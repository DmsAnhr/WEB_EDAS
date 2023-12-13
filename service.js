const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const bodyParser = require('body-parser');
const path = require("path");
const fs = require("fs/promises");
const app = express();
const port = 3000;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// read file JSON
async function readJsonFile(filename) {
  const filePath = path.join(__dirname, "data", `${filename}.json`);
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}.json: ${error.message}`);
    return [];
  }
}

// write file JSON
async function writeJsonFile(filename, data) {
    const filePath = path.join(__dirname, 'data', `${filename}.json`);
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`${filename}.json has been updated.`);
    } catch (error) {
        console.error(`Error writing ${filename}.json: ${error.message}`);
    }
}

async function rocBobot() {
    const kriteriaData = await readJsonFile('kriteria');

    const jumlahKriteria = kriteriaData.length;
    let pembagi = 0;
    const bobot = Array(jumlahKriteria).fill(0);

    // rumus ROC bobot
    for (let i = 0; i < jumlahKriteria; i++) {
        pembagi = 0;
        for (let j = 1; j <= jumlahKriteria; j++) {
            if (j > i) {
                pembagi += 1 / j;
            }
        }
        bobot[i] = pembagi / jumlahKriteria;
    }

    const bobotBulat = bobot.map(wk => parseFloat(wk.toFixed(3)));
    kriteriaData.forEach((kriteria, index) => {
        kriteria.bobot = bobotBulat[index];
    });

    // re-write file kriteria.json
    await writeJsonFile('kriteria', kriteriaData);
}

function hitungSolusiRataRata(matriksData, kriteriaData) {
    const jumlahAlternatif = matriksData.length;
    const jumlahKriteria = kriteriaData.length;

    // Inisialisasi array untuk menyimpan nilai Solusi Rata-rata
    const solusiRataRata = Array(jumlahKriteria).fill(0);

    // Iterasi melalui setiap kriteria
    for (let i = 0; i < jumlahKriteria; i++) {
        let totalNilai = 0;

        // Iterasi melalui setiap alternatif
        for (let j = 0; j < jumlahAlternatif; j++) {
            totalNilai += matriksData[j][kriteriaData[i].kriteria];
        }

        // Hitung nilai Solusi Rata-rata untuk kriteria tertentu
        solusiRataRata[i] = totalNilai / jumlahAlternatif;
    }

    return solusiRataRata.map(sr => parseFloat(sr.toFixed(3))); // Membulatkan angka desimal
}

function hitungPdaNda(matriksData, kriteriaData, solusiRataRata) {
    const jumlahAlternatif = matriksData.length;
    const jumlahKriteria = kriteriaData.length;

    // Inisialisasi array untuk menyimpan nilai PDA dan NDA
    const pda = Array(jumlahAlternatif).fill(0).map(() => Array(jumlahKriteria).fill(0));
    const nda = Array(jumlahAlternatif).fill(0).map(() => Array(jumlahKriteria).fill(0));

    // Iterasi melalui setiap alternatif
    for (let i = 0; i < jumlahAlternatif; i++) {
        // Iterasi melalui setiap kriteria
        for (let j = 0; j < jumlahKriteria; j++) {
            // Periksa jenis kriteria (benefit atau cost)
            if (kriteriaData[j].tipe === 'Benefit') {
                pda[i][j] = Math.max(0, matriksData[i][kriteriaData[j].kriteria] - solusiRataRata[j]) / solusiRataRata[j];
                nda[i][j] = Math.max(0, solusiRataRata[j] - matriksData[i][kriteriaData[j].kriteria]) / solusiRataRata[j];
            } else if (kriteriaData[j].tipe === 'Cost') {
                pda[i][j] = Math.max(0, solusiRataRata[j] - matriksData[i][kriteriaData[j].kriteria]) / solusiRataRata[j];
                nda[i][j] = Math.max(0, matriksData[i][kriteriaData[j].kriteria] - solusiRataRata[j]) / solusiRataRata[j];
            }
        }
    }

    return { pda, nda };
}

function hitungSpSn(pda, nda, bobot) {
    const jumlahAlternatif = pda.length;
    const jumlahKriteria = pda[0].length;

    // Inisialisasi array untuk menyimpan nilai SP dan SN
    const sp = Array(jumlahAlternatif).fill(0);
    const sn = Array(jumlahAlternatif).fill(0);

    // Iterasi melalui setiap alternatif
    for (let i = 0; i < jumlahAlternatif; i++) {
        // Iterasi melalui setiap kriteria
        for (let j = 0; j < jumlahKriteria; j++) {
            sp[i] += bobot[j] * pda[i][j];
            sn[i] += bobot[j] * nda[i][j];
        }
    }

    return { sp, sn };
}

function hitungNspNsn(sp, sn) {
    const maxSp = Math.max(...sp);
    const maxSn = Math.max(...sn);

    const nsp = sp.map(value => (value / maxSp).toFixed(3));
    const nsn = sn.map(value => (value / maxSn).toFixed(3));

    return { nsp, nsn };
}

function hitungAs(nsp, nsn) {
    const as = nsp.map((value, index) => ((parseFloat(value) + parseFloat(nsn[index])) / 2).toFixed(3));
    return as;
}

async function saveSkor(hasil) {
    const hasilFilePath = path.join(__dirname, 'data', 'hasil.json');
    try {
        await fs.writeFile(hasilFilePath, JSON.stringify(hasil, null, 2));
        console.log('File hasil.json berhasil ditulis.');
    } catch (error) {
        console.error('Error writing to hasil.json:', error.message);
    }
}

async function rangkingSkor() {
    try {
        const hasilFilePath = path.join(__dirname, 'data', 'hasil.json');
        const hasilData = await fs.readFile(hasilFilePath, 'utf8');
        const hasil = JSON.parse(hasilData);

        // Mengurutkan hasil berdasarkan skor dari yang terbesar ke terkecil
        const rangkingData = hasil.sort((a, b) => b.skor - a.skor);

        return rangkingData;
    } catch (error) {
        console.error('Error reading hasil.json:', error.message);
        return [];
    }
}

function namaAlternatif(namaAlternatif) {
    const alternatif = alternatif.find(a => a.alternatif === namaAlternatif);
    return alternatif ? alternatif.keterangan : '';
}




app.get("/", (req, res) => {
  res.render("index", {
    layout: "layouts/main",
    activePage: "home",
  });
});

app.get("/kriteria", async (req, res) => {
    rocBobot();
  const kriteria = await readJsonFile("kriteria");
  res.render("kriteria", {
    layout: "layouts/main",
    activePage: "kriteria",
    kriteria,
  });
});

app.get("/alternatif", async (req, res) => {
  const alternatif = await readJsonFile("alternatif");
  res.render("alternatif", {
    layout: "layouts/main",
    activePage: "alternatif",
    alternatif,
  });
});

app.get("/matriks", async (req, res) => {
  const kriteria = await readJsonFile("kriteria");
  const alternatif = await readJsonFile("alternatif");
  const matriks = await readJsonFile("matriks");
  res.render("matriks", {
    layout: "layouts/main",
    activePage: "matriks",
    kriteria,
    alternatif,
    matriks,
  });
});

app.get("/perhitungan", async (req, res) => {
    const matriks = await readJsonFile('matriks');
    const kriteria = await readJsonFile('kriteria');
    const alternatif = await readJsonFile("alternatif");

    const solusiRataRata = hitungSolusiRataRata(matriks, kriteria);
    const { pda, nda } = hitungPdaNda(matriks, kriteria, solusiRataRata);
    const bobot = (await readJsonFile('kriteria')).map(kriteria => kriteria.bobot);
    const { sp, sn } = hitungSpSn(pda, nda, bobot);
    const { nsp, nsn } = hitungNspNsn(sp, sn);
    const as = hitungAs(nsp, nsn);

    const hasil = alternatif.map((alternatif, index) => ({
        id: alternatif.id, 
        alternatif: alternatif.alternatif,
        keterangan: alternatif.keterangan,
        skor: parseFloat(as[index])
    }));

    await saveSkor(hasil);

    res.render("perhitungan", {
        layout: "layouts/main",
        activePage: "perhitungan",
        solusiRataRata,
        pda, nda,
        sp, sn,
        nsp, nsn,
        as,
        matriks, kriteria, alternatif
    });
});

app.get("/rangking", async (req, res) => {
  const rangking = await rangkingSkor();
  res.render("rangking", {
    layout: "layouts/main",
    activePage: "rangking",
    rangking,
    namaAlternatif
  });
});



// CRUD service


app.post('/kriteria',async (req, res) => {
    console.log(req.body);
    const { kriteria, keterangan, type } = req.body;
    const existingData = await readJsonFile('kriteria');

    const newData = {
        id: existingData.length + 1,
        kriteria,
        keterangan,
        bobot: 0,
        tipe: type
    };

    existingData.push(newData);
    const filePath = path.join(__dirname, 'data', 'kriteria.json');
    try {
        await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
        rocBobot();
        console.log('Data kriteria berhasil ditambahkan.');
    } catch (error) {
        console.error('Error writing to kriteria.json:', error.message);
    }
    res.redirect('/kriteria');
});

app.post('/kriteria/delete/:id', async (req, res) => {
    console.log(req.params.id);
    const idData = parseInt(req.params.id);
    const existingData = await readJsonFile('kriteria');

    const dataToDelete = existingData.find(k => k.id === idData);

    if (!dataToDelete) {
        return res.status(404).send('Kriteria not found');
    }

    const updatedData = existingData.filter(k => k.id !== idData);

    const filePath = path.join(__dirname, 'data', 'kriteria.json');
    try {
        await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2));
        console.log('Data kriteria berhasil dihapus.');
    } catch (error) {
        console.error('Error writing to kriteria.json:', error.message);
    }
    
    rocBobot();
    res.redirect('/kriteria');
});


app.post('/alternatif',async (req, res) => {
    console.log(req.body);
    const { alternatif, keterangan } = req.body;
    const existingData = await readJsonFile('alternatif');
    const existingDataMatriks = await readJsonFile('matriks');

    const newData = {
        id: existingData.length + 1,
        alternatif,
        keterangan
    };

    const newDataMatriks = {
        id: existingDataMatriks.length + 1,
        alternatif: 'A'+(existingDataMatriks.length + 1),
        C1: 0,
        C2: 0,
        C3: 0,
        C4: 0,
        C5: 0
    };

    existingData.push(newData);
    existingDataMatriks.push(newDataMatriks);
    const filePath = path.join(__dirname, 'data', 'alternatif.json');
    const filePathMatriks = path.join(__dirname, 'data', 'matriks.json');
    try {
        await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
        await fs.writeFile(filePathMatriks, JSON.stringify(existingDataMatriks, null, 2));
        rocBobot();
        console.log('Data alternatif berhasil ditambahkan.');
    } catch (error) {
        console.error('Error writing to alternatif.json:', error.message);
    }
    res.redirect('/alternatif');
});

app.post('/alternatif/delete/:id', async (req, res) => {
    console.log(req.params.id);
    const idData = parseInt(req.params.id);
    const existingData = await readJsonFile('alternatif');
    const existingDataMatriks = await readJsonFile('matriks');

    const dataToDelete = existingData.find(k => k.id === idData);
    const dataToDeleteMatriks = existingDataMatriks.find(k => k.id === idData);

    if (!dataToDelete) {
        return res.status(404).send('alternatif not found');
    }
    if (!dataToDeleteMatriks) {
        return res.status(404).send('matriks not found');
    }

    const updatedData = existingData.filter(k => k.id !== idData);
    const updatedDataMatriks = existingDataMatriks.filter(k => k.id !== idData);

    const filePath = path.join(__dirname, 'data', 'alternatif.json');
    const filePathMatriks = path.join(__dirname, 'data', 'matriks.json');
    try {
        await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2));
        await fs.writeFile(filePathMatriks, JSON.stringify(updatedDataMatriks, null, 2));
        console.log('Data alternatif berhasil dihapus.');
    } catch (error) {
        console.error('Error writing to alternatif.json:', error.message);
    }
    
    rocBobot();
    res.redirect('/alternatif');
});

app.post('/matriks/edit/:id', async (req, res) => {
    const matriksId = parseInt(req.params.id);
    const { alternatif, c1, c2, c3, c4, c5 } = req.body;
    const existingData = await readJsonFile('matriks');

    const matriksIndex = existingData.findIndex(m => m.id === matriksId);

    if (matriksIndex === -1) {
        return res.status(404).send('Matriks not found');
    }

    existingData[matriksIndex] = {
        id: matriksId,
        alternatif,
        C1: parseInt(c1),
        C2: parseInt(c2),
        C3: parseInt(c3),
        C4: parseInt(c4),
        C5: parseInt(c5)
    };

    const filePath = path.join(__dirname, 'data', 'matriks.json');
    try {
        await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
        console.log('Data matriks berhasil diubah.');
    } catch (error) {
        console.error('Error writing to matriks.json:', error.message);
    }

    res.redirect('/matriks');
});

app.use((req, res) => {
  res.status(404);
  res.send("<h1>404</h1>");
});

app.listen(port, () =>
  console.log(`Server is running at http://localhost:${port}`)
);
