// app.js - CampusDesk frontend logic.
// Talks to the REST API at /api/students and renders the table,
// search, modals, detail panel, and toast notifications.

const API = "/api/students";

// Cached element handles.
const els = {
  body: document.getElementById("studentsBody"),
  empty: document.getElementById("emptyState"),
  search: document.getElementById("searchInput"),
  count: document.getElementById("recordCount"),
  addBtn: document.getElementById("addStudentBtn"),
  modal: document.getElementById("studentModal"),
  modalTitle: document.getElementById("modalTitle"),
  form: document.getElementById("studentForm"),
  formError: document.getElementById("formError"),
  studentId: document.getElementById("studentId"),
  name: document.getElementById("name"),
  email: document.getElementById("email"),
  phone: document.getElementById("phone"),
  course: document.getElementById("course"),
  enrollmentDate: document.getElementById("enrollmentDate"),
  closeModal: document.getElementById("closeModalBtn"),
  cancelModal: document.getElementById("cancelModalBtn"),
  deleteModal: document.getElementById("deleteModal"),
  deleteText: document.getElementById("deleteText"),
  cancelDelete: document.getElementById("cancelDeleteBtn"),
  confirmDelete: document.getElementById("confirmDeleteBtn"),
  panel: document.getElementById("detailPanel"),
  closePanel: document.getElementById("closePanelBtn"),
  editFromPanel: document.getElementById("editFromPanelBtn"),
  deleteFromPanel: document.getElementById("deleteFromPanelBtn"),
  toast: document.getElementById("toast"),
};

// Currently loaded students and the id pending deletion.
let students = [];
let pendingDeleteId = null;
let panelStudentId = null;

// Show a short toast message that fades away.
let toastTimer = null;
function toast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { els.toast.hidden = true; }, 2600);
}

// Escape HTML so user data can never break the page layout.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Format YYYY-MM-DD for display.
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return isNaN(d) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Fetch the list (with the current search term) and render it.
async function loadStudents() {
  const q = new URLSearchParams();
  const term = els.search.value.trim();
  if (term) q.set("search", term);
  const res = await fetch(API + (q.toString() ? "?" + q.toString() : ""));
  students = await res.json();
  renderTable();
}

function renderTable() {
  els.body.innerHTML = students
    .map(
      (s) => `
      <tr>
        <td><span class="name-cell" data-view="${s.id}">${escapeHtml(s.name)}</span></td>
        <td>${escapeHtml(s.email)}</td>
        <td>${escapeHtml(s.phone)}</td>
        <td><span class="course-pill">${escapeHtml(s.course)}</span></td>
        <td>${escapeHtml(formatDate(s.enrollment_date))}</td>
        <td class="actions-col">
          <div class="row-actions">
            <button class="btn btn-secondary btn-small" data-edit="${s.id}" type="button">Edit</button>
            <button class="btn btn-danger btn-small" data-delete="${s.id}" type="button">Delete</button>
          </div>
        </td>
      </tr>`
    )
    .join("");

  els.empty.hidden = students.length > 0;
  els.count.textContent = students.length === 1 ? "1 student" : students.length + " students";
}

// Event delegation for row buttons and name clicks.
els.body.addEventListener("click", (e) => {
  const edit = e.target.closest("[data-edit]");
  const del = e.target.closest("[data-delete]");
  const view = e.target.closest("[data-view]");
  if (edit) openModal(Number(edit.dataset.edit));
  else if (del) askDelete(Number(del.dataset.delete));
  else if (view) openDetail(Number(view.dataset.view));
});

// Open the Add/Edit modal. With no id, it is an Add form.
function openModal(id) {
  els.form.reset();
  els.formError.hidden = true;
  els.studentId.value = "";
  if (id) {
    const s = students.find((x) => x.id === id);
    if (!s) return;
    els.modalTitle.textContent = "Edit Student";
    els.studentId.value = s.id;
    els.name.value = s.name;
    els.email.value = s.email;
    els.phone.value = s.phone;
    els.course.value = s.course;
    els.enrollmentDate.value = s.enrollment_date;
  } else {
    els.modalTitle.textContent = "Add Student";
    // Default the date field to today for convenience.
    els.enrollmentDate.value = new Date().toISOString().slice(0, 10);
  }
  els.modal.hidden = false;
  els.name.focus();
}

function closeModal() {
  els.modal.hidden = true;
}

// Submit handler: POST for add, PUT for edit. Shows server errors inline.
els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  els.formError.hidden = true;
  const payload = {
    name: els.name.value.trim(),
    email: els.email.value.trim(),
    phone: els.phone.value.trim(),
    course: els.course.value.trim(),
    enrollment_date: els.enrollmentDate.value,
  };
  const id = els.studentId.value;
  const method = id ? "PUT" : "POST";
  const url = id ? API + "/" + id : API;

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();

  if (!res.ok) {
    const details = data.details ? ": " + data.details.join("; ") : "";
    els.formError.textContent = (data.error || "Could not save student") + details;
    els.formError.hidden = false;
    return;
  }
  closeModal();
  await loadStudents();
  toast(id ? "Student updated" : "Student added");
});

// Ask for delete confirmation, then delete.
function askDelete(id) {
  const s = students.find((x) => x.id === id);
  if (!s) return;
  pendingDeleteId = id;
  els.deleteText.textContent = 'This will permanently remove "' + s.name + '" from the records.';
  els.deleteModal.hidden = false;
}

els.confirmDelete.addEventListener("click", async () => {
  if (pendingDeleteId === null) return;
  const res = await fetch(API + "/" + pendingDeleteId, { method: "DELETE" });
  els.deleteModal.hidden = true;
  if (res.ok) {
    if (panelStudentId === pendingDeleteId) els.panel.hidden = true;
    pendingDeleteId = null;
    panelStudentId = null;
    await loadStudents();
    toast("Student deleted");
  } else {
    toast("Could not delete student");
  }
});

// Detail panel: shows one student's full record.
function openDetail(id) {
  const s = students.find((x) => x.id === id);
  if (!s) return;
  panelStudentId = id;
  document.getElementById("detailName").textContent = s.name;
  document.getElementById("detailEmail").textContent = s.email;
  document.getElementById("detailPhone").textContent = s.phone;
  document.getElementById("detailCourse").textContent = s.course;
  document.getElementById("detailEnrolled").textContent = formatDate(s.enrollment_date);
  document.getElementById("detailId").textContent = "#" + s.id;
  els.panel.hidden = false;
}

// Wiring: buttons, search, and closing overlays.
els.addBtn.addEventListener("click", () => openModal());
els.closeModal.addEventListener("click", closeModal);
els.cancelModal.addEventListener("click", closeModal);
els.modal.addEventListener("click", (e) => { if (e.target === els.modal) closeModal(); });

els.cancelDelete.addEventListener("click", () => { els.deleteModal.hidden = true; pendingDeleteId = null; });
els.deleteModal.addEventListener("click", (e) => {
  if (e.target === els.deleteModal) { els.deleteModal.hidden = true; pendingDeleteId = null; }
});

els.closePanel.addEventListener("click", () => { els.panel.hidden = true; });
els.panel.addEventListener("click", (e) => { if (e.target === els.panel) els.panel.hidden = true; });
els.editFromPanel.addEventListener("click", () => { els.panel.hidden = true; openModal(panelStudentId); });
els.deleteFromPanel.addEventListener("click", () => { els.panel.hidden = true; askDelete(panelStudentId); });

// Live search with a small debounce so typing stays smooth.
let searchTimer = null;
els.search.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadStudents, 250);
});

// Escape key closes the topmost overlay.
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!els.deleteModal.hidden) { els.deleteModal.hidden = true; pendingDeleteId = null; }
  else if (!els.modal.hidden) closeModal();
  else if (!els.panel.hidden) els.panel.hidden = true;
});

// Initial load.
loadStudents();
