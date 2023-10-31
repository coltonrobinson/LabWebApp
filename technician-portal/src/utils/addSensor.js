import callApi from "./api/callApi";


const addSensor = async (sensor, batchId) => {
    const sensorArray = sensor.split(':');
    const sensorId = sensorArray[0];
    const checkDigit = sensorArray[1];
  
    const parameters = {
      'sensor_id': sensorId,
      'check_digit': checkDigit,
      'batch_id': batchId,
    }
  
    try {
      const response = await callApi('create-sensor', parameters);
      if (!response[0]['sensor_id']) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  export default addSensor;