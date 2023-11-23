const express = require('express');
const mysql = require('mysql');
const app = express();
const port = 3000;

// Membuat koneksi MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'malang0341',
  database: 'spk_edas'
});

// Menghubungkan ke MySQL
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL');
});

// Middleware
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => res.sendFile(__dirname + '/views/index.html'));

// Server listening
app.listen(port, () => console.log(`Server is running at http://localhost:${port}`));
