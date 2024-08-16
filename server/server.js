const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./chinook.db'); 
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwtSecret = crypto.randomBytes(32).toString('hex');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 * 60 });

module.exports = 
{
  app,
  verifyToken,
  jwtSecret,
  cache
};

const checkoutController = require('./checkoutController'); 
const signupController = require('./signupController'); 
const loginController = require('./loginController'); 
const cartController = require('./cartController'); 
const saleswindowController = require('./saleswindowController'); 
const songsearchController = require('./songsearchController'); 
const statisticsController = require('./statisticsController'); 
const playlistController = require('./playlistController'); 


app.use(express.json());
app.use(cors());
app.use('/api', checkoutController);
app.use('/api', signupController);
app.use('/api', loginController);
app.use('/api', cartController);
app.use('/api', saleswindowController);
app.use('/api', songsearchController);
app.use('/api', statisticsController);
app.use('/api', playlistController);


function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).json({ error: 'Token is missing' });
  }

  const tokenString = token.split(' ')[1]; 
  jwt.verify(tokenString, jwtSecret, (err, decoded) => {
    if (err) {
      console.log("Token not valid")
      return res.status(401).json({ error: 'Token is not valid' });
    }
    req.user = decoded; 
    next(); 
  });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  }
)