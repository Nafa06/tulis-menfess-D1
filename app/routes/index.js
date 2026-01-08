const express = require("express");
const router = express.Router();
const db = require("../config/database");

// ==============================================
// 1. Halaman Utama (Menampilkan Data)
// ==============================================
router.get("/", async (req, res) => {
  try {
    // PENTING: Kita ubah nama kolom 'likes' jadi 'jumlah_like' 
    // supaya cocok dengan variabel di file EJS kamu.
    const query = `
      SELECT id, sender, content, color, created_at, 
      likes AS jumlah_like, 
      dislikes AS jumlah_dislike 
      FROM menfess 
      ORDER BY created_at DESC
    `;
    const [rows] = await db.query(query);
    res.render("index", { messages: rows });
  } catch (err) {
    console.error(err);
    // Kalau error, kemungkinan tabel belum punya kolom likes.
    // Kita arahkan user untuk memperbaikinya.
    res.send(`
      <h1>⚠️ Terjadi Error Database</h1>
      <p>Error: ${err.message}</p>
      <p>Sepertinya database kamu belum punya kolom Likes/Dislikes.</p>
      <a href="/fix-db" style="background:blue; color:white; padding:10px; text-decoration:none; border-radius:5px;">
        🔧 KLIK DI SINI UNTUK PERBAIKI DATABASE OTOMATIS
      </a>
    `);
  }
});

// ==============================================
// 2. Halaman Create
// ==============================================
router.get("/create", (req, res) => {
  res.render("create");
});

router.post("/send", async (req, res) => {
  const { sender, content, color } = req.body;
  if (!sender || !content) return res.redirect("/create");

  try {
    // Default likes & dislikes = 0
    await db.query(
      "INSERT INTO menfess (sender, content, color, likes, dislikes) VALUES (?, ?, ?, 0, 0)",
      [sender, content, color]
    );
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.redirect("/create");
  }
});

// ==============================================
// 3. API LIKE (Khusus untuk AJAX Fetch Frontend)
// ==============================================
// URL ini COCOK dengan script di EJS: fetch('/api/menfess/${id}/like')
router.post('/api/menfess/:id/like', async (req, res) => {
  const { id } = req.params;
  try {
    // Update database
    await db.query("UPDATE menfess SET likes = likes + 1 WHERE id = ?", [id]);
    
    // Ambil data terbaru untuk dikirim balik ke layar
    const [rows] = await db.query("SELECT likes FROM menfess WHERE id = ?", [id]);
    
    if (rows.length > 0) {
      // Kirim JSON (Data angka terbaru)
      res.json({ success: true, total_likes: rows[0].likes });
    } else {
      res.status(404).json({ success: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================
// 4. API DISLIKE (Khusus untuk AJAX Fetch Frontend)
// ==============================================
router.post('/api/menfess/:id/dislike', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("UPDATE menfess SET dislikes = dislikes + 1 WHERE id = ?", [id]);
    const [rows] = await db.query("SELECT dislikes FROM menfess WHERE id = ?", [id]);
    
    if (rows.length > 0) {
      // Kirim JSON (Data angka terbaru) - perhatikan key 'total_dislike' sesuai EJS
      res.json({ success: true, total_dislike: rows[0].dislikes });
    } else {
      res.status(404).json({ success: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================
// 5. RUTE PERBAIKAN DATABASE (JALANKAN SEKALI SAJA)
// ==============================================
router.get('/fix-db', async (req, res) => {
  try {
    // Tambah kolom likes jika belum ada
    await db.query("ALTER TABLE menfess ADD COLUMN likes INT DEFAULT 0");
    // Tambah kolom dislikes jika belum ada
    await db.query("ALTER TABLE menfess ADD COLUMN dislikes INT DEFAULT 0");
    
    res.send("<h1>✅ Sukses!</h1><p>Kolom likes dan dislikes berhasil ditambahkan.</p><a href='/'>Kembali ke Home</a>");
  } catch (err) {
    res.send("<h1>Info:</h1><p>" + err.message + "</p><a href='/'>Kembali ke Home</a>");
  }
});

module.exports = router;