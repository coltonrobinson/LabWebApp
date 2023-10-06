import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../contexts/app";

import styles from "../../styles/styles.module.css";

function ConfirmationScreen() {
    const navigate = useNavigate()
    const { confirmationMessage } = useAppContext()

    return (
        <div className={styles.menu}>
            <h1 className={styles.title}>{confirmationMessage}</h1>
            <button className={styles.default_button} onClick={() => navigate('/')}>Return to Main Menu</button>
        </div>
    );
}

export default ConfirmationScreen;