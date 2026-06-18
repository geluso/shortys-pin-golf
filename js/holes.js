const HOLES = [
  { num: 1, name: 'Bobby Orr Power play', target: '75,000', par: 3 },
  { num: 2, name: 'Godzilla', target: '50mil', par: 3 },
  { num: 3, name: 'Star Wars FOTE', target: '100 mil', par: 3 },
  { num: 4, name: 'Medieval Madness', target: '5mil', par: 3 },
  { num: 5, name: 'Centaur', target: '500k', par: 5 },
  { num: 6, name: 'Cactus canyon', target: '10mil', par: 3 },
  { num: 7, name: 'King Kong', target: '80mil', par: 3 },
  { num: 8, name: 'D&D', target: '120mil', par: 3 },
  { num: 9, name: 'Target alpha', target: '10k', par: 2 },
];

const TOTAL_PAR = HOLES.reduce((sum, h) => sum + h.par, 0);

function totalBalls(scores) {
  return scores.reduce((sum, s) => sum + (s ?? 0), 0);
}

function holesPlayed(scores) {
  return scores.filter((s) => s != null).length;
}

function sortLeaderboardEntries(entries) {
  return entries.slice().sort((a, b) => {
    const aPlayed = holesPlayed(a.scores);
    const bPlayed = holesPlayed(b.scores);
    if (aPlayed !== bPlayed) return bPlayed - aPlayed;
    const aTotal = totalBalls(a.scores);
    const bTotal = totalBalls(b.scores);
    if (aTotal !== bTotal) return aTotal - bTotal;
    return a.name.localeCompare(b.name);
  });
}

function formatVsPar(scores) {
  const total = totalBalls(scores);
  if (holesPlayed(scores) === 0) return '—';
  return `${total}`;
}

function formatDelta(scores) {
  if (holesPlayed(scores) < HOLES.length) return '—';
  const diff = totalBalls(scores) - TOTAL_PAR;
  if (diff === 0) return '0';
  return diff > 0 ? `+${diff}` : `${diff}`;
}
