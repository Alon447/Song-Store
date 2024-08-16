import React, {useState, useEffect} from "react";
import { Link, useNavigate  } from 'react-router-dom';
import "./Cart.css"
import Button from '@mui/material/Button';
import API from '../API/api'
import TableComponent from "../Components/TableComponent";
import { navbarButtons } from "../Components/Utilities";
import Navbar from "../Components/Navbar";
function Cart(){
  
  const token = (sessionStorage.getItem('token'))
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState()
  const [user, setUser] = useState()

  const [totalPrice, setTotalPrice] = useState(0)
  const nav = useNavigate()
  const [sortingOptions, setSortingOptions] = useState({
      sortBy: null, 
      sortOrder: 'asc', 
  });

  const handleSort = (column) => {
      let order = 'asc';
      if (sortingOptions.sortBy === column && sortingOptions.sortOrder === 'asc') {
        order = 'desc';
      }
      setSortingOptions({
        sortBy: column,
        sortOrder: order,
      });
    
      const sortedSongs = [...selectedSongs].sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];
    
        if (valueA === null) valueA = ''; 
        if (valueB === null) valueB = ''; 
    
        const isNumeric = !isNaN(valueA) && !isNaN(valueB);
    
        if (isNumeric) {
          valueA = parseFloat(valueA);
          valueB = parseFloat(valueB);
    
          if (order === 'asc') {
            return valueA - valueB; 
          } else {
            return valueB - valueA; 
          }
        } else {
          if (order === 'asc') {
            return valueA.localeCompare(valueB);
          } else {
            return valueB.localeCompare(valueA);
          }
        }
      });
      setSelectedSongs(sortedSongs);
  };
  const tableColumns = [
      { id: 'Song_Name', label: 'Song' },
      { id: 'Composer', label: 'Artist' },
      { id: 'Album_Name', label: 'Album' },
      { id: 'Milliseconds', label: 'Time' },
      { id: 'UnitPrice', label: 'Price' }
  ];

  const tableButtons = [
      {
          label: 'Remove From Cart',
          onClick: (songId) => removeSong(songId),
      }
  ]
  useEffect(() =>{
      initialFetchData()
  }, [])

  useEffect(() =>{

      let price = 0;
      for (const song of selectedSongs) {
          price += song.UnitPrice || 0; // Adding the price, handling possible missing prices
      }
      setTotalPrice(parseFloat(price).toFixed(2))
  }, [selectedSongs.length])
  
  async function initialFetchData(){
    try {
        const response = await API.get('getcartdata', {
      });
    //   console.log(response)
      if (response.status === 200) {
        const cartData = response.data;
        console.log('Cart Information:', cartData);
        setSelectedSongs(cartData.songs)
        setEmployees(cartData.employees)
        setUser(cartData.user)
      }
    } catch (error) {
        console.error('Error fetching user information:', error);
    }
}

  async function removeSong(song){
      console.log(song)
      try{
          const response = await API.delete('removesongfromcart', {
              headers: {
                  'Content-Type': 'application/json',
              },
              data: {
                  cartTrackId: song.cartTrackId,
              }
          })
          const updatedSongs = selectedSongs.filter(oldSong => oldSong.cartTrackId !== song.cartTrackId);
          setSelectedSongs(updatedSongs);
      }
      catch(error){
        console.log("error:", error);

        console.log("no remove song")
      }
  };

  async function handlePayment(){
      try {
          const response = await API.post('payment', {
              selectedEmployee
          }, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
    
          if (response.status === 200) {
            nav("/checkout")
          } else {
            alert('Payment failed. Please try again.');
          }
        } catch (error) {
          console.error('Error processing payment:', error);
          alert('Error processing payment. Please try again later.');
        }
  };

  function handleEmployeeSelection(event){
      const employeeId = +event.target.value
      setSelectedEmployee(employeeId);
  }

  function handleSignOut(){
    sessionStorage.removeItem("token");
  }
  return (
  <div className="cart" >
      <Navbar
        user={user}
        navbarButtons={navbarButtons}
      />
      {/* <Header
            title="Cart"
            user={user}
            additionalButtons={[
              {
                // link: '/songsearch',
                className: 'payment',
                buttonClass: '',
                onClick: handlePayment, 
                label: 'Proceed to Payment',
              },
            ]}
          /> */}
      <div className="employeeSelector">
          <h2>Select The Employee That Helped You:</h2>
          <select value={selectedEmployee} onChange={handleEmployeeSelection}>
              <option value="">Select an employee</option>
              {employees.map((employee) => (
              <option key={employee.EmployeeId} value={employee.EmployeeId}>
                  {`${employee.FirstName} ${employee.LastName} - ${employee.Title}`}
              </option>
              ))}
          </select>
      </div>
      <div className="table">
          <TableComponent
              data={selectedSongs}
              sortingOptions={sortingOptions}
              handleSort={handleSort}
              columns={tableColumns}
              buttons={tableButtons}
          />
    </div>
    
    <h4 className="price">Total Price: {totalPrice}$</h4>
    {selectedSongs.length > 0 ? (
      <Button
          onClick={handlePayment}
          variant="contained">
          Proceed to Payment
      </Button>
    ) : (
      <p>No songs selected</p>
    )}
    <Link to="/songSearch">
      <Button>Back to buying songs</Button>
    </Link>
  </div>
  );
}

export default Cart;