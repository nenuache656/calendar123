/* =========================================
   Финансовый календарь — логика приложения
   ========================================= */

const STORAGE_KEY = 'finance_calendar_v1';
const THEME_KEY = 'finance_theme';
const LAST_CAT_KEY = 'finance_last_category';

const CATEGORIES = {
  income: [
    { id: 'salary', label: 'Зарплата', color: '#16a34a' },
    { id: 'freelance', label: 'Фриланс', color: '#15803d' },
    { id: 'investments', label: 'Инвестиции', color: '#166534' },
    { id: 'gift', label: 'Подарок', color: '#65a30d' },
    { id: 'other_income', label: 'Прочее', color: '#4d7c0f' }
  ],
  expense: [
    { id: 'food', label: 'Продукты', color: '#dc2626' },
    { id: 'transport', label: 'Транспорт', color: '#b91c1c' },
    { id: 'housing', label: 'Жильё / Коммунальные', color: '#991b1b' },
    { id: 'entertainment', label: 'Развлечения', color: '#7f1d1d' },
    { id: 'health', label: 'Здоровье', color: '#450a0a' },
    { id: 'shopping', label: 'Покупки', color: '#7f1d1d' },
    { id: 'other_expense', label: 'Прочее', color: '#7f1d1d' }
  ],
  transfer: [
    { id: 'savings', label: 'Сбережения', color: '#2563eb' },
    { id: 'debt', label: 'Долг / Кредит', color: '#1d4ed8' },
    { id: 'other_transfer', label: 'Прочее', color: '#1e40af' }
  ]
};

const DEMO_DATA = [
  { id: 'd1', type: 'income', category: 'salary', amount: 85000, description: 'Зарплата Январь', date: '2026-01-15' },
  { id: 'd2', type: 'expense', category: 'food', amount: 12400, description: 'Продукты неделя 1', date: '2026-01-05' },
  { id: 'd3', type: 'expense', category: 'transport', amount: 3200, description: 'Проезд январь', date: '2026-01-08' },
  { id: 'd4', type: 'expense', category: 'housing', amount: 25000, description: 'Аренда январь', date: '2026-01-01' },
  { id: 'd5', type: 'expense', category: 'entertainment', amount: 4500, description: 'Кино и ресторан', date: '2026-01-12' },
  { id: 'd6', type: 'income', category: 'freelance', amount: 15000, description: 'Фриланс-проект', date: '2026-01-20' },
  { id: 'd7', type: 'expense', category: 'shopping', amount: 8900, description: 'Одежда', date: '2026-01-22' },
  { id: 'd8', type: 'transfer', category: 'savings', amount: 10000, description: 'На копилку', date: '2026-01-25' }
];

let events = [];
let currentDate = new Date();
let charts = {};
let lastCategory = localStorage.getItem(LAST_CAT_KEY) || 'salary';
let importRows = []; //parsed CSV rows awaiting confirmation

const els = {
  monthTitle: document.getElementById('monthTitle'),
  calendarGrid: document.getElementById('calendarGrid'),
  eventsList: document.getElementById('eventsList'),
  eventsCount: document.getElementById('eventsCount'),

  statIncome: document.getElementById('statIncome'),
  statIncomeDelta: document.getElementById('statIncomeDelta'),
  statExpense: document.getElementById('statExpense'),
  statExpenseDelta: document.getElementById('statExpenseDelta'),
  statBalance: document.getElementById('statBalance'),
  statBalanceDelta: document.getElementById('statBalanceDelta'),
  statSavings: document.getElementById('statSavings'),
  statSavingsDelta: document.getElementById('statSavingsDelta'),

  btnPrevMonth: document.getElementById('btnPrevMonth'),
  btnNextMonth: document.getElementById('btnNextMonth'),
  btnToday: document.getElementById('btnToday'),
  btnAdd: document.getElementById('btnAdd'),
  btnImport: document.getElementById('btnImport'),
  btnExport: document.getElementById('btnExport'),
  btnTheme: document.getElementById('btnTheme'),

  eventModal: document.getElementById('eventModal'),
  eventForm: document.getElementById('eventForm'),
  eventId: document.getElementById('eventId'),
  eventType: document.getElementById('eventType'),
  eventCategory: document.getElementById('eventCategory'),
  eventAmount: document.getElementById('eventAmount'),
  eventDate: document.getElementById('eventDate'),
  eventDescription: document.getElementById('eventDescription'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  btnCancelModal: document.getElementById('btnCancelModal'),

  // Быстрая форма
  quickForm: document.getElementById('quickForm'),
  quickType: document.getElementById('quickType'),
  quickCategory: document.getElementById('quickCategory'),
  quickAmount: document.getElementById('quickAmount'),
  quickDesc: document.getElementById('quickDesc'),

  // Импорт
  importModal: document.getElementById('importModal'),
  importForm: document.getElementById('importForm'),
  importFile: document.getElementById('importFile'),
  importPreview: document.getElementById('importPreview'),
  btnCloseImport: document.getElementById('btnCloseImport'),
  btnCancelImport: document.getElementById('btnCancelImport')
};

function init() {
  loadTheme();
  loadData();

  const today = new Date();
  currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
  els.eventDate.valueAsDate = today;

  renderAll();
  bindEvents();
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      events = JSON.parse(raw);
    } else {
      events = [...DEMO_DATA];
      saveData();
    }
  } catch (e) {
    console.error('Ошибка загрузки данных:', e);
    events = [...DEMO_DATA];
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Ошибка сохранения данных:', e);
  }
}

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function getMonthEvents(year, month) {
  return events.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

function formatMoney(n) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(n);
}

function formatDateShort(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// ==================== Отрисовка ====================
function renderAll() {
  renderMonthTitle();
  renderStats();
  renderCalendarGrid();
  renderEventsList();
  renderCharts();
}

function renderMonthTitle() {
  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  els.monthTitle.textContent = `${MONTHS_RU[m]} ${y}`;
}

function renderStats() {
  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  const monthEvents = getMonthEvents(y, m);

  const income = monthEvents.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const expense = monthEvents.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const transfer = monthEvents.filter(e => e.type === 'transfer').reduce((s, e) => s + e.amount, 0);
  const balance = income - expense - transfer;

  const prev = new Date(y, m - 1, 1);
  const prevEvents = getMonthEvents(prev.getFullYear(), prev.getMonth());
  const prevIncome = prevEvents.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const prevExpense = prevEvents.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

  const incomeDelta = prevIncome === 0 ? 0 : ((income - prevIncome) / prevIncome) * 100;
  const expenseDelta = prevExpense === 0 ? 0 : ((expense - prevExpense) / prevExpense) * 100;
  const savingsRate = income === 0 ? 0 : ((income - expense) / income) * 100;

  els.statIncome.textContent = formatMoney(income);
  els.statIncomeDelta.textContent = incomeDelta >= 0 ? `▲${incomeDelta.toFixed(0)}%` : `▼${Math.abs(incomeDelta).toFixed(0)}%`;
  els.statIncomeDelta.className = `stat-delta ${incomeDelta >= 0 ? 'positive' : 'negative'}`;

  els.statExpense.textContent = formatMoney(expense);
  els.statExpenseDelta.textContent = expenseDelta >= 0 ? `▲${expenseDelta.toFixed(0)}%` : `▼${Math.abs(expenseDelta).toFixed(0)}%`;
  els.statExpenseDelta.className = `stat-delta ${expenseDelta >= 0 ? 'negative' : 'positive'}`;

  els.statBalance.textContent = formatMoney(balance);
  els.statBalanceDelta.textContent = balance >= 0 ? 'Положительный' : 'Отрицательный';
  els.statBalanceDelta.className = `stat-delta ${balance >= 0 ? 'positive' : 'negative'}`;

  els.statSavings.textContent = `${savingsRate.toFixed(0)} %`;
  els.statSavingsDelta.textContent = `Переводы: ${formatMoney(transfer)}`;
}

function renderCalendarGrid() {
  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  const monthEvents = getMonthEvents(y, m);

  const dayMap = {};
  monthEvents.forEach(e => {
    if (!dayMap[e.date]) dayMap[e.date] = { income: 0, expense: 0, count: 0 };
    if (e.type === 'income') dayMap[e.date].income += e.amount;
    if (e.type === 'expense') dayMap[e.date].expense += e.amount;
    dayMap[e.date].count += 1;
  });

  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = startOffset + lastDay.getDate();

  const today = new Date();
  const isToday = (d) => d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  let html = '';

  WEEKDAYS_RU.forEach(w => {
    html += `<div class="calendar-weekday">${w}</div>`;
  });

  for (let i = 0; i < startOffset; i++) {
    html += `<div class="calendar-day other-month"></div>`;
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const data = dayMap[dateStr];
    const hasEvents = data && data.count > 0;
    const net = (data ? data.income - data.expense : 0);

    let cls = 'calendar-day';
    if (isToday(new Date(y, m, day))) cls += ' today';
    if (hasEvents) cls += ' has-events';

    let amountHtml = '';
    if (data) {
      const sign = net >= 0 ? 'positive' : 'negative';
      amountHtml = `<div class="day-amount ${sign}">${formatMoney(net)}</div>`;
    }

    html += `
      <div class="${cls}" data-date="${dateStr}">
        <div class="day-value">${day}</div>
        ${hasEvents ? '<div class="day-dot"></div>' : ''}
        ${amountHtml}
      </div>
    `;
  }

  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < remaining; i++) {
    html += `<div class="calendar-day other-month"></div>`;
  }

  els.calendarGrid.innerHTML = html;
}

function renderEventsList() {
  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  const monthEvents = getMonthEvents(y, m).sort((a, b) => a.date.localeCompare(b.date));

  els.eventsCount.textContent = monthEvents.length;

  if (monthEvents.length === 0) {
    els.eventsList.innerHTML = '<div class="empty-events">Нет событий в этом месяце. Используйте «Быстрое добавление» или кнопку «+ Событие».</div>';
    return;
  }

  const html = monthEvents.map(e => {
    const typeLabel = e.type === 'income' ? 'Доход' : e.type === 'expense' ? 'Расход' : 'Перевод';
    const sign = e.type === 'income' ? '+' : e.type === 'expense' ? '-' : '±';
    const signCls = e.type === 'income' ? 'positive' : e.type === 'expense' ? 'negative' : 'neutral';
    const cat = CATEGORIES[e.type].find(c => c.id === e.category);
    return `
      <div class="event-item" data-id="${e.id}">
        <div class="event-dot ${e.type}"></div>
        <div class="event-info">
          <div class="event-title">${escapeHtml(e.description)} <span style="font-weight:400;font-size:0.8rem;color:var(--color-text-muted);margin-left:6px;">[${cat ? cat.label : e.category}]</span></div>
          <div class="event-meta">${formatDateShort(e.date)} · ${typeLabel}</div>
        </div>
        <div class="event-amount ${signCls}">${sign}${formatMoney(e.amount)}</div>
        <button class="btn-delete" data-id="${e.id}" aria-label="Удалить событие">×</button>
      </div>
    `;
  }).join('');

  els.eventsList.innerHTML = html;

  // Вешаем обработчики на кнопки удаления
  els.eventsList.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (confirm('Удалить это событие?')) {
        deleteEvent(id);
      }
    });
  });
}

function deleteEvent(id) {
  events = events.filter(e => e.id !== id);
  saveData();
  renderAll();
}

// ==================== Инфографика (Chart.js) ====================
function renderCharts() {
  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  const monthEvents = getMonthEvents(y, m);

  const income = monthEvents.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const expense = monthEvents.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  renderChart('chartIncomeExpense', 'doughnut', {
    labels: ['Доходы', 'Расходы'],
    datasets: [{
      data: [income, expense],
      backgroundColor: ['#16a34a', '#dc2626'],
      borderWidth: 0,
      hoverOffset: 24
    }]
  }, { plugins: { legend: { position: 'bottom' } } });

  const catMap = {};
  monthEvents.filter(e => e.type === 'expense').forEach(e => {
    catMap[e.category] = (catMap[e.category] || 0) + e.amount;
  });
  const catEntries = Object.entries(catMap);
  renderChart('chartCategories', 'pie', {
    labels: catEntries.length ? catEntries.map(([id]) => {
      const c = CATEGORIES.expense.find(x => x.id === id);
      return c ? c.label : id;
    }) : ['Нет данных'],
    datasets: [{
      data: catEntries.length ? catEntries.map(([, v]) => v) : [1],
      backgroundColor: catEntries.length ? catEntries.map(([id]) => {
        const c = CATEGORIES.expense.find(x => x.id === id);
        return c ? c.color : '#94a3b8';
      }) : ['#cbd5e1'],
      borderWidth: 0
    }]
  }, { plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16, font: { size: 11 } } } } });

  const labels = [];
  const incData = [];
  const expData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(y, m - i, 1);
    const yy = d.getFullYear();
    const mm = d.getMonth();
    labels.push(`${MONTHS_RU[mm].slice(0, 3)} ${yy}`);
    const evs = getMonthEvents(yy, mm);
    incData.push(evs.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0));
    expData.push(evs.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0));
  }
  renderChart('chartTrend', 'bar', {
    labels,
    datasets: [
      { label: 'Доходы', data: incData, backgroundColor: '#2563eb', borderRadius: 4 },
      { label: 'Расходы', data: expData, backgroundColor: '#dc2626', borderRadius: 4 }
    ]
  }, {
    plugins: { legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12 } } },
    scales: {
      x: { ticks: { font: { size: 11 } }, grid: { display: false } },
      y: { beginAtZero: true, ticks: { font: { size: 10 }, callback: v => v >= 1000 ? (v / 1000).toFixed(0) + 'к' : v }, grid: { color: '#eef2ff' } }
    }
  });
}

function renderChart(canvasId, type, data, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (charts[canvasId]) {
    charts[canvasId].destroy();
  }
  const ctx = canvas.getContext('2d');
  charts[canvasId] = new Chart(ctx, {
    type,
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800 },
      ...options
    }
  });
}

// ==================== Быстрое добавление ====================
function fillQuickCategories(type) {
  const select = els.quickCategory;
  if (!select) return;
  select.innerHTML = '<option value="">Категория</option>';
  (CATEGORIES[type] || []).forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.label;
    select.appendChild(opt);
  });
  // подставляем последнюю категорию если подходит по типу
  if (lastCategory && (CATEGORIES[type] || []).some(c => c.id === lastCategory)) {
    select.value = lastCategory;
  }
}

function handleQuickSubmit(e) {
  e.preventDefault();

  const type = els.quickType.value;
  const category = els.quickCategory.value;
  const amount = parseFloat(els.quickAmount.value) || 0;
  const description = els.quickDesc.value.trim();

  if (!category) {
    alert('Выберите категорию');
    return;
  }
  if (!amount || amount <= 0) {
    alert('Введите сумму');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const event = {
    id: crypto.randomUUID?.() || Date.now().toString(),
    type,
    category,
    amount,
    date: today,
    description
  };

  events.push(event);
  lastCategory = category;
  localStorage.setItem(LAST_CAT_KEY, lastCategory);

  saveData();
  renderAll();

  els.quickForm.reset();
  fillQuickCategories(type);
  els.quickAmount.focus();
}

// ==================== Модальное окно события ====================
function openAddModal() {
  els.eventForm.reset();
  els.eventId.value = '';
  els.eventModal.querySelector('.modal-header h3').textContent = 'Новое финансовое событие';
  const today = new Date().toISOString().split('T')[0];
  els.eventDate.value = today;
  fillCategories('income');
  if (lastCategory && CATEGORIES.income.some(c => c.id === lastCategory)) {
    els.eventCategory.value = lastCategory;
  }
  els.eventModal.showModal();
}

function openAddModalWithDate(dateStr) {
  openAddModal();
  els.eventDate.value = dateStr;
}

function closeModal() {
  els.eventModal.close();
}

function fillCategories(type) {
  const select = els.eventCategory;
  select.innerHTML = '<option value="">Выберите категорию</option>';
  (CATEGORIES[type] || []).forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.label;
    select.appendChild(opt);
  });
  // подставляем последнюю категорию если подходит по типу
  if (lastCategory && (CATEGORIES[type] || []).some(c => c.id === lastCategory)) {
    select.value = lastCategory;
  }
}

function handleFormSubmit(e) {
  e.preventDefault();

  const id = els.eventId.value || crypto.randomUUID?.() || Date.now().toString();
  const type = els.eventType.value;
  const category = els.eventCategory.value;
  const amount = parseFloat(els.eventAmount.value) || 0;
  const date = els.eventDate.value;
  const description = els.eventDescription.value.trim();

  if (!category) {
    alert('Выберите категорию');
    return;
  }
  if (!date) {
    alert('Укажите дату');
    return;
  }

  const event = { id, type, category, amount, date, description };

  if (els.eventId.value) {
    const idx = events.findIndex(e => e.id === id);
    if (idx !== -1) events[idx] = event;
  } else {
    events.push(event);
    lastCategory = category;
    localStorage.setItem(LAST_CAT_KEY, lastCategory);
  }

  saveData();
  renderAll();
  closeModal();
}

// ==================== Импорт CSV ====================
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row);
  }
  return rows;
}

function validateImportRow(row) {
  const errors = [];
  const date = row.date || '';
  const type = (row.type || '').toLowerCase();
  const category = row.category || '';
  const amount = parseFloat(row.amount);
  const description = row.description || '';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push('Неверная дата (ожидается ГГГГ-ММ-ДД)');
  if (!['income', 'expense', 'transfer'].includes(type)) errors.push('Неверный тип (income/expense/transfer)');
  const validCats = (CATEGORIES[type] || []).map(c => c.id);
  if (!validCats.includes(category)) errors.push(`Категория "${category}" не подходит для типа ${type}`);
  if (!amount || amount <= 0) errors.push('Неверная сумма');

  return { valid: errors.length === 0, errors, data: { date, type, category, amount, description } };
}

function showImportPreview(rows) {
  const container = els.importPreview;
  container.style.display = 'block';
  if (rows.length === 0) {
    container.innerHTML = '<p style="padding:10px;color:var(--color-text-muted);">Не найдено подходящих строк.</p>';
    return;
  }
  let html = '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;">';
  html += '<thead><tr style="border-bottom:1px solid var(--color-border);text-align:left;"><th style="padding:6px;padding-right:8px;">#</th><th style="padding:6px;">Дата</th><th style="padding:6px;">Тип</th><th style="padding:6px;">Категория</th><th style="padding:6px;">Сумма</th><th style="padding:6px;">Описание</th><th style="padding:6px;color:var(--color-danger);">Статус</th></tr></thead><tbody>';
  rows.forEach((r, i) => {
    const ok = r.valid ? '✓' : '✗';
    const color = r.valid ? 'var(--income-color)' : 'var(--expense-color)';
    html += `<tr style="border-bottom:1px solid var(--color-border);"><td style="padding:6px 4px;">${i+1}</td><td style="padding:6px 4px;">${r.data.date}</td><td style="padding:6px 4px;">${r.data.type}</td><td style="padding:6px 4px;">${r.data.category}</td><td style="padding:6px 4px;">${formatMoney(r.data.amount)}</td><td style="padding:6px 4px;">${escapeHtml(r.data.description)}</td><td style="padding:6px 4px;color:${color};font-weight:bold;">${ok}</td></tr>`;
  });
  html += '</tbody></table>';
  const validCount = rows.filter(r => r.valid).length;
  html += `<p style="margin-top:8px;font-size:0.9rem;">Будет импортировано: <strong>${validCount}</strong> из ${rows.length}</p>`;
  container.innerHTML = html;
}

function handleImportSubmit(e) {
  e.preventDefault();
  const validRows = importRows.filter(r => r.valid);
  if (validRows.length === 0) {
    alert('Нет валидных строк для импорта');
    return;
  }
  for (const r of validRows) {
    const ev = {
      id: crypto.randomUUID?.() || Date.now().toString(),
      ...r.data
    };
    events.push(ev);
    lastCategory = ev.category;
    localStorage.setItem(LAST_CAT_KEY, lastCategory);
  }
  saveData();
  renderAll();
  closeImportModal();
}

function closeImportModal() {
  els.importModal.close();
  els.importFile.value = '';
  els.importPreview.style.display = 'none';
  els.importPreview.innerHTML = '';
  importRows = [];
}

// ==================== Экспорт ====================
function exportData() {
  const dataStr = JSON.stringify(events, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finance_calendar_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==================== Тема ====================
function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    els.btnTheme.textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    els.btnTheme.textContent = '🌙';
  }
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem(THEME_KEY, 'light');
    els.btnTheme.textContent = '🌙';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem(THEME_KEY, 'dark');
    els.btnTheme.textContent = '☀️';
  }
}

// ==================== Привязка событий ====================
function bindEvents() {
  // Навигация месяца
  els.btnPrevMonth.addEventListener('click', () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    renderAll();
  });
  els.btnNextMonth.addEventListener('click', () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    renderAll();
  });
  els.btnToday.addEventListener('click', () => {
    const today = new Date();
    currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    renderAll();
  });
  els.btnAdd.addEventListener('click', openAddModal);
  els.btnCloseModal.addEventListener('click', closeModal);
  els.btnCancelModal.addEventListener('click', closeModal);
  els.eventModal.addEventListener('click', (e) => {
    if (e.target === els.eventModal) closeModal();
  });
  els.eventType.addEventListener('change', () => fillCategories(els.eventType.value));
  els.eventForm.addEventListener('submit', handleFormSubmit);
  els.btnExport.addEventListener('click', exportData);
  els.btnTheme.addEventListener('click', toggleTheme);

  // Импорт
  els.btnImport.addEventListener('click', () => {
    els.importModal.showModal();
  });
  els.btnCloseImport.addEventListener('click', closeImportModal);
  els.btnCancelImport.addEventListener('click', closeImportModal);
  els.importModal.addEventListener('click', (e) => {
    if (e.target === els.importModal) closeImportModal();
  });
  els.importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const rows = parseCSV(text).map(r => ({ ...r, ...validateImportRow(r) }));
      importRows = rows;
      showImportPreview(rows);
    };
    reader.readAsText(file, 'UTF-8');
  });
  els.importForm.addEventListener('submit', handleImportSubmit);

  // Быстрая форма
  fillQuickCategories(els.quickType.value);
  els.quickType.addEventListener('change', () => fillQuickCategories(els.quickType.value));
  els.quickForm.addEventListener('submit', handleQuickSubmit);

  // Клик по дню календаря (делегирование)
  els.calendarGrid.addEventListener('click', (e) => {
    const day = e.target.closest('.calendar-day');
    if (!day || day.classList.contains('other-month')) return;
    const date = day.dataset.date;
    openAddModalWithDate(date);
  });

  // Горячие клавиши
  document.addEventListener('keydown', (e) => {
    // Игнорируем если пользователь печатает в поле ввода
    const active = document.activeElement;
    const typing = active && (active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.tagName === 'TEXTAREA');
    if (typing) return;

    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      openAddModal();
    }
    if (e.key === 'Escape') {
      closeModal();
      closeImportModal();
    }
  });
}

// ==================== Утилиты ====================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== Старт ====================
init();
