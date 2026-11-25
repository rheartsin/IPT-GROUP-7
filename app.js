/* Fieldnote is a front-end demonstration for Binangonan Catholic College.
 * Authentication and payroll data are stored in this browser only; use a secure
 * server and database before handling real payroll. */
'use strict';

const STORAGE = { users: 'bcc.payroll.users.v1', session: 'bcc.payroll.session.v1' };
const app = document.getElementById('app');
let activeView = 'overview';
let toastTimer;

const starterUsers = [
  { id: 'u-admin', name: 'Avery Morgan', email: 'admin@bcc.demo', password: 'Admin123!', role: 'admin', department: 'School office' },
  { id: 'u-manager', name: 'Jordan Lee', email: 'manager@bcc.demo', password: 'Manager123!', role: 'manager', department: 'Payroll' },
  { id: 'u-employee', name: 'Maya Santos', email: 'teacher@bcc.demo', password: 'Teacher123!', role: 'employee', department: 'Mathematics' },
  { id: 'u-employee-2', name: 'Noah Kim', email: 'noah@bcc.demo', password: 'Teacher123!', role: 'employee', department: 'Science' },
  { id: 'u-employee-3', name: 'Imani Brooks', email: 'imani@bcc.demo', password: 'Teacher123!', role: 'employee', department: 'English' },
  { id: 'u-employee-4', name: 'Theo Rivera', email: 'theo@bcc.demo', password: 'Teacher123!', role: 'employee', department: 'Arts' }
];
const demoPayroll = [
  { id: 'P-1042', userId: 'u-employee', period: 'Nov 1–15, 2026', gross: 2840, net: 2312, hours: 80, overtime: 0, status: 'Paid' },
  { id: 'P-1043', userId: 'u-employee-2', period: 'Nov 1–15, 2026', gross: 3125, net: 2531, hours: 80, overtime: 0, status: 'Paid' },
  { id: 'P-1044', userId: 'u-employee-3', period: 'Nov 1–15, 2026', gross: 2980, net: 2414, hours: 80, overtime: 0, status: 'Review' },
  { id: 'P-1045', userId: 'u-employee-4', period: 'Nov 1–15, 2026', gross: 4670, net: 3715, hours: 112, overtime: 32, status: 'Review' },
  { id: 'P-1038', userId: 'u-employee', period: 'Oct 16–31, 2026', gross: 2840, net: 2312, hours: 80, overtime: 0, status: 'Paid' },
  { id: 'P-1039', userId: 'u-employee-2', period: 'Oct 16–31, 2026', gross: 3125, net: 2531, hours: 80, overtime: 0, status: 'Paid' }
];

function loadUsers() {
  try { const stored = JSON.parse(localStorage.getItem(STORAGE.users)); if (Array.isArray(stored)) return stored; } catch (_) {}
  localStorage.setItem(STORAGE.users, JSON.stringify(starterUsers));
  return [...starterUsers];
}
function saveUsers(users) { localStorage.setItem(STORAGE.users, JSON.stringify(users)); }
function getSession() {
  try { const data = JSON.parse(localStorage.getItem(STORAGE.session)); return data && loadUsers().find(user => user.id === data.userId) || null; }
  catch (_) { return null; }
}
function esc(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
function initials(name) { return String(name).split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase(); }
function money(value) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value); }
function notify(message) { const el = document.getElementById('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2800); }
function roleName(role) { return { admin: 'Administrator', manager: 'Payroll manager', employee: 'Teacher / employee' }[role] || role; }
function payrollRows(user) { const users = loadUsers(); return demoPayroll.map(row => ({ ...row, person: users.find(person => person.id === row.userId) })).filter(row => row.person && (user.role !== 'employee' || row.userId === user.id)); }

function renderAuth(mode = 'login', error = '') {
  app.innerHTML = `<section class="auth-shell">
    <aside class="auth-art"><div class="brand"><span class="brand-mark">BCC</span><span>Binangonan Catholic College</span></div><div class="art-copy"><div class="eyebrow">Faith · Service · Excellence</div><h1>Payroll with<br>care and clarity.</h1><p>Binangonan Catholic College payroll services for the people who help our school community grow.</p></div><div class="art-note">BINANGONAN CATHOLIC COLLEGE / EMPLOYEE SERVICES</div><div class="orbit" aria-hidden="true"></div></aside>
    <section class="auth-panel"><div class="auth-card">${mode === 'signup' ? signupMarkup(error) : loginMarkup(error)}</div></section>
  </section>`;
  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  const signupForm = document.getElementById('signup-form');
  if (signupForm) signupForm.addEventListener('submit', handleSignup);
  const switchButton = document.getElementById('auth-switch');
  if (switchButton) switchButton.addEventListener('click', () => renderAuth(mode === 'signup' ? 'login' : 'signup'));
}
function loginMarkup(error) {
  return `<div class="eyebrow">BCC / SCHOOL PAYROLL</div><h2>Welcome back.</h2><p class="subtle">Sign in to the BCC payroll workspace.</p>
    ${error ? `<div class="notice" role="alert">${esc(error)}</div>` : ''}
    <form id="login-form"><div class="field"><label for="email">Work email</label><input id="email" name="email" type="email" autocomplete="username" placeholder="you@bcc.edu.ph" required></div>
    <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" placeholder="Enter your password" required></div>
    <div class="field"><label for="role">Sign in as</label><select id="role" name="role"><option value="employee">Teacher / employee</option><option value="manager">Payroll manager</option><option value="admin">Administrator</option></select></div>
    <button class="btn btn-primary" type="submit">Open my workspace <span aria-hidden="true">↗</span></button></form>
    <div class="auth-switch">New BCC employee? <button id="auth-switch" type="button">Create an employee account</button></div>
    <div class="demo-box"><strong>Demo accounts — sample data only</strong><code>Admin: admin@bcc.demo / Admin123!</code><br><code>Manager: manager@bcc.demo / Manager123!</code><br><code>Employee: teacher@bcc.demo / Teacher123!</code></div>`;
}
function signupMarkup(error) {
  return `<div class="eyebrow">BCC / EMPLOYEE ACCESS</div><h2>Join the faculty.</h2><p class="subtle">Create a teacher or employee account. Administrator and manager accounts are provisioned by a developer.</p>
    ${error ? `<div class="notice" role="alert">${esc(error)}</div>` : ''}
    <form id="signup-form"><div class="field"><label for="name">Full name</label><input id="name" name="name" autocomplete="name" placeholder="Your name" required maxlength="80"></div>
    <div class="field"><label for="signup-email">School email</label><input id="signup-email" name="email" type="email" autocomplete="email" placeholder="you@bcc.edu.ph" required maxlength="120"></div>
    <div class="field"><label for="department">Department</label><input id="department" name="department" placeholder="e.g. Mathematics" required maxlength="80"></div>
    <div class="field"><label for="signup-password">Create password</label><input id="signup-password" name="password" type="password" autocomplete="new-password" minlength="8" placeholder="At least 8 characters" required></div>
    <button class="btn btn-primary" type="submit">Create employee account ↗</button></form>
    <div class="auth-switch">Already registered? <button id="auth-switch" type="button">Back to sign in</button></div>
    <div class="demo-box">Self-registration always creates an <strong style="display:inline">employee</strong> role. This demo stores information in this browser; don't use real personal or payroll data.</div>`;
}
function handleLogin(event) {
  event.preventDefault(); const data = new FormData(event.currentTarget);
  const email = String(data.get('email')).trim().toLowerCase(); const password = String(data.get('password')); const role = String(data.get('role'));
  const user = loadUsers().find(item => item.email.toLowerCase() === email && item.password === password && item.role === role);
  if (!user) { renderAuth('login', 'Those details do not match an account with the selected role.'); return; }
  localStorage.setItem(STORAGE.session, JSON.stringify({ userId: user.id })); activeView = 'overview'; renderWorkspace();
}
function handleSignup(event) {
  event.preventDefault(); const data = new FormData(event.currentTarget); const users = loadUsers();
  const email = String(data.get('email')).trim().toLowerCase();
  if (users.some(user => user.email.toLowerCase() === email)) { renderAuth('signup', 'An account already uses that email. Try signing in instead.'); return; }
  const user = { id: `u-${Date.now()}`, name: String(data.get('name')).trim(), email, password: String(data.get('password')), role: 'employee', department: String(data.get('department')).trim() };
  if (user.password.length < 8) { renderAuth('signup', 'Choose a password with at least 8 characters.'); return; }
  users.push(user); saveUsers(users); localStorage.setItem(STORAGE.session, JSON.stringify({ userId: user.id })); activeView = 'overview'; renderWorkspace(); notify('Employee account created. Welcome to BCC.');
}

function median(values) { const sorted = [...values].sort((a, b) => a - b); if (!sorted.length) return 0; const mid = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2; }
function detectAnomalies(rows) {
  const peerGross = rows.map(row => row.gross); const center = median(peerGross); const mad = median(peerGross.map(value => Math.abs(value - center)));
  return rows.map(row => {
    const reasons = []; let score = 0;
    if (row.hours > 100) { reasons.push(`${row.hours} hours recorded`); score += 45; }
    if (row.overtime > 20) { reasons.push(`${row.overtime} overtime hours`); score += 25; }
    const robustZ = mad === 0 ? (row.gross === center ? 0 : 4) : Math.abs(.6745 * (row.gross - center) / mad);
    if (robustZ > 3.5) { reasons.push('Gross pay differs from the peer group'); score += 35; }
    if (row.status === 'Review') score += 10;
    return { ...row, score: Math.min(score, 100), reasons };
  }).filter(row => row.score >= 35).sort((a, b) => b.score - a.score);
}
function renderWorkspace() {
  const user = getSession(); if (!user) { localStorage.removeItem(STORAGE.session); renderAuth(); return; }
  const nav = user.role === 'employee' ? [['overview', '◫', 'My overview'], ['payroll', '▤', 'My pay history']] : [['overview', '◫', 'Overview'], ['payroll', '▤', 'Payroll records'], ['anomalies', '⌁', 'Anomaly review']];
  app.innerHTML = `<div class="workspace"><aside class="sidebar"><div class="brand"><span class="brand-mark">BCC</span><span>Payroll</span></div><div class="nav-label">Workspace</div><nav>${nav.map(([key, icon, label]) => `<button class="nav-link ${activeView === key ? 'active' : ''}" data-view="${key}"><span class="nav-icon">${icon}</span>${label}</button>`).join('')}</nav><div class="sidebar-bottom"><div class="user-chip"><div class="avatar">${esc(initials(user.name))}</div><div><div class="user-name">${esc(user.name)}</div><div class="user-role">${esc(roleName(user.role))}</div></div></div><button class="logout" id="logout">↗ &nbsp; Sign out</button></div></aside>
  <section class="main-area"><div class="topline"><div><div class="eyebrow">${esc(user.department || 'SCHOOL OFFICE')} / PAYROLL</div></div><div class="top-date">PAY PERIOD · NOV 1–15, 2026</div></div>${viewMarkup(user)}</section></div>`;
  app.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => { activeView = button.dataset.view; renderWorkspace(); }));
  document.getElementById('logout').addEventListener('click', () => { localStorage.removeItem(STORAGE.session); renderAuth(); });
  const search = document.getElementById('payroll-search'); if (search) search.addEventListener('input', () => fillPayrollTable(user, search.value));
  const exportButton = document.getElementById('export-csv'); if (exportButton) exportButton.addEventListener('click', () => exportPayroll(user));
}
function viewMarkup(user) { if (activeView === 'payroll') return payrollView(user); if (activeView === 'anomalies' && user.role !== 'employee') return anomalyView(user); return overviewView(user); }
function overviewView(user) {
  const rows = payrollRows(user), flagged = detectAnomalies(rows); const allUsers = loadUsers().filter(person => person.role === 'employee');
  const latest = rows.slice(0, 4); const periodTotal = user.role === 'employee' ? (rows[0]?.gross || 0) : rows.filter(row => row.period.startsWith('Nov')).reduce((sum, row) => sum + row.gross, 0);
  return `<div class="greeting"><h1 class="page-title">Good morning, ${esc(user.name.split(' ')[0])}.</h1><p class="page-subtitle">${user.role === 'employee' ? 'Here is your pay snapshot and recent history.' : 'Here is the payroll overview for Binangonan Catholic College.'}</p></div>
  <div class="kpi-grid"><article class="kpi"><div class="kpi-label">${user.role === 'employee' ? 'Latest gross pay' : 'Gross payroll'}</div><div class="kpi-value">${money(periodTotal)}</div><div class="kpi-foot">Nov 1–15, 2026</div></article><article class="kpi"><div class="kpi-label">${user.role === 'employee' ? 'Pay statements' : 'Employees'}</div><div class="kpi-value">${user.role === 'employee' ? rows.length : allUsers.length}</div><div class="kpi-foot">${user.role === 'employee' ? 'Available in your history' : 'Active employee accounts'}</div></article><article class="kpi"><div class="kpi-label">${user.role === 'employee' ? 'Hours logged' : 'Flagged for review'}</div><div class="kpi-value">${user.role === 'employee' ? (rows[0]?.hours || 0) : flagged.length}</div><div class="kpi-foot ${flagged.length ? 'warn' : ''}">${user.role === 'employee' ? 'Current pay period' : 'Review suggested, not a finding'}</div></article><article class="kpi"><div class="kpi-label">Payroll status</div><div class="kpi-value" style="font-size:20px">${user.role === 'employee' ? (rows[0]?.status || '—') : 'On track'}</div><div class="kpi-foot">Last updated today</div></article></div>
  <div class="content-grid"><section class="panel"><div class="panel-head"><div><h2 class="panel-title">${user.role === 'employee' ? 'Your recent pay' : 'Recent payroll entries'}</h2><div class="panel-caption">Latest activity across the current pay cycle</div></div><span class="pill">NOVEMBER CYCLE</span></div>${payrollTable(latest, user.role === 'employee')}</section><section class="panel"><div class="panel-head"><div><h2 class="panel-title">${user.role === 'employee' ? 'A note on your pay' : 'Signals to review'}</h2><div class="panel-caption">${user.role === 'employee' ? 'What the system checks' : 'Automated review suggestions'}</div></div>${user.role !== 'employee' ? `<span class="pill ${flagged.length ? 'alert' : ''}">${flagged.length} FLAGGED</span>` : ''}</div>${user.role === 'employee' ? `<div class="insight">Payroll checks look for unusual hours, overtime, and pay changes. A signal prompts the payroll office to verify the record — it is never a conclusion about you.</div>` : flagged.length ? flagged.slice(0, 3).map(row => `<div class="flag-item"><div class="flag-icon">!</div><div class="flag-text"><strong>${esc(row.person.name)}</strong><span>${esc(row.reasons.join(' · '))}</span></div></div>`).join('') : '<div class="empty">No review signals right now.</div>'}<div class="insight">${user.role === 'employee' ? 'Questions about a statement? Contact the BCC payroll office.' : 'Signals are heuristic suggestions. Verify source records before taking action.'}</div></section></div>`;
}
function payrollView(user) {
  const rows = payrollRows(user);
  return `<div class="greeting"><h1 class="page-title">${user.role === 'employee' ? 'My pay history' : 'Payroll records'}</h1><p class="page-subtitle">${user.role === 'employee' ? 'Your statements, kept in one place.' : 'Review BCC payroll entries and export the current sample data.'}</p></div>${user.role !== 'employee' ? '<div class="notice">Demo data only. Review employee records through BCC’s normal payroll approval process.</div>' : ''}<section class="panel page-panel"><div class="panel-head"><div><h2 class="panel-title">Pay statements</h2><div class="panel-caption">Most recent first · USD</div></div>${user.role !== 'employee' ? '<button class="btn-outline" id="export-csv">Export CSV ↓</button>' : ''}</div><div class="toolbar"><input id="payroll-search" class="search-input" type="search" placeholder="Search by employee or period" aria-label="Search payroll"></div><div id="payroll-table">${payrollTable(rows, user.role === 'employee')}</div></section>`;
}
function anomalyView(user) {
  const flags = detectAnomalies(payrollRows(user));
  return `<div class="greeting"><h1 class="page-title">Anomaly review</h1><p class="page-subtitle">A second set of eyes for entries that look different from the norm.</p></div><div class="notice"><strong>How this works:</strong> This transparent, unsupervised heuristic compares gross pay to the sample peer group using median absolute deviation (MAD), then applies explicit hour and overtime rules. It is not a trained or validated machine-learning model. Signals require human review and are not proof of error or misconduct.</div><section class="panel page-panel"><div class="panel-head"><div><h2 class="panel-title">Suggested checks</h2><div class="panel-caption">${flags.length} signal${flags.length === 1 ? '' : 's'} · sample payroll only</div></div><span class="pill alert">REVIEW REQUIRED</span></div>${flags.length ? `<div class="table-wrap"><table><thead><tr><th>Employee</th><th>Pay period</th><th>Gross pay</th><th>Signal</th><th>Score</th></tr></thead><tbody>${flags.map(row => `<tr><td><div class="person"><div class="avatar">${esc(initials(row.person.name))}</div><div>${esc(row.person.name)}<small>${esc(row.person.department)}</small></div></div></td><td>${esc(row.period)}</td><td class="amount">${money(row.gross)}</td><td><span class="status-dot flag"></span>${esc(row.reasons.join(' · '))}</td><td class="amount">${row.score}/100</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No signals in the current sample.</div>'}</section>`;
}
function payrollTable(rows, employeeOnly) {
  if (!rows.length) return '<div class="empty">No payroll entries to show yet.</div>';
  return `<div class="table-wrap"><table><thead><tr>${employeeOnly ? '<th>Pay period</th>' : '<th>Employee</th><th>Pay period</th>'}<th>Gross</th><th>Net</th><th>Hours</th><th>Status</th></tr></thead><tbody>${rows.map(row => `<tr>${employeeOnly ? `<td>${esc(row.period)}</td>` : `<td><div class="person"><div class="avatar">${esc(initials(row.person.name))}</div><div>${esc(row.person.name)}<small>${esc(row.person.department)}</small></div></div><td>${esc(row.period)}</td>`}<td class="amount">${money(row.gross)}</td><td class="amount">${money(row.net)}</td><td>${row.hours}</td><td><span class="status-dot ${row.status === 'Review' ? 'flag' : ''}"></span>${esc(row.status)}</td></tr>`).join('')}</tbody></table></div>`;
}
function fillPayrollTable(user, query) { const target = document.getElementById('payroll-table'); if (!target) return; const q = query.trim().toLowerCase(); const rows = payrollRows(user).filter(row => !q || `${row.person.name} ${row.period} ${row.status}`.toLowerCase().includes(q)); target.innerHTML = payrollTable(rows, user.role === 'employee'); }
function exportPayroll(user) {
  if (user.role === 'employee') return;
  const rows = payrollRows(user); const csv = [['Employee', 'Department', 'Period', 'Gross', 'Net', 'Hours', 'Overtime', 'Status'], ...rows.map(row => [row.person.name, row.person.department, row.period, row.gross, row.net, row.hours, row.overtime, row.status])].map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = 'bcc-payroll-demo.csv'; link.click(); URL.revokeObjectURL(link.href); notify('BCC demo payroll CSV downloaded.');
}

if (getSession()) renderWorkspace(); else renderAuth();
