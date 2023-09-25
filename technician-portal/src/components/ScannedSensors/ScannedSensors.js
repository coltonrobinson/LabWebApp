import styles from "../../styles/styles.module.css";


const ScannedSensors = ({ sensorList }) => {
    if (sensorList.length > 0) {
        return (
            <div>
                <div className={styles.sensor_list}>
                    {sensorList.map((sensor, index) => (
                        <div key={index} className={`${styles.grid_entry} ${sensor.online ? styles.green_sensor : styles.red_sensor}`}>{sensor.sensor}</div>
                    ))}
                </div>
            </div>
        );
    } else {
        return (
            <div>
                <div className={styles.sensor_list}>
                    <div className={styles.grid_entry}>No sensors scanned</div>
                </div>
            </div>
        );
    }
};

export default ScannedSensors;