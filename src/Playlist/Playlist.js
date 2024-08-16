import "./Playlist.css"
import React, {useState, useEffect, useRef} from "react";
import { Link, useNavigate } from 'react-router-dom';
import { Button, Table, TableHead, TableRow, TableCell, TableSortLabel, TableBody, Collapse, Typography, Box, IconButton, TextField, Dialog, DialogActions, 
  DialogContent, DialogContentText, DialogTitle, FormControl, InputLabel, Select, MenuItem,} from '@mui/material';
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { navbarButtons } from "../Components/Utilities";

import { millisecondsToMinutes, formatTotal, formatCell } from "../Components/Utilities";
import Navbar from "../Components/Navbar";
import API from '../API/api'
import { useAuthContext } from "../Components/AuthContext";

export default function Playlist(){

  const { user, setUser, token, setToken} = useAuthContext()
  const [playlistData, setPlaylistData] = useState()
  const [cart, setCart] = useState()
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedPlaylistInfo, setSelectedPlaylistInfo] = useState(null);
  // add a new playlist
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [isPublic, setIsPublic] = React.useState('');
  const isNavigated = useRef(false);
  const [sortingOptions, setSortingOptions] = useState({ 
      sortBy: null, 
      sortOrder: 'asc', 
  });

  const nav = useNavigate()
  const columns = [
      { id: 'PlaylistId', label: 'PlaylistId' },
      { id: 'Name', label: 'Name' },
      { id: 'username', label: 'Owner' },
      { id: 'Public', label: 'Public' },

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
    
      const sortedPlaylistData = [...playlistData].sort((a, b) => {
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
      setPlaylistData(sortedPlaylistData);
  };
  const handleTypeChange = (event) => {
    setIsPublic(event.target.value);
  };
  useEffect(() =>{
      fetchUserData()
      fetchPlaylistData()
  },[])

  async function fetchUserData(){
      try {
          const response = await API.get('userinfo', {});
          if (response.status === 200) {
              const userData = response.data;
              console.log(userData)

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
      }
      catch(error){
          console.log(error)
      }
  }

  async function fetchPlaylistData(){
      try {
          const response = await API.get('allpublicplaylists', {});
          if (response.status === 200) {
              const playlistData = response.data;
              console.log(response.data)
              setPlaylistData(playlistData)
          }
          else{
              isNavigated.current = true;
              sessionStorage.removeItem('token');
              nav("/")
              console.error('Failed to fetch user information');
          }
      }
      catch(error){
          console.log(error)
      }
  }

  async function handlePlaylistClick(playlist){

      if (selectedPlaylist && selectedPlaylist.PlaylistId === playlist.PlaylistId) {
          setSelectedPlaylist(null);
          return;
        }
        else{
          try{
            const playlistRes = await API.get('playlistdata', {
                params: {
                    playlistId: playlist.PlaylistId,
                }
            });
            if (playlistRes.statusText === 'OK') {
                setSelectedPlaylistInfo(playlistRes.data);
                setSelectedPlaylist(playlist)
            }
        }
        catch(error){
          console.log(error)
      }
      
      }
      
  }
  
  async function handleNewPlaylist(name, type){
    try {
      const response = await API.post('addplaylist', {
        params: {
          name: name,
          public: type,
          owner:user.userId
        },
      });
      fetchPlaylistData()
    }
    catch(error){
        console.log(error)
    }
  }
  return(
      <div className="playlistWindow">
        <Navbar
          user={user}
          navbarButtons={navbarButtons}
          cart={cart}
        />
          {/* Playlist form */}
          <React.Fragment>
            <Button 
              variant="contained" 
              onClick={handleOpen}
              style={{ marginTop: '15px'}}

              >
              Add A New Playlist
            </Button>
            <Dialog
              open={open}
              onClose={handleClose}
              PaperProps={{
                component: 'form',
                onSubmit: (event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  const formJson = Object.fromEntries(formData.entries());
                  const name = formJson.name;
                  const type = formJson.playlistType;
                  handleNewPlaylist(name,type)
                  handleClose();
                },
              }}
            >
              <DialogTitle>New Playlist</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Add a new playlist to save your favourite songs
                </DialogContentText>
                <TextField
                  autoFocus
                  required
                  margin="dense"
                  id="name"
                  name="name"
                  label="Playlist Name"
                  type="name"
                  fullWidth
                  variant="standard"
                />
                <Box mt={2}>
                  <FormControl fullWidth>
                      <InputLabel id="playlist-type-label">Playlist Type</InputLabel>
                      <Select
                        value={isPublic}
                        labelId="playlist-type-label"
                        id="playlist-type"
                        name="playlistType"
                        label="Playlist Type"
                        onChange={handleTypeChange}
                      >
                        <MenuItem value={1}>Public</MenuItem>
                        <MenuItem value={0}>Private</MenuItem>
                      </Select>
                  </FormControl>
                </Box>
                  
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button type="submit">Confirm</Button>
              </DialogActions>
            </Dialog>
          </React.Fragment>

          <h2>Playlists</h2>
          {playlistData ? (
          <Table>
              {/* Header */}
              <TableHead>
                  <TableRow>
                  {columns.map(column => (
                      <TableCell key={column.id} >
                          <TableSortLabel
                          active={sortingOptions.sortBy === column.id}
                          direction={sortingOptions.sortOrder}
                          onClick={() => handleSort(column.id)}
                          >
                              {column.label}
                          </TableSortLabel>
                      </TableCell>
                  ))}
                      
                  </TableRow>
              </TableHead>
              <TableBody>

              {/* Actual Rows */}
                {playlistData.map((value, index) => (
                  <React.Fragment key={index}>
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{value.Name}</TableCell>
                      <TableCell>{value.username}</TableCell>
                      <TableCell>{value.Public ? ("Public") : ("Private")}</TableCell>
                      <TableCell>
                        <IconButton
                          className="expand-button"
                          variant="contained"
                          color="primary"
                          onClick={() => handlePlaylistClick(value)}
                          style={{ width: "5px", color: "black" }}
                        >
                          <KeyboardArrowDownIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={columns.length + 1}>
                        <Collapse in={selectedPlaylist && selectedPlaylist.PlaylistId === value.PlaylistId} timeout={150} unmountOnExit>
                          <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                              Playlist Details
                            </Typography>
                            <Table size="small" aria-label="playlist-details">
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
                                { selectedPlaylistInfo &&
                                  Object.entries(selectedPlaylistInfo).map(([key, value]) => (
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
    ) : (
      <p>Loading...</p>
    )}
      </div>
      
  )
}