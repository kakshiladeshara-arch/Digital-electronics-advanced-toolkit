import {
  clearResult,
  renderError,
  renderSuccess,
  renderSteps,
  createStatCard,
  buildTruthTable,
  normalizeExpression,
} from './utils.js';

function tableHTML(vars, rows) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            ${vars.map(variable => `<th>${variable}</th>`).join('')}
            <th>F</th>
            <th>Minterm</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${vars.map(variable => `<td class="mono">${row[variable]}</td>`).join('')}
              <td class="${row.output ? 'highlight-true' : 'highlight-false'}">${row.output}</td>
              <td class="mono">m${row.minterm}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function initTruthTable() {
  const expressionInput = document.getElementById('truthExpression');
  const result = document.getElementById('truthResult');
  const generateBtn = document.getElementById('truthGenerateBtn');
  const sampleBtn = document.getElementById('truthSampleBtn');
  const resetBtn = document.getElementById('truthResetBtn');

  clearResult(result, 'Enter a Boolean expression to generate the full truth table.');

  function run() {
    try {
      const normalized = normalizeExpression(expressionInput.value);
      const { vars, rows } = buildTruthTable(expressionInput.value);
      const asserted = rows.filter(row => row.output === 1).map(row => row.minterm);
      const steps = [
        {
          title: 'Normalize expression syntax',
          body: `The input is converted into a parser-friendly form: ${normalized}.`,
        },
        {
          title: 'Enumerate all combinations',
          body: `All ${2 ** vars.length} input combinations for variables ${vars.join(', ')} are evaluated.`,
        },
        {
          title: 'Capture high output rows',
          body: asserted.length
            ? `Output 1 appears at minterms ${asserted.join(', ')}.`
            : 'No row produces output 1 for the entered expression.',
        },
      ];

      renderSuccess(result, `
        <div class="result-head">
          <h4 class="result-title">Truth Table</h4>
          <span class="value-pill">${vars.length} Variables</span>
        </div>
        <div class="result-grid">
          ${createStatCard('Normalized Expression', normalized)}
          ${createStatCard('Rows with F = 1', asserted.length ? asserted.join(', ') : 'None')}
        </div>
        <h4 class="section-subtitle">Evaluated Table</h4>
        ${tableHTML(vars, rows)}
        ${renderSteps(steps)}
      `);
    } catch (error) {
      renderError(result, error.message);
    }
  }

  generateBtn.addEventListener('click', run);
  sampleBtn.addEventListener('click', () => {
    expressionInput.value = "A'B + AC + B'C";
    run();
  });
  resetBtn.addEventListener('click', () => {
    expressionInput.value = '';
    clearResult(result, 'Enter a Boolean expression to generate the full truth table.');
  });
}
