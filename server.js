// server.js - modify only the registration and login endpoints
const express = require('express');
const app = express();
const db = require('./database.js');
const cors = require('cors');

// Middleware for parsing JSON bodies
app.use(express.json());
app.use(cors());

// Registration endpoint
app.post('/register', (req, res) => {
  const { nickname, email, password } = req.body;
  console.log('Register request:', req.body);
  
  if (!nickname || !email || !password) {
      return res.status(400).json({ error: 'Nickname, email, and password are required.' });
  }
  
  const sql = `INSERT INTO users (nickname, email, password) VALUES (?, ?, ?)`;
  db.run(sql, [nickname, email, password], function (err) {
      if (err) {
          console.error('Registration error:', err.message);
          return res.status(400).json({ error: err.message });
      }
      console.log('User registered:', this.lastID, nickname, email);
      res.json({ id: this.lastID, nickname, email, score: 0 });
  });
});

// Login endpoint
app.post('/login', (req, res) => {
  console.log('Login request received. Body:', req.body);
  let nickname, password;
  
  if (req.body && typeof req.body === 'object') {
    nickname = req.body.nickname;
    password = req.body.password;
  } else if (req.body && typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      nickname = parsed.nickname;
      password = parsed.password;
    } catch (e) {
      console.error('Error parsing request body:', e);
    }
  }
  
  if (!nickname) {
      console.error('Login error: No nickname provided');
      return res.status(400).json({ error: 'Nickname is required.' });
  }
  
  console.log('Looking up user with nickname:', nickname);
  const sql = `SELECT id, nickname, email, password, score FROM users WHERE nickname = ?`;
  db.get(sql, [nickname], (err, row) => {
      if (err) {
          console.error('Database error during login:', err.message);
          return res.status(400).json({ error: err.message });
      }
      if (!row) {
          console.error('User not found:', nickname);
          return res.status(404).json({ error: 'User not found' });
      }
      
      // If no password was provided but user has a password stored
      if (!password && row.password) {
          return res.status(401).json({ error: 'Invalid password' });
      }
      
      // If password was provided but doesn't match
      if (password && row.password && password !== row.password) {
          return res.status(401).json({ error: 'Invalid password' });
      }
      
      // Don't send password back to client
      const { password: _, ...userData } = row;
      console.log('User found:', userData);
      res.json(userData);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});