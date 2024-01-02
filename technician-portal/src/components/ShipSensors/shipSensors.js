import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppContext } from "../../contexts/app";
import callApi from "../../utils/api/callApi";

import styles from "../../styles/styles.module.css";

function ShipSensors() {
    const navigate = useNavigate();
    const updated = useRef(false);
    const loading = useRef(true);
    const { setPopupMessage } = useAppContext()

    const [orders, setOrders] = useState(<></>)
    const [ordersSelected, setOrdersSelected] = useState([]);
    const [name, setName] = useState('');
    const checkAll = useRef(false);

    const handleCheck = (event) => {
        const value = parseInt(event.target.value);
        const isChecked = event.target.checked;

        setOrdersSelected(prevOrdersSelected => {
            if (isChecked) {
                if (ordersSelected.length === orders.length - 1) checkAll.current = true;
                return [...prevOrdersSelected, value];
            } else {
                checkAll.current = false;
                return prevOrdersSelected.filter(order => order !== value);
            }
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!name) {
            setPopupMessage('Please enter your name');
            return;
        }
        for (const order of ordersSelected) {
            callApi('set-order-shipped', { order_id: order, name: name })
        }
        updated.current = false;
        setPopupMessage(`Order(s) ${ordersSelected.join(', ')} marked as shipped`);
        navigate('/');
    }

    const toggleAllChecked = event => {
        if (event.target.checked) {
            setOrdersSelected(orders.map(order => order.order_id))
        } else {
            setOrdersSelected([]);
        }
        checkAll.current = !checkAll.current;
    }

    useEffect(() => {
        if (!updated.current) {
            updated.current = true;
            callApi('get-orders-boxed')
                .then(orders => {
                    loading.current = false;
                    setOrders(orders)
                })
                .catch(err => {
                    console.error(err);
                    updated.current = false;
                })
        }
    })


    return (
        <>
            {loading.current ?
                <h1 className={styles.title}>Loading...</h1>
                : <div className={styles.menu}>
                    <form onSubmit={handleSubmit}>
                        <input type='text' value={name} onChange={event => setName(event.target.value)} className={styles.default_text_box} placeholder={'Enter your name'} />
                    </form>
                    <h1 className={styles.title}>Select the orders you are picking up</h1>
                    <div className={styles.check_box_menu}>
                        <label className={styles.check_box_container}>
                            <input className={styles.grid_check_box} type="checkbox" onChange={toggleAllChecked} checked={checkAll.current} />
                            <span className={styles.batch_button}>Select all</span>
                        </label>
                        <div className={styles.check_box_grid}>
                            {orders.map(order => {
                                return <label key={order.order_id} className={styles.check_box_container}>
                                    <input value={order.order_id} className={styles.grid_check_box} type="checkbox" checked={ordersSelected.includes(order.order_id)} onChange={handleCheck} />
                                    <div className={styles.check_box_span}>{order.customer_order_number}<br />{order.order_id}<br />Sensors: {order.sensors}</div>
                                </label>
                            })}
                        </div>
                    </div>
                    <button className={styles.default_button} onClick={handleSubmit}>Mark orders as picked up</button>
                </div>
            }
        </>
    )
}

export default ShipSensors;