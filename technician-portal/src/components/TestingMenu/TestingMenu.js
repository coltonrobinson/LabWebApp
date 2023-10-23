import { useState, useRef, useEffect } from "react";
import styles from "../../styles/styles.module.css";
import callApi from "../../utils/api/callApi";
import round from "../../utils/round.js";
import StableTimeDisplay from "../StableTimeDisplay/StableTimeDisplay";
import { useAppContext } from "../../contexts/app";

function TestingMenu({ setPoints }) {
    const {
        procedureId: calibrationProcedureId, sensorGrid,
        sensorList, setSensorGrid, setPopupMessage
    } = useAppContext()

    const [point1StableTime, setPoint1StableTime] = useState('Loading...');
    const [point2StableTime, setPoint2StableTime] = useState('Loading...');
    const [point3StableTime, setPoint3StableTime] = useState('Loading...');
    const [refreshButtonText, setRefreshButtonText] = useState('Refresh');
    const [allReadings, setAllReadings] = useState([]);
    const [selectedSensor, setSelectedSensor] = useState(null);
    const [recentReadings, setRecentReadings] = useState([]);
    const [loadingMessage, setLoadingMessage] = useState('Loading...')
    const refreshed = useRef(false);


    const selectSensor = async (sensorId) => {
        if (selectedSensor === sensorId) {
            clearSelectedSensor();
        } else {
            setSelectedSensor(sensorId);
            updateSensors(sensorList, setSensorGrid, calibrationProcedureId, setPoints, allReadings, sensorId);
        }
    }

    const clearSelectedSensor = () => {
        if (selectedSensor) {
            setSelectedSensor(null);
            selectSensor(null);
        }
    }

    const updateSensors = async (sensorList, setSensorGrid, calibrationProcedureId, setPoints, allReadings, selectedSensor) => {
        let tempReferenceReadings = {};

        try {
            const newSensorGrid = [];
            let currentReadingCell = (<div className={styles.grid_entry}></div>);
            let referenceReadingCell = (<div className={styles.grid_entry}></div>);
            let firstCell = null;
            let referenceCell = null;
            let elementClass = styles.grid_row;

            for (let i = 0; i < sensorList.length; i++) {
                let sensorReadings = {};
                const sensor = sensorList[i % sensorList.length];
                const readings = allReadings[i];
                let style = '';
                if (sensor.sensor_id === selectedSensor) {
                    style = styles.selected_sensor;
                }
                if (readings) {
                    for (let j = 0; j < setPoints.length; j++) {
                        let sensorReadingString = '';
                        let referenceString = '';
                        let pass = true;
                        let readingObject = {}
                        switch (calibrationProcedureId) {
                            default:
                                if (recentReadings[0].devices_under_test[`${sensor.sensor_id}temp`] !== undefined) {
                                    currentReadingCell = <div className={styles.grid_entry_green}>{`${recentReadings[0].devices_under_test[`${sensor.sensor_id}temp`].toFixed(2)}°C`}</div>
                                } else {
                                    currentReadingCell = <div className={styles.grid_entry}>No data found</div>
                                }
                                firstCell = (<div className={styles.grid_entry}>{tempReferenceReadings.setPoint0}</div>);
                                referenceCell = (<div className={sensorReadings.set_point_0_style}>{sensorReadings.set_point_0}</div>);

                                for (const type of ['temperature']) {
                                    const findReadings = readings.find((reading) => (reading.set_point === setPoints[j][type] && reading.type === type));
                                    if (findReadings) {
                                        readingObject = { ...readingObject, ...findReadings };
                                        if (type === 'humidity') {
                                            referenceString = referenceString + `${readingObject.reference_reading}%RH\n`
                                            sensorReadingString = sensorReadingString + `${readingObject.sensor_reading}%RH\n`;
                                        } else {
                                            referenceString = referenceString + `${readingObject.reference_reading}°C\n`
                                            sensorReadingString = sensorReadingString + `${readingObject.sensor_reading}°C`;
                                        }
                                        if (!readingObject.pass) {
                                            pass = false;
                                        }
                                        sensorReadings[`set_point_${j}_style`] = (pass) ? styles.grid_entry_green : styles.grid_entry_red;
                                    } else {
                                        sensorReadings[`set_point_${j}_style`] = styles.grid_entry;
                                        break;
                                    }
                                }
                                sensorReadings[`set_point_${j}`] = sensorReadingString;
                                tempReferenceReadings[`setPoint${j}`] = referenceString;
                                break;

                            case 3:
                                elementClass = styles.humidity_grid;
                                if (recentReadings[0].devices_under_test[`${sensor.sensor_id}temp`] !== undefined) {
                                    currentReadingCell = <div className={styles.grid_entry_green}>
                                        {`${recentReadings[0].devices_under_test[`${sensor.sensor_id}humidity`].toFixed(2)}%RH\n
                                    ${recentReadings[0].devices_under_test[`${sensor.sensor_id}temp`].toFixed(2)}°C`}
                                    </div>
                                } else {
                                    currentReadingCell = <div className={styles.grid_entry}>No data found</div>
                                }

                                for (const type of ['humidity', 'temperature']) {
                                    const findReadings = readings.find((reading) => (reading.set_point === setPoints[j][type] && reading.type === type))
                                    if (findReadings) {
                                        readingObject = { ...readingObject, ...findReadings };
                                        if (type === 'humidity') {
                                            referenceString = referenceString + `${readingObject.reference_reading}%RH\n`;
                                            sensorReadingString = sensorReadingString + `${readingObject.sensor_reading}%RH\n`;
                                        } else {
                                            referenceString = referenceString + `${readingObject.reference_reading}°C\n`
                                            sensorReadingString = sensorReadingString + `${readingObject.sensor_reading}°C`;
                                        }
                                        if (!readingObject.pass) {
                                            pass = false;
                                        }
                                        sensorReadings[`set_point_${j + 1}_style`] = (pass) ? styles.grid_entry_green : styles.grid_entry_red;
                                    } else {
                                        sensorReadings[`set_point_${j + 1}_style`] = styles.grid_entry;
                                        break;
                                    }
                                }
                                sensorReadings[`set_point_${j + 1}`] = sensorReadingString;
                                tempReferenceReadings[`setPoint${j + 1}`] = referenceString;
                                break;
                        }
                        if (loadingMessage) {
                            setLoadingMessage('');
                        }
                    }
                }
                newSensorGrid.push(
                    <div className={`${elementClass} ${style}`} key={sensor.sensor_id}>
                        <button className={styles.default_button} onClick={() => selectSensor(sensor.sensor_id)}>{sensor.sensor_id}</button>
                        {currentReadingCell}
                        {referenceCell}
                        <div className={sensorReadings.set_point_1_style}>{sensorReadings.set_point_1}</div>
                        <div className={sensorReadings.set_point_2_style}>{sensorReadings.set_point_2}</div>
                        <div className={sensorReadings.set_point_3_style}>{sensorReadings.set_point_3}</div>
                    </div>
                );
            }
            newSensorGrid.unshift(
                <div className={elementClass} key={'1'}>
                    <div className={styles.grid_entry}>Reference</div>
                    {referenceReadingCell}
                    {firstCell}
                    <div className={styles.grid_entry}>{tempReferenceReadings.setPoint1}</div>
                    <div className={styles.grid_entry}>{tempReferenceReadings.setPoint2}</div>
                    <div className={styles.grid_entry}>{tempReferenceReadings.setPoint3}</div>
                </div>)
            setSensorGrid(newSensorGrid);
        } catch (error) {
            console.error(error);
        }
    };

    const updateStableTimes = async () => {
        let stableTime;
        const now = new Date()
        const setters = [setPoint1StableTime, setPoint2StableTime, setPoint3StableTime];
        const references = ['S000114', 'S000115', 'S000116']
        for (let i = 0; i < setters.length; i++) {
            if (calibrationProcedureId === 3) {
                stableTime = await callApi('get-last-humidity-stable-reading', { 'set_point': setPoints[i].humidity })
            } else if (calibrationProcedureId === 5) {
                stableTime = await callApi('get-last-humidity-stable-reading', { 'set_point': setPoints[i + 1].temperature, 'type': 'temperature', 'reference': 'S000119' })
            } else if (calibrationProcedureId === 1) {
                stableTime = await callApi('get-last-temperature-stable-reading', { 'set_point': setPoints[i + 1].temperature, 'reference': references[i], 'stability_criteria': JSON.stringify(setPoints[i + 1].stabilityCriteria) });
            } else {
                stableTime = await callApi('get-last-temperature-stable-reading', { 'set_point': setPoints[i + 1].temperature, 'reference': references[1], 'stability_criteria': JSON.stringify(setPoints[i + 1].stabilityCriteria) });
            }
            const totalSeconds = parseInt((now.getTime() - new Date(stableTime[1]).getTime()) / 1000);
            const minutesAgo = parseInt(totalSeconds / 60);
            if (isNaN(minutesAgo)) {
                setters[i](`No stable times found`);
            } else if (minutesAgo > 0) {
                setters[i](`Stable ${minutesAgo} minutes ago`);
            } else {
                setters[i](`Stable`);
            }
        }
    }

    const refresh = async () => {
        const promises = [];

        for (const sensor of sensorList) {
            promises.push(callApi("get-readings", { sensors: sensor.sensor_id }));
        }
        const resolvedRecentReadings = await callApi('get-recent-data');
        const resolvedReadings = await Promise.all(promises);
        setRecentReadings(resolvedRecentReadings);
        setAllReadings(resolvedReadings);
        updateStableTimes();
        updateSensors(sensorList, setSensorGrid, calibrationProcedureId, setPoints, allReadings, selectedSensor);
    };

    useEffect(() => {
        if (!refreshed.current) {
            refresh();
            refreshed.current = true;
        }
        const interval = setInterval(() => {
            refresh();
        }, 3000);
        return () => clearInterval(interval);
    })

    const setStableTimesToLoading = () => {
        const setters = [setPoint1StableTime, setPoint2StableTime, setPoint3StableTime];
        for (const setter of setters) {
            setter('Loading...');
        }
    }

    const getStableTemperatureReading = async (sensorList, setPointObject, reference = 'S000114') => {
        const setPoint = setPointObject.temperature
        let finalSetPoint = setPoint;
        if (finalSetPoint === '-999.00') {
            if (calibrationProcedureId === 2) {
                finalSetPoint = '0.00';
            } else {
                finalSetPoint = '28.00';
            }
        }
        const data = await callApi('get-last-temperature-stable-reading', { 'set_point': finalSetPoint, 'reference': reference, 'stability_criteria': JSON.stringify(setPointObject.stabilityCriteria) });
        if (!data[1]) {
            setPopupMessage('Unable to find stable data');
            return;
        }
        let readings = await callApi('get-temperature-reading-range', { 'timestamp': data[1] });
        let referenceTemperature = readings[0].super_daq_data[reference].Temperature;
        readings = readings[0].devices_under_test;

        let finalReadings = { 'referenceTemperature': referenceTemperature };
        for (const sensor of sensorList) {
            finalReadings[`${sensor.sensor_id}temp`] = readings[`${sensor.sensor_id}temp`];
        }
        return finalReadings;
    }

    const createReading = async (setPointObject, referenceAssetID, generatorId, referenceId, tolerance, uncertainty, type, calibrate = false) => {
        const setPoint = setPointObject.temperature;
        const readings = await getStableTemperatureReading(sensorList, setPointObject, referenceAssetID);
        const labReadings = await callApi('get-recent-data');

        for (const sensor of sensorList) {
            if (selectedSensor && sensor.sensor_id !== parseInt(selectedSensor)) {
                continue;
            } else if (!readings) {
                setPopupMessage(`Could not get stable data`);
                return;
            } else if (readings[`${sensor.sensor_id}temp`] === undefined) {
                setPopupMessage(`No stable data found for sensor: ${sensor.sensor_id}`);
                return;
            } else {
                const parameters = {
                    'type': type,
                    'set_point': setPoint,
                    'reference_reading': readings.referenceTemperature,
                    'sensor_reading': readings[`${sensor.sensor_id}temp`],
                    'lab_rh': labReadings[0].lab_humidity,
                    'lab_temperature': labReadings[0].lab_temperature,
                    'sensor_id': sensor.sensor_id,
                    'generator_id': generatorId,
                    'reference_id': referenceId,
                    'tolerance': tolerance,
                    'uncertainty': uncertainty,
                }
                if (calibrate) {
                    callApi('calibrate-sensor', { 'sensor_id': sensor.sensor_id, 'target_reading': parameters.reference_reading })
                    .then(response => {
                       if (response.Result !== 'Success') {
                        setPopupMessage(`Could not calibrate sensor ${sensor.sensor_id}, please try again`)
                        console.error(response)
                        return;
                       }
                    })
                }
                callApi('create-reading', parameters)
                    .then(() => {
                        refresh();
                    })
            }
        }
    }

    const createRotronicTemperatureReading = async (setPointObject, referenceAssetID, generatorId, referenceId, tolerance, uncertainty, type, calibrate = false) => {
        let setPoint;
        if (setPointObject.temperature !== '-999.00') {
            setPoint = setPointObject.temperature;
        } else {
            setPoint = '20.00';
        }
        const data = await callApi('get-last-humidity-stable-reading', { 'set_point': setPoint, 'type': 'temperature', 'reference': referenceAssetID });
        if (!data[1]) {
            setPopupMessage(`Could not get stable data`);
            return;
        }
        let readings = await callApi('get-humidity-reading-range', { 'timestamp': data[1] });
        if (!readings || readings.error) {
            setPopupMessage(`Could not get stable data`);
            return;
        }
        let referenceTemperature = readings.map((item) => item.rotronic_data[referenceAssetID].Temperature).filter((value) => value !== undefined);
        referenceTemperature = round(referenceTemperature.reduce((a, b) => a + b, 0) / referenceTemperature.length);
        readings = readings.map((item) => item.devices_under_test);
        const labReadings = await callApi('get-recent-data');

        for (const sensor of sensorList) {
            if (selectedSensor && sensor.sensor_id !== parseInt(selectedSensor)) {
                continue;
            }
            const sensorId = sensor.sensor_id
            let temperatureReading = readings.map((item) => item[`${sensorId}temp`]).filter((value) => value !== undefined);
            temperatureReading = round(temperatureReading.reduce((a, b) => a + b, 0) / temperatureReading.length);
            if (temperatureReading === undefined) {
                setPopupMessage(`No stable data found for sensor: ${sensorId}`);
                return;
            } else {
                const parameters = {
                    'type': type,
                    'set_point': setPointObject.temperature,
                    'reference_reading': referenceTemperature,
                    'sensor_reading': temperatureReading,
                    'lab_rh': labReadings[0].lab_humidity,
                    'lab_temperature': labReadings[0].lab_temperature,
                    'sensor_id': sensorId,
                    'generator_id': generatorId,
                    'reference_id': referenceId,
                    'tolerance': tolerance,
                    'uncertainty': uncertainty,
                }
                if (calibrate) {
                    callApi('calibrate-sensor', { 'sensor_id': sensorId, 'target_reading': parameters.reference_reading })
                }
                callApi('create-reading', parameters)
                    .then(() => {
                        refresh();
                    })
            }
        }
    }

    const getHumidityAverages = async (sensorList, setPoint, reference = 'S000119') => {
        const data = await callApi('get-last-humidity-stable-reading', { 'set_point': setPoint });
        let readings = await callApi('get-humidity-reading-range', { 'timestamp': data[1] });

        let referenceHumidity = readings.map((item) => item.rotronic_data[reference].Humidity).filter((value) => value !== undefined);
        let referenceTemperature = readings.map((item) => item.rotronic_data[reference].Temperature).filter((value) => value !== undefined);
        referenceHumidity = round(referenceHumidity.reduce((a, b) => a + b, 0) / referenceHumidity.length);
        referenceTemperature = round(referenceTemperature.reduce((a, b) => a + b, 0) / referenceTemperature.length);
        readings = readings.map((item) => item.devices_under_test);

        let finalReadings = { 'referenceHumidity': referenceHumidity, 'referenceTemperature': referenceTemperature };
        for (const sensor of sensorList) {
            const sensorId = sensor.sensor_id
            let humidityReading = readings.map((item) => item[`${sensorId}humidity`]).filter((value) => value !== undefined);
            let temperatureReading = readings.map((item) => item[`${sensorId}temp`]).filter((value) => value !== undefined);
            humidityReading = round(humidityReading.reduce((a, b) => a + b, 0) / humidityReading.length);
            temperatureReading = round(temperatureReading.reduce((a, b) => a + b, 0) / temperatureReading.length);

            finalReadings[`${sensorId}humidity`] = humidityReading;
            finalReadings[`${sensorId}temp`] = temperatureReading;
        }
        return finalReadings;
    }


    const createHumidityReading = async (setPointsSetPoint, humidityUncertainty, temperatureUncertainty) => {
        let promises = [];
        let readings = await callApi('get-recent-data');
        const humidityAverages = await getHumidityAverages(sensorList, setPoints[setPointsSetPoint].humidity);
        for (const type of ['humidity', 'temperature']) {
            if (!humidityAverages.referenceHumidity || !humidityAverages.referenceTemperature) {
                setPopupMessage('No stable data found!');
            } else {
                for (const sensor of sensorList) {
                    if (selectedSensor && sensor.sensor_id !== parseInt(selectedSensor)) {
                        continue;
                    }
                    if (!humidityAverages[`${sensor.sensor_id}humidity`] || !humidityAverages[`${sensor.sensor_id}temp`]) {
                        setPopupMessage(`No stable data found for sensor: ${sensor.sensor_id}`);
                        return;
                    } else {
                        let referenceReading;
                        let sensorReading;
                        let setPoint;
                        let tolerance;
                        let uncertainty;

                        if (type === 'humidity') {
                            referenceReading = humidityAverages.referenceHumidity;
                            sensorReading = humidityAverages[`${sensor.sensor_id}humidity`];
                            setPoint = setPoints[setPointsSetPoint].humidity;
                            tolerance = 5;
                            uncertainty = humidityUncertainty;
                        } else {
                            referenceReading = humidityAverages.referenceTemperature;
                            sensorReading = humidityAverages[`${sensor.sensor_id}temp`];
                            setPoint = setPoints[setPointsSetPoint].temperature;
                            tolerance = 1;
                            uncertainty = temperatureUncertainty;
                        }
                        const parameters = {
                            'type': type,
                            'set_point': setPoint,
                            'reference_reading': referenceReading,
                            'sensor_reading': sensorReading,
                            'lab_rh': readings[0].lab_humidity,
                            'lab_temperature': readings[0].lab_temperature,
                            'sensor_id': sensor.sensor_id,
                            'generator_id': 5,
                            'reference_id': 13,
                            'tolerance': tolerance,
                            'uncertainty': uncertainty,
                        }
                        promises.push(callApi('create-reading', parameters))
                    }
                }
                await Promise.all(promises);
                refresh();
            }
        }
    }

    let menu;
    switch (calibrationProcedureId) {
        case 1:
            menu = (
                <div className={styles.testing_grid}>
                    <div className={styles.grid_row}>
                        <button className={`${styles.default_button} ${styles.red}`} onClick={clearSelectedSensor}>Clear selection</button>
                        <button className={styles.default_button} onClick={() => { setRefreshButtonText('Loading...'); setStableTimesToLoading(); refresh(); setRefreshButtonText('Refresh') }}>{refreshButtonText}</button>
                        <button className={styles.default_button} onClick={() => createReading(setPoints[0], 'S000114', 1, 14, 1, 0.02, 'temperature', true)}>As Found</button>
                        <button className={styles.default_button} onClick={() => createReading(setPoints[1], 'S000114', 1, 14, 1, 0.02, 'temperature')}>{setPoints[1].temperature}°C</button>
                        <button className={styles.default_button} onClick={() => createReading(setPoints[2], 'S000115', 2, 15, 1, 0.028, 'temperature')}>{setPoints[2].temperature}°C</button>
                        <button className={styles.default_button} onClick={() => createReading(setPoints[3], 'S000116', 3, 16, 1, 0.068, 'temperature')}>{setPoints[3].temperature}°C</button>
                        <div className={styles.grid_entry}>Stable times</div>
                        <div className={styles.grid_entry}></div>
                        <StableTimeDisplay stableTime={point1StableTime} />
                        <StableTimeDisplay stableTime={point1StableTime} />
                        <StableTimeDisplay stableTime={point2StableTime} />
                        <StableTimeDisplay stableTime={point3StableTime} />
                    </div>
                    {sensorGrid}
                </div>
            );
            break;
        case 2:
            menu = (
                <div className={styles.testing_grid}>
                    <div className={styles.grid_row}>
                        <button className={`${styles.default_button} ${styles.red}`} onClick={clearSelectedSensor}>Clear selection</button>
                        <button className={styles.default_button} onClick={() => { setRefreshButtonText('Loading...'); setStableTimesToLoading(); refresh(); setRefreshButtonText('Refresh') }}>{refreshButtonText}</button>
                        <button className={styles.default_button} onClick={() => createReading(setPoints[0], 'S000115', 2, 15, 1, 0.021, 'temperature', true)}>As Found</button>
                        <button className={styles.default_button} onClick={() => createReading(setPoints[1], 'S000115', 2, 15, 1, 0.021, 'temperature')}>{setPoints[1].temperature}°C</button>
                        <button className={styles.default_button} onClick={() => createReading(setPoints[2], 'S000115', 17, 15, 1, 0.047, 'temperature')}>{setPoints[2].temperature}°C</button>
                        <button className={styles.default_button} onClick={() => createReading(setPoints[3], 'S000115', 18, 15, 1.5, 0.018, 'temperature')}>{setPoints[3].temperature}°C</button>
                        <div className={styles.grid_entry}>Stable times</div>
                        <div className={styles.grid_entry}></div>
                        <StableTimeDisplay stableTime={point1StableTime} />
                        <StableTimeDisplay stableTime={point1StableTime} />
                        <StableTimeDisplay stableTime={point2StableTime} />
                        <StableTimeDisplay stableTime={point3StableTime} />
                    </div>
                    {sensorGrid}
                </div >
            );
            break;
        case 3:
            menu = (
                <div className={styles.testing_grid}>
                    <div className={styles.humidity_grid}>
                        <button className={`${styles.default_button} ${styles.red}`} onClick={clearSelectedSensor}>Clear selection</button>
                        <button className={styles.default_button} onClick={() => { setRefreshButtonText('Loading...'); setStableTimesToLoading(); refresh(); setRefreshButtonText('Refresh') }}>{refreshButtonText}</button>
                        <button className={styles.default_button} onClick={() => createHumidityReading(0, 2.1, 0.45)}>{setPoints[0].humidity}%RH<br />{setPoints[0].temperature}°C</button>
                        <button className={styles.default_button} onClick={() => createHumidityReading(1, 2.3, 0.4)}>{setPoints[1].humidity}%RH<br />{setPoints[1].temperature}°C</button>
                        <button className={styles.default_button} onClick={() => createHumidityReading(2, 2.3, 0.28)}>{setPoints[2].humidity}%RH<br />{setPoints[2].temperature}°C</button>
                        <div className={styles.grid_entry}>Stable times</div>
                        <div className={styles.grid_entry}></div>
                        <StableTimeDisplay stableTime={point1StableTime} />
                        <StableTimeDisplay stableTime={point2StableTime} />
                        <StableTimeDisplay stableTime={point3StableTime} />
                    </div>
                    {sensorGrid}
                </div >
            );
            break;
        case 4:
            menu = (
                <div className={styles.testing_grid}>
                    <div className={styles.grid_row}>
                        <button className={`${styles.default_button} ${styles.red}`} onClick={clearSelectedSensor}>Clear selection</button>
                        <button className={styles.default_button} onClick={() => { setRefreshButtonText('Loading...'); setStableTimesToLoading(); refresh(); setRefreshButtonText('Refresh') }}>{refreshButtonText}</button>
                        <button className={styles.default_button} onClick={() => createReading(setPoints[0], 'S000115', 17, 15, 1, 0.011, 'temperature', true)}>As Found</button>
                        <button className={styles.default_button} onClick={() => createReading(setPoints[1], 'S000115', 17, 15, 1, 0.011, 'temperature')}>{setPoints[1].temperature}°C</button>
                        <button className={styles.default_button} onClick={() => createReading(setPoints[2], 'S000115', 17, 15, 1, 0.089, 'temperature')}>{setPoints[2].temperature}°C</button>
                        <button className={styles.default_button} onClick={() => createReading(setPoints[3], 'S000115', 17, 15, 1, 0.022, 'temperature')}>{setPoints[3].temperature}°C</button>
                        <div className={styles.grid_entry}>Stable times</div>
                        <div className={styles.grid_entry}></div>
                        <StableTimeDisplay stableTime={point1StableTime} />
                        <StableTimeDisplay stableTime={point1StableTime} />
                        <StableTimeDisplay stableTime={point2StableTime} />
                        <StableTimeDisplay stableTime={point3StableTime} />
                    </div>
                    {sensorGrid}
                </div >
            );
            break;
        case 5:
            menu = (
                <div className={styles.testing_grid}>
                    <div className={styles.grid_row}>
                        <button className={`${styles.default_button} ${styles.red}`} onClick={clearSelectedSensor}>Clear selection</button>
                        <button className={styles.default_button} onClick={() => { setRefreshButtonText('Loading...'); setStableTimesToLoading(); refresh(); setRefreshButtonText('Refresh') }}>{refreshButtonText}</button>
                        <button className={styles.default_button} onClick={() => createRotronicTemperatureReading(setPoints[0], 'S000119', 5, 13, 1, 0.23, 'temperature', true)}>As Found</button>
                        <button className={styles.default_button} onClick={() => createRotronicTemperatureReading(setPoints[1], 'S000119', 5, 13, 1, 0.23, 'temperature')}>{setPoints[1].temperature}°C</button>
                        <button className={styles.default_button} onClick={() => createRotronicTemperatureReading(setPoints[2], 'S000119', 5, 13, 1, 0.4, 'temperature')}>{setPoints[2].temperature}°C</button>
                        <button className={styles.default_button} onClick={() => createRotronicTemperatureReading(setPoints[3], 'S000119', 5, 13, 1, 0.62, 'temperature')}>{setPoints[3].temperature}°C</button>
                        <div className={styles.grid_entry}>Stable times</div>
                        <div className={styles.grid_entry}></div>
                        <StableTimeDisplay stableTime={point1StableTime} />
                        <StableTimeDisplay stableTime={point1StableTime} />
                        <StableTimeDisplay stableTime={point2StableTime} />
                        <StableTimeDisplay stableTime={point3StableTime} />
                    </div>
                    {sensorGrid}
                </div >
            );
            break;
        default:
            menu = (
                <h1 className={styles.title}>No calibration menu found</h1>
            )
    }
    if (sensorList.length < 1) {
        return (
            <>
                <h1 className={styles.title}>No sensors found</h1>
            </>
        )
    } else if (loadingMessage) {
        return (
            <>
                <h1 className={styles.title}>Loading...</h1>
            </>
        )
    }


    return menu;
}

export default TestingMenu;