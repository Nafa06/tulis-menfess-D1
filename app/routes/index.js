const express = require("express");
const router = express.Router();
const db = require("../config/database");

// ==============================================
// 1. Halaman Utama - Menampilkan Daftar Menfess
// ==============================================
router.get("/", async (req, res) => {
  try {
    // KITA PAKAI "ALIAS" DI SINI:
    // Karena di EJS kamu pakai variabel 'jumlah_like' dan 'jumlah_dislike',
    // tapi di database nama kolomnya 'likes' dan 'dislikes'.
    // Jadi kita ubah namanya saat SELECT supaya cocok.
    const query = `
      SELECT 
        id, sender, content, color, created_at, 
        likes AS jumlah_like, 
        dislikes AS jumlah_dislike 
      FROM menfess 
      ORDER BY created_at DESC
    `;
    
    const [rows] = await db.query(query);
    res.render("index", { messages: rows });
  } catch (err) {
    console.error(err);
    res.render("index", { messages: [], error: "Database connection failed!" });
  }
});

// ==============================================
// 2. Halaman Create - Form Menulis Menfess
// ==============================================
router.get("/create", (req, res) => {
  res.render("create");
});

// ==============================================
// 3. Proses Kirim (Submit) Menfess Baru
// ==============================================
router.post("/send", async (req, res) => {
  const { sender, content, color } = req.body;

  if (!sender || !content) return res.redirect("/create");

  try {
    // Default likes & dislikes diisi 0 saat pesan dibuat
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
// 4. API LIKE (Khusus untuk AJAX Fetch)
// ==============================================
// Sesuai dengan fetch di EJS: /api/menfess/:id/like
router.post('/api/menfess/:id/like', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Update Database (Tambah 1 Like)
    await db.query("UPDATE menfess SET likes = likes + 1 WHERE id = ?", [id]);

    // 2. Ambil Data Terbaru (Supaya angka di layar bisa update real-time)
    const [rows] = await db.query("SELECT likes FROM menfess WHERE id = ?", [id]);
    
    if (rows.length > 0) {
      // 3. Kirim balasan JSON (Bukan Redirect!)
      res.json({ 
        success: true, 
        total_likes: rows[0].likes 
      });
    } else {
      res.status(404).json({ success: false, message: "Pesan tidak ditemukan" });
    }
  } catch (err) {
    console.error("API Like Error:", err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

// ==============================================
// 5. API DISLIKE (Khusus untuk AJAX Fetch)
// ==============================================
// Sesuai dengan fetch di EJS: /api/menfess/:id/dislike
router.post('/api/menfess/:id/dislike', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Update Database (Tambah 1 Dislike)
    await db.query("UPDATE menfess SET dislikes = dislikes + 1 WHERE id = ?", [id]);

    // 2. Ambil Data Terbaru
    const [rows] = await db.query("SELECT dislikes FROM menfess WHERE id = ?", [id]);
    
    if (rows.length > 0) {
      // 3. Kirim balasan JSON
      // Perhatikan: EJS kamu mengharapkan key 'total_dislike'
      res.json({ 
        success: true, 
        total_dislike: rows[0].dislikes 
      });
    } else {
      res.status(404).json({ success: false, message: "Pesan tidak ditemukan" });
    }
  } catch (err) {
    console.error("API Dislike Error:", err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

module.exports = router;