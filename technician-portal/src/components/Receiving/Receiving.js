import { useNavigate } from "react-router-dom";
import styles from "../../styles/styles.module.css";
import callApi from "../../utils/api/callApi";

function Receiving({ salesOrder, setSalesOrder, setOrder }) {
    const navigate = useNavigate();
    const handleSubmit = (event) => {
        event.preventDefault();
        callApi('create-order', { 'customer_id': 1, 'customer_order_number': salesOrder })
            .then(response => {
                const tempOrder = response[0]['order_id'];
                setOrder(tempOrder);
                navigate('/createSalesOrder');
            })
    }

    const handleChange = (event) => {
        setSalesOrder(event.target.value);
    }

    return (
        <div className={styles.menu}>
            <form onSubmit={handleSubmit}>
                <input type='text' value={salesOrder} onChange={handleChange} className={styles.default_text_box} placeholder={'Sales Order'} />
                <button type='submit' className={styles.default_button}>Submit</button>
            </form>
        </div>
    );
}

export default Receiving;