
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./chinook.db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { verifyToken, jwtSecret, cache } = require('./server'); // Update with your actual server file name

router.post('/login', (req, res) =>{

  const {userName, password} = req.body
  // const cacheKey = `${userName}`;
  // const cachedUserInfo = cache.get(cacheKey);
  
  console.log(userName, password)
  const query = `SELECT passwordHash FROM users WHERE username = ?`;
  
  db.get(query, [userName], async (err,row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    if(!row){
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const hashedPassword = row.passwordHash;
    try {
      const passwordMatch = await bcrypt.compare(password, hashedPassword);
      if (passwordMatch) {
          const token = jwt.sign({ userName }, jwtSecret, { expiresIn: '1h' });
          res.status(200).json({ token: token });
        } else {
        res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
      console.error('Error during password comparison:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  })
})


module.exports = router;
