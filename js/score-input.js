const MAX_BALLS = 5;

function nextScore(current) {
  if (current == null) return 1;
  if (current >= MAX_BALLS) return null;
  return current + 1;
}

function prevScore(current) {
  if (current == null) return MAX_BALLS;
  if (current <= 1) return null;
  return current - 1;
}

function createScoreInput(initialValue, onChange) {
  let value = initialValue ?? null;

  const wrap = document.createElement('div');
  wrap.className = 'score-cell-wrap';

  const minus = document.createElement('button');
  minus.type = 'button';
  minus.className = 'score-btn';
  minus.setAttribute('aria-label', 'Fewer balls');
  minus.textContent = '−';

  const display = document.createElement('div');
  display.className = 'score-display empty';
  display.setAttribute('role', 'button');
  display.setAttribute('tabindex', '0');
  display.setAttribute('aria-label', 'Tap to set balls used');

  const plus = document.createElement('button');
  plus.type = 'button';
  plus.className = 'score-btn';
  plus.setAttribute('aria-label', 'More balls');
  plus.textContent = '+';

  function render() {
    if (value == null) {
      display.textContent = '—';
      display.classList.add('empty');
    } else {
      display.textContent = String(value);
      display.classList.remove('empty');
    }
  }

  function setValue(next) {
    value = next;
    render();
    onChange(value);
  }

  minus.addEventListener('click', (e) => {
    e.preventDefault();
    setValue(prevScore(value));
  });

  plus.addEventListener('click', (e) => {
    e.preventDefault();
    setValue(nextScore(value));
  });

  display.addEventListener('click', () => setValue(nextScore(value)));

  display.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setValue(nextScore(value));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setValue(nextScore(value));
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setValue(prevScore(value));
    }
  });

  render();

  wrap.append(minus, display, plus);
  return {
    element: wrap,
    getValue: () => value,
    setValue,
  };
}

function buildScoreTable(tbody, scores, onUpdate) {
  const inputs = [];

  HOLES.forEach((hole, i) => {
    const tr = document.createElement('tr');

    const tdNum = document.createElement('td');
    tdNum.className = 'hole-num';
    tdNum.textContent = hole.num;

    const tdName = document.createElement('td');
    tdName.className = 'hole-name';
    tdName.textContent = hole.name;

    const tdPar = document.createElement('td');
    tdPar.className = 'par-cell';
    tdPar.innerHTML = `<span class="par-target">${hole.target}</span><span class="par-balls">Par ${hole.par}</span>`;

    const tdScore = document.createElement('td');
    const input = createScoreInput(scores?.[i] ?? null, () => {
      onUpdate?.();
    });
    inputs.push(input);
    tdScore.appendChild(input.element);

    tr.append(tdNum, tdName, tdPar, tdScore);
    tbody.appendChild(tr);
  });

  return inputs;
}

function updateTotalRow(scores) {
  const el = document.getElementById('player-total');
  if (el) el.textContent = formatVsPar(scores);
}

function getScoresFromInputs(inputs) {
  return inputs.map((input) => input.getValue());
}
