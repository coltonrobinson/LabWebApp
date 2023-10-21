import { useAppContext } from "../../contexts/app";
import callApi from "../../utils/api/callApi";

import styles from "../../styles/styles.module.css";

const DropDown = ({ options, selectedOption, setSelectedOption, batches, setBatches }) => {
    const { technicianId, setPopupMessage, order } = useAppContext()

    const createBatch = async (calibration_procedure) => {
        if (!technicianId) {
            setPopupMessage('Please sign in');
        } else {
            callApi('create-batch', { order_id: order, calibration_procedure_id: calibration_procedure, receiving_technician_id: technicianId })
                .then(response => {
                    callApi('log-batch-interaction', { department: 'receiving', start: true, technician_id: technicianId, batch_id: response[0].batch_id })
                    setBatches([...batches, response[0]]);
                })
        }
    }
    const handleOptionChange = async (event) => {
        createBatch(event.target.value);
        setSelectedOption('');
    };

    return (
        <div>
            <select className={styles.dropdown} value={selectedOption} onChange={handleOptionChange}>
                <option value="">Add Calibration Procedure</option>
                {options.map((option, index) => (
                    <option key={index} value={option.calibration_procedure_id}>
                        {`${option.calibration_procedure_id}: ${option.calibration_procedure}`}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default DropDown;