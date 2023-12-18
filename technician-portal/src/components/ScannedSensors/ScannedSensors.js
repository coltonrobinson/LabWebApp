import styles from "../../styles/styles.module.css";


const ScannedSensors = ({ sensorList }) => {
    if (sensorList.length > 0) {
        return (
            <div>
                <div className={styles.grid_menu}>
                    {sensorList.map((sensor, index) => (
                        <div key={index} className={`${styles.grid_entry} ${styles.double_span} ${sensor.online ? styles.green_sensor : styles.red_sensor}`}>{sensor.sensor}</div>
                    ))}
                </div>
            </div>
        );
    } else {
        return (
            <div>
                <div className={styles.grid_menu}>
                    <div className={`${styles.grid_entry} ${styles.double_span}`}>No sensors scanned</div>
                </div>
            </div>
        );
    }
};

export default ScannedSensors;