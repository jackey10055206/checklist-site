async function loadProgress() {
  const res = await fetch('./data/progress.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load progress.json');
  return res.json();
}

function badge(status) {
  const label = status === 'done' ? '已完成' : status === 'inprogress' ? '進行中' : status === 'blocked' ? '卡住' : '待辦';
  return `<span class="status ${status === 'todo' ? '' : status}">${label}</span>`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderTable(rows) {
  const tbody = document.querySelector('#statusTable tbody');
  if (!tbody) return;
  tbody.innerHTML = rows.map((r) => {
    const status = r.status || 'todo';
    return `
      <tr data-status="${escapeHtml(status)}">
        <td>${escapeHtml(r.area)}</td>
        <td>${escapeHtml(r.task)}</td>
        <td>${escapeHtml(r.owner || '—')}</td>
        <td>${badge(status)}</td>
        <td>${escapeHtml(r.notes || '')}</td>
      </tr>
    `;
  }).join('');
}

function renderAgents(agents) {
  const el = document.getElementById('agentsDynamic');
  if (!el) return;
  el.innerHTML = agents.map((a) => {
    const dels = (a.deliverables || []).map((d) => `<li>${escapeHtml(d)}</li>`).join('');
    return `
      <article class="agent">
        <div class="agent-head">
          <div class="agent-key">${escapeHtml(a.key)}</div>
          <div>
            <div class="agent-name">${escapeHtml(a.name)}</div>
            <div class="small">狀態：<strong>${escapeHtml(a.status || 'planned')}</strong></div>
          </div>
        </div>
        <p class="agent-goal">${escapeHtml(a.goal || '')}</p>
        ${dels ? `<ul class="ul">${dels}</ul>` : ''}
      </article>
    `;
  }).join('');
}

function renderActivity(items) {
  const el = document.getElementById('activityLog');
  if (!el) return;
  if (!items || items.length === 0) {
    el.innerHTML = '<p class="small">目前還沒有活動紀錄。</p>';
    return;
  }
  el.innerHTML = `<ul class="ul">${items.slice().reverse().map((it) => {
    const t = new Date(it.time).toLocaleString();
    return `<li><span class="small">${escapeHtml(t)}</span> — ${escapeHtml(it.text)}</li>`;
  }).join('')}</ul>`;
}

function setupFilters() {
  const statusSel = document.getElementById('statusFilter');
  const q = document.getElementById('q');
  const table = document.getElementById('statusTable');

  const apply = () => {
    const status = statusSel?.value || 'all';
    const query = (q?.value || '').toLowerCase().trim();
    const rows = table?.querySelectorAll('tbody tr') || [];

    rows.forEach((tr) => {
      const s = tr.getAttribute('data-status') || 'todo';
      const text = (tr.textContent || '').toLowerCase();
      const okStatus = status === 'all' ? true : s === status;
      const okQuery = !query ? true : text.includes(query);
      tr.style.display = okStatus && okQuery ? '' : 'none';
    });
  };

  statusSel?.addEventListener('change', apply);
  q?.addEventListener('input', apply);

  apply();
}

(async function main() {
  try {
    const data = await loadProgress();
    const last = document.getElementById('lastUpdated');
    if (last) {
      const d = data.lastUpdated ? new Date(data.lastUpdated) : new Date();
      last.textContent = d.toLocaleString();
    }

    renderTable(data.statusRows || []);
    renderAgents(data.agents || []);
    renderActivity(data.activity || []);
    setupFilters();
  } catch (e) {
    console.error(e);
    const last = document.getElementById('lastUpdated');
    if (last) last.textContent = 'Failed to load progress data';
  }
})();
