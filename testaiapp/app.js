'use strict';

// ── Seed Data ──────────────────────────────────────────────────────────────
const seedTasks = [
  { id: 1, name: 'Redesign onboarding flow',      priority: 'High',   assignee: 'Alex Smith',   status: 'In Progress' },
  { id: 2, name: 'Fix payment gateway timeout',   priority: 'High',   assignee: 'Jamie Lee',    status: 'Blocked'     },
  { id: 3, name: 'Write API documentation',       priority: 'Medium', assignee: 'Taylor Wong',  status: 'In Progress' },
  { id: 4, name: 'Set up CI/CD pipeline',         priority: 'Medium', assignee: 'Morgan Patel', status: 'Todo'        },
  { id: 5, name: 'Add dark mode to settings',     priority: 'Low',    assignee: 'Alex Smith',   status: 'Done'        },
  { id: 6, name: 'Audit accessibility (WCAG 2.1)', priority: 'Medium', assignee: 'Jordan Kim',  status: 'Todo'        },
  { id: 7, name: 'Resolve CDN caching bug',       priority: 'High',   assignee: 'Jamie Lee',    status: 'Blocked'     },
  { id: 8, name: 'Update dependencies to latest', priority: 'Low',    assignee: 'Taylor Wong',  status: 'Done'        },
];

// ── State ──────────────────────────────────────────────────────────────────
let tasks   = [...seedTasks];
let nextId  = seedTasks.length + 1;

// ── DOM refs ───────────────────────────────────────────────────────────────
const taskBody      = document.getElementById('taskBody');
const totalTasksEl  = document.getElementById('totalTasks');
const blockersEl    = document.getElementById('activeBlockers');
const modalOverlay  = document.getElementById('modalOverlay');
const taskForm      = document.getElementById('taskForm');
const filterStatus  = document.getElementById('filterStatus');
const filterPriority = document.getElementById('filterPriority');

// ── Helpers ────────────────────────────────────────────────────────────────
function priorityClass(p) {
  return { High: 'high', Medium: 'medium', Low: 'low' }[p] ?? 'low';
}

function statusClass(s) {
  return { 'In Progress': 'in-progress', Todo: 'todo', Done: 'done', Blocked: 'blocked' }[s] ?? 'todo';
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

// ── Render ─────────────────────────────────────────────────────────────────
function renderTable(animate = false) {
  const sStatus   = filterStatus.value;
  const sPriority = filterPriority.value;

  const visible = tasks.filter(t =>
    (!sStatus   || t.status   === sStatus)   &&
    (!sPriority || t.priority === sPriority)
  );

  if (visible.length === 0) {
    taskBody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <strong>No tasks found</strong>
          <p>Try adjusting the filters or add a new task.</p>
        </div>
      </td></tr>`;
    return;
  }

  taskBody.innerHTML = visible.map((t, i) => `
    <tr data-id="${t.id}" class="${animate && i === 0 ? 'new-row' : ''}">
      <td>${t.id}</td>
      <td class="task-name">${escHtml(t.name)}</td>
      <td><span class="badge-priority ${priorityClass(t.priority)}">${escHtml(t.priority)}</span></td>
      <td>${escHtml(t.assignee)}</td>
      <td><span class="badge-status ${statusClass(t.status)}">${escHtml(t.status)}</span></td>
      <td>
        <button class="action-delete" data-id="${t.id}" title="Delete task" aria-label="Delete task ${escHtml(t.name)}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');

  updateMetrics();
}

function updateMetrics() {
  totalTasksEl.textContent = tasks.length;
  blockersEl.textContent   = tasks.filter(t => t.status === 'Blocked').length;
}

// XSS-safe escaping
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Delete ─────────────────────────────────────────────────────────────────
taskBody.addEventListener('click', e => {
  const btn = e.target.closest('.action-delete');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  tasks = tasks.filter(t => t.id !== id);
  renderTable();
});

// ── Filters ────────────────────────────────────────────────────────────────
filterStatus.addEventListener('change',   () => renderTable());
filterPriority.addEventListener('change', () => renderTable());

// ── Modal open / close ─────────────────────────────────────────────────────
function openModal() {
  modalOverlay.classList.add('open');
  document.getElementById('taskName').focus();
}

function closeModal() {
  modalOverlay.classList.remove('open');
  taskForm.reset();
  clearErrors();
}

document.getElementById('openModal').addEventListener('click', openModal);
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);

modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal();
});

// ── Validation ─────────────────────────────────────────────────────────────
function clearErrors() {
  document.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
  document.querySelectorAll('.form-input').forEach(i => i.classList.remove('error'));
}

function showError(inputId, errorId) {
  const input = document.getElementById(inputId);
  input.classList.add('error');
  input.closest('.form-group').classList.add('has-error');
}

function validate(name, priority, assignee) {
  clearErrors();
  let valid = true;
  if (!name.trim())     { showError('taskName',     'taskNameError');     valid = false; }
  if (!priority)        { showError('taskPriority', 'taskPriorityError'); valid = false; }
  if (!assignee.trim()) { showError('taskAssignee', 'taskAssigneeError'); valid = false; }
  return valid;
}

// ── Form submit ────────────────────────────────────────────────────────────
taskForm.addEventListener('submit', e => {
  e.preventDefault();

  const name     = document.getElementById('taskName').value;
  const priority = document.getElementById('taskPriority').value;
  const assignee = document.getElementById('taskAssignee').value;
  const status   = document.getElementById('taskStatus').value;

  if (!validate(name, priority, assignee)) return;

  const newTask = { id: nextId++, name: name.trim(), priority, assignee: assignee.trim(), status };
  tasks.unshift(newTask);

  // Reset active filters so the new task is always visible
  filterStatus.value   = '';
  filterPriority.value = '';

  closeModal();
  renderTable(true);
});

// ── Init ───────────────────────────────────────────────────────────────────
renderTable();
