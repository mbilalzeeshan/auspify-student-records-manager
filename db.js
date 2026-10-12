// db.js - SQLite data layer for the Student Records Manager.
//
// Uses better-sqlite3 (synchronous, zero-network SQLite driver).
// On first run the students.db file does not exist, so the table is
// created and seeded with realistic sample records. Everything the
// API needs goes through the functions exported below.

const path = require("path");
const Database = require("better-sqlite3");

// Keep the database file next to this module so the app is portable.
const DB_PATH = path.join(__dirname, "students.db");
const db = new Database(DB_PATH);

// Create the table if it does not exist yet.
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    course TEXT NOT NULL,
    enrollment_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Seed with realistic records only when the table is empty (first run).
function seedIfEmpty() {
  const count = db.prepare("SELECT COUNT(*) AS c FROM students").get().c;
  if (count > 0) return;

  const seed = [
    ["Ahmed Khan", "ahmed.khan@student.edu.pk", "+92 300 1234567", "Computer Science", "2024-09-02"],
    ["Ayesha Raza", "ayesha.raza@student.edu.pk", "+92 333 9876543", "Business Administration", "2024-09-02"],
    ["Bilal Ahmed", "bilal.ahmed@student.edu.pk", "+92 321 4567890", "Computer Science", "2025-01-15"],
    ["Fatima Noor", "fatima.noor@student.edu.pk", "+92 345 1122334", "Psychology", "2024-09-02"],
    ["Hassan Ali", "hassan.ali@student.edu.pk", "+92 302 5556677", "Electrical Engineering", "2025-01-15"],
    ["Mahnoor Tariq", "mahnoor.tariq@student.edu.pk", "+92 341 7788990", "Business Administration", "2024-09-02"],
    ["Usman Malik", "usman.malik@student.edu.pk", "+92 306 3344556", "Computer Science", "2025-08-25"],
    ["Zainab Shahid", "zainab.shahid@student.edu.pk", "+92 322 9900112", "Data Science", "2025-08-25"],
    ["Danish Iqbal", "danish.iqbal@student.edu.pk", "+92 313 6677889", "Media Studies", "2025-01-15"],
  ];

  const insert = db.prepare(
    "INSERT INTO students (name, email, phone, course, enrollment_date) VALUES (?, ?, ?, ?, ?)"
  );
  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(...row);
  });
  insertMany(seed);
}
seedIfEmpty();

// Return every student, optionally filtered by a search term that
// matches name, email, or course (case-insensitive, partial match).
function listStudents(search) {
  if (search && search.trim() !== "") {
    const term = `%${search.trim().toLowerCase()}%`;
    return db
      .prepare(
        `SELECT * FROM students
         WHERE LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(course) LIKE ?
         ORDER BY name COLLATE NOCASE`
      )
      .all(term, term, term);
  }
  return db.prepare("SELECT * FROM students ORDER BY name COLLATE NOCASE").all();
}

function getStudent(id) {
  return db.prepare("SELECT * FROM students WHERE id = ?").get(id) || null;
}

function createStudent(data) {
  const result = db
    .prepare(
      "INSERT INTO students (name, email, phone, course, enrollment_date) VALUES (?, ?, ?, ?, ?)"
    )
    .run(data.name, data.email, data.phone, data.course, data.enrollment_date);
  return getStudent(result.lastInsertRowid);
}

function updateStudent(id, data) {
  const result = db
    .prepare(
      `UPDATE students
       SET name = ?, email = ?, phone = ?, course = ?, enrollment_date = ?
       WHERE id = ?`
    )
    .run(data.name, data.email, data.phone, data.course, data.enrollment_date, id);
  return result.changes > 0 ? getStudent(id) : null;
}

function deleteStudent(id) {
  const result = db.prepare("DELETE FROM students WHERE id = ?").run(id);
  return result.changes > 0;
}

module.exports = {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
};
