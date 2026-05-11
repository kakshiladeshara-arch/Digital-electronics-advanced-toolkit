import {
  clearResult,
  renderError,
  renderSuccess,
  renderSteps,
  createStatCard,
  parseBaseValue,
  formatBigIntInBase,
} from './utils.js';

export function initConverter() {
  const input = document.getElementById('converterInput');
  const from = document.getElementById('converterFrom');
  const result = document.getElementById('converterResult');
  const convertBtn = document.getElementById('convertBtn');
  const sampleBtn = document.getElementById('converterSampleBtn');
  const resetBtn = document.getElementById('converterResetBtn');

  clearResult(result, 'Enter a number and convert it across all common number systems.');

  function run() {
    try {
      const base = Number(from.value);
      const parsed = parseBaseValue(input.value, base);
      const binary = formatBigIntInBase(parsed, 2);
      const decimal = formatBigIntInBase(parsed, 10);
      const octal = formatBigIntInBase(parsed, 8);
      const hex = formatBigIntInBase(parsed, 16);
      const steps = [
        {
          title: 'Validate source format',
          body: `The input is checked against the selected base ${base} before conversion begins.`,
        },
        {
          title: 'Convert to decimal core value',
          body: `The entered value is interpreted as a base-${base} number and internally represented as decimal ${decimal}.`,
        },
        {
          title: 'Re-encode into target systems',
          body: `The same numeric quantity is formatted into binary (${binary}), octal (${octal}), and hexadecimal (${hex}).`,
        },
      ];

      renderSuccess(result, `
        <div class="result-head">
          <h4 class="result-title">Conversion Result</h4>
          <span class="value-pill">Source Base ${base}</span>
        </div>
        <div class="result-grid">
          ${createStatCard('Binary', binary)}
          ${createStatCard('Decimal', decimal)}
          ${createStatCard('Octal', octal)}
          ${createStatCard('Hexadecimal', hex)}
        </div>
        ${renderSteps(steps)}
      `);
    } catch (error) {
      renderError(result, error.message);
    }
  }

  convertBtn.addEventListener('click', run);
  sampleBtn.addEventListener('click', () => {
    input.value = '2AF';
    from.value = '16';
    run();
  });
  resetBtn.addEventListener('click', () => {
    input.value = '';
    from.value = '10';
    clearResult(result, 'Enter a number and convert it across all common number systems.');
  });
}
