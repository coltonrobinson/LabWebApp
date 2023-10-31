import { React, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppContext } from '../../contexts/app';
import callApi from '../../utils/api/callApi';

import styles from '../../styles/styles.module.css';

function SignInBox() {
    const navigate = useNavigate()
    const location = useLocation()

    const { setTechnicianId, setPopupMessage, technicianId } = useAppContext()

    const [isSignedIn, setIsSignedIn] = useState(false);
    const [isSignInBoxDisplayed, setIsSignInBoxDisplayed] = useState(false);
    const [technicianName, setTechnicianName] = useState('');

    let buttonText = isSignedIn ? 'Sign Out' : 'Sign In';

    useEffect(() => {
        if (!technicianId && location.pathname !== '/signIn') {
            navigate('/signIn')
        }
    })

    const handleChange = (event) => {
        temporaryTechnicianName = event.target.value;
    }

    const handleClick = () => {
        setTechnicianId(0);
        setIsSignedIn(false);
        if (isSignedIn) {
            setIsSignInBoxDisplayed(false);
            setTechnicianName('');
        } else {
            setIsSignInBoxDisplayed(true);
            setTechnicianName(technicianName);
        } 
    }

    const toggleDisplay = () => {
        isSignInBoxDisplayed ? setIsSignInBoxDisplayed(false) : setIsSignInBoxDisplayed(true)
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
                <button className={styles.sign_in_button} onClick={handleClick}>{buttonText}</button>
            </div>
        );
    } else {
        return (
            <div className={styles.sign_in_container}>
                <div className={styles.technician_name}>{technicianName.split(' ')[0]}</div>
                <button className={styles.sign_in_button} onClick={toggleDisplay}>{buttonText}</button>
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