import { React, useEffect } from 'react';
import styles from '../../styles/styles.module.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from "../../contexts/app";

function Header({ title }) {
  let location = useLocation();
  let navigate = useNavigate();
  const { technician, setTechnician, setTechnicianId } = useAppContext();

  useEffect(() => {
    if (!technician.technician_id && location.pathname !== '/signIn') {
      navigate('/signIn')
    }
  })
  const handleSubmit = () => {
    setTechnician({});
    setTechnicianId(0);
    navigate('/signIn')
  }
  return (
    <>
      <header>
        <h1 className={styles.main_header}>{title ? title : 'Default title'}</h1>
        <button className={styles.home_button} onClick={() => navigate('/')}></button>

        <div className={styles.sign_in_container}>
          <div className={styles.technician_name}>{technician.first_name}</div>
          {technician.technician_id ? <button className={styles.sign_in_button} onClick={handleSubmit}>Sign Out</button> : <></>}
        </div>
      </header>
    </>
  );
}

export default Header;