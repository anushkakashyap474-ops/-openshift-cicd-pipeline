const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: 'postgres-service',
  port: 5432,
  user: 'appuser',
  password: 'apppassword',
  database: 'appdb',
});
async function setupDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      text VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('Database table ready');
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

app.get('/api/messages', async (req, res) => {
  const result = await pool.query('SELECT * FROM messages ORDER BY id DESC');
  res.json(result.rows);
});

app.post('/api/messages', async (req, res) => {
  const { text } = req.body;
  const result = await pool.query(
    'INSERT INTO messages (text) VALUES ($1) RETURNING *',
    [text]
  );
  res.json(result.rows[0]);
});

app.delete('/api/messages/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM messages WHERE id = $1', [id]);
  res.json({ success: true, message: `Message ${id} deleted` });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  setupDatabase().catch(err => {
    console.log('Database not reachable yet:', err.message);
  });
});