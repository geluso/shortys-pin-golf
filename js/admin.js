async function adminApi(path, options = {}) {
  const res = await fetch(path, {
    cache: 'no-store',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function sortEntries(entries) {
  return sortLeaderboardEntries(entries);
}

async function loadAdminLeaderboard(listEl) {
  const entries = sortEntries(await api(appPath('/api/entries.php')));

  const table = document.createElement('table');
  table.className = 'leaderboard-table admin-leaderboard-table';

  table.innerHTML = `
    <thead>
      <tr>
        <th>Name</th>
        <th>Holes Played</th>
        <th>Balls</th>
        <th>Delta</th>
        <th></th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');

  if (entries.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'leaderboard-empty';
    td.textContent = 'No scores yet.';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    entries.forEach((entry) => {
      const tr = document.createElement('tr');

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

      const tdDelete = document.createElement('td');
      tdDelete.className = 'admin-delete-cell';
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'button-danger';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', async () => {
        if (!confirm(`Delete ${entry.name}?`)) return;
        try {
          await adminApi(appPath('/api/admin.php'), {
            method: 'POST',
            body: JSON.stringify({ action: 'delete', id: entry.id }),
          });
          await loadAdminLeaderboard(listEl);
        } catch (err) {
          showMessage(document.getElementById('admin-message'), err.message, 'error');
        }
      });
      tdDelete.appendChild(deleteBtn);

      tr.append(tdName, tdHoles, tdBalls, tdDelta, tdDelete);
      tbody.appendChild(tr);
    });
  }

  listEl.innerHTML = '';
  listEl.appendChild(table);
}

function showAdminPanel(show) {
  document.getElementById('login-panel').hidden = show;
  document.getElementById('admin-panel').hidden = !show;
}

async function initAdminPage() {
  const loginForm = document.getElementById('admin-login');
  const loginMessage = document.getElementById('login-message');
  const adminMessage = document.getElementById('admin-message');
  const leaderboardEl = document.getElementById('admin-leaderboard');

  async function refreshLeaderboard() {
    hideMessage(adminMessage);
    await loadAdminLeaderboard(leaderboardEl);
  }

  try {
    const status = await adminApi(appPath('/api/admin.php'));
    if (status.authenticated) {
      showAdminPanel(true);
      await refreshLeaderboard();
    }
  } catch {
    showAdminPanel(false);
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage(loginMessage);

    const password = loginForm.password.value;
    try {
      await adminApi(appPath('/api/admin.php'), {
        method: 'POST',
        body: JSON.stringify({ action: 'login', password }),
      });
      loginForm.reset();
      showAdminPanel(true);
      await refreshLeaderboard();
    } catch {
      showMessage(loginMessage, 'Wrong password.', 'error');
    }
  });

  document.getElementById('admin-logout').addEventListener('click', async () => {
    try {
      await adminApi(appPath('/api/admin.php'), {
        method: 'POST',
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch {
      // still show login on failure
    }
    showAdminPanel(false);
    hideMessage(loginMessage);
    hideMessage(adminMessage);
    leaderboardEl.innerHTML = '';
  });

  document.getElementById('admin-clear-scores').addEventListener('click', async () => {
    if (!confirm('Clear all scores? The current file will be backed up first.')) return;

    try {
      const result = await adminApi(appPath('/api/admin.php'), {
        method: 'POST',
        body: JSON.stringify({ action: 'clear' }),
      });
      showMessage(
        adminMessage,
        `Scores cleared. Backup saved as ${result.backup}.`,
        'success',
      );
      await refreshLeaderboard();
    } catch (err) {
      showMessage(adminMessage, err.message, 'error');
    }
  });
}
