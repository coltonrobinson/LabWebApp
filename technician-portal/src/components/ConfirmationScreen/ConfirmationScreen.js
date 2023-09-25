import styles from "../../styles/styles.module.css";
import { useNavigate } from "react-router-dom";

function ConfirmationScreen({ confirmationMessage }) {
    let navigate = useNavigate()
    return (
        <div className={styles.menu}>
            <h1 className={styles.title}>{confirmationMessage}</h1>
            <button className={styles.default_button} onClick={() => navigate('/')}>Return to Main Menu</button>
        </div>
    );
}

export default ConfirmationScreen;