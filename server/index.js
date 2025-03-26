const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) throw err;
  console.log('MySQL Connected');
});

const verifyUser = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (err, results) => {
      if (err || !results.length || results[0].status === 'blocked') {
        return res.status(403).json({ error: 'User blocked or deleted' });
      }
      req.user = results[0];
      next();
    });
  });
};

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    console.log('Missing fields:', { name, email, password });
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    const hashedPassword = await require('bcryptjs').hash(password, 10);
    db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword],
      (err) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            console.log('Duplicate email:', email);
            return res.status(400).json({ error: 'Email already exists' });
          }
          console.error('Registration error:', err);
          return res.status(500).json({ error: 'Failed to register user' });
        }
        console.log('User registered:', email);
        res.status(201).json({ message: 'User registered successfully' });
      }
    );
  } catch (err) {
    console.error('Hashing error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    console.log('Missing fields:', { email, password });
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error('Login query error:', err);
        return res.status(500).json({ error: 'Failed to login' });
      }
      if (results.length === 0) {
        console.log('User not found:', email);
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const user = results[0];
      const isMatch = await require('bcryptjs').compare(password, user.password);
      if (!isMatch) {
        console.log('Password mismatch for:', email);
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      try {
        const token = require('jsonwebtoken').sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id], (err) => {
          if (err) {
            console.error('Update last_login error:', err);
            return res.status(500).json({ error: 'Failed to update login time' });
          }
          console.log('User logged in:', email);
          res.json({ token });
        });
      } catch (err) {
        console.error('JWT signing error:', err);
        res.status(500).json({ error: 'Failed to generate token' });
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/users', verifyUser, (req, res) => {
  db.query('SELECT id, name, email, last_login, status FROM users ORDER BY last_login DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(results);
  });
});

app.post('/block', verifyUser, (req, res) => {
  const { userIds } = req.body;
  db.query('UPDATE users SET status = "blocked" WHERE id IN (?)', [userIds], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (userIds.includes(req.user.id)) {
      return res.status(403).json({ error: 'User blocked or deleted' });
    }
    res.json({ message: 'User blocked successfully!' });
  });
});

app.post('/unblock', verifyUser, (req, res) => {
  const { userIds } = req.body;
  db.query('UPDATE users SET status = "active" WHERE id IN (?)', [userIds], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'User unblocked successfully!' });
  });
});

app.post('/delete', verifyUser, (req, res) => {
  const { userIds } = req.body;
  db.query('DELETE FROM users WHERE id IN (?)', [userIds], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (userIds.includes(req.user.id)) {
      return res.status(403).json({ error: 'User blocked or deleted' });
    }
    res.json({ message: 'User deleted successfully!' });
  });
});

// Add a root route for testing
const port = 5000
app.get('/', (req, res) => {
  res.send('Welcome to the User Management API');
});
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
