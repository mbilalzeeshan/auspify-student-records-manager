# CampusDesk: Student Records Manager

A full-stack CRUD web application for managing student records. It provides a REST API for student records (name, email, phone, course, enrollment date) and a clean single-page frontend with a data table, live search, add/edit modals, delete confirmation, and a detail view.

Built for the Auspify Technologies Full Stack Development internship (slug: `student-records-manager`).

## Features

- Student records with name, email, phone, course, and enrollment date
- Full CRUD through a REST API
- List endpoint with `?search=` filtering across name, email, and course
- Validation: required fields, email format check, unique email (409 on duplicates), 404 on unknown ids
- Frontend single-page app: data table, live search box, Add/Edit modal forms, delete confirmation modal, and a detail side panel
- Seeded with 9 realistic sample students on first run
- Responsive layout, usable at 375px mobile width
- Works fully offline after `npm install`, no CDN or network dependencies

## Tech Stack

- Backend: Node.js + Express
- Persistence: SQLite via better-sqlite3 (single `students.db` file, created automatically)
- Frontend: vanilla HTML, CSS, and JavaScript (custom CSS, system fonts only)

## Setup

```bash
npm install
npm start
```

Then open http://localhost:3001 in a browser. To use a different port: `PORT=4000 npm start`.

Demo notes: no login needed for this app. All data is stored locally in `students.db`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/students | List all students. Optional `?search=` filters by name, email, or course (case-insensitive) |
| GET | /api/students/:id | Get one student by id. 404 if not found |
| POST | /api/students | Create a student. JSON body with name, email, phone, course, enrollment_date. 400 on validation errors, 409 if the email already exists |
| PUT | /api/students/:id | Replace a student. Same body and error rules as POST. 404 if not found |
| DELETE | /api/students/:id | Delete a student. 404 if not found |

Example create:

```bash
curl -X POST http://localhost:3001/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Sara Javed","email":"sara.javed@example.com","phone":"+92 300 1112233","course":"Computer Science","enrollment_date":"2025-09-01"}'
```

Example search:

```bash
curl "http://localhost:3001/api/students?search=computer"
```

## Project Structure

```
student-records-manager/
  server.js        # Express app: REST API routes and static file serving
  db.js            # SQLite data layer (schema, seeding, CRUD queries)
  package.json     # Dependencies and the "start" script
  .gitignore       # Excludes node_modules and the database file
  README.md        # This file
  public/
    index.html     # Single-page app markup
    styles.css     # Custom CSS, CampusDesk visual identity
    app.js         # Frontend logic: table, search, modals, panel, toasts
```

## Implementation Notes

- The database file `students.db` is created in the project root on first run and seeded with 9 sample students. It is ignored by git via `.gitignore`.
- Email uniqueness is enforced by a UNIQUE constraint in SQLite, surfaced as HTTP 409.
- All dates are stored as `YYYY-MM-DD` strings and displayed in a readable format in the UI.
