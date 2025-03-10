import express from "express";
import pkg from "pg";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { Hocuspocus } from "@hocuspocus/server";

// Load environment variables from .env file
dotenv.config();

const { Pool } = pkg;

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow requests from all origins
app.use(express.json()); // Parse JSON request bodies

// PostgreSQL Database Configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Create Notes Table if it Doesn't Exist
const createTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL
      );
    `);
    console.log("✅ Notes table is ready");
  } catch (err) {
    console.error("Error creating table:", err);
  }
};
createTable(); // Run table creation

// 🔹 GET All Notes
app.get("/api/notes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM notes ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching notes");
  }
});

// 🔹 POST Create a New Note
app.post("/api/notes", async (req, res) => {
  const { name } = req.body;
  if (!name.trim()) return res.status(400).send("Note name is required");

  const id = uuidv4(); // Generate UUID in backend

  try {
    await pool.query("INSERT INTO notes (id, name) VALUES ($1, $2)", [
      id,
      name,
    ]);
    res.status(201).json({ id, name }); // Send back generated ID
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating note");
  }
});

// 🔹 DELETE a Note
app.delete("/api/notes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM notes WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rowCount === 0) return res.status(404).send("Note not found");
    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting note");
  }
});

// 🟢 Hocuspocus Server for Real-time Collaboration
const hocuspocus = new Hocuspocus({
  port: 1234, // Port for WebSocket connections
});

// Start Express Server
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://192.168.1.42:${PORT}`)
);

// Start Hocuspocus Server
hocuspocus.listen();
console.log("🟢 Hocuspocus WebSocket server running on port 1234");
