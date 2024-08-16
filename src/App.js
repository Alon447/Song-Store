import './App.css';
import React, {useState} from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import Login from './Login/Login';
import SignUp from './SignUp/SignUp';
import SongSearch from './SongSearch/SongSearch';
import Cart from './Cart/Cart';
import Checkout from './CheckOut/Checkout';
import SalesWindow from './SalesWindow/SalesWindow';
import StatisticsCenter from './StatisticsCenter/StatisticsCenter';
import Playlist from './Playlist/Playlist';
import Test from './Test'
function App() {

  return (
    <BrowserRouter>
      <Routes>
          <Route exact path="/" element={<Login/>}></Route>
          <Route exact path="/signup" element={<SignUp/>} />
          <Route exact path="/songsearch" element={<SongSearch/>} />
          <Route exact path="/cart" element={<Cart/>} />
          <Route exact path="/checkout" element={<Checkout/>}/>
          <Route exact path="/saleswindow" element={<SalesWindow/>}/>
          <Route exact path="/statistics" element={<StatisticsCenter/>}/>
          <Route exact path="/playlist" element={<Playlist/>}/>
          <Route exact path="/test" element={<Test/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
