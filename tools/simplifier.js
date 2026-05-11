import {
  clearResult,
  renderError,
  renderSuccess,
  renderSteps,
  createStatCard,
  buildTruthTable,
  normalizeExpression,
  simplifyMinterms,
} from './utils.js';

export function initSimplifier() {
  const expressionInput = document.getElementById('simplifierExpression');
  const result = document.getElementById('simplifierResult');
  const runBtn = document.getElementById('simplifierRunBtn');
  const sampleBtn = document.getElementById('simplifierSampleBtn');
  const resetBtn = document.getElementById('simplifierResetBtn');

  clearResult(result, 'Enter a Boolean expression to reduce it to a simplified SOP form.');

  function run() {
    try {
      const normalized = normalizeExpression(expressionInput.value);
      const { vars, rows } = buildTruthTable(expressionInput.value);
      const minterms = rows.filter(row => row.output === 1).map(row => row.minterm);
      const solution = simplifyMinterms(minterms, vars.length, vars);
      const steps = [
        {
          title: 'Normalize syntax',
          body: `The input is standardized as ${normalized}.`,
        },
        {
          title: 'Generate truth signature',
          body: minterms.length
            ? `The expression evaluates to 1 for minterms ${minterms.join(', ')}.`
            : 'The expression never reaches logic 1, so the simplified result is 0.',
        },
        ...solution.steps,
      ];

      renderSuccess(result, `
        <div class="result-head">
          <h4 class="result-title">Simplified Expression</h4>
          <span class="value-pill">${vars.join(', ')}</span>
        </div>
        <div class="result-grid">
          ${createStatCard('Normalized Input', normalized)}
          ${createStatCard('Reduced SOP', solution.expression)}
        </div>
        <h4 class="section-subtitle">Derived Canonical Set</h4>
        <div class="truth-mini-card">
          <div class="eqn">F(${vars.join(', ')}) = Σm(${minterms.join(', ') || '—'})</div>
        </div>
        ${renderSteps(steps)}
      `);
    } catch (error) {
      renderError(result, error.message);
    }
  }

  runBtn.addEventListener('click', run);
  sampleBtn.addEventListener('click', () => {
    expressionInput.value = "A'BC + ABC + AB'C + ABC'";
    run();
  });
  resetBtn.addEventListener('click', () => {
    expressionInput.value = '';
    clearResult(result, 'Enter a Boolean expression to reduce it to a simplified SOP form.');
  });
}
