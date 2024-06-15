const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');

const app = express();
const port = 3000;

// MySQL database connection configuration
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'samartha_recruitment'
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1); // Exit the application if unable to connect to the database
  }
  console.log('Connected to the MySQL database');
});

// Middleware for parsing JSON request bodies
app.use(bodyParser.json());

// Use CORS middleware
app.use(cors());

// Multer configuration for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Only PDF files are allowed'));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 
    }
}).single('job_description'); // Single file upload with field name 'job_description'

// Route to handle POST requests for adding a new request
app.post('/requests', (req, res) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Multer error
        console.error('Multer error:', err);
        return res.status(400).json({ error: 'File upload error' });
      } else if (err) {
        // Other errors
        console.error('Error uploading file:', err);
        return res.status(500).json({ error: 'An error occurred while uploading file' });
      }
  
      const { email_id, designation, skills, experience } = req.body;
      const job_descriptionFile = req.file;
  
      // Insert new request into the database
      const sql = 'INSERT INTO request (email_id, designation, job_description, skills, experience) VALUES (?, ?, ?, ?, ?)';
      db.query(sql, [email_id, designation, job_descriptionFile.buffer, skills, experience], (err, result) => {
        if (err) {
          console.error('Error adding request:', err);
          return res.status(500).json({ error: 'An error occurred while adding request' });
        }
        console.log('Request added successfully');
        res.status(200).json({ message: 'Request added successfully' }); // Send JSON response
      });
    });
  });
  


// GET request to retrieve all requests
app.get('/requests', (req, res) => {
    // Retrieve all requests from the database
    const sql = 'SELECT * FROM request';
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error retrieving requests:', err);
        return res.status(500).json({ error: 'An error occurred while retrieving requests' });
      }
      res.json(results);
    });
  });
  
// GET request to retrieve a specific request by database ID
app.get('/requests/:id', (req, res) => {
    const requestId = req.params.id;
  
    // Retrieve request from the database by database ID
    const sql = 'SELECT * FROM request WHERE request_id = ?';
    db.query(sql, [requestId], (err, result) => {
      if (err) {
        console.error('Error retrieving request:', err);
        return res.status(500).json({ error: 'An error occurred while retrieving request' });
      }
      if (result.length === 0) {
        return res.status(404).send('Request not found');
      }
      res.json(result[0]);
    });
  });
  
// GET request to retrieve a request's job description by request_id
app.get('/requests/:request_id/job_description', (req, res) => {
    const requestId = req.params.request_id;
    const sql = 'SELECT job_description FROM request WHERE request_id = ?';

    db.query(sql, [requestId], (error, results) => {
        if (error) {
            console.error('Error retrieving job description data:', error);
            return res.status(500).json({ error: 'An error occurred while retrieving job description' });
        }

        if (results.length === 0 || !results[0].job_description) {
            return res.status(404).json({ error: 'Job description not found for this request' });
        }

        try {
            const jobDescriptionBlob = results[0].job_description;
            res.setHeader('Content-Type', 'application/pdf');
            res.status(200).send(jobDescriptionBlob);
        } catch (error) {
            console.error('Error sending job description data:', error);
            res.status(500).json({ error: 'An error occurred while sending job description data' });
        }
    });
});

// DELETE request to delete a request by ID
app.delete('/requests/:id', (req, res) => {
    const requestId = req.params.id;
  
    // Delete request from the database by ID
    const sql = 'DELETE FROM request WHERE request_id = ?';
    db.query(sql, [requestId], (err, result) => {
      if (err) {
        console.error('Error deleting request:', err);
        return res.status(500).json({ error: 'An error occurred while deleting request' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).send('Request not found');
      }
      console.log('Request deleted successfully');
      res.status(200).send('Request deleted successfully');
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
