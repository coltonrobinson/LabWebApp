import { React, useState } from 'react';
import styles from '../../styles/styles.module.css';
import callApi from '../../utils/api/callApi';
import { useNavigate, useLocation } from 'react-router-dom';


function SignInBox({ setTechnicianId, setPopupMessage, technicianId }) {
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [isSignInBoxDisplayed, setIsSignInBoxDisplayed] = useState(false);
    const [technicianName, setTechnicianName] = useState('');
    const navigate = useNavigate()
    const location = useLocation()

    let buttonText = isSignedIn ? 'Sign Out' : 'Sign In';

    if (!technicianId && location.pathname !== '/signIn') {
        navigate('/signIn')
    }

    const handleChange = (event) => {
        temporaryTechnicianName = event.target.value;
    }

    const handleSubmit = (event) => {
        if (temporaryTechnicianName !== undefined) {
            callApi('lookup-technician', { 'technician': temporaryTechnicianName })
                .then(response => {
                    return response[0];
                })
                .then(response => {
                    const technicianId = response.technician_id;
                    if (Number.isInteger(technicianId)) {
                        setTechnicianId(technicianId);
                        setTechnicianName(`${response.first_name} ${response.last_name}`);
                        setIsSignInBoxDisplayed(false);
                        setIsSignedIn(true);
                        if (technicianId && location.pathname === '/signIn') {
                            navigate('/')
                        }
                    } else {
                        setPopupMessage('Could not find technician with that name')
                    }
                })
                .catch(error => {
                    console.error(error);
                })
            event.preventDefault();

        } else {
            setPopupMessage('Please enter a valid name');
        }
    }
    let temporaryTechnicianName;
    if (!isSignInBoxDisplayed) {
        return (
            <div className={styles.sign_in_container}>
                <div className={styles.technician_name}>{technicianName.split(' ')[0]}</div>
                <button className={styles.sign_in_button} onClick={() => { setTechnicianId(0); setIsSignedIn(false); setIsSignInBoxDisplayed(isSignedIn ? false : true); setTechnicianName(isSignedIn ? '' : technicianName) }}>{buttonText}</button>
            </div>
        );
    } else {
        return (
            <div className={styles.sign_in_container}>
                <div className={styles.technician_name}>{technicianName.split(' ')[0]}</div>
                <button className={styles.sign_in_button} onClick={() => setIsSignInBoxDisplayed(isSignInBoxDisplayed ? false : true)}>{buttonText}</button>
                <div className={styles.pop_up}>
                    <form onSubmit={handleSubmit}>
                        <input type='text' value={temporaryTechnicianName} onChange={handleChange} className={styles.pop_up_content} placeholder='Name' />
                        <button type='submit' className={styles.pop_up_content}>Submit</button>
                    </form>
                </div>
            </div>
        );
    }
}

export default SignInBox;