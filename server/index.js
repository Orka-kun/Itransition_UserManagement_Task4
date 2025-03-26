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
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

  const hashedPassword = await require('bcryptjs').hash(password, 10);
  db.query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, hashedPassword],
    (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Email already exists' });
        }
        console.error('Registration error:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.status(201).json({ message: 'User registered successfully' });
    }
  );
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err || !results.length) return res.status(400).json({ error: 'Invalid credentials' });
    const user = results[0];
    if (user.status === 'blocked') return res.status(403).json({ error: 'User is blocked' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  });
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
