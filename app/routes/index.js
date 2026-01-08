const express = require("express");
const router = express.Router();
const db = require("../config/database");

// Halaman Utama - List Menfess
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM menfess ORDER BY created_at DESC"
    );
    res.render("index", { messages: rows });
  } catch (err) {
    console.error(err);
    res.render("index", { messages: [], error: "Database connection failed!" });
  }
});

// Halaman Create Menfess
router.get("/create", (req, res) => {
  res.render("create");
});

// Handle Form Submission
router.post("/send", async (req, res) => {
  const { sender, content, color } = req.body;
  if (!sender || !content) return res.redirect("/create");

  try {
    await db.query(
      "INSERT INTO menfess (sender, content, color) VALUES (?, ?, ?)",
      [sender, content, color]
    );
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.redirect("/create");
  }
});

router.post('/like/:id', async (req, res) => {
    const { id } = req.params; 
    
    try {
        await db.query('UPDATE menfess SET likes = likes + 1 WHERE id = ?', [id]);
        
        res.redirect('/'); 
    } catch (error) {
        console.error("Error saat Like:", error);
        res.status(500).send("Gagal melakukan Like");
    }
});

router.post('/dislike/:id', async (req, res) => {
    const { id } = req.params; 

    try {
        await db.query('UPDATE menfess SET dislikes = dislikes + 1 WHERE id = ?', [id]);

        res.redirect('/'); 
    } catch (error) {
        console.error("Error saat Dislike:", error);
        res.status(500).send("Gagal melakukan Dislike");
    }
});

module.exports = router;
