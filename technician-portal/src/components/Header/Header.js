import { React } from 'react';
import styles from '../../styles/styles.module.css';
import { useNavigate } from 'react-router-dom';

function Header({ title }) {
  let navigate = useNavigate()
    return (
      <>
        <header>
          <h1 className={styles.main_header}>{title ? title : 'Default title'}</h1>
          <button className={styles.home_button} onClick={() => navigate('/')}></button>
        </header>
      </>
    );
  }

export default Header;