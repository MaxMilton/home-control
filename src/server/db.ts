// https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { Device } from './types';

const DB_PATH = process.env.DB_PATH || 'home-control.db';
const db = new Database(path.join(__dirname, DB_PATH));

// use write-ahead logging mode for better performance
db.pragma('journal_mode = WAL');

/** Populate database with default data */
export function dbInit() {
  const hasTables = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type='table' AND name='devices'
  `).get();

  if (hasTables) return;

  console.log('INFO: Database appears empty, initialising it.');
  const sql = fs.readFileSync(path.join(process.cwd(), './static/base-data.sql'), 'utf8');
  db.exec(sql);
}

// initialise database
dbInit();

/** Remove all database tables and populate with base data */
export function reset() {
  db.pragma('writable_schema = 1');
  db.exec("DELETE FROM sqlite_master WHERE type in ('table', 'index', 'trigger')");
  db.pragma('writable_schema = 0');

  // recover deleted space
  db.exec('VACUUM');

  dbInit();
}

export function query(sql: string) {
  const stmt = db.prepare(sql);
  return stmt.reader
    ? stmt.all()
    : stmt.run();
}

const devicePutStmt = db.prepare(`
  INSERT OR REPLACE INTO devices(
    rowid,
    host,
    port,
    name,
    state,
    type
  )
  VALUES (
    @rowid,
    @host,
    @port,
    @name,
    json(@state),
    @type
  )
`);

export function devicePut(rowid: string, { host, port, name, state, type }: Device) {
  return devicePutStmt.run({ rowid, host, port, name, state: JSON.stringify(state), type });
}

const deviceGetStmt = db.prepare('SELECT rowid, * FROM devices WHERE rowid=?');

export function deviceGet(id: string) {
  return deviceGetStmt.get(id);
}

const deviceListStmt = db.prepare('SELECT rowid, * FROM devices');

export function deviceList() {
  return deviceListStmt.all();
}

const deviceDeleteStmt = db.prepare('DELETE FROM devices WHERE rowid=?');

export function deviceDelete(id: string) {
  return deviceDeleteStmt.run(id);
}

export default db;
