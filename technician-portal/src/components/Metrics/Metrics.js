import React from 'react';
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

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const today = new Date();
let monthIntegers = []

for (let i = 2; i >= 0; i--) {
    const month = (today.getMonth() - i)
  monthIntegers.push(month);
  callApi('get-calibrations-by-month', {start_date: new Date(today.getFullYear(), month, 1)})
  .then(response => {
      // console.log(response)
  })
}

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Sensors Calibrated By Procedure',
    },
  },
};

const labels = [...monthIntegers];

const data = {
  labels,
  datasets: [
    {
      label: 'Standard temperature',
      data: [15, 70, 56],
      backgroundColor: 'rgba(255, 99, 132, 0.8)',
    },
    {
      label: 'Low temperature',
      data: [12, 23, 20],
      backgroundColor: 'rgba(0, 99, 132, 0.8)',
    },
    {
      label: 'Humidity',
      data: [18, 19, 60],
      backgroundColor: 'rgba(255, 255, 132, 0.8)',
    },
  ],
};

function Metrics() {
  return (
    <div className={styles.graph}>
  <Bar options={options} data={data} />
  </div>
  );
}

export default Metrics;