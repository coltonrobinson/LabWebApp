import styles from '../../styles/styles.module.css';

function ConfirmationPopup({ confirmationArray, setConfirmationArray, handleConfirm }) {
  return (
    <>
      <div className={`${styles.error_popup} ${styles.confirmation_popup}`}>
        {confirmationArray.map((string, index) => (
          index > 0 ? <h1 key={string} className={`${styles.title} ${styles.status_dot_red}`}>{string}</h1>: <h1 key={string} className={styles.title}>{string}</h1>
        ))}
        <button className={`${styles.default_button} ${styles.green}`} id={styles.popup_confirm} onClick={() => { setConfirmationArray([]); handleConfirm() }}>Confirm</button>
        <button className={`${styles.default_button} ${styles.red}`} id={styles.popup_close} onClick={() => setConfirmationArray([])}>Dismiss</button>
      </div>
    </>
  )
}

export default ConfirmationPopup;