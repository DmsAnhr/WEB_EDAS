const express = require('express');
const mysql = require('mysql');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const fs = require('fs/promises');
const app = express();
const port = 3000;

// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'spk_edas'
// });

// db.connect((err) => {
//   if (err) {
//     throw err;
//   }
//   console.log('Connected to MySQL');
// });

app.use(express.static('public'));
app.set('view engine','ejs');
app.use(expressLayouts);


async function readJsonFile(filename) {
  const filePath = path.join(__dirname, 'data', `${filename}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}.json: ${error.message}`);
    return [];
  }
}









app.get('/', (req, res) => {
  res.render('index', { 
    layout: 'layouts/main',
    activePage: 'home'
  })
});

app.get('/alternatif', async (req, res) => {
  const alternatif = await readJsonFile('alternatif');
  res.render('alternatif', { 
    layout: 'layouts/main', 
    activePage: 'alternatif', 
    alternatif 
  });
});

app.get('/kriteria', async (req, res) => {
  const kriteria = await readJsonFile('kriteria');
  res.render('kriteria', { 
    layout: 'layouts/main', 
    activePage: 'kriteria', 
    kriteria 
  });
});

app.get('/matriks', async (req, res) => {
  const kriteria = await readJsonFile('kriteria');
  const matriks = await readJsonFile('matriks');
  res.render('matriks', { 
    layout: 'layouts/main', 
    activePage: 'matriks', 
    kriteria, 
    matriks 
  });
});

// app.get('/perhitungan', (req, res) => {
//   res.render('perhitungan', { 
//     layout: 'layouts/main', 
//     activePage: 'perhitungan',
//   })
// });

app.get('/perhitungan', async (req, res) => {
  const alternatif = await readJsonFile('alternatif');
  const kriteria = await readJsonFile('kriteria');
  const matriks = await readJsonFile('matriks');
  
  // rata-rata hitungan
  // const rataRata = {};
  // kriteria.forEach(k => {
  //   const sum = matriks.reduce((acc, alt) => acc + alt[k.kriteria], 0);
  //   rataRata[k.kriteria] = (sum / matriks.length).toFixed(3);
  // });

  // rata-rata jurnal
  const rataRata = {
    C1: '3.88',
    C2: '3.934',
    C3: '4.24',
    C4: '3.75',
    C5: '4',
    C6: '4.12'
  }
  res.render('perhitungan', { layout: 'layouts/main', activePage: 'perhitungan', kriteria, matriks, rataRata, alternatif });
});

app.get('/rangking', (req, res) => {
  res.render('rangking', { 
    layout: 'layouts/main', 
    activePage: 'rangking',
  })
});

app.use((req, res)=>{
  res.status(404);
  res.send('<h1>404</h1>')
})

app.listen(port, () => console.log(`Server is running at http://localhost:${port}`));
