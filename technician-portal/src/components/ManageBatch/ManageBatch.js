import { useState, useEffect, useRef } from "react";
import styles from "../../styles/styles.module.css";
import callApi from "../../utils/api/callApi";
import TestingMenu from "../TestingMenu/TestingMenu";
import { useNavigate } from "react-router-dom";
import ip from "../../utils/ip/ip";

function ManageBatch({ batchNumber, sensorList, calibrationProcedureId, setPopupMessage, technicianId, sensorGrid, setSensorGrid }) {
    let navigate = useNavigate();
    const [heartbeat, setHeartBeat] = useState('');
    const [location, setLocation] = useState('');
    const [currentLocation, setCurrentLocation] = useState('');
    const readings = useRef(null);
    let setPoints;

    switch (calibrationProcedureId) {
        case 1:
            setPoints = [
                {
                    temperature: '-999.00',
                    stabilityCriteria: { difference: 0.5, slope: 0.0099, standardDeviation: 0.005 }
                },
                {
                    temperature: '28.00',
                    stabilityCriteria: { difference: 0.5, slope: 0.0099, standardDeviation: 0.005 }
                },
                {
                    temperature: '-25.00',
                    stabilityCriteria: { difference: 0.5, slope: 0.0099, standardDeviation: 0.009 }
                },
                {
                    temperature: '90.00',
                    stabilityCriteria: { difference: 0.5, slope: 0.0099, standardDeviation: 0.006 }
                }
            ];
            break;
        case 2:
            setPoints = [
                {
                    temperature: '-999.00',
                    stabilityCriteria: { difference: 0.5, slope: 0.0099, standardDeviation: 0.0078 }
                },
                {
                    temperature: '0.00',
                    stabilityCriteria: { difference: 0.5, slope: 0.0099, standardDeviation: 0.0078 }
                },
                {
                    temperature: '-80.00',
                    stabilityCriteria: { difference: 0.5, slope: 0.0099, standardDeviation: 0.0057 }
                },
                {
                    temperature: '-197.00',
                    stabilityCriteria: { difference: 0.5, slope: 0.0099, standardDeviation: 0.0020 }
                }
            ];
            break;
        case 3:
            setPoints = [
                {
                    temperature: '40.00',
                    humidity: '20.00',
                    stabilityCriteria: { difference: 2.0, slope: 0.003, standardDeviation: 0.30 }
                },
                {
                    temperature: '30.00',
                    humidity: '50.00',
                    stabilityCriteria: { difference: 2.0, slope: 0.003, standardDeviation: 0.60 }
                },
                {
                    temperature: '20.00', humidity: '80.00',
                    stabilityCriteria: { difference: 2.0, slope: 0.003, standardDeviation: 0.65 }
                },
            ];
            break;
        case 4:
            setPoints = [
                {
                    temperature: '-999.00',
                    stabilityCriteria: { difference: 0.5, slope: 0.0099, standardDeviation: 0.00036 }
                },
                {
                    temperature: '28.00',
                    stabilityCriteria: { difference: 0.5, slope: 0.0099, standardDeviation: 0.00036 }
                },
                {
                    temperature: '-25.00',
                    stabilityCriteria: { difference: 0.5, slope: 0.0099, standardDeviation: 0.044 }
                },
                {
                    temperature: '90.00',
                    stabilityCriteria: { difference: 0.5, slope: 0.0099, standardDeviation: 0.0032 }
                }
            ];
            break;
        case 5:
            setPoints = [
                {
                    temperature: '-999.00',
                    stabilityCriteria: { difference: 0.25, slope: 0.005, standardDeviation: 0.075 }
                },
                {
                    temperature: '20.00',
                    stabilityCriteria: { difference: 0.25, slope: 0.005, standardDeviation: 0.075 }
                },
                {
                    temperature: '-20.00',
                    stabilityCriteria: { difference: 0.25, slope: 0.005, standardDeviation: 0.065 }
                },
                {
                    temperature: '60.00',
                    stabilityCriteria: { difference: 0.25, slope: 0.005, standardDeviation: 0.01 }
                }
            ];
            break;
        default:
            setPoints = null;
    }

    useEffect(() => {
        callApi('get-batch-by-id', { batch_id: batchNumber })
            .then(response => {
                setCurrentLocation(response.current_location)
            })
    })

    const downloadWorkOrder = () => {
        fetch(`http://${ip}:8000/api/generate-work-order?batch_id=${batchNumber}`)
            .then(response => {
                if (response.ok) {
                    if (response.headers.get('content-type') === 'application/json; charset=utf-8') {
                        return response.blob();
                    } else {
                        console.error(`Expecting work order 'application/json' but instead got '${response.headers.get("content-type")}': ${response}`);
                        setPopupMessage(`Failed to generate work order for batch ${batchNumber}`);
                    }
                } else {
                    console.error(`Could not complete generation, response.ok: ${response.ok}`);
                    setPopupMessage(`Failed to generate work order for batch ${batchNumber}`);
                }
            })
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `workOrder${batchNumber}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    const handleHeartBeatChange = (event) => {
        setHeartBeat(event.target.value);
    }

    const handleHeartBeatSubmit = (event) => {
        if (!heartbeat) {
            return;
        }
        event.preventDefault();
        const promises = [];
        for (const sensor of sensorList) {
            try {
                promises.push(callApi('change-sensor-heartbeat', { sensor_id: sensor.sensor_id, heartbeat: heartbeat }));
            } catch (error) {
                console.error(error);
                setPopupMessage(`Sensor ${sensor.sensor_id} failed: ${error}`)
            }
        }
        Promise.all(promises);
        setPopupMessage(`Heartbeat changed to ${heartbeat} minutes`);
        setHeartBeat('');
    }

    const handleLocationChange = (event) => {
        setLocation(event.target.value);
    }

    const handleLocationSubmit = async (event) => {
        if (!location) {
            return;
        }
        event.preventDefault();
        const response = await callApi('create-location-log', { 'location': location, 'batch_id': batchNumber })
        if (!response.error) {
            setPopupMessage(`Batch moved to ${location}`);
            setCurrentLocation(location);
            setLocation('');
            if (location.startsWith('S')) {
                callApi('log-batch-interaction', { department: 'testing', start: false, technician_id: technicianId, batch_id: batchNumber })
                callApi('set-batch-active-state', { batch_id: batchNumber, active_state: false })
                for (const sensor of sensorList) {
                    callApi('change-sensor-heartbeat', { sensor_id: sensor.sensor_id, heartbeat: 120 })
                }
            } else if (location.startsWith('T')) {
                callApi('log-batch-interaction', { department: 'testing', start: true, technician_id: technicianId, batch_id: batchNumber })
            }
        } else {
            setPopupMessage('The batch was not moved successfully');
            console.error(response.error)
        }
    }

    return (
        <>
            <div className={styles.menu}>
                <div className={styles.grid_menu}>
                    <h1 className={styles.title}>{'Batch: ' + batchNumber + (currentLocation ? ` | Current location: ${currentLocation}` : ` | No location set`)}</h1>
                    <button className={styles.default_button} onClick={() => navigate('/batchEntry')}>Change Batch</button>
                    <button className={styles.default_button} onClick={downloadWorkOrder}>Download work order</button>
                    <form onSubmit={handleLocationSubmit}>
                        <input type='text' value={location} onChange={handleLocationChange} className={styles.default_text_box} placeholder={'Location'} />
                    </form>
                    <form onSubmit={handleHeartBeatSubmit}>
                        <input type='text' value={heartbeat} onChange={handleHeartBeatChange} className={styles.default_text_box} placeholder={'Heartbeat'} />
                    </form>
                </div>
                <br />
                <hr />
                <br />
                <div className={styles.test_menu}>
                    <h1 className={styles.title}>{`Calibration Procedure: ${calibrationProcedureId}`}</h1>
                    <TestingMenu sensorGrid={sensorGrid} calibrationProcedureId={calibrationProcedureId} readings={readings} sensorList={sensorList} setPoints={setPoints} setSensorGrid={setSensorGrid} setPopupMessage={setPopupMessage} />
                </div>
            </div>
        </>
    );
}

export default ManageBatch;