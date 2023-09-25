import { useState, useEffect } from "react";
import styles from "../../styles/styles.module.css";
import callApi from "../../utils/api/callApi";
import { useNavigate } from "react-router-dom";

function BatchEntry({ batchNumber, setBatchNumber, setSensors, setProcedureId, technicianId, setPopupMessage }) {
    let navigate = useNavigate();
    const [batches, setBatches] = useState([<h1 className={styles.title}>Loading...</h1>]);

    useEffect(() => {
        let isMounted = true;

        const handleButtonClick = (batch) => {
            setBatchNumber(batch.batch_id);
            if (technicianId) {
                callApi('update-batch-technician', { 'department': 'testing', 'technician_id': technicianId, 'batch_id': batch.batch_id })
                setProcedureId(batch.calibration_procedure_id);
                callApi('get-sensors', { 'batch_id': batch.batch_id })
                    .then(data => {
                        setSensors(data);
                    })
                navigate('/manageBatch');
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
                        setBatches([<h1 className={styles.title}>No batches found</h1>]);
                        return;
                    }
                    let batchList = [];
                    const promises = response.map(batch => {
                        return callApi('get-sensors-by-batch-id', { batch_id: batch.batch_id })
                            .then(sensors => {
                                batchList.push(
                                    <button key={batch.batch_id} className={styles.batch_button} onClick={() => handleButtonClick(batch)}>
                                        {`Batch: ${batch.batch_id} | Order: ${batch.order_id} | Sensors: ${sensors.length} | `}
                                        <span className={styles[`calibration_${batch.calibration_procedure_id}`]}>{`CP: ${batch.calibration_procedure_id}`}</span>
                                    </button>
                                );
                            });
                    });

                    Promise.all(promises).then(() => {
                        if (isMounted) {
                            const newBatchList = batchList.sort((a, b) => a.batch_id - b.batch_id);
                            setBatches(newBatchList);
                        }
                    });
                });
        }

        return () => {
            isMounted = false;
        };
    }, [setBatchNumber, setSensors, setProcedureId, navigate, technicianId, setPopupMessage, batches.length]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!technicianId) {
            setPopupMessage('Please sign in');
            return;
        }
        if (parseInt(batchNumber)) {
            callApi('get-batch-by-id', { 'batch_id': batchNumber })
                .then(batch => {
                    if (technicianId) {
                        callApi('update-batch-technician', { 'department': 'testing', 'technician_id': technicianId, 'batch_id': batch.batch_id })
                        setProcedureId(batch.calibration_procedure_id);
                        callApi('get-sensors', { 'batch_id': batchNumber })
                            .then(data => {
                                setSensors(data);
                            })
                        navigate('/manageBatch');
                    } else {
                        setPopupMessage('Please sign in');
                    }
                })
        } else {
            setPopupMessage('Batch must be a number')
        }
    }

    const handleChange = (event) => {
        setBatchNumber(event.target.value);
    }

    console.log(batches)
    return (
        <div className={styles.menu}>
            <form onSubmit={handleSubmit}>
                <input type='text' value={batchNumber} onChange={handleChange} className={styles.default_text_box} placeholder={'Batch Number'} />
                <button type='submit' className={styles.default_button}>Submit</button>
            </form>
            <br />
            <hr />
            <br />
            {batches.map(batch => <>{batch}</>)}
        </div>
    );
}

export default BatchEntry;
