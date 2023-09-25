import { useEffect, useState } from "react";
import styles from "../../styles/styles.module.css";
import addSensor from "../../utils/addSensor";
import ScannedSensors from "../ScannedSensors/ScannedSensors";
import callApi from "../../utils/api/callApi";

function AddBatchMenu({ technicianId, calibrationProcedureId, batchNumber, setPopupMessage, batches, setBatches }) {
    const [addedSensors, setAddedSensors] = useState([]);
    const [sensors, setSensors] = useState([]);
    const [sensor, setSensor] = useState('');
    const [displayed, setDisplayed] = useState(true);

    const handleAddSensor = (event) => {
        event.preventDefault();
        if (!technicianId) {
            setPopupMessage('Please sign in');
        } else {
            if (sensor) {
                const sensorObject = {sensor: sensor, online: false}
                if (!addedSensors.includes(sensor)) {
                    setAddedSensors([...addedSensors, sensor])
                    addSensor(sensorObject.sensor, batchNumber)
                        .then(sensorValid => {
                            if (!sensorValid) {
                                setPopupMessage(`Sensor "${sensor}" could not be added`);
                                setSensors(sensors.filter(item => item !== sensorObject))
                            }
                        })
                    setSensors([...sensors, sensorObject]);
                } else {
                    setPopupMessage(`Sensor "${sensor}" is already in this batch`);
                }
                setSensor('');
            }
        }
    }

    const checkStatus = () => {
        callApi('get-online-sensors')
        .then(response => {
            for (const fullSensor of addedSensors) {
                if (response.includes(parseInt(fullSensor.split(':')[0]))) {
                    let newSensors = []
                    for (const sensorElement of sensors) {
                        if (sensorElement.sensor === fullSensor) {
                            sensorElement.online = true;
                        }
                        newSensors.push({sensor: sensorElement.sensor, online: sensorElement.online});
                    }
                    setSensors(newSensors)
                }
            }
        })
        .catch(error => {
            console.error(error);
        })
    }

    useEffect(() => {
        const interval = setInterval(checkStatus, 3000);
        return () => clearInterval(interval);
    })

    const removeBatch = () => {
        callApi('delete-batch', { batch_id: batchNumber })
            .catch(error => {
                console.error(error)
            })
        if (batches.length > 1) {
            setBatches(
                batches.filter(batch => {
                    return batch.batch_id !== batchNumber;
                })
            )
        } else {
            setBatches([]);
        }
    }

    if (!displayed) {
        return (
            <button className={styles.default_button} onClick={() => setDisplayed(true)}>{`Expand (Batch: ${batchNumber} | Calibration procedure: ${calibrationProcedureId}) | Total sensors: ${sensors.length}`}</button>
        )
    }
    return (
        <>
            <h1 className={styles.title}>{`Expand (Batch: ${batchNumber} | Calibration procedure: ${calibrationProcedureId}) | Total sensors: ${sensors.length}`}</h1>
            <div className={styles.sensor_entry_grid_container}>
                <button className={styles.default_button} onClick={handleAddSensor}>Add Sensor</button>
                <form onSubmit={handleAddSensor}>
                    <input type='text' value={sensor} onChange={event => setSensor(event.target.value)} className={styles.default_text_box} placeholder={'Sensor ID:Check Digit'} />
                </form>
                <ScannedSensors sensorList={sensors} />
                <button type="button" className={`${styles.default_button} ${styles.red}`} onClick={removeBatch}>Remove batch</button>
                <button className={`${styles.default_button} ${styles.button_span}`} onClick={() => setDisplayed(false)}>Hide batch</button>
            </div>
        </>
    )
}

export default AddBatchMenu;