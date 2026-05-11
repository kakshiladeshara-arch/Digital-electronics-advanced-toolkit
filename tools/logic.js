import {
  clearResult,
  renderSuccess,
  createStatCard,
  renderSteps,
} from './utils.js';

function gateOutput(gate, inputs) {
  switch (gate) {
    case 'AND': return inputs.every(Boolean) ? 1 : 0;
    case 'OR': return inputs.some(Boolean) ? 1 : 0;
    case 'NOT': return inputs[0] ? 0 : 1;
    case 'NAND': return inputs.every(Boolean) ? 0 : 1;
    case 'NOR': return inputs.some(Boolean) ? 0 : 1;
    case 'XOR': return inputs.filter(Boolean).length % 2 === 1 ? 1 : 0;
    case 'XNOR': return inputs.filter(Boolean).length % 2 === 0 ? 1 : 0;
    default: return 0;
  }
}

function buildInputs(container, count) {
  container.innerHTML = '';
  const labels = 'ABCD'.slice(0, count).split('');
  labels.forEach((label, index) => {
    const box = document.createElement('div');
    box.className = 'toggle-box';
    box.innerHTML = `
      <div>
        <strong>Input ${label}</strong>
        <div class="field-help">Toggle digital level</div>
      </div>
      <button class="toggle-btn" data-index="${index}">0</button>
    `;
    container.appendChild(box);
  });
}

export function initLogicSimulator() {
  const gateType = document.getElementById('logicGateType');
  const inputCount = document.getElementById('logicInputCount');
  const inputsWrap = document.getElementById('logicInputs');
  const result = document.getElementById('logicResult');
  const runBtn = document.getElementById('logicRunBtn');
  const sampleBtn = document.getElementById('logicSampleBtn');
  const resetBtn = document.getElementById('logicResetBtn');

  let currentInputs = [0, 0];

  function syncInputUI() {
    const count = gateType.value === 'NOT' ? 1 : Number(inputCount.value);
    inputCount.value = String(count);
    inputCount.disabled = gateType.value === 'NOT';
    currentInputs = Array.from({ length: count }, (_, index) => currentInputs[index] ?? 0);
    buildInputs(inputsWrap, count);
    [...inputsWrap.querySelectorAll('.toggle-btn')].forEach((button, index) => {
      const value = currentInputs[index];
      button.textContent = String(value);
      button.classList.toggle('active-1', value === 1);
      button.addEventListener('click', () => {
        currentInputs[index] = currentInputs[index] ? 0 : 1;
        syncInputUI();
        run();
      });
    });
  }

  function run() {
    const output = gateOutput(gateType.value, currentInputs);
    const expressionPreview = `${gateType.value}(${currentInputs.join(', ')})`;
    const steps = [
      {
        title: 'Read input levels',
        body: `The simulator reads the current logic levels as ${currentInputs.join(', ')}.`,
      },
      {
        title: 'Apply gate rule',
        body: `${gateType.value} is evaluated according to its standard truth behavior.`,
      },
      {
        title: 'Emit final output',
        body: `The resulting output is ${output}.`,
      },
    ];

    renderSuccess(result, `
      <div class="result-head">
        <h4 class="result-title">Simulation Output</h4>
        <span class="value-pill">${gateType.value} Gate</span>
      </div>
      <div class="result-grid">
        ${createStatCard('Input Vector', currentInputs.join(' , '))}
        ${createStatCard('Output', String(output))}
      </div>
      <h4 class="section-subtitle">Gate Preview</h4>
      <div class="truth-mini-card">
        <div class="eqn">${expressionPreview} = ${output}</div>
      </div>
      ${renderSteps(steps)}
    `);
  }

  gateType.addEventListener('change', () => {
    syncInputUI();
    run();
  });
  inputCount.addEventListener('change', () => {
    syncInputUI();
    run();
  });
  runBtn.addEventListener('click', run);
  sampleBtn.addEventListener('click', () => {
    gateType.value = 'XOR';
    inputCount.value = '3';
    currentInputs = [1, 0, 1];
    syncInputUI();
    run();
  });
  resetBtn.addEventListener('click', () => {
    gateType.value = 'AND';
    inputCount.value = '2';
    currentInputs = [0, 0];
    syncInputUI();
    clearResult(result, 'Toggle input levels and evaluate a logic gate instantly.');
  });

  syncInputUI();
  clearResult(result, 'Toggle input levels and evaluate a logic gate instantly.');
}
