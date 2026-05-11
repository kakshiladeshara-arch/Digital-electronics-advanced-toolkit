import {
  clearResult,
  renderError,
  renderSuccess,
  renderSteps,
  createStatCard,
} from './utils.js';

function validateBinary(value, fieldName) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${fieldName} is required.`);
  if (!/^[01]+$/.test(trimmed)) throw new Error(`${fieldName} must contain binary digits only.`);
  return trimmed;
}

function addBinary(a, b) {
  let carry = 0;
  let output = '';
  const lines = [];
  const max = Math.max(a.length, b.length);
  const x = a.padStart(max, '0');
  const y = b.padStart(max, '0');

  for (let i = max - 1; i >= 0; i -= 1) {
    const sum = Number(x[i]) + Number(y[i]) + carry;
    output = String(sum % 2) + output;
    lines.unshift(`bit ${i}: ${x[i]} + ${y[i]} + carry ${carry} = ${sum} → write ${sum % 2}, carry ${sum > 1 ? 1 : 0}`);
    carry = sum > 1 ? 1 : 0;
  }
  if (carry) output = '1' + output;
  return { result: output, lines };
}

function subtractBinary(a, b) {
  const decA = parseInt(a, 2);
  const decB = parseInt(b, 2);
  const diff = decA - decB;
  const sign = diff < 0 ? '-' : '';
  const result = `${sign}${Math.abs(diff).toString(2)}`;
  return {
    result,
    lines: [`Convert to decimal for magnitude check: ${decA} - ${decB} = ${diff}.`, `Convert the magnitude ${Math.abs(diff)} back to binary and apply sign if needed.`],
  };
}

function multiplyBinary(a, b) {
  const multiplier = [...b].reverse();
  const partials = [];
  multiplier.forEach((bit, index) => {
    partials.push(bit === '1' ? `${a}${'0'.repeat(index)}` : '0');
  });
  const result = (parseInt(a, 2) * parseInt(b, 2)).toString(2);
  return {
    result,
    lines: partials.map((partial, index) => `partial ${index + 1}: ${multiplier[index]} × ${a} shifted by ${index} = ${partial}`),
  };
}

export function initArithmetic() {
  const inputA = document.getElementById('arithA');
  const inputB = document.getElementById('arithB');
  const operation = document.getElementById('arithOperation');
  const result = document.getElementById('arithResult');
  const runBtn = document.getElementById('arithRunBtn');
  const sampleBtn = document.getElementById('arithSampleBtn');
  const resetBtn = document.getElementById('arithResetBtn');

  clearResult(result, 'Perform binary addition, subtraction, or multiplication with worked steps.');

  function run() {
    try {
      const a = validateBinary(inputA.value, 'Operand A');
      const b = validateBinary(inputB.value, 'Operand B');
      let response;
      let operationName;

      if (operation.value === 'add') {
        response = addBinary(a, b);
        operationName = 'Addition';
      }
      if (operation.value === 'subtract') {
        response = subtractBinary(a, b);
        operationName = 'Subtraction';
      }
      if (operation.value === 'multiply') {
        response = multiplyBinary(a, b);
        operationName = 'Multiplication';
      }

      const steps = [
        {
          title: 'Validate binary inputs',
          body: `Both operands are confirmed as valid binary numbers: ${a} and ${b}.`,
        },
        {
          title: 'Apply selected arithmetic',
          body: `${operationName} is performed according to binary arithmetic rules.`,
        },
        {
          title: 'Produce final binary result',
          body: `The final binary answer is ${response.result}.`,
        },
      ];

      renderSuccess(result, `
        <div class="result-head">
          <h4 class="result-title">Binary ${operationName}</h4>
          <span class="value-pill">${operationName}</span>
        </div>
        <div class="result-grid">
          ${createStatCard('Operand A', a)}
          ${createStatCard('Operand B', b)}
          ${createStatCard('Binary Result', response.result)}
          ${createStatCard('Decimal Check', `${parseInt(a, 2)} ${operation.value === 'add' ? '+' : operation.value === 'subtract' ? '-' : '×'} ${parseInt(b, 2)} = ${operation.value === 'add' ? parseInt(a, 2) + parseInt(b, 2) : operation.value === 'subtract' ? parseInt(a, 2) - parseInt(b, 2) : parseInt(a, 2) * parseInt(b, 2)}`)}
        </div>
        <h4 class="section-subtitle">Working</h4>
        <div class="binary-work"><div class="binary-lines">${response.lines.join('\n')}</div></div>
        ${renderSteps(steps)}
      `);
    } catch (error) {
      renderError(result, error.message);
    }
  }

  runBtn.addEventListener('click', run);
  sampleBtn.addEventListener('click', () => {
    inputA.value = '1011';
    inputB.value = '0110';
    operation.value = 'add';
    run();
  });
  resetBtn.addEventListener('click', () => {
    inputA.value = '';
    inputB.value = '';
    operation.value = 'add';
    clearResult(result, 'Perform binary addition, subtraction, or multiplication with worked steps.');
  });
}
