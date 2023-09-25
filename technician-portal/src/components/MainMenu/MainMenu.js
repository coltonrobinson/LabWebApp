import { useNavigate } from "react-router-dom";
import styles from "../../styles/styles.module.css";


function MainMenu() {
    const navigate = useNavigate();
    return (
        <div className={styles.menu}>
            <button className={styles.default_button} onClick={() => navigate('/receiving')}>Receiving</button>
            <button className={styles.default_button} onClick={() => navigate('/batchEntry')}>Manage</button>
            <button className={styles.default_button} onClick={() => navigate('/orderEntry')}>Shipping</button>
            <br /><br /><br />
            <button className={styles.default_button} onClick={() => navigate('/labView')}>Lab View</button>
            {/* <button className={styles.default_button} onClick={() => navigate('/metrics')}>Metrics</button> */}
        </div>
    );
}

export default MainMenu;