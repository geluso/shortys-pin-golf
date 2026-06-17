function sanitizeNameInput(name) {
  return String(name)
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 64);
}

function looksMaliciousText(text) {
  const raw = String(text);
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(raw)) return true;
  if (/<[^>]*>/i.test(raw)) return true;
  if (/javascript:/i.test(raw)) return true;
  if (/on\w+\s*=/i.test(raw)) return true;
  if (/data:\s*text\/html/i.test(raw)) return true;

  const trimmed = raw.trim().replace(/\s+/g, ' ');
  const sanitized = sanitizeNameInput(raw);
  return sanitized !== trimmed;
}

function rejectIfMalicious(text, messageEl) {
  if (!looksMaliciousText(text)) return false;
  showMessage(messageEl, 'Nice try. Fuck off.', 'error');
  return true;
}
