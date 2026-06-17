const APP_BASE = (() => {
  const el = document.querySelector('script[src*="js/app.js"]');
  if (!el) return '';
  return new URL(el.src, location.origin).pathname.replace(/\/js\/app\.js$/, '');
})();

function appPath(path) {
  return `${APP_BASE}${path}`;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function showMessage(el, text, type) {
  el.textContent = text;
  el.className = `message ${type}`;
  el.hidden = false;
}

function hideMessage(el) {
  el.hidden = true;
}

function initScoreForm({ form, tbody, messageEl, onSaved }) {
  const scores = Array(HOLES.length).fill(null);
  const inputs = buildScoreTable(tbody, scores, () => {
    updateTotalRow(getScoresFromInputs(inputs));
    persistDraft(form, inputs);
  });
  updateTotalRow(scores);
  loadDraftIntoForm(form, inputs);

  form.name.addEventListener('input', () => persistDraft(form, inputs));
  form.pin.addEventListener('input', () => persistDraft(form, inputs));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage(messageEl);

    const name = form.name.value.trim();
    if (!name) {
      showMessage(messageEl, 'Enter your name.', 'error');
      return;
    }

    const entryScores = getScoresFromInputs(inputs);
    const pin = form.pin.value.trim() || null;

    try {
      const entry = await api(appPath('/api/entries'), {
        method: 'POST',
        body: JSON.stringify({ name, scores: entryScores, pin }),
      });
      showMessage(messageEl, 'Saved!', 'success');
      clearDraft();
      onSaved?.(entry);
    } catch (err) {
      showMessage(messageEl, err.message, 'error');
    }
  });

  return { inputs };
}

function initEditForm({ form, tbody, messageEl, entry }) {
  const inputs = buildScoreTable(tbody, entry.scores, () => {
    updateTotalRow(getScoresFromInputs(inputs));
  });
  updateTotalRow(entry.scores);

  form.name.value = entry.name;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage(messageEl);

    const name = form.name.value.trim();
    if (!name) {
      showMessage(messageEl, 'Enter your name.', 'error');
      return;
    }

    const body = {
      name,
      scores: getScoresFromInputs(inputs),
    };

    if (entry.pin) {
      body.editPin = form.editPin?.value.trim();
    }

    try {
      await api(appPath(`/api/entries/${encodeURIComponent(entry.id)}`), {
        method: 'POST',
        body: JSON.stringify(body),
      });
      showMessage(messageEl, 'Updated!', 'success');
    } catch (err) {
      showMessage(messageEl, err.message, 'error');
    }
  });

  return { inputs };
}

async function loadLeaderboard(listEl, options = {}) {
  const { highlightId, limit } = options;
  const entries = await api(appPath('/api/entries'));

  const sorted = entries.slice().sort((a, b) => {
    const aPlayed = holesPlayed(a.scores);
    const bPlayed = holesPlayed(b.scores);
    const aTotal = totalBalls(a.scores);
    const bTotal = totalBalls(b.scores);
    if (aPlayed === HOLES.length && bPlayed !== HOLES.length) return -1;
    if (bPlayed === HOLES.length && aPlayed !== HOLES.length) return 1;
    if (aTotal !== bTotal) return aTotal - bTotal;
    return a.name.localeCompare(b.name);
  });

  const shown = limit ? sorted.slice(0, limit) : sorted;

  const table = document.createElement('table');
  table.className = 'leaderboard-table';

  table.innerHTML = `
    <thead>
      <tr>
        <th>Name</th>
        <th>Balls</th>
        <th>Delta</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');
  let highlightedEl = null;

  if (shown.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 3;
    td.className = 'leaderboard-empty';
    td.textContent = 'No scores yet.';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    shown.forEach((entry) => {
      const tr = document.createElement('tr');
      if (highlightId && entry.id === highlightId) {
        tr.className = 'leaderboard-highlight';
      }

      const tdName = document.createElement('td');
      const link = document.createElement('a');
      link.href = appPath(`/entry?id=${entry.id}`);
      link.textContent = entry.name;
      tdName.appendChild(link);

      const tdBalls = document.createElement('td');
      tdBalls.className = 'leaderboard-balls';
      tdBalls.textContent = formatVsPar(entry.scores);

      const tdDelta = document.createElement('td');
      tdDelta.className = 'leaderboard-delta';
      tdDelta.textContent = formatDelta(entry.scores);

      tr.append(tdName, tdBalls, tdDelta);
      tbody.appendChild(tr);

      if (highlightId && entry.id === highlightId) {
        highlightedEl = tr;
      }
    });
  }

  listEl.innerHTML = '';
  listEl.appendChild(table);

  if (highlightedEl) {
    highlightedEl.scrollIntoView({ block: 'nearest' });
  }
}

async function loadEntry(id) {
  return api(appPath(`/api/entries/${encodeURIComponent(id)}`));
}
