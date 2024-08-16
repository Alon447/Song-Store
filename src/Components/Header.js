import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../song-search.png';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import './Header.css'; 

function Header(props) {
    const title = props.title
    const user = props.user
    const additionalButtons = props.additionalButtons
    // console.log(additionalButtons)
    
    function handleSignOut(){
        sessionStorage.removeItem("token");
    }

    return (
        <nav className="navbar">
            <div className="header">
                <div className='header-left'>
                    <div className="static-title">
                        <h1 className="window-title">{title}</h1>
                    </div>
                    <Tooltip title="Return To Song Search" >
                        <Link to="/songsearch">
                            <img src={logo} alt="Song Search" className="logo" />
                        </Link>
                    </Tooltip>
                    {user?.FirstName && (
                    <h1 className='welcome-text'>Welcome {user?.FirstName} {user?.LastName}</h1>
                    )}
                </div>
                
                <div className="header-right">
                    {additionalButtons.map((button, index) => (
                        <Link key={index} to={button.link} className={button.className}>
                        <Button 
                            className={button.buttonClass}
                            variant="contained"
                            onClick={button.onClick}
                        >
                            {button.label}
                        </Button>
                        </Link>
                    ))}
                    <Link to="/" className="signout-link">
                        <Button 
                        className="signout-button" 
                        variant="contained"
                        onClick={handleSignOut}
                        >
                        Sign Out
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}

export default Header;
