import React, {useState} from "react";
import { useNavigate } from 'react-router-dom';
import '../SignUp/SignUp_Style.css'; // Import your CSS file
import logo from "../song-search.png"
import Button from '@mui/material/Button';
import API from '../API/api'
import Link from '@mui/material/Link';

function SignUp(){
      const [signUpData, setSignUpData] = React.useState(
        {
            userName:"",
            password:"",
            firstName: "", 
            lastName: "",
            company: "",
            address: "",
            city: "",
            country: "",
            postalCode: "",
            phone: "",       
            email: "", 
        }
    )

    const [errors, setErrors] = useState({});
    const nav = useNavigate()
    const requiredFields = [ 
      // fields that if the user not inserting input will raise an error message to the user
        "userName",
        "password",
        "firstName",
        "lastName",
        "address",
        "city",
        "country",
        "postalCode",
        "phone",
        "email"
    ];


    function handleChange(event){
        const {name, value} = event.target
        setSignUpData(prevState =>{
            return{
                ...prevState,
                [name]:value
            }
        })
    }
    
    async function handleSubmit(event){
        const newErrors = {};
        event.preventDefault(); 
        // console.log(signUpData)
        requiredFields.forEach(field => {
            if (!signUpData[field]) {
                newErrors[field] = `This field is required`;
            }
        });
        try {
          const response = await API.post('newuser', signUpData, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (response.status === 200 || response.status === 201) {
            nav("/");
          }
        } catch (error) {
          console.error('Error: ', error);
          if (error.response && error.response.data) {
            setErrors(error.response.data);
          }
        }
      }
    return (
        <div className="signUp">
          <div className="header">
            <h1>Sign Up</h1>
            <img src={logo} alt="Song Search" className="login-logo"/>
          </div>
          <div className="form">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                {Object.entries(signUpData).map(([key, value]) => (
                  <div key={key} className="input-container">
                    <label htmlFor={key} style={{textTransform: 'capitalize'}}>{(key)}</label>
                    <input
                      id={key}
                      name={key}
                      type={key === "email" ? "email" : key === "password" ? "password" : "text"}
                      placeholder={(key)}
                      onChange={handleChange}
                      value={value}
                    />
                    {errors[key] && <span className="error">{errors[key]}</span>}
                  </div>
                ))}
              </div>
              <Button onClick={handleSubmit} variant="contained">Submit</Button>
              <br />
              <Link href="/" underline="hover">Already have an account? Sign In</Link>
            </form>
          </div>
        </div>
      );
}
export default SignUp;
