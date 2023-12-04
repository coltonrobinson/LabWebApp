import styles from "../../styles/styles.module.css";
import { useState } from "react";
import { useAppContext } from "../../contexts/app";
import axios from "axios";
import ip from "../../utils/ip/ip";
import { useNavigate } from "react-router-dom";
import callApi from "../../utils/api/callApi";

const FORM_VALUES = [
    {
      title: "Email Address",
      type: "email",
      key: "email",
    },
    {
      title: "Password",
      type: "password",
      key: "password"
    },
  ];

function SignInMenu() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { setPopupMessage, setTechnicianId, setTechnician } = useAppContext();
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = {email: email, password: password};
        setPopupMessage(null)
        let error = ""
    
        FORM_VALUES.map(formItem => {
          if (!form[formItem.key]) {
            error = `${formItem.title} is required`;
          }
          return error;
        })
    
        if (error) {
          setPopupMessage(error)
          return
        }
    
        try {
          const url = process.env.REACT_APP_STATUS === 'production' ? `https://${ip}/api/auth/sign-in` : `http://${ip}/api/auth/sign-in`;
          const response = await axios.post(url, form, {
            headers: {
              'x-api-key': "T7vidLgPfCkGQHYlBbQz416qkKeyQUkFFxFOLUAVYE0"
            }
          });
    
          localStorage.setItem('token', response?.headers['access-token'])
          callApi('lookup-technician', {technician: response.data})
          .then(technician => {
            technician = technician[0]
            if (technician?.technician_id) {
                setTechnicianId(technician.technician_id);
                setTechnician(technician);
                navigate('/');
            } else {
                setPopupMessage('It looks like there is no technician profile connected with that account. If you believe this is an error, please contact your manager.')
            }
          })

        } catch (error) {
          const errorMessageRaw = error.response
          const errorMessage = errorMessageRaw?.data.error
    
          setPopupMessage(errorMessage);
        }
      }
    return (
        <div className={styles.menu}>
            <form onSubmit={handleSubmit}>
                <input type='text' value={email} onChange={e => setEmail(e.target.value)} className={styles.default_text_box} placeholder={'Enter your email address'} />
                <input type='password' value={password} onChange={e => setPassword(e.target.value)} className={styles.default_text_box} placeholder={'Enter your password'} />
                <input type='submit' className={styles.default_button}></input>
            </form>
        </div>
    )
}

export default SignInMenu;