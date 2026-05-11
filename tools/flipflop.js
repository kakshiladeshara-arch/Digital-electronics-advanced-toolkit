import {
  clearResult,
  renderSuccess,
  createStatCard,
  renderSteps,
} from './utils.js';

const CONFIG = {
  SR: ['S', 'R'],
  JK: ['J', 'K'],
  D: ['D'],
  T: ['T'],
};

function computeNextState(type, inputs, q) {
  const [a = 0, b = 0] = inputs;
  switch (type) {
    case 'SR':
      if (a === 1 && b === 1) return { next: 'X', note: 'Invalid state for SR flip-flop.' };
      if (a === 1) return { next: 1, note: 'Set condition.' };
      if (b === 1) return { next: 0, note: 'Reset condition.' };
      return { next: q, note: 'Hold condition.' };
    case 'JK':
      if (a === 0 && b === 0) return { next: q, note: 'Hold condition.' };
      if (a === 0 && b === 1) return { next: 0, note: 'Reset condition.' };
      if (a === 1 && b === 0) return { next: 1, note: 'Set condition.' };
      return { next: q ? 0 : 1, note: 'Toggle condition.' };
    case 'D':
      return { next: a, note: 'Next state follows D input.' };
    case 'T':
      return { next: a ? (q ? 0 : 1) : q, note: a ? 'Toggle condition.' : 'Hold condition.' };
    default:
      return { next: q, note: 'Hold condition.' };
  }
}

function truthTableHTML(type) {
  const rows = [];
  if (type === 'SR') rows.push(['0','0','Q','Hold'], ['0','1','0','Reset'], ['1','0','1','Set'], ['1','1','X','Invalid']);
  if (type === 'JK') rows.push(['0','0','Q','Hold'], ['0','1','0','Reset'], ['1','0','1','Set'], ['1','1','Q̅','Toggle']);
  if (type === 'D') rows.push(['0','Q','0','Follow D'], ['1','Q','1','Follow D']);
  if (type === 'T') rows.push(['0','Q','Q','Hold'], ['1','Q','Q̅','Toggle']);

  const headers = type === 'SR' || type === 'JK'
    ? [type[0], type[1], 'Q(t)', 'Q(t+1)']
    : [type, 'Q(t)', 'Q(t+1)', 'Mode'];

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>${headers.map(head => `<th>${head}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map(row => `<tr>${row.map(cell => `<td class="mono">${cell}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderInputToggles(container, labels, values, onToggle) {
  container.innerHTML = '';
  labels.forEach((label, index) => {
    const box = document.createElement('div');
    box.className = 'toggle-box';
    box.innerHTML = `
      <div>
        <strong>${label}</strong>
        <div class="field-help">Interactive input</div>
      </div>
      <button class="toggle-btn ${values[index] ? 'active-1' : ''}" data-index="${index}">${values[index]}</button>
    `;
    container.appendChild(box);
  });

  [...container.querySelectorAll('.toggle-btn')].forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      onToggle(index);
    });
  });
}

export function initFlipFlop() {
  const typeSelect = document.getElementById('flipflopType');
  const qSelect = document.getElementById('flipflopQ');
  const inputsWrap = document.getElementById('flipflopInputs');
  const result = document.getElementById('flipflopResult');
  const runBtn = document.getElementById('flipflopRunBtn');
  const sampleBtn = document.getElementById('flipflopSampleBtn');
  const resetBtn = document.getElementById('flipflopResetBtn');

  let values = [0, 0];

  function syncInputs() {
    const labels = CONFIG[typeSelect.value];
    values = Array.from({ length: labels.length }, (_, index) => values[index] ?? 0);
    renderInputToggles(inputsWrap, labels, values, index => {
      values[index] = values[index] ? 0 : 1;
      syncInputs();
      run();
    });
  }

  function run() {
    const q = Number(qSelect.value);
    const response = computeNextState(typeSelect.value, values, q);
    const steps = [
      {
        title: 'Read current state',
        body: `The present state is Q(t) = ${q}.`,
      },
      {
        title: 'Apply input condition',
        body: `${typeSelect.value} inputs are ${values.join(', ')}. ${response.note}`,
      },
      {
        title: 'Determine next state',
        body: `The resulting next state is Q(t+1) = ${response.next}.`,
      },
    ];

    renderSuccess(result, `
      <div class="result-head">
        <h4 class="result-title">Flip-Flop Evaluation</h4>
        <span class="value-pill">${typeSelect.value} Type</span>
      </div>
      <div class="result-grid">
        ${createStatCard('Current State Q(t)', String(q))}
        ${createStatCard('Next State Q(t+1)', String(response.next))}
      </div>
      <h4 class="section-subtitle">Behavior Summary</h4>
      <div class="flip-state"><div class="eqn">${response.note}</div></div>
      <h4 class="section-subtitle">Reference Truth Table</h4>
      ${truthTableHTML(typeSelect.value)}
      ${renderSteps(steps)}
    `);
  }

  typeSelect.addEventListener('change', () => {
    syncInputs();
    run();
  });
  qSelect.addEventListener('change', run);
  runBtn.addEventListener('click', run);
  sampleBtn.addEventListener('click', () => {
    typeSelect.value = 'JK';
    qSelect.value = '1';
    values = [1, 1];
    syncInputs();
    run();
  });
  resetBtn.addEventListener('click', () => {
    typeSelect.value = 'SR';
    qSelect.value = '0';
    values = [0, 0];
    syncInputs();
    clearResult(result, 'Choose a flip-flop type, toggle inputs, and inspect the next-state response.');
  });

  syncInputs();
  clearResult(result, 'Choose a flip-flop type, toggle inputs, and inspect the next-state response.');
}
