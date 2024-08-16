import React, {useEffect, useState} from "react";
import { Link, useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import logo from "../song-search.png"
import API from '../API/api'
import './Login_Style.css';

export default function Login(){

    const [loginData, setLoginData] = useState({
        userName:"",
        password:""
    })
    const [errorsData, setErrorsData] = useState("")
    const nav = useNavigate()
    
    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (token) {
            nav("/songSearch");
        }
    }, [nav]);

    function handleChange(event){
        const {name, value} = event.target
        setLoginData(prevState =>{
            return{
                ...prevState,
                [name]:value
            }
        })
    }
    
    async function handleSignIn(){
        try{
            const response = await API.post('login',loginData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.status === 200) {
                // Login successful
                const { token } = response.data;
                sessionStorage.setItem('token', token);
                setErrorsData('')
                nav("/songSearch")

            }else if (response.status === 401) {
                // Unauthorized - Invalid username or password
                setErrorsData('Incorrect username or password');} 
            
            else {
                // Login failed
                console.error('Login failed');
                setErrorsData('Incorrect username or password');
            } 
        }catch (error) {
            setErrorsData(error.response.data.error);
        }
        
    }

    return(
        <div className="login-container">
            <header>
                <h1>Sign In</h1>
                <img src={logo} alt="Song Search" className="login-logo" />
            </header>

            <main>
                <div className="inputContainer">

                    {/* sign in inputs */}
                    <div className="input">
                        <label>Username</label>
                        <input 
                            className="usernameInput" 
                            type="text"
                            name="userName" 
                            id="usernameInput" 
                            placeholder="Username"
                            value={loginData.userName}
                            onChange={handleChange}
                        ></input>
                    </div>
                    <div className="input">
                        <label>Password</label>
                            <input 
                                className="passwordInput" 
                                type="password" 
                                name="password"
                                id="passwordInput" 
                                placeholder="Password"
                                value={loginData.password}
                                onChange={handleChange}
                            ></input>
                    </div>
                    {errorsData && <p className="error">{errorsData}</p>}
                    <div className="buttons">
                        <Button 
                            className="confirmButton"
                            variant="contained"
                            onClick={handleSignIn}>
                                Login
                        </Button>
                        <Link to="/signup" className="signup-link">
                            <Button 
                                className="signUp"
                                variant="contained"
                                sx={{
                                    marginLeft:1,
                                  }} 
                                >
                                    Sign Up
                            </Button>
                        </Link>
                        
                    </div>
                </div>
            </main>
        </div>
    )
}