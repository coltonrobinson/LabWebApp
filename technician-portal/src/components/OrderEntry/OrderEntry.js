import styles from "../../styles/styles.module.css";
import callApi from "../../utils/api/callApi";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function OrderEntry({ orderNumber, setOrderNumber, technicianId, setPopupMessage, setBatches }) {
    const [activeOrders, setActiveOrders] = useState(null)
    const navigate = useNavigate();

    useEffect(() => {
        const handleClick = (orderId) => {
            setOrderNumber(orderId);
            if (!technicianId) {
                setPopupMessage('Please sign in');
                return;
            }
            callApi('get-batches-by-order-id', { order_id: orderId })
                .then(batches => {
                    setBatches(batches);
                    for (const batch of batches) {
                        callApi('log-batch-interaction', { department: 'shipping', start: true, technician_id: technicianId, batch_id: batch.batch_id })
                    }
                })
            navigate('/shipping')
        }

        if (!activeOrders) {
            setActiveOrders(<h1 className={styles.title}>Loading...</h1>);
            callApi('get-orders-to-ship')
                .then(orders => {
                    if (orders.length === 0) {
                        setActiveOrders(<h1 className={styles.title}>No orders found</h1>);
                        return;
                    }
                    const orderedOrders = orders.sort((a, b) => a.order_id - b.order_id);
                    setActiveOrders(
                        orderedOrders.map(order => (
                            <button key={order.order_id} className={styles.batch_button} onClick={() => handleClick(order.order_id)}>Order: {order.order_id} | Customer Order: {order.customer_order_number}</button>
                        ))
                    );
                })
        }
    }, [setActiveOrders, activeOrders, setOrderNumber, technicianId, orderNumber, setPopupMessage, navigate, setBatches])

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!technicianId) {
            setPopupMessage('Please sign in');
            return;
        }
        callApi('get-order-by-id', { order_id: orderNumber })
            .then(response => {
                if (response.order_id) {
                    callApi('get-batches-by-order-id', { order_id: orderNumber })
                        .then(batches => {
                            setBatches(batches);
                            for (const batch of batches) {
                                callApi('log-batch-interaction', { department: 'shipping', start: true, technician_id: technicianId, batch_id: batch.batch_id })
                            }
                        })
                    navigate('/shipping')
                } else {
                    setPopupMessage(`Could not find order: ${orderNumber}`)
                }
            })
    }
    return (
        <>
            <div className={styles.menu}>
                <form onSubmit={handleSubmit}>
                    <input type='text' value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} className={styles.default_text_box} placeholder={'Order Number'} />
                    <button className={styles.default_button} onClick={handleSubmit}>Submit</button>
                </form>
            </div>
            <br />
            <hr />
            <br />
            {activeOrders}
        </>
    )
}

export default OrderEntry;