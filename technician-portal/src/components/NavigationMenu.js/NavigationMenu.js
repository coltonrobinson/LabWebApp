import { useNavigate } from "react-router-dom";
import styles from "../../styles/styles.module.css";
import homeIcon from "../../media/home_icon.png";
import receivingIcon from "../../media/receiving_icon.png";
import testingIcon from "../../media/testing_icon.png";
import shippingIcon from "../../media/shipping_icon.png";
import boxedIcon from "../../media/boxed_icon.png";
import { useAppContext } from "../../contexts/app";


function NavigationMenu() {
    const navigate = useNavigate();
    const { technicianId } = useAppContext();

    if (!technicianId) {
        return <></>
    }

    return (
        <div className={styles.navigation_menu_container}>
            <ul className={styles.navigation_menu}>
                <li>
                    <input type="radio" id="home" name="navigation_menu" className={styles.navigation_menu_radio}></input>
                    <label htmlFor="home" className={styles.navigation_item} onClick={() => { navigate('/') }}><img src={homeIcon} alt="Home icon" className={styles.icon_image} /> Home</label>
                </li>
                <li>
                    <input type="radio" id="receiving" name="navigation_menu" className={styles.navigation_menu_radio}></input>
                    <label htmlFor="receiving" className={styles.navigation_item} onClick={() => { navigate('/receiving') }}><img src={receivingIcon} alt="Receiving icon" className={styles.icon_image} /> Receiving</label>
                </li>
                <li>
                    <input type="radio" id="testing" name="navigation_menu" className={styles.navigation_menu_radio}></input>
                    <label htmlFor="testing" className={styles.navigation_item} onClick={() => { navigate('/batchEntry') }}><img src={testingIcon} alt="Testing icon" className={styles.icon_image} /> Testing</label>
                </li>
                <li>
                    <input type="radio" id="shipping" name="navigation_menu" className={styles.navigation_menu_radio}></input>
                    <label htmlFor="shipping" className={styles.navigation_item} onClick={() => { navigate('/orderEntry') }}><img src={shippingIcon} alt="Shipping icon" className={styles.icon_image} /> Shipping</label>
                </li>
                <li>
                    <input type="radio" id="boxedSensors" name="navigation_menu" className={styles.navigation_menu_radio}></input>
                    <label htmlFor="boxedSensors" className={styles.navigation_item} onClick={() => { navigate('/shipSensors') }}><img src={boxedIcon} alt="Box icon" className={styles.icon_image} /> Boxed sensors</label>
                </li>
            </ul>
        </div>
    );
}

export default NavigationMenu;