import { useState, useEffect } from "react";
import ip from "../../utils/ip/ip";
import styles from "../../styles/styles.module.css";
import callApi from "../../utils/api/callApi";
import DropDown from "../DropDown/DropDown";
import AddBatchMenu from "../AddBatchMenu/AddBatchMenu";
import { useNavigate } from "react-router-dom";

function SalesOrderForm({ salesOrder, technicianId, setConfirmationMessage, setPopupMessage, order }) {
    let navigate = useNavigate();
    const [batches, setBatches] = useState([]);
    const [calibrationProcedures, setCalibrationProcedures] = useState([])
    const [selectedOption, setSelectedOption] = useState('');
    const [batchDisplay, setBatchDisplay] = useState(null);



    useEffect(() => {
        callApi('get-calibration-procedures')
            .then(response => {
                setCalibrationProcedures(response);
            })
        if (batches.length > 0) {
            setBatchDisplay(batches.map((batch, index) => (
                <AddBatchMenu key={index} technicianId={technicianId} calibrationProcedureId={batch.calibration_procedure_id} batchNumber={batch.batch_id} setPopupMessage={setPopupMessage} batches={batches} setBatches={setBatches} />
            )))
        } else {
            setBatchDisplay(null);
        }
    }, [salesOrder, order, batches, technicianId, setPopupMessage]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        for (const batch of batches) {
            if (batch.batch_id) {
                callApi('log-batch-interaction', { department: 'receiving', start: false, technician_id: technicianId, batch_id: batch.batch_id })
                    .catch(error => {
                        console.error(error);
                    })

                fetch(`http://${ip}:8000/api/generate-work-order?batch_id=${batch.batch_id}`)
                    .then(response => {
                        if (response.ok) {
                            if (response.headers.get('content-type') === 'application/json; charset=utf-8') {
                                return response.blob();
                            } else {
                                console.error(`Expecting work order 'application/json' but instead got '${response.headers.get("content-type")}': ${response}`);
                                setPopupMessage(`Failed to generate work order for batch ${batch.batch_id}`);
                            }
                        } else {
                            console.error(`Could not complete generation, response.ok: ${response.ok}`);
                            setPopupMessage(`Failed to generate work order for batch ${batch.batch_id}`);
                        }
                    })
                    .then(blob => {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `workOrder${batch.batch_id}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
            }
        }
        setConfirmationMessage(`Order: ${order} was created successfully`);
        navigate('/confirmation');
    }

    if (!order) {
        return (
            <h1 className={styles.title}>Loading...</h1>
        )
    }

    return (
        <>
            <h1 className={styles.title}>{`Sales Order: ${order}`}</h1>
            <div className={styles.grid_menu}>
                <div className={styles.menu_form}>
                    <div className={styles.grid_entry_container}>
                        <input type='text' className={styles.customer_info_text_box} placeholder={'Client Name'} defaultValue={'Monnit'} />
                        <input type='text' className={styles.customer_info_text_box} placeholder={'Contact Name'} defaultValue={'Sarah Larsen'} />
                        <input type='text' className={styles.customer_info_text_box} placeholder={'Address Line 1'} defaultValue={'3400 South, West Temple'} />
                        <input type='text' className={styles.customer_info_text_box} placeholder={'Address Line 2'} defaultValue={'South Salt Lake, UT 84115'} />
                        <input type='text' className={styles.customer_info_text_box} placeholder={'Phone Number'} defaultValue={'801-561-5555'} />
                        <input type='text' className={styles.customer_info_text_box} placeholder={'Email Address'} defaultValue={'sarahl@monnit.com'} />
                    </div>
                    <DropDown options={calibrationProcedures} selectedOption={selectedOption} setSelectedOption={setSelectedOption} batches={batches} setBatches={setBatches} technicianId={technicianId} order={order} setPopupMessage={setPopupMessage} />
                    {batchDisplay}
                    <button onClick={handleSubmit} className={styles.default_button}>Complete Sales Order</button>
                </div>
            </div>
        </>
    );
}

export default SalesOrderForm;