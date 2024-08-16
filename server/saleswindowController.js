const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./chinook.db');
const { verifyToken, jwtSecret } = require('./server'); 

router.get('/getinvoices', verifyToken, async (req, res) => {
  const { pageNumber, pageSize, title, userId } = req.query;
  const username = req.user.userName
  const userTypeQuery = `
    SELECT type
    FROM users
    WHERE username = ?;
  `;  
  const employeeQuery = `
    SELECT CustomerEmployeeId
    FROM users
    WHERE userId = ?;
  `;
  db.get(userTypeQuery, [username], async (err, userData) =>{
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error fetching user data from the database.' });
    }

    if (!userData) {
      return res.status(404).json({ error: 'User data not found for the provided userId.' });
    }

    const { type } = userData;

    if (type !== 'e') {
      return res.status(403).json({ error: 'Unauthorized access: User is not an employee.' });
    }
    db.get(employeeQuery, [userId], async (err, employeeData) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Error fetching employee data from the database.' });
      }
  
      if (!employeeData) {
        return res.status(404).json({ error: 'Employee data not found for the provided userId.' });
      }
      const { customerEmployeeId } = employeeData;
  
      const customerQuery = `
        SELECT 
          i.*, 
          c.FirstName, 
          c.LastName, 
          COALESCE(e.FirstName, '') AS EmployeeFirstName, 
          COALESCE(e.LastName, '') AS EmployeeLastName,
          COALESCE(e.Title, '') AS EmployeeTitle
        FROM invoices AS i
        INNER JOIN customers AS c ON i.CustomerId = c.CustomerId
        LEFT JOIN employees AS e ON i.SupportRepId = e.EmployeeId
        ORDER BY i.InvoiceId DESC
        LIMIT ? OFFSET ?;
      `;
      const limit = parseInt(pageSize);
      const offset = (parseInt(pageNumber) - 1) * limit;
  
      db.all(customerQuery, [limit, offset], (err, items) => {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: 'Error fetching invoices from the database.' });
        }
        const modifiedInvoices = items.map(invoice => {
          const { FirstName, LastName, SupportRepId } = invoice;
          if (!title.toLowerCase().includes('manager') && !title.toLowerCase().includes('sales') &&  SupportRepId !== customerEmployeeId ) {
            invoice.FirstName = FirstName.charAt(0) + '*'.repeat(FirstName.length - 1);
            invoice.LastName = LastName.charAt(0) + '*'.repeat(LastName.length - 1);
          }
          return invoice;
        });
        res.json(modifiedInvoices);
      });
    });
  })
});

router.get('/getinvoicedetails', verifyToken, async (req, res) => {
  const invoiceId = req.query.invoice
  const query = `
    SELECT ii.*, t.name AS Song_Name, t.composer AS Composer, t.Milliseconds
    FROM invoice_items AS ii
    LEFT JOIN tracks AS t ON ii.TrackId = t.TrackId
    WHERE ii.InvoiceId = ?`
  
  db.all(query, [invoiceId], (err, items) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error fetching invoice items from the database.' });
    }
    res.json(items);
  });
})

router.post('/updateinvoice', verifyToken,  async (req, res) => {
  const { InvoiceId, Deleted } = req.body;

  const updateQuery = `
    UPDATE invoices
    SET Deleted = ?
    WHERE InvoiceId = ?
  `;

  try {
    db.run(updateQuery, [Deleted, InvoiceId], function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Error updating invoice.' });
      }
      // console.log(`Invoice with ID ${InvoiceId} updated successfully.`);
      res.status(200).json({ message: 'Invoice updated successfully.' });
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'An error occurred while updating the invoice.' });
  }
});

module.exports = router;
