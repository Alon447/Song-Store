import React, {useState, useEffect, useRef} from "react";
import './SongSearch_Style.css';
import { Link, useNavigate } from 'react-router-dom';
import logo from "../song-search.png"
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { IconButton} from '@mui/material';
import API from '../API/api'
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import TableComponent from '../Components/TableComponent'
import Tooltip from '@mui/material/Tooltip';
import { useAuthContext } from '../Components/AuthContext'
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Navbar from "../Components/Navbar";
import { navbarButtons } from "../Components/Utilities";

export default function SongSearch(){

    // search results
    const [searchData, setSearchData] = useState({
        search:"",
        searchResults:[],
    })
    const [recommendedSongs, setRecommendedSongs] = useState()

    const { user, setUser, token, setToken } = useAuthContext();
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const debounceDelay = 500;

    const [cart, setCart] = useState(0)
    
    // snackbar
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    const [openDialog, setOpenDialog] = useState(false);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [selectedSong, setSelectedSong] = useState(null);
    const [playlists, setPlaylists] = useState(null)

    const isNavigated = useRef(false);
    const nav = useNavigate()

    // for sorting
    const [sortingOptions, setSortingOptions] = useState({
        sortBy: null, 
        sortOrder: 'asc', 
    });
    const tableColumns = [
        { id: 'Song_Name', label: 'Song' },
        { id: 'Composer', label: 'Artist' },
        { id: 'Album_Name', label: 'Album' },
        { id: 'Milliseconds', label: 'Time' },
        { id: 'UnitPrice', label: 'Price' }
    ];
    const handleOpenDialog = (song) => {
        setOpenDialog(true);
        setSelectedSong(song)
    };
      
      const handleCloseDialog = () => {
        setOpenDialog(false);
    };
    

    const tableButtons = [
        {
            label: 'Add To Cart',
            onClick: (song) => addToCart(song),
        },
        {
            label: 'Add To Playlist',
            onClick: (song) => handleOpenDialog(song),
        }
    ]

    const handleSort = (column) => {
        let order = 'asc';
        if (sortingOptions.sortBy === column && sortingOptions.sortOrder === 'asc') {
          order = 'desc';
        }
        setSortingOptions({
          sortBy: column,
          sortOrder: order,
        });
      
        const sortedSongs = [...searchData.searchResults].sort((a, b) => {
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
      
        setSearchData((prevState) => ({
          ...prevState,
          searchResults: sortedSongs,
        }));
    };

    useEffect(() =>{
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchData.search);
        }, debounceDelay);
        return () => {
            clearTimeout(timerId);
        };
    },[searchData.search])
    
    useEffect(() =>{
        if(debouncedSearchTerm){
            confirmSearch(debouncedSearchTerm)
        } 
        else {
            setSearchData({
                search:"",
                searchResults:[],
            })
        }
    },[debouncedSearchTerm])
    
    useEffect(() =>{
        fetchUserData() 
    },[])
    
    async function fetchUserData(){
        try {
            const response = await API.get('userinfo', {});
            if (response.status === 200) {
                const userData = response.data;
                setUser(userData)
            }
            else{
                isNavigated.current = true;
                sessionStorage.removeItem('token');
                nav("/")
                console.error('Failed to fetch user information');
            }
            const resCart = await API.get('cartdata', {});
            if (resCart.status === 200) {
                const cartData = resCart.data;
                setCart(cartData.cart_track_count)
            }
            else{
                isNavigated.current = true;
                sessionStorage.removeItem('token');
                nav("/")
                console.error('Failed to fetch user information');
            }

            const resRecommended = await API.get('best-selling-songs', {
                params: { item: 50 }
            });                       
            if (resRecommended.status === 200) {
                const receivedData = resRecommended.data.map((song, index) => ({
                    ...song,
                    id: index + 1, 
                }));
                // console.log(receivedData)
                setRecommendedSongs(receivedData)
            }
            else{
                isNavigated.current = true;
                sessionStorage.removeItem('token');
                nav("/")
                console.error('Failed to fetch user information');
            }
            
            const resPlaylists = await API.get('allpublicplaylists', {});                       
            if (resPlaylists.status === 200) {

                console.log(resPlaylists.data)
                setPlaylists(resPlaylists.data)
            }
            else{
                isNavigated.current = true;
                sessionStorage.removeItem('token');
                nav("/")
                console.error('Failed to fetch user information');
            }
        } catch (error) {
            console.log("no token")
            isNavigated.current = true;
            console.error('Unauthorized access. Redirecting to login page.');
            sessionStorage.removeItem('token');
            nav("/");        }
    }

    async function handleSearchChange(event){
        const value = event.target.value
        setSearchData(prevState =>{
            return{
                ...prevState,
                search:value
            }
        })
    }

    async function confirmSearch(search){
        try{
            const searchQuery = search.toLowerCase();
            const response = await API.get(`songs?search=${searchQuery}`); 
            const receivedData = response.data.map((song, index) => ({
                ...song,
                id: index + 1, 
            }));            
            setSearchData(prevState =>{
                return{
                    ...prevState,
                    searchResults:receivedData,
                }
            })
        }catch (error) {
                console.error('Error fetching data:', error);
        }
    }

    // cart related functions
    async function addToCart(song) {        
        if (isNavigated.current) {
            console.log("Navigation occurred. Aborting addToCart action.");
            nav("/")
            return;
        }
        const requestData = {
            song: song.TrackId,
          };
        try{
            const response = await API.post(`addsong`, requestData, {});
            setCart(prevCart => prevCart+1);
            setSnackbarMessage('Song added to cart');
            setSnackbarOpen(true);
            setSnackbarSeverity('success')
        }
        catch(error){
            console.error('Error adding song to cart:', error);
            // Handle different types of errors here
            if (error.response) {
            handleSnackbarClose()
            setSnackbarMessage('Song already in the cart');
            setSnackbarSeverity('error')
            setSnackbarOpen(true);
            } 
            else {
            console.error('Error setting up the request:', error.message);
            }
        }
        console.log("Song added to cart")
    }

    const handleSelectPlaylist = (playlist) => {
        setSelectedPlaylist(playlist);
        handleCloseDialog();
        addToPlaylist(playlist); 
    };
      
    async function addToPlaylist(playlist){
        try{
            const response = await API.post(`addsongtoplaylist`, {
                params:{
                    song:selectedSong.TrackId,
                    playlist:playlist.PlaylistId,
                },
            });
            if (response.status === 200) {
                setSnackbarMessage('Song added to playlist');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
              } else {
                setSnackbarMessage('Failed to add song to playlist');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
              }
        }
        catch(error){
            console.log(error)
            setSnackbarMessage('Song already exists in the playlist');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
        
    }
    // checkout functions
    function handleCheckout(){
        if (isNavigated.current) {
            console.log("Navigation occurred. Aborting checkout action.");
            return;
        }
        nav("/cart")
    }
    
    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
          return;
        }
        setSnackbarOpen(false);
    };
    
    return(
        <div className="main">
            <Navbar
                user={user}
                navbarButtons={navbarButtons}
                cart={cart}
            />
            <input
                className="search"
                type="text"
                name="search"
                id="searchInput"
                placeholder="Song, Album, Artist"
                value={searchData.search}
                onChange={(e) => handleSearchChange(e)}>
            </input>
            <div className="searchResults">
                {
                    searchData.searchResults.length > 0 ? (
                        <TableComponent
                            data={searchData.searchResults}
                            sortingOptions={sortingOptions}
                            handleSort={handleSort}
                            columns={tableColumns}
                            buttons={tableButtons}
                        />           
                    )  : recommendedSongs ? (
                        <div>
                            <h2>Recommended Songs For You</h2>
                            <TableComponent
                                data={recommendedSongs}
                                sortingOptions={sortingOptions}
                                handleSort={handleSort}
                                columns={tableColumns}
                                buttons={tableButtons}
                            />
                        </div>
                    ) :(
                        <p></p>
                    )
                }
                {/* Dialog for adding to playlist */}
                <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Select Playlist</DialogTitle>
                <DialogContent>
                    {/* Render a list of public playlists */}
                    {playlists && playlists.map((playlist) => (
                    <ListItemButton key={playlist.id} button onClick={() => handleSelectPlaylist(playlist)}>
                        <ListItemText primary={playlist.Name} />
                    </ListItemButton>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                </DialogActions>
                </Dialog>
                <p>
                    {searchData.searchResults.length} Results
                </p>
                <p>
                    * Results are limited to 50 songs
                </p>
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={3000}
                    onClose={handleSnackbarClose}
                >
                    <MuiAlert
                    elevation={6}
                    variant="filled"
                    onClose={handleSnackbarClose}
                    severity={snackbarSeverity}
                    >
                    {snackbarMessage}
                    </MuiAlert>
                </Snackbar>
                <div className="checkout">
                    <Button
                    variant="contained" 
                    className="checkout-button"
                    onClick={handleCheckout}
                    >
                        Procceed To Checkout
                    </Button>
                </div>
            </div>
        </div>
    )
}