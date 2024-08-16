
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./chinook.db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { verifyToken, jwtSecret } = require('./server'); 


router.get('/getcartdata', verifyToken, (req, res) => {
  const userQuery = `
    SELECT u.type, u.customerEmployeeId, 
      CASE
        WHEN u.type = 'c' THEN c.FirstName
        ELSE e.FirstName
      END AS FirstName,
      CASE
        WHEN u.type = 'c' THEN c.LastName
        ELSE e.LastName
      END AS LastName
    FROM users AS u
    LEFT JOIN customers AS c ON u.customerEmployeeId = c.CustomerId
    LEFT JOIN employees AS e ON u.customerEmployeeId = e.EmployeeId
    WHERE u.username = ?;
  `;

  const songQuery = `
    SELECT t.TrackId, ct.cartTrackId, u.userId, c.cartId, t.name as Song_Name, t.composer AS Composer, a.Title AS Album_Name, t.unitPrice as UnitPrice, t.Milliseconds
    FROM users AS u
    JOIN carts AS c ON u.userId = c.userId
    JOIN cart_tracks AS ct ON c.cartId = ct.cartId
    JOIN tracks AS t ON ct.trackId = t.trackId
    JOIN albums AS a ON t.albumId = a.albumId
    WHERE u.username = ?;
  `;

  const employeesQuery = `
    SELECT e.EmployeeId, e.FirstName, e.LastName, e.Title
    FROM employees AS e
    WHERE Title LIKE 'Sales%'
    ;
  `;

  const userData = req.user;
  const userName = userData.userName;
  db.get(userQuery, [userName], (err, userData) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error fetching user data from the database.' });
    }
    db.all(songQuery, [userName], (err, songData) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Error fetching song data from the database.' });
      }

      db.all(employeesQuery, [], (err, employeesData) => {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: 'Error fetching employees data from the database.' });
        }
        // console.log(userData)
        const result = {
          user: userData,
          songs: songData,
          employees: employeesData
        };

        res.json(result);
      });
    });
  });
});

router.delete('/removesongfromcart', verifyToken, (req, res) =>{
  const {cartTrackId} = req.body
  // console.log(cartTrackId)
  const deleteSongQuery = `DELETE FROM cart_tracks WHERE cartTrackId = ?`;
  db.run(deleteSongQuery, [cartTrackId], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Error deleting song from the cart.' });
    } else {
      console.log(`Song with cartTrackId ${cartTrackId} deleted successfully.`);
      res.status(200).json({ message: 'Song deleted successfully.' });
    }
  })
})

router.post('/payment', verifyToken, async (req, res) => {
  try {
    const employeeId = req.body.selectedEmployee;
    const userName = req.user.userName;

    const customerQuery = `
      SELECT c.*
      FROM customers c
      INNER JOIN users u ON c.CustomerId = u.customerEmployeeId
      WHERE u.username = ?;
    `;

    const unitPriceSumQuery = `
      SELECT SUM(t.unitPrice) as totalPrice
      FROM customers c
      INNER JOIN users u ON c.CustomerId = u.customerEmployeeId
      INNER JOIN carts cart ON u.userId = cart.userId
      INNER JOIN cart_tracks ct ON cart.cartId = ct.cartId
      INNER JOIN tracks t ON ct.trackId = t.trackId
      WHERE u.username = ?;
    `;

    const invoiceQuery = `INSERT INTO invoices (
      CustomerId,
      InvoiceDate,
      BillingAddress,
      BillingCity,
      BillingCountry,
      BillingPostalCode,
      Total,
      SupportRepId
      )
      VALUES (?,?,?,?,?,?,?,?)
    `;

    const removeSongsFromCartQuery = `
      DELETE FROM cart_tracks
      WHERE cartId IN (
        SELECT c.cartId
        FROM carts c
        JOIN users u ON c.userId = u.userId
        WHERE u.username = ?
      );
    `;

    const cartItemsQuery = `
      SELECT t.TrackId, t.UnitPrice, COUNT(ct.trackId) AS Quantity
      FROM customers c
      INNER JOIN users u ON c.CustomerId = u.customerEmployeeId
      INNER JOIN carts cart ON u.userId = cart.userId
      INNER JOIN cart_tracks ct ON cart.cartId = ct.cartId
      INNER JOIN tracks t ON ct.trackId = t.trackId
      WHERE u.username = ?
      GROUP BY t.TrackId, t.UnitPrice;
    `;
    
    const cartItems = await new Promise((resolve, reject) => {
      db.all(cartItemsQuery, [userName], (err, items) => {
        if (err) {
          console.error('Error fetching cart items:', err);
          reject('Error fetching cart items.');
        }

        resolve(items);
      });
    });

    const customer = await new Promise((resolve, reject) => {
      db.get(customerQuery, [userName], (err, customer) => {
        if (err) {
          console.error(err.message);
          reject('Error fetching user data from the database.');
        }

        if (!customer) {
          reject('User not found.');
        }

        resolve(customer);
      });
    });

    const customerId = customer.CustomerId;
    const address = customer.Address;
    const city = customer.City;
    const country = customer.Country;
    const postalCode = customer.PostalCode;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now
      .getDate()
      .toString()
      .padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now
      .getSeconds()
      .toString()
      .padStart(2, '0')}`;

    const unitPriceData = await new Promise((resolve, reject) => {
      db.get(unitPriceSumQuery, [userName], (unitPriceErr, unitPriceData) => {
        if (unitPriceErr) {
          console.error('Error calculating total unit price:', unitPriceErr);
          reject('Error calculating total unit price.');
        }

        resolve(unitPriceData);
      });
    });

    const totalUnitPrice = unitPriceData.totalPrice

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      db.run(
        invoiceQuery,
        [customerId, formattedDate, address, city, country, postalCode, totalUnitPrice, employeeId],
        function(insertErr) {
          if (insertErr) {
            console.error('Error inserting invoice:', insertErr);
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Error creating the invoice.' });
          }
          const invoiceId = this.lastID; // Get the ID of the inserted invoice
          // console.log(invoiceId)
          // Insert items into invoice_items table
          const insertItemsQuery = `
            INSERT INTO invoice_items (InvoiceId, TrackId, UnitPrice, Quantity)
            VALUES (?, ?, ?, ?);
          `;

          cartItems.forEach((item) => {
            db.run(
              insertItemsQuery,
              [invoiceId, item.TrackId, item.UnitPrice, item.Quantity],
              (itemInsertErr) => {
                if (itemInsertErr) {
                  console.error('Error inserting invoice items:', itemInsertErr);
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: 'Error adding invoice items.' });
                }
              }
            );
          });


          db.run(removeSongsFromCartQuery, [userName], (removeErr) => {
            if (removeErr) {
              console.error('Error removing songs from the cart:', removeErr);
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Error removing songs from the cart.' });
            }

            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                console.error('Error committing transaction:', commitErr);
                return res.status(500).json({ error: 'Error committing the transaction.' });
              }
              res.status(200).json();
            });
          });
        }
      );
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'An error occurred while creating the invoice.' });
  }
});

module.exports = router;
