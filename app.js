const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sendOtp, verifyOtp, resendOtp } = require('./otpservice'); // Import OTP service
const app = express();

app.use(bodyParser.json());
app.use(cors());

// MySQL connection for users
const userDb = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'userdb'
});

userDb.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL user database');
});

// MySQL connection for contacts
const contactDb = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'userdb'
});

contactDb.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL contact database');
});

// ------------------ User Registration & Login ------------------

// Register endpoint
app.post('/register', (req, res) => {
    const { firstname, lastname, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql = 'INSERT INTO users (firstname, lastname, email, password) VALUES (?, ?, ?, ?)';

    userDb.query(sql, [firstname, lastname, email, hashedPassword], (err, result) => {
        if (err) {
            res.status(500).send({ message: 'Registration failed!', error: err });
            return;
        }
        res.status(200).send({ message: 'Registration successful!' });
    });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';

    userDb.query(sql, [username], (err, results) => {
        if (err || results.length === 0) {
            res.status(401).send({ message: 'Invalid username or password' });
            return;
        }

        const user = results[0];
        if (bcrypt.compareSync(password, user.password)) {
            sendOtp(username)
                .then(message => {
                    res.status(200).send({ message });
                })
                .catch(error => {
                    res.status(500).send({ message: error });
                });
        } else {
            res.status(401).send({ message: 'Invalid username or password' });
        }
    });
});

// Verify OTP
app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).send({ message: 'Email and OTP are required' });
    }

    const result = verifyOtp(email, otp);
    if (result.success) {
        res.status(200).send(result);
    } else {
        res.status(400).send(result);
    }
});

// Resend OTP
app.post('/resend-otp', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const message = await resendOtp(email);
        res.status(200).json({ message });
    } catch (error) {
        res.status(500).json({ message: error });
    }
});

// ------------------ Contact Us ------------------

// Handle POST request for Contact Us form
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;

    const query = 'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)';
    contactDb.query(query, [name, email, message], (err, result) => {
        if (err) {
            res.status(500).send({ message: 'Failed to save contact!', error: err });
            return;
        }
        res.status(200).json({ message: 'Contact saved successfully!' });
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
