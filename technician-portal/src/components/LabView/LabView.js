import { useEffect, useState } from "react";
import callApi from "../../utils/api/callApi";
import styles from "../../styles/styles.module.css";
import Equipment from "../Equipment/Equipment";

function LabView() {
    const [aggregatorStatusDotStyle, setAggregatorStatusDotStyle] = useState(styles.status_dot_red);
    const [referenceList, setReferenceList] = useState([]);
    const [labReadings, setLabReadings] = useState(null);
    const [equipmentList, setEquipmentList] = useState([])

    const setAggregatorStyle = (data) => {
        const secondsAgo = (new Date() - new Date(data.timestamp)) / 1000;
        if (secondsAgo <= 30) {
            setAggregatorStatusDotStyle(styles.status_dot_green);
        } else if (secondsAgo > 120) {
            setAggregatorStatusDotStyle(styles.status_dot_red);
        } else {
            setAggregatorStatusDotStyle(styles.status_dot_yellow);
        }
    }

    const updateData = () => {
        callApi('get-recent-data')
            .then(response => {
                const data = response[0];
                setAggregatorStyle(data);

                const referenceArray = [];
                const references = {};
                Object.assign(references, data.super_daq_data, data.rotronic_data)
                let description;
                for (const reference in references) {
                    description = equipmentList.filter(equipment => equipment.asset_tag === reference)[0].description
                    referenceArray.push(<Equipment key={reference} assetId={reference} readings={references[reference]} description={description} />)
                }
                setLabReadings(<span className={styles.lab_readings}>Lab Readings: {data.lab_humidity}%RH @ {data.lab_temperature}°C</span>)
                setReferenceList(referenceArray)
            })
    }
    useEffect(() => {
        if (equipmentList.length === 0) {
            callApi('get-equipment')
            .then(equipment => {
                setEquipmentList(equipment);
            })
        }
        const interval = setInterval(updateData, 3000);
        return () => clearInterval(interval);
    })

    return (
        <>
            <h1 className={styles.title}>Lab View
                {labReadings}
                <span className={styles.server_status}>
                    Aggregator status: <span className={`${aggregatorStatusDotStyle} ${styles.status_dot}`}></span>
                </span>
            </h1>
            <div className={styles.equipment_container}>
                {(referenceList.length > 0) ? referenceList : <h1 className={styles.title}>Loading...</h1>}
            </div>
        </>
    )
}

export default LabView;