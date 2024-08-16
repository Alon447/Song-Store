import React, {useState, useEffect} from "react";
import API from '../API/api'
import { Link, useNavigate } from "react-router-dom";
import { Snackbar, Alert } from '@mui/material';
import Header from "../Components/Header";
import "./SalesWindow.css"
import { millisecondsToMinutes, formatTotal, formatCell } from "../Components/Utilities";
import { Table, TableHead, TableRow, TableCell, TableSortLabel, TableBody, Collapse, Typography, Box, Button,} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import IconButton from "@mui/material/IconButton";
import Navbar from "../Components/Navbar";
import { navbarButtons } from "../Components/Utilities";

export default function SalesWindow(){
    
    const token = sessionStorage.getItem("token")
    const [invoices, setInvoices] = useState()
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedInvoiceInfo, setSelectedInvoiceInfo] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const invoicesPerPage = 50;
    const [user, setuser] = useState()
    const [cart, setCart] = useState()
    const nav = useNavigate()
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    const [sortingOptions, setSortingOptions] = useState({
        sortBy: null, 
        sortOrder: 'asc', 
    });
    const columns = [
        { id: 'InvoiceId', label: 'InvoiceId' },
        { id: 'FirstName', label: 'FirstName' },
        { id: 'LastName', label: 'LastName' },
        { id: 'InvoiceDate', label: 'InvoiceDate' },
        { id: 'BillingCountry', label: 'BillingCountry' },
        { id: 'Total', label: 'Total' },
        { id: 'EmployeeFirstName', label: 'EmployeeFirstName' },
        { id: 'EmployeeLastName', label: 'EmployeeLastName' },
        { id: 'EmployeeTitle', label: 'EmployeeTitle' },
    ];



    const handleSort = (column) => {
        let order = 'asc';
        if (sortingOptions.sortBy === column && sortingOptions.sortOrder === 'asc') {
          order = 'desc';
        }
        setSortingOptions({
          sortBy: column,
          sortOrder: order,
        });
      
        const sortedInvoices = [...invoices].sort((a, b) => {
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
        setInvoices(sortedInvoices);
    };

    useEffect(() =>{
      initialFetchData()
    }, [])

    async function initialFetchData(){
      try {
          const employeeRes = await API.get('employeeinfo', {});
          if (employeeRes.statusText === 'OK') {
            const data = employeeRes.data;
            setuser(data)
            const title = data.Title
            try {
              const invoiceRes = await API.get('getinvoices', {
                params: {
                  pageNumber: pageNumber,
                  pageSize: invoicesPerPage,
                  title: title,
                  userId: data.userId
                },
            });
              if (invoiceRes.statusText === 'OK') {
                const invoicesData = invoiceRes.data
                const sortedInvoices = invoicesData.sort((a, b) => {
                  const dateA = new Date(a.InvoiceDate).getTime();
                  const dateB = new Date(b.InvoiceDate).getTime();
                  return dateB - dateA;
              });
              setInvoices(sortedInvoices);
              }
              const resCart = await API.get('cartdata', {});
              if (resCart.status === 200) {
                  const cartData = resCart.data;
                  setCart(cartData.cart_track_count)
              }
              else{
                  sessionStorage.removeItem('token');
                  nav("/")
                  console.error('Failed to fetch user information');
              }
          } catch (error) {
              console.log("error")
              console.error('Error fetching invoices:', error);
          }
        }
      } catch (error) {
          console.error('Error fetching user information:', error);
          nav("/")
      }
    }

    async function deleteInvoice(invoice){
      try {
        
        await API.post('updateinvoice', {
          InvoiceId: invoice.InvoiceId,
          Deleted: 1 
        });
        const updatedInvoices = invoices.map((inv) =>
          inv.InvoiceId === invoice.InvoiceId ? { ...inv, Deleted: 1 } : inv
        );
        setInvoices(updatedInvoices)
        setSnackbarMessage('Invoice deleted successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
      catch(error){
        console.error('Error deleting invoice:', error);
        setSnackbarMessage('Failed to delete invoice');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }

    const handleSnackbarClose = (event, reason) => {
      if (reason === 'clickaway') {
        return;
      }
      setSnackbarOpen(false);
    };

    const fetchInvoicesByPage = async (newPageNumber, pageSize) => {
      try {
        const response = await API.get('getinvoices', {
          params: {
            pageNumber: newPageNumber,
            pageSize: pageSize,
            title: user.Title,
            userId: user.userId
          },
        });
  
        if (response.status === 200) {
          console.log(response.data)
          const invoicesData = response.data;
          if(response.data.length  !== 0){
            setInvoices(invoicesData);
            setPageNumber(newPageNumber)
          }
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
      }
    };

    const loadNextInvoices = () => {
      const nextPageNumber = pageNumber + 1;
      fetchInvoicesByPage(nextPageNumber, invoicesPerPage) 
    };
  
    const loadPreviousInvoices = () => {
      if (pageNumber > 1) {
        const previousPageNumber = pageNumber - 1;
        fetchInvoicesByPage(previousPageNumber, invoicesPerPage);
      }
    };

    const handleInvoiceClick = async (invoice) => {
      if (selectedInvoice && selectedInvoice.InvoiceId === invoice.InvoiceId) {
        setSelectedInvoice(null);
        return;
      }
    
      setSelectedInvoice(invoice);
      try {
        const invoiceRes = await API.get('getinvoicedetails', {
          params: { invoice: invoice.InvoiceId }
        });
        if (invoiceRes.statusText === 'OK') {
          setSelectedInvoiceInfo(invoiceRes.data);
        }
      } catch (error) {
        console.error('Error fetching invoice details:', error);
      }
    };

    function handleSongSearch(){
      nav("/songsearch")
    }
    
    const renderTable = () => {
      return (
        <div className="tableContainer">
          <Button variant="contained"  style={{ marginRight: '10px'}} onClick={loadPreviousInvoices}>Load Previous 50 Invoices</Button>
          <Button variant="contained" onClick={loadNextInvoices}>Load Next 50 Invoices</Button>
          <div className="tableMain">
        <Table>
          <TableHead>
            <TableRow className="tableHeader">
              <TableCell key="expand"></TableCell>
              <TableCell key="id">#</TableCell>
              {columns.map(column => (
                <TableCell key={column.id} align="left">
                  <TableSortLabel
                    active={sortingOptions.sortBy === column.id}
                    direction={sortingOptions.sortOrder}
                    onClick={() => handleSort(column.id)}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((row, index) => (
              <React.Fragment key={row.id}>
                <TableRow key={row.id} className={row.Deleted === 1 ? 'sales-deleted-row' : ''}>
                  <TableCell>
                      <IconButton
                        className="expand-button"
                        variant="contained"
                        color="primary"
                        onClick={() => handleInvoiceClick(row)}
                        style={{ width: '5px' , color:'black' }}
                      >
                        <KeyboardArrowDownIcon />
                      </IconButton>
                  </TableCell>
                  <TableCell key={`${row.id}-index`}>{index + 1}</TableCell>
                  {columns.map(column => (
                      <TableCell key={`${row.id}-${column.id}`} className="sales-table-cell">
                        {formatCell(row, column.id)}
                      </TableCell>
                    ))}
                    <TableCell>

                    {row.Deleted === 0 && 
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => deleteInvoice(row)}
                        style={{ width: '10px', marginRight: '10px' }}
                      >
                        Delete
                      </Button>
                    }
                    </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={columns.length + 1}>
                    <Collapse in={selectedInvoice && selectedInvoice.InvoiceId === row.InvoiceId} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 1 }}>
                        <Typography variant="h6" gutterBottom component="div">
                          Invoice Details
                        </Typography>
                        <Table size="small" aria-label="invoice-details">
                          <TableHead>
                            <TableRow>
                              <TableCell>#</TableCell>
                              <TableCell>Name</TableCell>
                              <TableCell>Artist</TableCell>
                              <TableCell>Length</TableCell>
                              <TableCell>Price</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedInvoiceInfo &&
                              Object.entries(selectedInvoiceInfo).map(([key, value]) => (
                                <TableRow key={key}>
                                  <TableCell>{key}</TableCell>
                                  <TableCell>{value.Song_Name}</TableCell>
                                  <TableCell>{value.Composer}</TableCell>
                                  <TableCell>{millisecondsToMinutes(value.Milliseconds)}</TableCell>
                                  <TableCell>{value.UnitPrice}$</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
        <Button variant="contained"  style={{ marginRight: '10px'}} onClick={loadPreviousInvoices}>Load Previous 50 Invoices</Button>
          <Button variant="contained" onClick={loadNextInvoices}>Load Next 50 Invoices</Button>
      </div>
      );
    };
    
    return(
        <div className="salesWindow">
          <Navbar
            user={user}
            navbarButtons={navbarButtons}
            cart={cart}
          />
          {/* <Header
            title="Sales Window"
            user={user}
            additionalButtons={[
              {
                link: '/songsearch',
                className: 'searchSongs-link-sales',
                buttonClass: 'searchSongs-button',
                onClick: handleSongSearch, 
                label: 'Search Songs',
              },
            ]}
          /> */}

            {invoices ? renderTable() : <p>Loading...</p>}
               <Snackbar
                  open={snackbarOpen}
                  autoHideDuration={6000}
                  onClose={handleSnackbarClose}
                >
                  <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
                    {snackbarMessage}
                  </Alert>
                </Snackbar>
        </div>
    )
}