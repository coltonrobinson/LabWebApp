//General imports
import React, { useState } from 'react';
import styles from './styles/styles.module.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

//Component imports
import MainMenu from './components/MainMenu/MainMenu';
import Header from './components/Header/Header';
import SignInBox from './components/SignInBox/SignInBox';
import SalesOrderForm from './components/SalesOrderForm/SalesOrderForm';
import ErrorMessage from './components/ErrorMessage/ErrorMessage';
import LocationEntry from './components/LocationEntry/LocationEntry';
import ManageBatch from './components/ManageBatch/ManageBatch';
import Receiving from './components/Receiving/Receiving';
import BatchEntry from './components/BatchEntry/BatchEntry'
import Shipping from './components/Shipping/Shipping';
import ConfirmationScreen from './components/ConfirmationScreen/ConfirmationScreen';
import PageNotFound from './components/PageNotFound/PageNotFound';
import LabView from './components/LabView/LabView';
import Navbar from './components/Navbar/Navbar.js';
import OrderEntry from './components/OrderEntry/OrderEntry';
import Metrics from './components/Metrics/Metrics';
import SignInMenu from './components/SignInMenu/SignInMenu';
import ShipSensors from './components/ShipSensors/shipSensors';

let banner;

if (process.env.REACT_APP_STATUS !== 'production') {
  banner = (<div className={styles.dev_banner}>Development Environment</div>);
}

function App() {
  const [salesOrder, setSalesOrder] = useState('');
  const [technicianId, setTechnicianId] = useState(0);
  const [batchNumber, setBatchNumber] = useState('');
  const [sensorList, setSensorList] = useState([]);
  const [procedureId, setProcedureId] = useState(0);
  const [confirmationMessage, setConfirmationMessage] = useState('Success!');
  const [popupMessage, setPopupMessage] = useState('');
  const [order, setOrder] = useState(null);
  const [orderNumber, setOrderNumber] = useState('');
  const [batches, setBatches] = useState([]);
  const [sensorGrid, setSensorGrid] = useState([]);
  let errorElement;

  if (popupMessage) {
    errorElement = (<ErrorMessage popupMessage={popupMessage} setPopupMessage={setPopupMessage} />);
  }

  return (
    <div className={styles.App}>
      <Router>
        {banner}
        <Header title='Technician Portal' />
        <SignInBox setTechnicianId={setTechnicianId} setPopupMessage={setPopupMessage} technicianId={technicianId} />
        <Navbar />
        {errorElement}
        <Routes>
          <Route path='/' element={<MainMenu />} />
          <Route path='/labView' element={<LabView />} />
          <Route path='/metrics' element={<Metrics />} />
          <Route path='/receiving' element={<Receiving salesOrder={salesOrder} setSalesOrder={setSalesOrder} setOrder={setOrder} />} />
          <Route path='/createSalesOrder' element={<SalesOrderForm salesOrder={salesOrder} technicianId={technicianId} setConfirmationMessage={setConfirmationMessage} setPopupMessage={setPopupMessage} order={order} />} />
          <Route path='/batchEntry' element={<BatchEntry batchNumber={batchNumber} setBatchNumber={setBatchNumber} setSensors={setSensorList} setProcedureId={setProcedureId} technicianId={technicianId} setPopupMessage={setPopupMessage} sensorGrid={sensorGrid} setSensorGrid={setSensorGrid} />} />
          <Route path='/manageBatch' element={<ManageBatch batchNumber={batchNumber} sensorList={sensorList} setSensorList={setSensorList} calibrationProcedureId={procedureId} setPopupMessage={setPopupMessage} technicianId={technicianId} sensorGrid={sensorGrid} setSensorGrid={setSensorGrid} />} />
          <Route path='/orderEntry' element={<OrderEntry orderNumber={orderNumber} setOrderNumber={setOrderNumber} technicianId={technicianId} setPopupMessage={setPopupMessage} setBatches={setBatches} />} />
          <Route path='/shipping' element={<Shipping setConfirmationMessage={setConfirmationMessage} technicianId={technicianId} setPopupMessage={setPopupMessage} orderNumber={orderNumber} batches={batches} />} />
          <Route path='/confirmation' element={<ConfirmationScreen confirmationMessage={confirmationMessage} />} />
          <Route path='/locationEntry' element={<LocationEntry batchNumber={batchNumber} setPopupMessage={setPopupMessage} technicianId={technicianId} />} />
          <Route path='/shipSensors' element={<ShipSensors setPopupMessage={setPopupMessage} />} />
          <Route path='/signIn' element={<SignInMenu />} />
          <Route path='*' element={<PageNotFound />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;