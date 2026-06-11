'use strict';

// ── State ──────────────────────────────────────────────────────────────────
let transactions = JSON.parse(localStorage.getItem('ledger_txs') || '[]');
let nextId = Number(localStorage.getItem('ledger_nextId') || '1');

// ── DOM refs ───────────────────────────────────────────────────────────────
const txForm       = document.getElementById('txForm');
const txBody       = document.getElementById('txBody');
const emptyState   = document.getElementById('emptyState');
const txCount      = document.getElementById('txCount');
const totalIncome  = document.getElementById('totalIncome');
const totalExpenses= document.getElementById('totalExpenses');
const balanceEl    = document.getElementById('balance');
const navDate      = document.getElementById('navDate');

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const dateStr = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function persist() {
  localStorage.setItem('ledger_txs', JSON.stringify(transactions));
  localStorage.setItem('ledger_nextId', String(nextId));
}

// ── Summary ────────────────────────────────────────────────────────────────
function updateSummary() {
  const income   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const bal      = income - expenses;

  totalIncome.textContent   = fmt(income);
  totalExpenses.textContent = fmt(expenses);
  balanceEl.textContent     = fmt(bal);
  balanceEl.className = `text-2xl font-bold mt-1 ${bal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;

  txCount.textContent = `${transactions.length} ${transactions.length === 1 ? 'entry' : 'entries'}`;
  emptyState.classList.toggle('hidden', transactions.length > 0);
}

// ── Render table ───────────────────────────────────────────────────────────
function renderTable(newId = null) {
  txBody.innerHTML = [...transactions].reverse().map(t => {
    const isIncome = t.type === 'income';
    return `
    <tr data-id="${t.id}" class="border-b border-border/50 hover:bg-surface2/60 transition ${t.id === newId ? 'fade-in' : ''}">
      <td class="px-6 py-3 text-slate-500 whitespace-nowrap">${dateStr(t.date)}</td>
      <td class="px-6 py-3 text-slate-200 font-medium">${esc(t.desc)}</td>
      <td class="px-6 py-3">
        <span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-surface3 text-slate-400">
          ${esc(t.category)}
        </span>
      </td>
      <td class="px-6 py-3">
        <span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold
          ${isIncome ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}">
          ${isIncome ? 'Income' : 'Expense'}
        </span>
      </td>
      <td class="px-6 py-3 text-right font-semibold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}">
        ${isIncome ? '+' : '-'}${fmt(t.amount)}
      </td>
      <td class="px-4 py-3 text-center">
        <button class="delete-btn text-slate-600 hover:text-rose-400 transition rounded p-1 hover:bg-rose-500/10"
                data-id="${t.id}" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </td>
    </tr>`;
  }).join('');

  updateSummary();
}

// ── Validation ─────────────────────────────────────────────────────────────
function setError(inputId, errId, show) {
  const input = document.getElementById(inputId);
  const err   = document.getElementById(errId);
  input.classList.toggle('border-rose-500', show);
  input.classList.toggle('focus:border-rose-500', show);
  err.classList.toggle('hidden', !show);
}

function validate(desc, amount, category) {
  let ok = true;
  if (!desc.trim())                    { setError('desc',     'descErr',     true);  ok = false; } else { setError('desc',     'descErr',     false); }
  if (!amount || isNaN(amount) || Number(amount) <= 0) { setError('amount', 'amountErr', true);  ok = false; } else { setError('amount', 'amountErr', false); }
  if (!category)                       { setError('category', 'categoryErr', true);  ok = false; } else { setError('category', 'categoryErr', false); }
  return ok;
}

// ── Form submit ────────────────────────────────────────────────────────────
txForm.addEventListener('submit', e => {
  e.preventDefault();

  const desc     = document.getElementById('desc').value;
  const amount   = document.getElementById('amount').value;
  const catRaw   = document.getElementById('category').value;

  if (!validate(desc, amount, catRaw)) return;

  const [category, type] = catRaw.split('|');
  const tx = {
    id: nextId++,
    desc: desc.trim(),
    amount: parseFloat(parseFloat(amount).toFixed(2)),
    category,
    type,
    date: new Date().toISOString(),
  };

  transactions.push(tx);
  persist();
  renderTable(tx.id);
  txForm.reset();
});

// ── Delete ─────────────────────────────────────────────────────────────────
txBody.addEventListener('click', e => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  transactions = transactions.filter(t => t.id !== id);
  persist();
  renderTable();
});

// ── Init ───────────────────────────────────────────────────────────────────
navDate.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
renderTable();
