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
    fileSize: 5 * 1024 * 1024 // 5 MB file size limit
  }
}).single('job_description_file'); // Handle job_description_file as a single file, but make it optional

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

    const { email_id, designation, skills, experience, job_description_text } = req.body;
    let job_description_file = null; // Initialize job_description_file as null

    // Check if file was uploaded
    if (req.file) {
      job_description_file = req.file.buffer; // Access the uploaded file's buffer
    }

    // Insert new request into the database
    const sql = 'INSERT INTO request (email_id, designation, job_description_text, job_description_file, skills, experience) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [email_id, designation, job_description_text, job_description_file, skills, experience], (err, result) => {
      if (err) {
        console.error('Error adding request:', err);
        return res.status(500).json({ error: 'An error occurred while adding request' });
      }
      console.log('Request added successfully');
      res.status(200).json({ message: 'Request added successfully' }); // Send JSON response
    });
  });
});

// Route to handle GET all requests
app.get('/requests', (req, res) => {
    const sql = 'SELECT * FROM request';
  
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error retrieving requests:', err);
        return res.status(500).json({ error: 'An error occurred while retrieving requests' });
      }
      
      res.status(200).json(results); // Return all results
    });
  });
  
// Route to handle GET requests by ID
app.get('/requests/:id', (req, res) => {
    const requestId = req.params.id;
    const sql = 'SELECT * FROM request WHERE request_id = ?';
    
    db.query(sql, [requestId], (err, result) => {
      if (err) {
        console.error('Error retrieving request:', err);
        return res.status(500).json({ error: 'An error occurred while retrieving request' });
      }
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }
      
      res.status(200).json(result[0]); // Return the first (and should be the only) result
    });
  });
  

// Route to handle DELETE requests by ID
app.delete('/requests/:id', (req, res) => {
  const requestId = req.params.id;
  const sql = 'DELETE FROM request WHERE request_id = ?';
  db.query(sql, [requestId], (err, result) => {
    if (err) {
      console.error('Error deleting request:', err);
      return res.status(500).json({ error: 'An error occurred while deleting request' });
    }
    console.log('Request deleted successfully');
    res.status(200).json({ message: 'Request deleted successfully' });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
