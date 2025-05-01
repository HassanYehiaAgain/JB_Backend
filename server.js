const express = require('express');
const app = express();
const db = require('./database.js');
const cors = require('cors');

app.use(express.json());
app.use(cors());

app.post('/register', (req, res) => {
  const { nickname, email, password } = req.body;
  console.log('Register request:', req.body);
  
  if (!nickname || !email || !password) {
      return res.status(400).json({ error: 'Nickname, email, and password are required' });
  }
  
  if (!email.includes('@') || !email.includes('.com')) {
    return res.status(400).json({ error: 'Email must include @ and .com' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  
  const checkNicknameSQL = `SELECT nickname FROM users WHERE nickname = ?`;
  db.get(checkNicknameSQL, [nickname], (err, row) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (row) {
      return res.status(400).json({ error: 'Nickname already exists' });
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
});

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
      return res.status(400).json({ error: 'Nickname is required' });
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
      
      if (!password && row.password) {
          return res.status(401).json({ error: 'Invalid password' });
      }
      
      if (password && row.password && password !== row.password) {
          return res.status(401).json({ error: 'Invalid password' });
      }
      
      const { password: _, ...userData } = row;
      console.log('User found:', userData);
      res.json(userData);
  });
});

app.post('/update-score', (req, res) => {
  console.log('Update score request received:', req.body);
  const { id, score } = req.body;
  
  if (!id || score === undefined) {
    return res.status(400).json({ error: 'ID and score are required' });
  }
  
  const checkUserSQL = `SELECT id, score FROM users WHERE id = ?`;
  db.get(checkUserSQL, [id], (err, row) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentScore = row.score || 0;
    
    if (score > currentScore) {
      const updateSQL = `UPDATE users SET score = ? WHERE id = ?`;
      db.run(updateSQL, [score, id], function(err) {
        if (err) {
          console.error('Error updating score:', err.message);
          return res.status(500).json({ error: 'Error updating score' });
        }
        
        console.log(`Score updated for user ${id}: ${currentScore} -> ${score}`);
        res.json({ success: true, message: 'Score updated successfully' });
      });
    } else {
      console.log(`Score not updated for user ${id}: ${score} <= ${currentScore}`);
      res.json({ success: true, message: 'Score not updated (lower than current)' });
    }
  });
});

app.get('/leaderboard', (req, res) => {
  console.log('Leaderboard request received');
  
  const sql = `
    SELECT nickname, score 
    FROM users 
    WHERE score > 0 
    ORDER BY score DESC 
    LIMIT 10
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    console.log(`Returning leaderboard with ${rows.length} entries`);
    res.json(rows);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});