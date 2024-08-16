import { Link, NavLink } from 'react-router-dom'
import './Navbar.css'
import logo from "../song-search.png"
import Tooltip from '@mui/material/Tooltip';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { IconButton} from '@mui/material';
import Badge from '@mui/material/Badge';

function Navbar(props){

  const user = props.user
  const navbarButtons = props.navbarButtons
  const cart = props.cart

  function handleSignOut(){
    sessionStorage.removeItem("token");
}

  return (
    <nav className="navbar-main">
      <div className="container">
        <div className="logo-container">
          <Tooltip title="Return To Song Search">
            <Link to="/songsearch">
              <img src={logo} alt="Logo" className='logo' />
            </Link>
          </Tooltip>
        </div>
        {/* cart icon */}
        {cart !== null &&
            <Tooltip title="Go To Cart">
                <IconButton
                    className="cart-button"
                    component={Link}
                    style={{ marginRight: '55px' }}
                    to="/cart"
                >
                    <Badge badgeContent={cart} color="error">
                        <ShoppingCartOutlinedIcon />
                    </Badge>
                </IconButton>
            </Tooltip>
            }
            <div>
              {user?.FirstName && (
              <h3 className='welcome-text'>Welcome {user?.FirstName} {user?.LastName}</h3>
              )}
            </div>
       
        <div className="nav-elements">
          <ul>
            {/* render all the navbar links */}
            {navbarButtons
              .filter(
                (button) =>
                  (user?.type === 'e' || button.label !== 'Sales') &&
                  (user?.type === 'e' || !button.label.includes('Statistics') || user?.Title?.includes('Manager'))
              )
              .map((button, index) => (
                <li key={index} className='li-'>
                  <NavLink to={button.to}>{button.label}</NavLink>
                </li>
            ))}
            <li>
              <NavLink onClick={handleSignOut} to="/">Sign Out</NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navbar