import styles from "../../styles/styles.module.css";
import round from "../../utils/round";
import { useState } from "react";

function Equipment({ assetId, readings, description }) {
    const [displayStyle, setDisplayStyle] = useState(styles.no_display);
    let referenceColor;
    const temperature = `Temperature: ${round(readings.Temperature)}`;
    const humidity = readings.hasOwnProperty('Humidity') ? `Humidity: ${round(readings.Humidity)}` : ``;

    const showPopup = () => {
        setDisplayStyle('')
    }

    let elements;
    if (!readings.hasOwnProperty('Humidity')) {
        let stableString = 'Temperature not stable';
        if (JSON.stringify(readings.stability_data['stable']) === 'true') {
            stableString = 'Temperature stable';
            referenceColor = styles.stable_green;
        }
        elements = (
            <>
                <hr />
                <h1 className={styles.title}>Temperature: {readings.Temperature}</h1>
                <h1 className={styles.title}>{stableString}</h1>
                <h1 className={styles.title}>Slope: {JSON.stringify(readings.stability_data['slope'])}</h1>
                <h1 className={styles.title}>Standard Deviation: {JSON.stringify(readings.stability_data['standard_deviation'])}</h1>
                <hr />
            </>)
    } else {
        let stableString = 'Humidity not stable';
        if (JSON.stringify(readings.stability_data.humidity['stable']) === 'true') {
            stableString = 'Humidity stable';
            referenceColor = styles.stable_green;
        }
        elements = (
            <>
                <hr />
                <h1 className={styles.title}>Humidity: {readings.Humidity}</h1>
                <h1 className={styles.title}>{stableString}</h1>
                <h1 className={styles.title}>Slope: {JSON.stringify(readings.stability_data['humidity']['slope'])}</h1>
                <h1 className={styles.title}>Standard Deviation: {JSON.stringify(readings.stability_data['humidity']['standard_deviation'])}</h1>
                <hr />
                <h1 className={styles.title}>Temperature: {readings.Temperature}</h1>
                <h1 className={styles.title}>{(JSON.stringify(readings.stability_data.temperature['stable']) === 'true') ? 'Temperature stable' : 'Temperature not stable'}</h1>
                <h1 className={styles.title}>Slope: {JSON.stringify(readings.stability_data['temperature']['slope'])}</h1>
                <h1 className={styles.title}>Standard Deviation: {JSON.stringify(readings.stability_data['temperature']['standard_deviation'])}</h1>
                <hr />
            </>
        )
    }
    const infoPopup = (
        <div className={`${styles.equipment_popup} ${displayStyle}`} data-testid={'equipmentPopup'}>
            <h1 className={styles.title}>Reference: {assetId} | {description}</h1>
            {elements}
            <br />
            <br />
            <button className={styles.default_button} id={styles.popup_close} onClick={() => setDisplayStyle(styles.no_display)}>Close</button>
        </div>
    )

    return (
        <>
            {infoPopup}
            <button className={`${styles.equipment} ${referenceColor}`} onClick={showPopup}>{temperature}<br />{humidity}{humidity ? <br /> : ''}{assetId}</button>
        </>
    )
}

export default Equipment;