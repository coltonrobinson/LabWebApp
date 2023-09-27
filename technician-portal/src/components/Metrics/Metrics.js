import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import styles from "../../styles/styles.module.css";
import callApi from '../../utils/api/callApi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Metrics() {
  const monthNames = [
    "January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"
  ];

  const today = new Date();
  const [totalSensors, setTotalSensors] = useState([]);
  const calibrationProcedures = useRef('');
  const [datasets, setDataSets] = useState([]);

  useEffect(() => {
    const today = new Date()

    const fetchData = async () => {
      const colors = ['red', 'blue', 'yellow', 'red', 'yellow', 'green']
      const promises = [];
      calibrationProcedures.current = await callApi('get-calibration-procedures')
      for (let i = 2; i >= 0; i--) {
        const month = today.getMonth() - i;
        const startDate = new Date(today.getFullYear(), month, 1);
        const promise = callApi('get-calibrations-by-month', { start_date: startDate })
          .then(response => {
            let calibrationProcedureTotals = []
            for (const calibrationProcedure of calibrationProcedures.current) {
              calibrationProcedureTotals.push(response.filter(calibrationList => calibrationList.calibration_procedure_id === calibrationProcedure.calibration_procedure_id).length)
            }
            calibrationProcedureTotals.push(response.length)
            return calibrationProcedureTotals;
          });
        promises.push(promise);
      }
      const sensorsData = await Promise.all(promises);

      const newDatasets = [];
      for (let i = 0; i < sensorsData[0].length; i++) {
        newDatasets.push(
          {
            label: (i !== sensorsData[0].length-1) ? `CP: ${i+1}` : 'Total sensors',
            data: [sensorsData[0][i], sensorsData[1][i], sensorsData[2][i]],
            backgroundColor: colors[i],
          }
        )
      }
      setDataSets(newDatasets);
      setTotalSensors(sensorsData);
    };

    if (totalSensors.length === 0) {
      fetchData();
    }
  }, [datasets, totalSensors]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Sensors Calibrated By Procedure',
      },
    },
  };

  const labels = monthNames.slice(today.getMonth() - 2, today.getMonth() + 1);

  const data = {
    labels,
    datasets: datasets,
  };

  return (
    <div className={styles.graph}>
      {<Bar options={options} data={data} />}
    </div>
  );
}

export default Metrics;
