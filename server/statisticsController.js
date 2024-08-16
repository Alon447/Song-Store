
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./chinook.db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { verifyToken, jwtSecret } = require('./server'); // Update with your actual server file name


router.get('/sales-by-genre', verifyToken, (req, res) => {
  const query = `
    SELECT g.Name as genre_name, COUNT(*) as sales_count
    FROM invoice_items i
    INNER JOIN tracks t ON i.TrackId = t.TrackId
    INNER JOIN genres g ON t.GenreId = g.GenreId
    INNER JOIN invoices inv ON i.InvoiceId = inv.InvoiceId
    WHERE inv.Deleted = 0
    GROUP BY g.Name
    ORDER BY sales_count DESC;
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error fetching sales by genre.' });
    }
    res.json(rows);
  });
});

router.get('/sales-by-salesman', verifyToken, (req, res) => {
  const query = `
    SELECT 
      e.EmployeeId as employee_id,
      e.FirstName as first_name,
      e.LastName as last_name,
      COUNT(*) as total_sales
    FROM invoices i
    INNER JOIN customers c ON i.CustomerId = c.CustomerId
    INNER JOIN employees e ON i.SupportRepId = e.EmployeeId
    WHERE i.Deleted = 0
    GROUP BY e.EmployeeId
    ORDER BY total_sales DESC;
    `;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error fetching sales by salesman.' });
    }
    res.json(rows);
  });
});

router.get('/best-selling-songs', verifyToken, (req, res) =>{
  const itemNb = req.query.item
  const query = `
    SELECT t.TrackId, t.Name AS Song_Name, a.Title AS Album_Name, SUM(i.Quantity) AS TotalSales, t.Composer, t.UnitPrice, t.Milliseconds
    FROM invoice_items i
    INNER JOIN tracks t ON i.TrackId = t.TrackId
    LEFT JOIN albums a ON t.AlbumId = a.AlbumId
    GROUP BY t.TrackId
    ORDER BY TotalSales DESC
    LIMIT ${itemNb};`
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error fetching best selling songs.' });
    }
    res.json(rows);
  });
})

module.exports = router;
