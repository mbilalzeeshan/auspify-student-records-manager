// server.js - Express REST API + static frontend for CampusDesk.
//
// Run with: npm install && npm start
// Listens on process.env.PORT or 3001.

const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Simple email format check (good enough for form validation).
function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Shared validation for POST and PUT bodies.
// Returns an array of error messages; empty means the input is valid.
function validateStudent(body) {
  const errors = [];
  if (!body.name || String(body.name).trim() === "") errors.push("name is required");
  if (!body.email || String(body.email).trim() === "") errors.push("email is required");
  else if (!isValidEmail(body.email)) errors.push("email must be a valid email address");
  if (!body.phone || String(body.phone).trim() === "") errors.push("phone is required");
  if (!body.course || String(body.course).trim() === "") errors.push("course is required");
  if (!body.enrollment_date || String(body.enrollment_date).trim() === "")
    errors.push("enrollment_date is required");
  return errors;
}

// Normalize a row for API output (trim strings, keep shape stable).
function serialize(row) {
  return {
    id: row.id,
    name: row.name.trim(),
    email: row.email.trim(),
    phone: row.phone.trim(),
    course: row.course.trim(),
    enrollment_date: row.enrollment_date.trim(),
  };
}

// Helper to parse :id safely; non-numeric ids are treated as not found.
function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// ---- REST API ----

// List all students, with optional ?search= filter on name, email, course.
app.get("/api/students", (req, res) => {
  const students = db.listStudents(req.query.search).map(serialize);
  res.json(students);
});

// Get a single student by id.
app.get("/api/students/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "Student not found" });
  const student = db.getStudent(id);
  if (!student) return res.status(404).json({ error: "Student not found" });
  res.json(serialize(student));
});

// Create a new student.
app.post("/api/students", (req, res) => {
  const errors = validateStudent(req.body);
  if (errors.length > 0) return res.status(400).json({ error: "Validation failed", details: errors });
  try {
    const student = db.createStudent(req.body);
    res.status(201).json(serialize(student));
  } catch (err) {
    // UNIQUE constraint on email -> 409 Conflict.
    if (err && err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "A student with this email already exists" });
    }
    throw err;
  }
});

// Replace a student record.
app.put("/api/students/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "Student not found" });
  const errors = validateStudent(req.body);
  if (errors.length > 0) return res.status(400).json({ error: "Validation failed", details: errors });
  if (!db.getStudent(id)) return res.status(404).json({ error: "Student not found" });
  try {
    const student = db.updateStudent(id, req.body);
    res.json(serialize(student));
  } catch (err) {
    if (err && err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "A student with this email already exists" });
    }
    throw err;
  }
});

// Delete a student.
app.delete("/api/students/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "Student not found" });
  const deleted = db.deleteStudent(id);
  if (!deleted) return res.status(404).json({ error: "Student not found" });
  res.json({ message: "Student deleted" });
});

// Serve the frontend from public/.
app.use(express.static(path.join(__dirname, "public")));

// Generic error handler so API failures return JSON, not HTML.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`CampusDesk Student Records Manager running on http://localhost:${PORT}`);
});
