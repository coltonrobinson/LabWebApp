import styles from "../../styles/styles.module.css";
import callApi from "../../utils/api/callApi";
import parseDataBaseDate from "../../utils/parseDataBaseDate";
import ip from "../../utils/ip/ip";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import ConfirmationPopup from "../ConfirmationPopup/ConfirmationPopup";

const { addMonths } = require('date-fns');

function Shipping({ setConfirmationMessage, technicianId, setPopupMessage, orderNumber, batches }) {
  const [certificatesGeneratedDate, setCertificatesGeneratedDate] = useState(null);
  const [labelsPrinted, setLabelsPrinted] = useState(false);
  const [certificatesPrinted, setCertificatesPrinted] = useState(false);
  const [certificatesDownloaded, setCertificatesDownloaded] = useState(false);
  const [returnRecordGenerated, setreturnRecordGenerated] = useState(false);
  const [confirmationArray, setConfirmationArray] = useState(false);
  const certificateList = useRef([])



  let navigate = useNavigate()
  const promises = [];

  const getCertificates = () => {
    callApi('get-certificates-by-order-id', { order_id: orderNumber })
      .then(certificates => {
        if (certificates.length > 0) {
          const fullDate = new Date(certificates[0].timestamp)
          const dateString = `${fullDate.getMonth() + 1}/${fullDate.getDate()}/${fullDate.getFullYear()}`;
          setCertificatesGeneratedDate(dateString);
          certificateList.current = certificates.sort((a, b) => a.certificate_id - b.certificate_id);
        }
      })
  }

  useEffect(() => {
    getCertificates();
  })

  const generateCertificates = async (event) => {
    try {
      for (const batch of batches) {
        promises.push(callApi('update-batch-technician', { department: 'shipping', technician_id: technicianId, 'batch_id': batch.batch_id }));
        promises.push(callApi('set-batch-active-state', { batch_id: batch.batch_id, active_state: false }));
      }

      await Promise.all(promises);

      await createCertificates();
      getCertificates();

    } catch (error) {
      console.error(error);
    }
  };


  const createCertificates = async () => {
    const promises = [];
    let alerted = false;
    let certificates = [];

    if (!orderNumber) {
      setPopupMessage('Please enter a valid order number');
      return;
    } else {
      try {
        const equipmentList = await callApi('get-equipment');
        const sensors = await callApi('get-sensors-by-order-id', { 'order_id': orderNumber });
        const order = await callApi('get-order-by-id', { 'order_id': orderNumber });
        const customer = await callApi('get-customer-by-id', { 'customer_id': order.customer_id });

        for (const sensor of sensors) {
          promises.push(callApi('get-batch-by-id', { 'batch_id': sensor.batch_id })
            // eslint-disable-next-line no-loop-func
            .then(async (batch) => {
              if (technicianId) {
                const readings = await callApi('get-readings-by-sensor-id', { 'sensor_id': sensor.sensor_id });
                if (readings.length === 0) {
                  setPopupMessage(`Could not find readings for sensor ${sensor.sensor_id}`);
                  return;
                } else {
                  const today = new Date();
                  const date = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
                  const calibrationDate = readings[0].timestamp;
                  let dueDate;
                  let parsedDueDate;
                  let template;
                  let certificateJson = {
                    'C1': customer.name,
                    'C2': `${customer.address_line_1}, ${customer.address_line_2}`,
                    'C3': `${customer.city}, ${customer.state} ${customer.zip_code}`,
                    'D1': 'Manufacturer: Monnit Corp',
                    'D2': `Model: ${sensor.sku}`,
                    'D3': `Identifier/Serial: ${sensor.sensor_id}`,
                    'D4': 'Condition: Functional',
                    'CS1': parseDataBaseDate(calibrationDate),
                    'CS3': JSON.stringify(batch.calibration_procedure_id),
                    'CS4': `${readings[0].lab_rh}% RH @ ${readings[0].lab_temperature}°C`,
                    'TechName': 'Colton Robinson',
                    'AuthName': 'Kelly S Lewis',
                    'Date': date,
                  }
                  if (batch.calibration_procedure_id === 1 || batch.calibration_procedure_id === 4) {
                    template = 'temperatureCertificate.pdf'
                    let finalReadings = [];
                    let setPoints = ['-999.00', '28.00', '-25.00', '90.00'];
                    let references = [14, 15, 16, 20];
                    let equipment = {};

                    for (const reference of references) {
                      for (const row of equipmentList) {
                        if (reference === row.equipment_id) {
                          equipment[row.asset_tag] = row;
                        }
                      }
                    }
                    let certificateStatus = 'PASS';

                    for (const setPoint of setPoints) {
                      for (const reading of readings) {
                        if (reading.set_point === setPoint) {
                          finalReadings.push(reading);
                          if (!reading.pass && setPoint !== '-999.00') {
                            certificateStatus = 'FAIL';
                          }
                          break;
                        }
                      }
                    }
                    if (finalReadings.length !== 4 && alerted === false) {
                      alerted = true;
                      setPopupMessage(`Batch ${batch.batch_id} is missing readings. It requires 4 readings, and only has ${finalReadings.length}`)
                      navigate('/shipping');
                      return;
                    } else if (alerted === true) {
                      navigate('/shipping');
                      return;
                    }
                    dueDate = addMonths(today, 25);
                    parsedDueDate = `${dueDate.getMonth() + 1}/${dueDate.getDate()}/${dueDate.getFullYear()}`;
                    const standardJson = {
                      'CS2': parsedDueDate,
                      'CS5': certificateStatus,
                      'CD11': parseFloat(finalReadings[1].set_point).toFixed(0) + '°C',
                      'CD12': parseFloat(finalReadings[1].reference_reading).toFixed(1) + '°C',
                      'CD13': parseFloat(finalReadings[0].sensor_reading).toFixed(1) + '°C',
                      'CD14': (parseFloat(finalReadings[1].sensor_reading) - parseFloat(finalReadings[0].sensor_reading)).toFixed(1) + '°C',
                      'CD15': parseFloat(finalReadings[1].sensor_reading).toFixed(1) + '°C',
                      'CD16': parseFloat(finalReadings[1].tolerance).toFixed(1) + '°C',
                      'CD17': parseFloat(finalReadings[1].uncertainty).toFixed(3) + '°C',
                      'CD18': (finalReadings[1].pass ? 'PASS' : 'FAIL'),
                      'CD21': parseFloat(finalReadings[2].set_point).toFixed(0) + '°C',
                      'CD22': parseFloat(finalReadings[2].reference_reading).toFixed(1) + '°C',
                      'CD23': parseFloat(finalReadings[2].sensor_reading).toFixed(1) + '°C',
                      'CD24': 'N/A',
                      'CD25': parseFloat(finalReadings[2].sensor_reading).toFixed(1) + '°C',
                      'CD26': parseFloat(finalReadings[2].tolerance).toFixed(1) + '°C',
                      'CD27': parseFloat(finalReadings[2].uncertainty).toFixed(3) + '°C',
                      'CD28': (finalReadings[2].pass ? 'PASS' : 'FAIL'),
                      'CD31': parseFloat(finalReadings[3].set_point).toFixed(0) + '°C',
                      'CD32': parseFloat(finalReadings[3].reference_reading).toFixed(1) + '°C',
                      'CD33': parseFloat(finalReadings[3].sensor_reading).toFixed(1) + '°C',
                      'CD34': 'N/A',
                      'CD35': parseFloat(finalReadings[3].sensor_reading).toFixed(1) + '°C',
                      'CD36': parseFloat(finalReadings[3].tolerance).toFixed(1) + '°C',
                      'CD37': parseFloat(finalReadings[3].uncertainty).toFixed(3) + '°C',
                      'CD38': (finalReadings[3].pass ? 'PASS' : 'FAIL'),
                      'RS11': equipment.S000114.asset_tag,
                      'RS12': equipment.S000114.description,
                      'RS13': parseDataBaseDate(equipment.S000114.last_calibration),
                      'RS14': parseDataBaseDate(equipment.S000114.next_calibration),
                      'RS21': equipment.S000115.asset_tag,
                      'RS22': equipment.S000115.description,
                      'RS23': parseDataBaseDate(equipment.S000115.last_calibration),
                      'RS24': parseDataBaseDate(equipment.S000115.next_calibration),
                      'RS31': equipment.S000116.asset_tag,
                      'RS32': equipment.S000116.description,
                      'RS33': parseDataBaseDate(equipment.S000116.last_calibration),
                      'RS34': parseDataBaseDate(equipment.S000116.next_calibration),
                      'RS41': equipment.S000120.asset_tag,
                      'RS42': equipment.S000120.description,
                      'RS43': parseDataBaseDate(equipment.S000120.last_calibration),
                      'RS44': parseDataBaseDate(equipment.S000120.next_calibration),
                      'TUR': '4:1',
                    }
                    certificateJson = { ...certificateJson, ...standardJson };
                  } else if (batch.calibration_procedure_id === 2) {
                    template = 'temperatureCertificate.pdf'
                    let finalReadings = [];
                    let setPoints = ['-999.00', '0.00', '-80.00', '-197.00'];
                    let references = [14, 15, 16, 20];
                    let equipment = {};

                    for (const reference of references) {
                      for (const row of equipmentList) {
                        if (reference === row.equipment_id) {
                          equipment[row.asset_tag] = row;
                        }
                      }
                    }
                    let certificateStatus = 'PASS';


                    for (const setPoint of setPoints) {
                      for (const reading of readings) {
                        if (reading.set_point === setPoint) {
                          finalReadings.push(reading);
                          if (!reading.pass && setPoint !== '-999.00') {
                            certificateStatus = 'FAIL';
                          }
                          break;
                        }
                      }
                    }
                    if (finalReadings.length !== 4 && alerted === false) {
                      alerted = true
                      setPopupMessage(`Batch ${batch.batch_id} is missing readings. It requires 4 readings, and only has ${finalReadings.length}`);
                      navigate('/shipping');
                      return null;
                    } else if (alerted === true) {
                      navigate('/shipping');
                      return null;
                    }
                    dueDate = addMonths(today, 13);
                    parsedDueDate = `${dueDate.getMonth() + 1}/${dueDate.getDate()}/${dueDate.getFullYear()}`;
                    const lowJson = {
                      'CS2': parsedDueDate,
                      'CS5': certificateStatus,
                      'CD11': parseFloat(finalReadings[1].set_point).toFixed(0) + '°C',
                      'CD12': parseFloat(finalReadings[1].reference_reading).toFixed(1) + '°C',
                      'CD13': parseFloat(finalReadings[0].sensor_reading).toFixed(1) + '°C',
                      'CD14': (parseFloat(finalReadings[1].sensor_reading) - parseFloat(finalReadings[0].sensor_reading)).toFixed(1) + '°C',
                      'CD15': parseFloat(finalReadings[1].sensor_reading).toFixed(1) + '°C',
                      'CD16': parseFloat(finalReadings[1].tolerance).toFixed(1) + '°C',
                      'CD17': parseFloat(finalReadings[1].uncertainty).toFixed(3) + '°C',
                      'CD18': (finalReadings[1].pass ? 'PASS' : 'FAIL'),
                      'CD21': parseFloat(finalReadings[2].set_point).toFixed(0) + '°C',
                      'CD22': parseFloat(finalReadings[2].reference_reading).toFixed(1) + '°C',
                      'CD23': parseFloat(finalReadings[2].sensor_reading).toFixed(1) + '°C',
                      'CD24': 'N/A',
                      'CD25': parseFloat(finalReadings[2].sensor_reading).toFixed(1) + '°C',
                      'CD26': parseFloat(finalReadings[2].tolerance).toFixed(1) + '°C',
                      'CD27': parseFloat(finalReadings[2].uncertainty).toFixed(3) + '°C',
                      'CD28': (finalReadings[2].pass ? 'PASS' : 'FAIL'),
                      'CD31': parseFloat(finalReadings[3].set_point).toFixed(0) + '°C',
                      'CD32': parseFloat(finalReadings[3].reference_reading).toFixed(1) + '°C',
                      'CD33': parseFloat(finalReadings[3].sensor_reading).toFixed(1) + '°C',
                      'CD34': 'N/A',
                      'CD35': parseFloat(finalReadings[3].sensor_reading).toFixed(1) + '°C',
                      'CD36': parseFloat(finalReadings[3].tolerance).toFixed(1) + '°C',
                      'CD37': parseFloat(finalReadings[3].uncertainty).toFixed(3) + '°C',
                      'CD38': (finalReadings[3].pass ? 'PASS' : 'FAIL'),
                      'RS11': equipment.S000114.asset_tag,
                      'RS12': equipment.S000114.description,
                      'RS13': parseDataBaseDate(equipment.S000114.last_calibration),
                      'RS14': parseDataBaseDate(equipment.S000114.next_calibration),
                      'RS21': equipment.S000115.asset_tag,
                      'RS22': equipment.S000115.description,
                      'RS23': parseDataBaseDate(equipment.S000115.last_calibration),
                      'RS24': parseDataBaseDate(equipment.S000115.next_calibration),
                      'RS31': equipment.S000116.asset_tag,
                      'RS32': equipment.S000116.description,
                      'RS33': parseDataBaseDate(equipment.S000116.last_calibration),
                      'RS34': parseDataBaseDate(equipment.S000116.next_calibration),
                      'RS41': equipment.S000120.asset_tag,
                      'RS42': equipment.S000120.description,
                      'RS43': parseDataBaseDate(equipment.S000120.last_calibration),
                      'RS44': parseDataBaseDate(equipment.S000120.next_calibration),
                      'TUR': '4:1',
                    }
                    certificateJson = { ...certificateJson, ...lowJson };
                  } else if (batch.calibration_procedure_id === 3) {
                    template = 'humidityCertificate.pdf'
                    let finalTemperatureReadings = [];
                    let finalHumidityReadings = [];
                    let temperatureSetPoints = ['20.00', '30.00', '40.00'];
                    let humiditySetPoints = ['80.00', '50.00', '20.00'];
                    let referenceTag = readings[0].reference_id;
                    let certificateStatus = 'PASS';
                    let reference;

                    for (const row of equipmentList) {
                      if (referenceTag === row.equipment_id) {
                        reference = row;
                      }
                    }

                    for (const setPoint of temperatureSetPoints) {
                      for (const reading of readings) {
                        if (reading.set_point === setPoint && reading.type === 'temperature') {
                          finalTemperatureReadings.push(reading);
                          if (!reading.pass && setPoint !== '-999.00') {
                            certificateStatus = 'FAIL';
                          }
                          break;
                        }
                      }
                    }

                    for (const setPoint of humiditySetPoints) {
                      for (const reading of readings) {
                        if (reading.set_point === setPoint && reading.type === 'humidity') {
                          finalHumidityReadings.push(reading);
                          if (!reading.pass && setPoint !== '-999.00') {
                            certificateStatus = 'FAIL';
                          }
                          break;
                        }
                      }
                    }
                    if ((finalHumidityReadings.length !== 3) || (finalTemperatureReadings.length !== 3 && alerted === false)) {
                      alerted = true;
                      setPopupMessage(`Batch ${batch.batch_id} is missing readings. It requires 3 of each reading, and only has ${finalHumidityReadings.length} humidity readings and ${finalTemperatureReadings.length} temperature readings`)
                      navigate('/shipping');
                      return null;
                    } else if (alerted === true) {
                      navigate('/shipping');
                      return null;
                    }
                    dueDate = addMonths(today, 7);
                    parsedDueDate = `${dueDate.getMonth() + 1}/${dueDate.getDate()}/${dueDate.getFullYear()}`;
                    const humidityJson = {
                      'CS2': parsedDueDate,
                      'CS5': certificateStatus,
                      'CD11': parseFloat(finalHumidityReadings[0].set_point).toFixed(0) + '% RH',
                      'CD12': parseFloat(finalHumidityReadings[0].reference_reading).toFixed(1) + '%',
                      'CD13': parseFloat(finalHumidityReadings[0].sensor_reading).toFixed(1) + '%',
                      'CD14': 'N/A',
                      'CD15': parseFloat(finalHumidityReadings[0].sensor_reading).toFixed(1) + '%',
                      'CD16': parseFloat(finalHumidityReadings[0].tolerance).toFixed(1) + '%',
                      'CD17': parseFloat(finalHumidityReadings[0].uncertainty).toFixed(1) + '%',
                      'CD18': (finalHumidityReadings[0].pass ? 'PASS' : 'FAIL'),
                      'CD21': parseFloat(finalHumidityReadings[1].set_point).toFixed(0) + '% RH',
                      'CD22': parseFloat(finalHumidityReadings[1].reference_reading).toFixed(1) + '%',
                      'CD23': parseFloat(finalHumidityReadings[1].sensor_reading).toFixed(1) + '%',
                      'CD24': 'N/A',
                      'CD25': parseFloat(finalHumidityReadings[1].sensor_reading).toFixed(1) + '%',
                      'CD26': parseFloat(finalHumidityReadings[1].tolerance).toFixed(1) + '%',
                      'CD27': parseFloat(finalHumidityReadings[1].uncertainty).toFixed(1) + '%',
                      'CD28': (finalHumidityReadings[1].pass ? 'PASS' : 'FAIL'),
                      'CD31': parseFloat(finalHumidityReadings[2].set_point).toFixed(0) + '% RH',
                      'CD32': parseFloat(finalHumidityReadings[2].reference_reading).toFixed(1) + '%',
                      'CD33': parseFloat(finalHumidityReadings[2].sensor_reading).toFixed(1) + '%',
                      'CD34': 'N/A',
                      'CD35': parseFloat(finalHumidityReadings[2].sensor_reading).toFixed(1) + '%',
                      'CD36': parseFloat(finalHumidityReadings[2].tolerance).toFixed(1) + '%',
                      'CD37': parseFloat(finalHumidityReadings[2].uncertainty).toFixed(1) + '%',
                      'CD38': (finalHumidityReadings[2].pass ? 'PASS' : 'FAIL'),
                      'CD41': parseFloat(finalTemperatureReadings[0].set_point).toFixed(0) + '°C',
                      'CD42': parseFloat(finalTemperatureReadings[0].reference_reading).toFixed(1) + '°C',
                      'CD43': parseFloat(finalTemperatureReadings[0].sensor_reading).toFixed(1) + '°C',
                      'CD44': 'N/A',
                      'CD45': parseFloat(finalTemperatureReadings[0].sensor_reading).toFixed(1) + '°C',
                      'CD46': parseFloat(finalTemperatureReadings[0].tolerance).toFixed(1) + '°C',
                      'CD47': parseFloat(finalTemperatureReadings[0].uncertainty).toFixed(2) + '°C',
                      'CD48': (finalTemperatureReadings[0].pass ? 'PASS' : 'FAIL'),
                      'CD51': parseFloat(finalTemperatureReadings[1].set_point).toFixed(0) + '°C',
                      'CD52': parseFloat(finalTemperatureReadings[1].reference_reading).toFixed(1) + '°C',
                      'CD53': parseFloat(finalTemperatureReadings[1].sensor_reading).toFixed(1) + '°C',
                      'CD54': 'N/A',
                      'CD55': parseFloat(finalTemperatureReadings[1].sensor_reading).toFixed(1) + '°C',
                      'CD56': parseFloat(finalTemperatureReadings[1].tolerance).toFixed(1) + '°C',
                      'CD57': parseFloat(finalTemperatureReadings[1].uncertainty).toFixed(2) + '°C',
                      'CD58': (finalTemperatureReadings[1].pass ? 'PASS' : 'FAIL'),
                      'CD61': parseFloat(finalTemperatureReadings[2].set_point).toFixed(0) + '°C',
                      'CD62': parseFloat(finalTemperatureReadings[2].reference_reading).toFixed(1) + '°C',
                      'CD63': parseFloat(finalTemperatureReadings[2].sensor_reading).toFixed(1) + '°C',
                      'CD64': 'N/A',
                      'CD65': parseFloat(finalTemperatureReadings[2].sensor_reading).toFixed(1) + '°C',
                      'CD66': parseFloat(finalTemperatureReadings[2].tolerance).toFixed(1) + '°C',
                      'CD67': parseFloat(finalTemperatureReadings[2].uncertainty).toFixed(2) + '°C',
                      'CD68': (finalTemperatureReadings[2].pass ? 'PASS' : 'FAIL'),
                      'RS11': reference.asset_tag,
                      'RS12': reference.description,
                      'RS13': parseDataBaseDate(reference.last_calibration),
                      'RS14': parseDataBaseDate(reference.next_calibration),
                      'TUR': '1:1',
                    }
                    certificateJson = { ...certificateJson, ...humidityJson };
                  } else if (batch.calibration_procedure_id === 4) {
                    template = 'temperatureCertificate.pdf'
                    let finalReadings = [];
                    let setPoints = ['-999.00', '28.00', '-25.00', '90.00'];
                    let references = [14, 15, 16, 20];
                    let equipment = {};

                    for (const reference of references) {
                      for (const row of equipmentList) {
                        if (reference === row.equipment_id) {
                          equipment[row.asset_tag] = row;
                        }
                      }
                    }
                    let certificateStatus = 'PASS';


                    for (const setPoint of setPoints) {
                      for (const reading of readings) {
                        if (reading.set_point === setPoint) {
                          finalReadings.push(reading);
                          if (!reading.pass && setPoint !== '-999.00') {
                            certificateStatus = 'FAIL';
                          }
                          break;
                        }
                      }
                    }
                    if (finalReadings.length !== 4 && alerted === false) {
                      alerted = true
                      setPopupMessage(`Batch ${batch.batch_id} is missing readings. It requires 4 readings, and only has ${finalReadings.length}`);
                      navigate('/shipping');
                      return null;
                    } else if (alerted === true) {
                      navigate('/shipping');
                      return null;
                    }
                    dueDate = addMonths(today, 25);
                    parsedDueDate = `${dueDate.getMonth() + 1}/${dueDate.getDate()}/${dueDate.getFullYear()}`;
                    const standardJson = {
                      'CS2': parsedDueDate,
                      'CS5': certificateStatus,
                      'CD11': parseFloat(finalReadings[1].set_point).toFixed(0) + '°C',
                      'CD12': parseFloat(finalReadings[1].reference_reading).toFixed(1) + '°C',
                      'CD13': parseFloat(finalReadings[0].sensor_reading).toFixed(1) + '°C',
                      'CD14': (parseFloat(finalReadings[1].sensor_reading) - parseFloat(finalReadings[0].sensor_reading)).toFixed(1) + '°C',
                      'CD15': parseFloat(finalReadings[1].sensor_reading).toFixed(1) + '°C',
                      'CD16': parseFloat(finalReadings[1].tolerance).toFixed(1) + '°C',
                      'CD17': parseFloat(finalReadings[1].uncertainty).toFixed(3) + '°C',
                      'CD18': (finalReadings[1].pass ? 'PASS' : 'FAIL'),
                      'CD21': parseFloat(finalReadings[2].set_point).toFixed(0) + '°C',
                      'CD22': parseFloat(finalReadings[2].reference_reading).toFixed(1) + '°C',
                      'CD23': parseFloat(finalReadings[2].sensor_reading).toFixed(1) + '°C',
                      'CD24': 'N/A',
                      'CD25': parseFloat(finalReadings[2].sensor_reading).toFixed(1) + '°C',
                      'CD26': parseFloat(finalReadings[2].tolerance).toFixed(1) + '°C',
                      'CD27': parseFloat(finalReadings[2].uncertainty).toFixed(3) + '°C',
                      'CD28': (finalReadings[2].pass ? 'PASS' : 'FAIL'),
                      'CD31': parseFloat(finalReadings[3].set_point).toFixed(0) + '°C',
                      'CD32': parseFloat(finalReadings[3].reference_reading).toFixed(1) + '°C',
                      'CD33': parseFloat(finalReadings[3].sensor_reading).toFixed(1) + '°C',
                      'CD34': 'N/A',
                      'CD35': parseFloat(finalReadings[3].sensor_reading).toFixed(1) + '°C',
                      'CD36': parseFloat(finalReadings[3].tolerance).toFixed(1) + '°C',
                      'CD37': parseFloat(finalReadings[3].uncertainty).toFixed(3) + '°C',
                      'CD38': (finalReadings[3].pass ? 'PASS' : 'FAIL'),
                      'RS11': equipment.S000114.asset_tag,
                      'RS12': equipment.S000114.description,
                      'RS13': parseDataBaseDate(equipment.S000114.last_calibration),
                      'RS14': parseDataBaseDate(equipment.S000114.next_calibration),
                      'RS21': equipment.S000115.asset_tag,
                      'RS22': equipment.S000115.description,
                      'RS23': parseDataBaseDate(equipment.S000115.last_calibration),
                      'RS24': parseDataBaseDate(equipment.S000115.next_calibration),
                      'RS31': equipment.S000116.asset_tag,
                      'RS32': equipment.S000116.description,
                      'RS33': parseDataBaseDate(equipment.S000116.last_calibration),
                      'RS34': parseDataBaseDate(equipment.S000116.next_calibration),
                      'RS41': equipment.S000120.asset_tag,
                      'RS42': equipment.S000120.description,
                      'RS43': parseDataBaseDate(equipment.S000120.last_calibration),
                      'RS44': parseDataBaseDate(equipment.S000120.next_calibration),
                      'TUR': '4:1',
                    }
                    certificateJson = { ...certificateJson, ...standardJson };
                  } else if (batch.calibration_procedure_id === 5) {
                    template = 'temperatureCertificate.pdf'
                    let finalReadings = [];
                    let setPoints = ['-999.00', '20.00', '-20.00', '60.00'];
                    let references = [13, 5];
                    let equipment = {};

                    for (const reference of references) {
                      for (const row of equipmentList) {
                        if (reference === row.equipment_id) {
                          equipment[row.asset_tag] = row;
                        }
                      }
                    }
                    let certificateStatus = 'PASS';


                    for (const setPoint of setPoints) {
                      for (const reading of readings) {
                        if (reading.set_point === setPoint) {
                          finalReadings.push(reading);
                          if (!reading.pass && setPoint !== '-999.00') {
                            certificateStatus = 'FAIL';
                          }
                          break;
                        }
                      }
                    }
                    if (finalReadings.length !== 4 && alerted === false) {
                      alerted = true
                      setPopupMessage(`Batch ${batch.batch_id} is missing readings. It requires 4 readings, and only has ${finalReadings.length}`);
                      navigate('/shipping');
                      return null;
                    } else if (alerted === true) {
                      navigate('/shipping');
                      return null;
                    }
                    dueDate = addMonths(today, 25);
                    parsedDueDate = `${dueDate.getMonth() + 1}/${dueDate.getDate()}/${dueDate.getFullYear()}`;
                    const standardJson = {
                      'CS2': parsedDueDate,
                      'CS5': certificateStatus,
                      'CD11': parseFloat(finalReadings[1].set_point).toFixed(0) + '°C',
                      'CD12': parseFloat(finalReadings[1].reference_reading).toFixed(1) + '°C',
                      'CD13': parseFloat(finalReadings[0].sensor_reading).toFixed(1) + '°C',
                      'CD14': (parseFloat(finalReadings[1].sensor_reading) - parseFloat(finalReadings[0].sensor_reading)).toFixed(1) + '°C',
                      'CD15': parseFloat(finalReadings[1].sensor_reading).toFixed(1) + '°C',
                      'CD16': parseFloat(finalReadings[1].tolerance).toFixed(1) + '°C',
                      'CD17': parseFloat(finalReadings[1].uncertainty).toFixed(3) + '°C',
                      'CD18': (finalReadings[1].pass ? 'PASS' : 'FAIL'),
                      'CD21': parseFloat(finalReadings[2].set_point).toFixed(0) + '°C',
                      'CD22': parseFloat(finalReadings[2].reference_reading).toFixed(1) + '°C',
                      'CD23': parseFloat(finalReadings[2].sensor_reading).toFixed(1) + '°C',
                      'CD24': 'N/A',
                      'CD25': parseFloat(finalReadings[2].sensor_reading).toFixed(1) + '°C',
                      'CD26': parseFloat(finalReadings[2].tolerance).toFixed(1) + '°C',
                      'CD27': parseFloat(finalReadings[2].uncertainty).toFixed(3) + '°C',
                      'CD28': (finalReadings[2].pass ? 'PASS' : 'FAIL'),
                      'CD31': parseFloat(finalReadings[3].set_point).toFixed(0) + '°C',
                      'CD32': parseFloat(finalReadings[3].reference_reading).toFixed(1) + '°C',
                      'CD33': parseFloat(finalReadings[3].sensor_reading).toFixed(1) + '°C',
                      'CD34': 'N/A',
                      'CD35': parseFloat(finalReadings[3].sensor_reading).toFixed(1) + '°C',
                      'CD36': parseFloat(finalReadings[3].tolerance).toFixed(1) + '°C',
                      'CD37': parseFloat(finalReadings[3].uncertainty).toFixed(3) + '°C',
                      'CD38': (finalReadings[3].pass ? 'PASS' : 'FAIL'),
                      'RS11': equipment.S000113.asset_tag,
                      'RS12': equipment.S000113.description,
                      'RS13': parseDataBaseDate(equipment.S000113.last_calibration),
                      'RS14': parseDataBaseDate(equipment.S000113.next_calibration),
                      'RS21': equipment.S000105.asset_tag,
                      'RS22': equipment.S000105.description,
                      'RS23': parseDataBaseDate(equipment.S000105.last_calibration),
                      'RS24': parseDataBaseDate(equipment.S000105.next_calibration),
                      'TUR': '2:1',
                    }
                    certificateJson = { ...certificateJson, ...standardJson };
                  }
                  if (parsedDueDate) {
                    const certificate = await callApi('create-certificate', { 'certificate_json': JSON.stringify(certificateJson), 'sensor_id': sensor.sensor_id, 'template': template, 'due_date': parsedDueDate, 'calibration_date': calibrationDate })
                    certificates.push(certificate);
                    promises.push(callApi('remove-sensor', { 'sensor_id': sensor.sensor_id, 'check_digit': sensor.check_digit }));
                  }
                }
              } else {
                setPopupMessage('Please sign in');
                return;
              }
            }))
        }
      } catch (error) {
        console.error(error);
        setPopupMessage(`An error occurred`);
        return;
      }
      await Promise.all(promises);
      certificateList.current = certificates.sort((a, b) => a.certificate_id - b.certificate_id);
    }
  };


  const printCertificateLabels = async () => {
    if (certificateList.current.length === 0) {
      setPopupMessage(`There are no labels to print`)
    }
    for (const certificate of certificateList.current) {
      try {
        await callApi('print-certificate-labels', { calibration_date: certificate.generate_certificate_json.CS1, due_date: certificate.generate_certificate_json.CS2, certificate_number: `MNT-${certificate.certificate_id}` })
      } catch (error) {
        console.error(error)
        setPopupMessage('Unable to print label');
        return;
      }
      setLabelsPrinted(true)
    }
  }
  const printCertificates = async () => {
    if (certificateList.current.length === 0) {
      setPopupMessage(`There are no certificates to print`)
    }

      try {
        await callApi('print-certificates', {certificate_list: certificateList.current.map(certificate => certificate.certificate_id)})
      } catch (error) {
        console.error(error)
        setPopupMessage('Unable to print certificates');
        return;
      }
      setCertificatesPrinted(true)
  }

  const createReturnRecord = () => {
    fetch(`http://${ip}:8000/api/generate-return-record/?order_id=${orderNumber}`)
      .then(response => {
        if (response.ok) {
          if (response.headers.get('content-type') === 'application/json; charset=utf-8') {
            return response.blob();
          } else {
            console.error(`Expecting return record to be 'application/pdf' but instead got '${response.headers.get("content-type")}': ${response}`);
            setPopupMessage(`Failed to generate return record for order ${orderNumber}`);
          }
        } else {
          console.error(`Could not complete generation, response.ok: ${response.ok}`);
          setPopupMessage(`Failed to generate return record for order ${orderNumber}`);
        }
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `returnRecord${orderNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setreturnRecordGenerated(true);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

  const downloadCertificates = () => {
    for (const certificate of certificateList.current) {
      fetch(`http://${ip}:8000/api/generate-certificate?certificate_id=${certificate.certificate_id}&upload=true`)
        .then(response => {
          if (response.ok && response.headers.get('content-type') === 'application/json; charset=utf-8') {
            return response.blob();
          } else {
            throw new Error(`Failed to generate certificate MNT-${certificate.certificate_id}`);
          }
        })
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `MNT-${certificate.certificate_id}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        })
        .catch(error => {
          console.error('Error:', error);
          return;
        });
    }
    setCertificatesDownloaded(true);
  }

  const handleCloseOrder = () => {
    let confirmationArray = [`Are you sure you would like to finish this order?`];
    if (!certificatesGeneratedDate) {
      confirmationArray.push(`The certificates for this order have not been generated`);
    }
    if (!labelsPrinted) {
      confirmationArray.push(`The labels for this order have not been printed`);
    }
    if (!certificatesDownloaded && !certificatesPrinted) {
      confirmationArray.push(`The certificates for this order have not been downloaded or printed`);
    }
    if (!returnRecordGenerated) {
      confirmationArray.push(`The return record for this order has not been downloaded`)
    }
    setConfirmationArray(confirmationArray);
  }

  const endShipping = () => {
    callApi('set-order-active-state', { order_id: orderNumber, active_state: false });
    for (const batch of batches) {
      callApi('remove-batch-location', { batch_id: batch.batch_id });
      callApi('log-batch-interaction', { department: 'shipping', start: false, technician_id: technicianId, batch_id: batch.batch_id });
    }
    setConfirmationMessage(`Order: ${orderNumber} closed`);
    navigate('/confirmation');
  }

  return (
    <>
      <div className={styles.menu}>
        {confirmationArray.length > 0 ? <ConfirmationPopup confirmationArray={confirmationArray} setConfirmationArray={setConfirmationArray} handleConfirm={endShipping} /> : <></>}
        <h1 className={styles.title}>Order: {orderNumber}</h1>
        <button className={styles.default_button_half} onClick={generateCertificates}>Create certificates</button>
        {certificatesGeneratedDate ? <span className={`${styles.status_message} ${styles.status_dot_green}`}>Certificates generated on {certificatesGeneratedDate}</span> : <span className={`${styles.status_message} ${styles.status_dot_red}`}>No certificates</span>}
        <button className={styles.default_button_half} onClick={printCertificateLabels}>Print labels</button>
        {labelsPrinted ? <span className={`${styles.status_message} ${styles.status_dot_green}`}>Labels printed</span> : <span className={`${styles.status_message} ${styles.status_dot_red}`}>No labels printed</span>}
        <button className={styles.default_button_half} onClick={printCertificates}>Print certificates</button>
        {certificatesPrinted ? <span className={`${styles.status_message} ${styles.status_dot_green}`}>Certificates printed</span> : <span className={`${styles.status_message} ${styles.status_dot_red}`}>No certificates printed</span>}
        <button className={styles.default_button_half} onClick={downloadCertificates}>Download certificates</button>
        {certificatesDownloaded ? <span className={`${styles.status_message} ${styles.status_dot_green}`}>Certificates downloaded</span> : <span className={`${styles.status_message} ${styles.status_dot_red}`}>Not downloaded</span>}
        <button className={styles.default_button_half} onClick={createReturnRecord}>Download return record</button>
        {returnRecordGenerated ? <span className={`${styles.status_message} ${styles.status_dot_green}`}>Return record downloaded</span> : <span className={`${styles.status_message} ${styles.status_dot_red}`}>Not downloaded</span>}
        <button className={styles.default_button} onClick={handleCloseOrder}>Close Order</button>
        <div className={styles.batches_container}>
          {batches.length > 0 ? batches.map(batch => <div className={styles.shipping_batches}>{batch.current_location ? `Batch ${batch.batch_id} | Current location: ${batch.current_location}` : `Batch ${batch.batch_id} (Shipped)`}</div>) : <></>}
        </div>
      </div>
    </>
  );
}

export default Shipping;