import React, { useState, useEffect, useRef } from 'react';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar } from 'react-chartjs-2';
import styles from "../../styles/styles.module.css";
import callApi from '../../utils/api/callApi';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);


function parseDate(date) {
  if (date.getMonth() > 12) {
    return new Date(date.getFullYear() - 1, date.getMonth() - 12, 1);
  } else if (date.getMonth() < 1) {
    return new Date(date.getFullYear() - 1, date.getMonth() + 12, 1);
  } else {
    return date;
  }
}

function Metrics() {
  const monthNames = [
    "January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"
  ];

  const today = new Date();
  const [totalSensors, setTotalSensors] = useState([]);
  const calibrationProcedures = useRef([]);
  const [datasets, setDataSets] = useState([]);
  const [totalDataSets, setTotalDataSets] = useState([]);

  useEffect(() => {
    const today = new Date()

    const fetchData = async () => {
      const colors = ['#FF000095', '#0000FF95', '#FFFF0095', '#FF000095', '#FFFF0095', '#08afe695']
      const promises = [];
      calibrationProcedures.current = await callApi('get-calibration-procedures')
      if (!Array.isArray(calibrationProcedures.current)) {
        calibrationProcedures.current = [];
      }
      for (let i = 2; i >= 0; i--) {
        const modifiedDate = new Date(today.getFullYear(), today.getMonth() - i, 1)
        const startDate = parseDate(modifiedDate);
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
        if (i === sensorsData[0].length - 1) {
          setTotalDataSets([{
            label: 'Total sensors',
            data: [sensorsData[0][i], sensorsData[1][i], sensorsData[2][i]],
            backgroundColor: colors[i],
            borderColor: '#333',
            borderWidth: 1,
            hoverBorderWidth: 2,
            borderRadius: 2,
          }])
        } else {
          newDatasets.push(
            {
              label: `CP ${i + 1}: ${calibrationProcedures.current[i].calibration_procedure.replace(', 3-Set Points', '').replace('Monnit ', '')}`,
              data: [sensorsData[0][i], sensorsData[1][i], sensorsData[2][i]],
              backgroundColor: colors[i],
              borderColor: '#333',
              borderWidth: 1,
              hoverBorderWidth: 2,
              borderRadius: 2,
            }
          )
        }
      }
      setDataSets(newDatasets);
      setTotalSensors(sensorsData);
    };

    if (totalSensors.length === 0) {
      fetchData();
    }
  }, [datasets, totalSensors]);

  const byProcedureOptions = {
    responsive: true,
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'top',
        offset: -5,
        formatter: function(value) {
          return value > 0 ? value : ''
        },
      },
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Sensors Calibrated By Procedure',
      },
    },
  };

  const totalOptions = {
    responsive: true,
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'top',
        offset: -5,
        formatter: function(value) {
          return value > 0 ? value : ''
        },
      },
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Total Sensors Calibrated',
      },
    },
  };

  const labels = [monthNames[parseDate(new Date(today.getFullYear(), today.getMonth() - 2), 1).getMonth()], monthNames[parseDate(new Date(today.getFullYear(), today.getMonth() - 1), 1).getMonth()], monthNames[parseDate(new Date(today.getFullYear(), today.getMonth()), 1).getMonth()]];
  const byProcedureData = {
    labels,
    datasets: datasets,
  };

  const totalData = {
    labels,
    datasets: totalDataSets,
  };
  if (totalDataSets.length === 0) {
    return (
      <>
        <br />
        <br />
        <h1 className={styles.title}>Loading...</h1>
      </>
    )
  }

  return (
    <div data-testid='graphs'>
      <script src="chartjs-plugin-datalabels.js"></script>
      <br />
      <div className={styles.graph_grid}>
        <div className={styles.graph}>
          <Bar options={byProcedureOptions} data={byProcedureData} />
        </div>
        <div className={styles.graph}>
          <Bar options={totalOptions} data={totalData} />
        </div>
      </div>
    </div>
  );
}

export default Metrics;
