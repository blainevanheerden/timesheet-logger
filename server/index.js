import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 4000;
const API_KEY = process.env.SERVER_API_KEY || 'dev-key';

app.use(cors());
app.use(bodyParser.json());

// Simple API key middleware
app.use((req, res, next) => {
  const k = req.headers['x-api-key'];
  if (API_KEY && k !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

app.post('/api/jobs', (req, res) => {
  const jobs = Array.isArray(req.body) ? req.body : [req.body];
  const insert = db.prepare(`INSERT INTO jobs (client, clientPhone, clientAddress, jobDescription, resolution, startTime, endTime, hoursWorked, overtime, technician, location, date, afterHours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const inserted = [];

  const tx = db.transaction((jobsArray) => {
    for (const j of jobsArray) {
      const info = insert.run(
        j.client,
        j.clientPhone,
        j.clientAddress,
        j.jobDescription,
        j.resolution,
        j.startTime,
        j.endTime,
        parseFloat(j.hoursWorked || 0),
        parseFloat(j.overtime || 0),
        j.technician,
        j.location,
        j.date,
        j.afterHours ? 1 : 0
      );
      inserted.push({ ...j, serverId: info.lastInsertRowid });
    }
  });

  try {
    tx(jobs);
    res.json({ ok: true, inserted });
  } catch (err) {
    console.error('DB insert error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/jobs', (req, res) => {
  const rows = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all();
  res.json(rows);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}

export default app;
