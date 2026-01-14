import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.TIMESHEET_DB || path.join(process.cwd(), 'server', 'timesheet.db');
const db = new Database(dbPath);

// Initialize tables
db.prepare(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client TEXT,
    clientPhone TEXT,
    clientAddress TEXT,
    jobDescription TEXT,
    resolution TEXT,
    startTime TEXT,
    endTime TEXT,
    hoursWorked REAL,
    overtime REAL,
    technician TEXT,
    location TEXT,
    date TEXT,
    afterHours INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

export default db;
