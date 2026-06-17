const DRAFT_COOKIE = 'shortys_pin_golf_draft';

function getDraft() {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${DRAFT_COOKIE}=([^;]*)`)
  );
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

function saveDraft(draft) {
  const value = encodeURIComponent(JSON.stringify(draft));
  document.cookie = `${DRAFT_COOKIE}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

function clearDraft() {
  document.cookie = `${DRAFT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

function loadDraftIntoForm(form, inputs) {
  const draft = getDraft();
  if (!draft) return;

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
