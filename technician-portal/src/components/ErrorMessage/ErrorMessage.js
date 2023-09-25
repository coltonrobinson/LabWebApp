import styles from '../../styles/styles.module.css';

function ErrorMessage({ popupMessage, setPopupMessage }) {
    return (
      <>
        <div className={styles.error_popup}>
          <h1 className={styles.title}>{popupMessage}</h1>
          <button className={styles.default_button} id={styles.popup_close} onClick={() => setPopupMessage('')}>Close</button>
        </div>
      </>
    )
  }

  export default ErrorMessage;