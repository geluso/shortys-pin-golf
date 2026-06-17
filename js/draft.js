const DRAFT_COOKIE = 'shortys_pin_golf_draft';
const MAX_NAME_LENGTH = 64;
const MAX_PIN_LENGTH = 32;

function getDraft() {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${DRAFT_COOKIE}=([^;]*)`)
  );
  if (!match) return null;
  try {
    return sanitizeDraft(JSON.parse(decodeURIComponent(match[1])));
  } catch {
    return null;
  }
}

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

function saveDraft(draft) {
  const safe = sanitizeDraft(draft);
  if (!safe) return;
  const value = encodeURIComponent(JSON.stringify(safe));
  document.cookie = `${DRAFT_COOKIE}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

function clearDraft() {
  document.cookie = `${DRAFT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

function loadDraftIntoForm(form, inputs) {
  const draft = getDraft();
  if (!draft) return;
  if (draft.name && looksMaliciousText(draft.name)) return;

  if (draft.name) form.name.value = draft.name;
  if (draft.pin) form.pin.value = draft.pin;

  draft.scores?.forEach((score, i) => {
    if (inputs[i] && score != null) inputs[i].setValue(score);
  });

  updateTotalRow(getScoresFromInputs(inputs));
}

function persistDraft(form, inputs) {
  saveDraft({
    name: form.name.value,
    pin: form.pin.value,
    scores: getScoresFromInputs(inputs),
  });
}
