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
  });
  updateTotalRow(scores);

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
  form.pin.value = '';

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

    const newPin = form.pin.value.trim();
    if (newPin) body.pin = newPin;
    if (form.clearPin?.checked) body.clearPin = true;

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

async function loadLeaderboard(listEl) {
  const entries = await api(appPath('/api/entries'));

  if (entries.length === 0) {
    listEl.innerHTML = '<p class="empty-state">No scores yet. Be the first!</p>';
    return;
  }

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

  const ul = document.createElement('ul');
  ul.className = 'leaderboard-list';

  sorted.forEach((entry, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = appPath(`/entry?id=${entry.id}`);

    const rank = document.createElement('span');
    rank.className = 'leaderboard-rank';
    rank.textContent = `${i + 1}.`;

    const name = document.createElement('span');
    name.className = 'leaderboard-name';
    name.textContent = entry.name;

    const score = document.createElement('span');
    score.className = 'leaderboard-score';
    score.textContent = formatVsPar(entry.scores);

    a.append(rank, name, score);
    li.appendChild(a);
    ul.appendChild(li);
  });

  listEl.innerHTML = '';
  listEl.appendChild(ul);
}

async function loadEntry(id) {
  return api(appPath(`/api/entries/${encodeURIComponent(id)}`));
}
