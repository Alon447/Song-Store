
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./chinook.db');
// const NodeCache = require('node-cache');
// const cache = new NodeCache({ stdTTL: 60 * 60 });
const { verifyToken, jwtSecret, cache } = require('./server'); 

router.get('/songs', (req, res) => { 
  const { search } = req.query;
  const searchQuery = `
  SELECT 
    tracks.trackid,
    tracks.name AS Song_Name,
    tracks.composer,
    tracks.UnitPrice,
    tracks.Milliseconds, 
    albums.albumid,
    albums.title AS Album_Name
  FROM tracks
  LEFT JOIN albums ON tracks.albumid = albums.albumid
  WHERE tracks.name LIKE '%' || ? || '%' OR 
        albums.title LIKE '%' || ? || '%' OR 
        tracks.composer LIKE '%' || ? || '%'
  LIMIT 50;`;

db.all(searchQuery, [search, search, search], (err, rows) => {
  if (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  } else {
    res.json(rows);
  }
  });
});

router.post('/addsong', verifyToken, (req, res) =>{

  // queries
  
  const userDataQuery =`
  SELECT customers.FirstName, customers.LastName, users.userId
    FROM users
    INNER JOIN customers ON users.customerEmployeeId = customers.CustomerId
    WHERE users.username = ?;`

  const getCartIDQuery = `
  SELECT cartId FROM carts WHERE userId = ?
  `;
  const insertSongQuery = `
  INSERT INTO cart_tracks (cartId, trackId)
  VALUES (?, ?)
  `;

  const checkSongInCartQuery = `
    SELECT COUNT(*) AS count
      FROM cart_tracks AS ct
      INNER JOIN carts AS c ON ct.cartId = c.cartId
      INNER JOIN users AS u ON c.userId = u.userId
      WHERE ct.trackId = ? AND u.username = ?;
    `;
  const username = req.user.userName;
  const data = req.body;
  const SongID = data.song

  db.get(checkSongInCartQuery, [SongID, username], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error checking song in the cart.' });
    }

    if (row.count > 0) {
      // Song already exists in the cart for this user, send a message
      return res.status(400).json({ error: 'Song already exists in the cart.' });
    }
    db.get(userDataQuery, [username], (err, userData) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Error retrieving user data.' });
      }
      
      db.get(getCartIDQuery, [userData.userId], (err, row) => {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: 'Error retrieving CartID.' });
        }
        if (!row) {
          return res.status(404).json({ error: 'Cart for this user not found.' });
        }
        const CartID = row.cartId;
        
        db.run(insertSongQuery, [CartID, SongID], function (err) {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Error adding song to cart.' });
          }
          res.status(200).send();
        })
      })
      })
  })
})

router.post('/savecart', verifyToken, (req, res) =>{
  const {user_id, cart} = req.body
  const insert_query = `INSERT INTO carts (userId) VALUES (?);`

  db.run(insert_query, [user_id], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error saving cart data.' });
    }
    res.json({ message: 'Cart data saved successfully!'});
  });
})

router.get('/cartdata', verifyToken, (req, res) =>{
  const username = req.user.userName;
  const cartDataQuery = `
    SELECT COUNT(*) AS cart_track_count
    FROM cart_tracks
    INNER JOIN carts ON cart_tracks.cartId = carts.cartId
    WHERE carts.userId = (
      SELECT userId FROM users WHERE username = ?
    );
  `;
  
  db.get(cartDataQuery, [username], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error fetching cart data from the database.' });
    }
    res.json({ cart_track_count: row.cart_track_count });
  });

})

function getUserInfo(username, userType, res) {
  const cachedUserInfo = cache.get(username);
  // console.log(cachedUserInfo)

  if (cachedUserInfo) {
    if (userType === 'm' && (cachedUserInfo.Title === null || !cachedUserInfo.Title.includes('Manager'))) {
      return res.status(403).json({ error: 'Access denied. Not a manager.' });
    }
    if (userType === 'e' && cachedUserInfo.type !== 'e') {
      return res.status(403).json({ error: 'Access denied. Not a manager.' });
    }
    res.json(cachedUserInfo);
  } else {
    // console.log("NOT cache")
    const query = `
      SELECT 
        CASE
          WHEN users.type = 'e' THEN employees.FirstName
          ELSE customers.FirstName
        END AS FirstName,
        CASE
          WHEN users.type = 'e' THEN employees.LastName
          ELSE customers.LastName
        END AS LastName,
        CASE
          WHEN users.type = 'e' THEN employees.Title
        END AS Title,
        users.userId,
        users.type
      FROM users
      LEFT JOIN customers ON users.customerEmployeeId = customers.CustomerId AND users.type = 'c'
      LEFT JOIN employees ON employees.EmployeeId = users.customerEmployeeId AND users.type = 'e'
      WHERE users.username = ?;
    `;

    db.get(query, [username], (err, row) => {
      console.log("username", userType, row)

      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Error fetching user data from the database.' });
      }
      if (!row) {
        return res.status(404).json({ error: 'User not found.' });
      }
      if (userType === 'm' && (row.Title === null || !row.Title.includes('Manager'))) {
        return res.status(403).json({ error: 'Access denied. Not a manager.' });
      }
      if (userType === 'e' && row.type !== 'e') {
        return res.status(403).json({ error: 'Access denied. Not a manager.' });
      }
      cache.set(username, row); // Store user info in cache
      res.json(row);
    });
  }
}

router.get('/employeeinfo', verifyToken, (req, res) => {
  const userName = req.user.userName;
  getUserInfo(userName, 'e', res);
});

router.get('/managerinfo', verifyToken, (req, res) => {
  const userName = req.user.userName;
  getUserInfo(userName, 'm', res);
});

router.get('/userinfo', verifyToken, (req, res) => {
  const userName = req.user.userName;
  getUserInfo(userName, 'u', res);
});

router.get('/recommendedsongs',(req, res) =>{
  const searchQuery = `
  SELECT 
    tracks.trackid,
    tracks.name AS Song_Name,
    tracks.composer,
    tracks.UnitPrice,
    tracks.Milliseconds, 
    albums.albumid,
    albums.title AS Album_Name
  FROM tracks
  LEFT JOIN albums ON tracks.albumid = albums.albumid
  ORDER BY RANDOM()
  LIMIT 50;`;

db.all(searchQuery, [], (err, rows) => {
  if (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  } else {
    // console.log(rows)
    res.json(rows);
  }
  });
})
module.exports = router;
