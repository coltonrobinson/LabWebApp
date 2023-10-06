import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppContext } from "../../contexts/app";

import callApi from "../../utils/api/callApi";
import AddBatchMenu from "../AddBatchMenu/AddBatchMenu";
import DropDown from "../DropDown/DropDown";

import styles from "../../styles/styles.module.css";

function SalesOrderForm() {
    const navigate = useNavigate();
    const {
        salesOrder, technicianId, setConfirmationMessage,
        setPopupMessage, order
    } = useAppContext()

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
                <AddBatchMenu
                    key={index}
                    calibrationProcedureId={batch.calibration_procedure_id}
                    batchNumber={batch.batch_id}
                    batches={batches}
                    setBatches={setBatches}
                />
            )))
        } else {
            setBatchDisplay(null);
        }
    }, [salesOrder, order, batches, technicianId, setPopupMessage]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        for (const batch of batches) {
            if (batch.batch_id) {
                callApi('log-batch-interaction', {
                    department: 'receiving',
                    start: false,
                    technician_id: technicianId,
                    batch_id: batch.batch_id
                })
                    .catch(error => {
                        console.error(error);
                    })
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
                    <DropDown
                        options={calibrationProcedures}
                        selectedOption={selectedOption}
                        setSelectedOption={setSelectedOption}
                        batches={batches}
                        setBatches={setBatches}
                        order={order}
                    />
                    {batchDisplay}
                    <button onClick={handleSubmit} className={styles.default_button}>Complete Sales Order</button>
                </div>
            </div>
        </>
    );
}

export default SalesOrderForm;