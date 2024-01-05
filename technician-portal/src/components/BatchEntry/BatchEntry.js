import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppContext } from "../../contexts/app";
import callApi from "../../utils/api/callApi";

import styles from "../../styles/styles.module.css";

function BatchEntry() {
    const navigate = useNavigate();
    const {
        batchNumber, setBatchNumber, setSensorList, setProcedureId,
        technicianId, setPopupMessage, sensorGrid, setSensorGrid
    } = useAppContext()

    const [batches, setBatches] = useState([<h1 className={styles.title} key={'fillerKey'}>Loading...</h1>]);

    async function getBatchSensors(batches) {
        const promises = []
        for (const batch of batches) {
            promises.push(callApi('get-sensors', { batch_id: batch.batch_id })
                .then(sensors => {
                    batches[batches.indexOf(batch)].sensors = sensors;
                }))
        }
        await Promise.all(promises);
        return batches;
    }

    useEffect(() => {
        let isMounted = true;

        if (sensorGrid.length > 0) {
            setSensorGrid([]);
        }

        const handleButtonClick = (batch) => {
            setBatchNumber(batch.batch_id);
            if (technicianId) {
                callApi('update-batch-technician', { 'department': 'testing', 'technician_id': technicianId, 'batch_id': batch.batch_id })
                setProcedureId(batch.calibration_procedure_id);
                callApi('get-sensors', { 'batch_id': batch.batch_id })
                    .then(data => {
                        setSensorList(data);
                        navigate('/manageBatch');
                    })
            } else {
                setPopupMessage('Please sign in');
            }
        }
        if (batches.length === 1 && isMounted) {
            callApi('get-batches-by-active-state', { active: true })
                .then(response => {
                    if (!isMounted) {
                        return;
                    }
                    if (response.length === 0) {
                        setBatches([<h1 className={styles.title} key={'fillerKey'}>No batches found</h1>]);
                        return;
                    }
                    getBatchSensors(response)
                        .then(response => {
                            const batchList = []
                            const orders = [...new Set(response.map(batch => batch.order_id))].sort((a, b) => b - a)

                            for (const order of orders) {
                                const batches = [...new Set(response.filter(batch => batch.order_id === order))].sort((a, b) => b - a);
                                batchList.push(
                                    <div key={orders.indexOf(order)}>
                                        <hr />
                                        <h1 className={styles.title}>{`TO: ${batches[0].customer_order_number} | Order: ${order}`}</h1>
                                        {batches.map((batch, index) => {
                                            return <BatchDisplay batch={batch} handleButtonClick={handleButtonClick} key={index} />
                                        })}
                                    </div>
                                )
                            }

                            if (isMounted) {
                                setBatches(batchList);
                            }
                        });
                })
        }

        return () => {
            isMounted = false;
        };
    }, [setBatchNumber, setSensorList, setProcedureId, navigate, technicianId, setPopupMessage, batches.length, sensorGrid.length, setSensorGrid]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!technicianId) {
            setPopupMessage('Please sign in');
            return;
        }
        if (parseInt(batchNumber)) {
            callApi('get-batch-by-id', { 'batch_id': batchNumber })
                .then(batch => {
                    callApi('update-batch-technician', { 'department': 'testing', 'technician_id': technicianId, 'batch_id': batch.batch_id })
                    setProcedureId(batch.calibration_procedure_id);
                    callApi('get-sensors', { 'batch_id': batchNumber })
                        .then(data => {
                            setSensorList(data);
                        })
                    navigate('/manageBatch');
                })
        } else {
            setPopupMessage('Batch must be a number')
        }
    }

    const handleChange = (event) => {
        setBatchNumber(event.target.value);
    }

    return (
        <div className={styles.menu} >
            <form onSubmit={handleSubmit} data-testid={'batchForm'} >
                <input type='text' value={batchNumber} onChange={handleChange} className={styles.default_text_box} placeholder={'Batch Number'} />
                <button type='submit' className={styles.default_button}>Submit</button>
            </form>
            {batches}
        </div>
    );
}

function BatchDisplay({ batch, handleButtonClick }) {
    return (
        <>
            <button key={batch.batch_id} className={styles.batch_button} onClick={() => handleButtonClick(batch)}>
                {`Batch: ${batch.batch_id} | Sensors: ${batch.sensors ? batch.sensors.length : 0} | `}
                <span className={styles[`calibration_${batch.calibration_procedure_id}`]}>{`CP: ${batch.calibration_procedure_id}`}</span>
            </button>
        </>
    )


}

export default BatchEntry;
