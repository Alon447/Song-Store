const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./chinook.db');
const { verifyToken, jwtSecret } = require('./server'); 

router.get('/allpublicplaylists', verifyToken, async (req, res) =>{
    console.log(req.user.userName)
    const query = `
    SELECT playlists.*, users.username
    FROM users
    INNER JOIN playlists ON playlists.OwnerId = users.userId
    WHERE users.username = ?
    UNION
    SELECT playlists.*, users.username
    FROM playlists
    INNER JOIN users ON users.userId = playlists.OwnerId
    WHERE public = 1;
    `
  
    db.all(query, [req.user.userName], (err, items) => {
        if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Error fetching invoice items from the database.' });
        }
        res.json(items);
    });
})

router.get('/playlistdata', verifyToken, async (req, res) =>{
    const { playlistId } = req.query
    const query = `
    SELECT playlist_track.PlaylistId, tracks.Name AS Song_Name, tracks.Composer, albums.Title, tracks.Milliseconds, tracks.UnitPrice
        FROM playlist_track
        INNER JOIN tracks ON playlist_track.TrackId = tracks.TrackId
        LEFT JOIN albums ON tracks.AlbumId = albums.AlbumId
        WHERE playlist_track.PlaylistId = ?;
    `
  
    db.all(query, [playlistId], (err, items) => {
        if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Error fetching invoice items from the database.' });
        }
        res.json(items);
    });
})

router.post('/addplaylist', verifyToken, async (req, res) => {
    try {
      const { name, public, owner } = req.body.params;  
      // console.log(req.body )
      const query = `
        INSERT INTO playlists (Name, public, OwnerId)
        VALUES (?, ?, ?);
      `;
  
      db.run(query, [name, public, owner], function (err) {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: 'Error adding the playlist to the database.' });
        }  
        res.json({ playlistId: this.lastID });
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/addsongtoplaylist', verifyToken, async (req, res) => {
    try {
      const { song, playlist } = req.body.params;  
      console.log(req.body )
      const query = `
      INSERT INTO playlist_track (PlaylistId, TrackId)
        VALUES (?, ?);
      `;
  
      db.run(query, [playlist, song], function (err) {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: 'Error adding the playlist to the database.' });
        }  
        res.json({ playlistId: this.lastID });
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});
  module.exports = router;
