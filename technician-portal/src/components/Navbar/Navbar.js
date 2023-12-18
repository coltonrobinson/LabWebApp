import styles from "../../styles/styles.module.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAppContext } from "../../contexts/app";

function Navbar() {
    const [navbar, setNavbar] = useState([])
    const location = useLocation();
    const navigate = useNavigate();
    const {technicianId} = useAppContext();

    if (!technicianId) {
        return <></>
    }

    const capitalize = (string) => {
        return string[0].toUpperCase() + string.slice(1);
    }

    if (navbar[0] !== '/') {
        setNavbar(['/', ...navbar])
    }

    if (!navbar.includes(location.pathname)) {
        setNavbar([...navbar, location.pathname])
    } else {
        const pathIndex = navbar.indexOf(location.pathname);
        const tempNavbar = navbar.slice(0, pathIndex + 1)
        if (tempNavbar.length !== navbar.length) {
            setNavbar(tempNavbar);
        }
    }

    if (navbar.length > 0) {
        return (
            <div className={styles.navbar}>
                {navbar.map(route => <button key={route} onClick={() => navigate(route)} className={styles.navbar_button}>{route === '/' ? 'Home' : capitalize(route.replace('/', '')).replace(/([A-Z])/g, ' $1').trim()} <span className={styles.navbar_button_span}>{'>'}</span></button>)}
            </div>
        )
    }
}

export default Navbar;