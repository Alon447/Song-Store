
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./chinook.db');

router.get('/getcheckoutdetails', (req, res) => {
  const query = `
    SELECT *
    FROM invoices
    ORDER BY InvoiceId DESC
    LIMIT 1;
  `;

  db.get(query, async (err, invoice) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error fetching invoice data from the database.' });
    }

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    const invoiceId = invoice.InvoiceId;
    const invoiceItemsQuery = `
    SELECT ii.*, t.name AS Song_Name, t.composer AS Composer, t.UnitPrice AS UnitPrice
      FROM invoice_items AS ii
      LEFT JOIN tracks AS t ON ii.TrackId = t.TrackId
      WHERE ii.InvoiceId = ?
    `;

    db.all(invoiceItemsQuery, [invoiceId], (err, items) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Error fetching invoice items from the database.' });
      }

      const checkoutDetails = {
        invoice: invoice,
        items: items
      };

      res.json(checkoutDetails);
    });
  });
});

module.exports = router;
