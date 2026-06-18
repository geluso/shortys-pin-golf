const APP_BASE = (() => {
  const el = document.querySelector('script[src*="js/app.js"]');
  if (!el) return '';
  return new URL(el.src, location.origin).pathname.replace(/\/js\/app\.js$/, '');
})();

const ENTRY_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidEntryId(id) {
  return typeof id === 'string' && ENTRY_ID_RE.test(id);
}

function appPath(path) {
  return `${APP_BASE}${path}`;
}

function pagePath(file) {
  return `${APP_BASE}/${file}`;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    cache: 'no-store',
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

function showSavedMessage(el, entry) {
  el.innerHTML = '';
  el.className = 'message success';
  el.hidden = false;
  el.append('Saved! ');

  const link = document.createElement('a');
  link.href = pagePath(`leaderboard.html?highlight=${encodeURIComponent(entry.id)}`);
  link.textContent = 'See leaderboard';
  link.className = 'message-link';
  el.appendChild(link);
}

function hideMessage(el) {
  el.hidden = true;
}

async function initScoreForm({ form, tbody, messageEl, onSaved }) {
  const nameInput = form.elements.namedItem('name');
  const pinInput = form.elements.namedItem('pin');
  const scores = Array(HOLES.length).fill(null);
  const inputs = buildScoreTable(tbody, scores, () => {
    updateTotalRow(getScoresFromInputs(inputs));
    persistDraft(form, inputs);
  });
  updateTotalRow(scores);
  await loadDraftIntoForm(form, inputs);

  nameInput?.addEventListener('input', () => persistDraft(form, inputs));
  pinInput?.addEventListener('input', () => persistDraft(form, inputs));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage(messageEl);

    const name = nameInput?.value.trim().slice(0, 64) ?? '';
    if (!name) {
      showMessage(messageEl, 'Enter your name.', 'error');
      return;
    }
    if (rejectIfMalicious(name, messageEl)) return;

    const entryScores = getScoresFromInputs(inputs);
    const pin = pinInput?.value.trim().slice(0, 32) || null;

    try {
      const entry = await api(appPath('/api/entries.php'), {
        method: 'POST',
        body: JSON.stringify({ name, scores: entryScores, pin }),
      });
      showSavedMessage(messageEl, entry);
      clearDraft();
      onSaved?.(entry);
    } catch (err) {
      if (err.message === 'Rejected') {
        showMessage(messageEl, 'Nice try. Fuck off.', 'error');
      } else {
        showMessage(messageEl, err.message, 'error');
      }
    }
  });

  return { inputs };
}

function initEditForm({ form, tbody, messageEl, entry }) {
  const nameInput = form.elements.namedItem('name');
  const inputs = buildScoreTable(tbody, entry.scores, () => {
    updateTotalRow(getScoresFromInputs(inputs));
  });
  updateTotalRow(entry.scores);

  if (nameInput) nameInput.value = entry.name;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage(messageEl);

    const name = nameInput?.value.trim().slice(0, 64) ?? '';
    if (!name) {
      showMessage(messageEl, 'Enter your name.', 'error');
      return;
    }
    if (rejectIfMalicious(name, messageEl)) return;

    const body = {
      name,
      scores: getScoresFromInputs(inputs),
    };

    if (entry.hasPin) {
      body.editPin = form.editPin?.value.trim().slice(0, 32);
    }

    try {
      await api(appPath(`/api/entry.php?id=${encodeURIComponent(entry.id)}`), {
        method: 'POST',
        body: JSON.stringify(body),
      });
      showMessage(messageEl, 'Updated!', 'success');
    } catch (err) {
      if (err.message === 'Rejected') {
        showMessage(messageEl, 'Nice try. Fuck off.', 'error');
      } else {
        showMessage(messageEl, err.message, 'error');
      }
    }
  });

  return { inputs };
}

async function loadLeaderboard(listEl, options = {}) {
  const { highlightId, limit } = options;
  const entries = await api(appPath('/api/entries.php'));

  const sorted = sortLeaderboardEntries(entries);

  const shown = limit ? sorted.slice(0, limit) : sorted;

  const table = document.createElement('table');
  table.className = 'leaderboard-table';

  table.innerHTML = `
    <thead>
      <tr>
        <th>Name</th>
        <th>Holes Played</th>
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
    td.colSpan = 4;
    td.className = 'leaderboard-empty';
    td.textContent = 'No scores yet.';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    shown.forEach((entry) => {
      const tr = document.createElement('tr');
      if (highlightId && isValidEntryId(highlightId) && entry.id === highlightId) {
        tr.className = 'leaderboard-highlight';
      }

      const tdName = document.createElement('td');
      const link = document.createElement('a');
      link.href = pagePath(`entry.html?id=${encodeURIComponent(entry.id)}`);
      link.textContent = entry.name;
      tdName.appendChild(link);

      const tdHoles = document.createElement('td');
      tdHoles.className = 'leaderboard-holes';
      tdHoles.textContent = holesPlayed(entry.scores) || '—';

      const tdBalls = document.createElement('td');
      tdBalls.className = 'leaderboard-balls';
      tdBalls.textContent = formatVsPar(entry.scores);

      const tdDelta = document.createElement('td');
      tdDelta.className = 'leaderboard-delta';
      tdDelta.textContent = formatDelta(entry.scores);

      tr.append(tdName, tdHoles, tdBalls, tdDelta);
      tbody.appendChild(tr);

      if (highlightId && isValidEntryId(highlightId) && entry.id === highlightId) {
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
  if (!isValidEntryId(id)) {
    throw new Error('Invalid entry');
  }
  return api(appPath(`/api/entry.php?id=${encodeURIComponent(id)}`));
}
