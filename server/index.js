const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const db = new sqlite3.Database(path.join(__dirname, 'nosh.db'));

const SEED = [
  { dishId: '1', dishName: 'Jeera Rice', imageUrl: 'https://nosh-assignment.s3.ap-south-1.amazonaws.com/jeera-rice.jpg', isPublished: 1 },
  { dishId: '2', dishName: 'Paneer Tikka', imageUrl: 'https://nosh-assignment.s3.ap-south-1.amazonaws.com/paneer-tikka.jpg', isPublished: 1 },
  { dishId: '3', dishName: 'Rabdi', imageUrl: 'https://nosh-assignment.s3.ap-south-1.amazonaws.com/rabdi.jpg', isPublished: 1 },
  { dishId: '4', dishName: 'Chicken Biryani', imageUrl: 'https://nosh-assignment.s3.ap-south-1.amazonaws.com/chicken-biryani.jpg', isPublished: 1 },
  { dishId: '5', dishName: 'Alfredo Pasta', imageUrl: 'https://nosh-assignment.s3.ap-south-1.amazonaws.com/alfredo-pasta.jpg', isPublished: 1 },
];

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS dishes (dishId TEXT PRIMARY KEY, dishName TEXT, imageUrl TEXT, isPublished INTEGER)`);
  db.get(`SELECT COUNT(*) AS count FROM dishes`, (_, row) => {
    if (row.count === 0) {
      const stmt = db.prepare(`INSERT INTO dishes VALUES (?, ?, ?, ?)`);
      SEED.forEach(d => stmt.run(d.dishId, d.dishName, d.imageUrl, d.isPublished));
      stmt.finalize();
    }
  });
});

const getAllDishes = () =>
  new Promise((resolve, reject) =>
    db.all(`SELECT * FROM dishes`, (err, rows) =>
      err ? reject(err) : resolve(rows.map(r => ({ ...r, isPublished: !!r.isPublished })))
    )
  );

app.get('/dishes', async (_, res) => {
  res.json(await getAllDishes());
});

app.patch('/dishes/:id/toggle', async (req, res) => {
  db.run(`UPDATE dishes SET isPublished = 1 - isPublished WHERE dishId = ?`, [req.params.id], async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    const dishes = await getAllDishes();
    broadcast(dishes);
    res.json(dishes);
  });
});

app.post('/dishes/:id/simulate', (req, res) => {
  db.run(`UPDATE dishes SET isPublished = 1 - isPublished WHERE dishId = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  getAllDishes().then(dishes => ws.send(JSON.stringify({ type: 'DISHES_UPDATED', dishes })));
});

const broadcast = (dishes) => {
  const msg = JSON.stringify({ type: 'DISHES_UPDATED', dishes });
  wss.clients.forEach(c => { if (c.readyState === 1) c.send(msg); });
};

setInterval(async () => {
  broadcast(await getAllDishes());
}, 2000);

server.listen(3001, () => console.log('Nosh server running on http://localhost:3001'));
