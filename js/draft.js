const MAX_NAME_LENGTH = 64;
const MAX_PIN_LENGTH = 32;
const SESSION_SAVE_DEBOUNCE_MS = 400;

const SESSION_API = (() => {
  const el = document.querySelector('script[src*="js/draft.js"]');
  if (!el) return '/api/session.php';
  const base = new URL(el.src, location.origin).pathname.replace(/\/js\/draft\.js$/, '');
  return `${base}/api/session.php`;
})();

let saveTimer = null;
let saveInFlight = null;

function sanitizeDraft(draft) {
  if (!draft || typeof draft !== 'object') return null;

  const name = typeof draft.name === 'string'
    ? draft.name.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, MAX_NAME_LENGTH)
    : '';
  const pin = typeof draft.pin === 'string'
    ? draft.pin.slice(0, MAX_PIN_LENGTH)
    : '';
  const scores = Array.isArray(draft.scores)
    ? draft.scores.slice(0, 9).map((score) => {
        if (score == null || score === '') return null;
        const n = Number(score);
        if (!Number.isInteger(n) || n < 1 || n > 99) return null;
        return n;
      })
    : Array(9).fill(null);

  while (scores.length < 9) scores.push(null);

  return { name, pin, scores };
}

async function sessionApi(method, body) {
  const res = await fetch(SESSION_API, {
    method,
    cache: 'no-store',
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Session request failed');
  return data;
}

async function getDraft() {
  const data = await sessionApi('GET');
  const draft = sanitizeDraft(data.draft);
  console.log('[session] loaded', draft ? { name: draft.name, scores: draft.scores } : null);
  return draft;
}

function applyDraftToForm(form, inputs, draft) {
  if (!draft) return;
  if (draft.name && looksMaliciousText(draft.name)) return;

  if (draft.name) form.elements.namedItem('name').value = draft.name;
  if (draft.pin) form.elements.namedItem('pin').value = draft.pin;

  draft.scores?.forEach((score, i) => {
    if (inputs[i] && score != null) inputs[i].setValue(score);
  });

  updateTotalRow(getScoresFromInputs(inputs));
}

async function loadDraftIntoForm(form, inputs) {
  try {
    const draft = await getDraft();
    applyDraftToForm(form, inputs, draft);
  } catch (err) {
    console.warn('[session] load failed', err);
  }
}

async function saveDraft(draft) {
  const safe = sanitizeDraft(draft);
  if (!safe) return;

  if (saveInFlight) {
    await saveInFlight.catch(() => {});
  }

  saveInFlight = sessionApi('POST', safe)
    .then((data) => {
      console.log('[session] saved', {
        sessionId: data.sessionId,
        name: safe.name,
        scores: safe.scores,
      });
    })
    .catch((err) => {
      console.warn('[session] save failed', err);
    })
    .finally(() => {
      saveInFlight = null;
    });

  return saveInFlight;
}

function clearDraft() {
  sessionApi('DELETE')
    .then(() => console.log('[session] cleared'))
    .catch((err) => console.warn('[session] clear failed', err));
}

function persistDraft(form, inputs) {
  const draft = {
    name: form.elements.namedItem('name')?.value ?? '',
    pin: form.elements.namedItem('pin')?.value ?? '',
    scores: getScoresFromInputs(inputs),
  };

  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveDraft(draft), SESSION_SAVE_DEBOUNCE_MS);
}
