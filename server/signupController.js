
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./chinook.db');
const bcrypt = require('bcryptjs');

router.post('/newuser', async (req, res) => {
  const errors = {};
  
  const requiredFields = [ // fields that if the user not inserting input will raise an error message to the user
  "userName",
  "password",
  "firstName",
  "lastName",
  "address",
  "city",
  "country",
  "postalCode",
  "phone",
  "email"
];
  const params = req.body;
  // console.log(params);

  // SQL queries
  const insert_customer_query = `
    INSERT INTO customers (FirstName, LastName, Company, Address, City, Country, PostalCode, Phone, Email) 
    VALUES (?, ?, COALESCE(?, NULL), ?, ?, ?, ?, ?, ?);`;

  const insert_query = `INSERT INTO users (username, passwordHash, type, customerEmployeeID) VALUES (?, ?, ?, ?);`;

  const checkUsernameQuery = `SELECT COUNT(*) AS count FROM users WHERE username = ?`;

  const insertCartQuery = `
  INSERT INTO Carts (UserID)
  VALUES (?)
`;
  // Hash password
  const hashedPassword = await bcrypt.hash(params.password, 10); // 10 is the saltRounds
  // console.log(hashedPassword);

  // input checks

  requiredFields.forEach(field => {
    if (!params[field]) {
        errors[field] = `This field is required`;
    }
    });

  if (params.password.length < 6) {
    errors.password = `Password must be at least 6 characters`;
  }
  if(!validateEmail(params.email)){
    errors.email = `Not valid email`;
  }


  // Begin transaction with serialize
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');    
    // Check if the username already exists within the transaction
    db.get(checkUsernameQuery, [params.userName], async (err, row) => {
      if (err) {
        console.log("username exists");
        db.run('ROLLBACK'); // Rollback transaction if an error occurs
        return res.status(500).json({ error: 'Error checking username.' });
      }

      if (row.count > 0) {
        // Username already exists, rollback transaction and send an error response
        console.log("Username already exists")
        errors.userName = "Username already exists"
        // return res.status(400).json({ error: 'Username already exists.' });
      }
      if (Object.keys(errors).length > 0) {
        console.log(errors)
        db.run('ROLLBACK');
        return res.status(400).json(errors);
      }
      

      // Continue with insertion since username doesn't exist
      db.run(
        insert_customer_query,
        [
          params.firstName,
          params.lastName,
          params.company,
          params.address,
          params.city,
          params.country,
          params.postalCode,
          params.phone,
          params.email,
        ],
        function (err) {
          if (err) {
            console.error(err.message);
            db.run('ROLLBACK'); // Rollback transaction if an error occurs
            return res.status(500).json({ error: 'Error saving customer data.' });
          }

          // Get the last inserted customer ID
          const customerId = this.lastID;

          // Run the insert_query for users table
          db.run(
            insert_query,
            [params.userName, hashedPassword, 'c', customerId],
            function (err) {
              if (err) {
                console.error(err.message);
                db.run('ROLLBACK'); // Rollback transaction if an error occurs
                return res.status(500).json({ error: 'Error saving user data.' });
              }
              const userId = this.lastID;
              db.run(
                insertCartQuery, 
                [userId],
                function (err) {
                  if (err) {
                    console.error(err.message);
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Error creating a new cart.' });
                  }
              // Commit the transaction if everything is successful
              db.run('COMMIT');
              console.log('Data saved successfully!');
              res.json({ message: 'Data saved successfully!' });
                })
            }
          );
        }
      );
    });
  });
});

function validateEmail(email) {
  // function to validate correct input of email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}
module.exports = router;
