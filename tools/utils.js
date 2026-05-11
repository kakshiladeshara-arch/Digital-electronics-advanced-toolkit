const STORAGE_KEY = 'detoolkit-mode';
let currentMode = localStorage.getItem(STORAGE_KEY) || 'student';

export function setMode(mode) {
  currentMode = mode === 'quick' ? 'quick' : 'student';
  localStorage.setItem(STORAGE_KEY, currentMode);
}

export function getMode() {
  return currentMode;
}

export function isStudentMode() {
  return currentMode !== 'quick';
}

export function escapeHTML(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function clearResult(el, message = 'Run the tool to view results.') {
  el.classList.add('empty');
  el.innerHTML = `<div>${escapeHTML(message)}</div>`;
}

export function renderError(el, message) {
  el.classList.remove('empty');
  el.innerHTML = `<div class="notice error"><strong>Input Error</strong><div>${escapeHTML(message)}</div></div>`;
}

export function renderSuccess(el, html) {
  el.classList.remove('empty');
  el.innerHTML = html;
}

export function renderSteps(steps = []) {
  if (!isStudentMode() || !steps.length) return '';
  return `
    <h4 class="section-subtitle">Step-by-step explanation</h4>
    <div class="step-list">
      ${steps.map((step, index) => `
        <article class="step-card">
          <strong>Step ${index + 1}: ${escapeHTML(step.title)}</strong>
          <p>${escapeHTML(step.body)}</p>
        </article>
      `).join('')}
    </div>
  `;
}

export function createStatCard(label, value) {
  return `
    <article class="stat-card">
      <span class="stat-label">${escapeHTML(label)}</span>
      <div class="stat-value">${escapeHTML(value)}</div>
    </article>
  `;
}

export function createSectionTitle(title) {
  return `<h4 class="section-subtitle">${escapeHTML(title)}</h4>`;
}

export function uniqueSortedNumbers(values) {
  return [...new Set(values.map(Number))].sort((a, b) => a - b);
}

export function parseMinterms(input, varCount) {
  if (!input.trim()) return [];
  const maxValue = (2 ** varCount) - 1;
  const values = input
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      if (!/^\d+$/.test(item)) throw new Error(`Invalid minterm "${item}".`);
      const num = Number(item);
      if (num < 0 || num > maxValue) {
        throw new Error(`Minterm ${num} is outside the valid range 0 to ${maxValue}.`);
      }
      return num;
    });
  return uniqueSortedNumbers(values);
}

export function defaultVariables(varCount) {
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, varCount).split('');
}

export function toBinary(num, width) {
  return num.toString(2).padStart(width, '0');
}

export function countOnes(term) {
  return [...term].filter(char => char === '1').length;
}

export function combineTerms(a, b) {
  let diffCount = 0;
  let combined = '';
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === b[i]) {
      combined += a[i];
    } else if (a[i] !== b[i]) {
      if (a[i] === '-' || b[i] === '-') return null;
      diffCount += 1;
      combined += '-';
    }
    if (diffCount > 1) return null;
  }
  return diffCount === 1 ? combined : null;
}

export function termCovers(term, minterm, width = term.length) {
  const binary = typeof minterm === 'string' ? minterm : toBinary(minterm, width);
  for (let i = 0; i < term.length; i += 1) {
    if (term[i] !== '-' && term[i] !== binary[i]) return false;
  }
  return true;
}

function termLiteralCount(term) {
  return [...term].filter(ch => ch !== '-').length;
}

export function implicantToExpression(term, variables = defaultVariables(term.length)) {
  let output = '';
  [...term].forEach((bit, index) => {
    if (bit === '-') return;
    output += bit === '1' ? variables[index] : `${variables[index]}'`;
  });
  return output || '1';
}

export function generatePrimeImplicants(minterms, varCount) {
  if (!minterms.length) return [];
  let groups = new Map();
  const initialTerms = uniqueSortedNumbers(minterms).map(num => ({
    term: toBinary(num, varCount),
    members: [num],
    combined: false,
  }));

  initialTerms.forEach(item => {
    const ones = countOnes(item.term);
    if (!groups.has(ones)) groups.set(ones, []);
    groups.get(ones).push(item);
  });

  const primes = [];

  while (groups.size) {
    const nextGroups = new Map();
    const keys = [...groups.keys()].sort((a, b) => a - b);
    const usedPairs = new Set();

    for (let i = 0; i < keys.length - 1; i += 1) {
      const current = groups.get(keys[i]) || [];
      const next = groups.get(keys[i + 1]) || [];
      current.forEach(a => {
        next.forEach(b => {
          const combined = combineTerms(a.term, b.term);
          if (!combined) return;
          a.combined = true;
          b.combined = true;
          const members = uniqueSortedNumbers([...a.members, ...b.members]);
          const signature = `${combined}|${members.join(',')}`;
          if (usedPairs.has(signature)) return;
          usedPairs.add(signature);
          const ones = countOnes(combined.replace(/-/g, ''));
          if (!nextGroups.has(ones)) nextGroups.set(ones, []);
          nextGroups.get(ones).push({ term: combined, members, combined: false });
        });
      });
    }

    groups.forEach(group => {
      group.forEach(item => {
        if (!item.combined) primes.push(item);
      });
    });

    const dedupedGroups = new Map();
    nextGroups.forEach((group, key) => {
      const deduped = [];
      const seen = new Set();
      group.forEach(item => {
        const signature = `${item.term}|${item.members.join(',')}`;
        if (seen.has(signature)) return;
        seen.add(signature);
        deduped.push(item);
      });
      if (deduped.length) dedupedGroups.set(key, deduped);
    });

    groups = dedupedGroups;
  }

  const seen = new Set();
  return primes.filter(item => {
    const signature = `${item.term}|${item.members.join(',')}`;
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

function minimalCover(primeImplicants, minterms, varCount) {
  const coverage = new Map();
  minterms.forEach(m => {
    coverage.set(m, primeImplicants.filter(p => termCovers(p.term, m, varCount)));
  });

  const essential = [];
  const covered = new Set();
  coverage.forEach((items, minterm) => {
    if (items.length === 1) {
      essential.push(items[0]);
    }
  });

  const essentialUnique = [];
  const seenEssential = new Set();
  essential.forEach(item => {
    const key = item.term;
    if (!seenEssential.has(key)) {
      seenEssential.add(key);
      essentialUnique.push(item);
    }
    item.members.forEach(member => covered.add(member));
  });

  const remainingMinterms = minterms.filter(m => !covered.has(m));
  if (!remainingMinterms.length) return essentialUnique;

  const remainingImplicants = primeImplicants.filter(p => !seenEssential.has(p.term));
  let bestSubset = null;
  const total = 1 << remainingImplicants.length;

  for (let mask = 1; mask < total; mask += 1) {
    const subset = [];
    const cover = new Set();
    let literalCost = 0;

    for (let i = 0; i < remainingImplicants.length; i += 1) {
      if ((mask & (1 << i)) === 0) continue;
      subset.push(remainingImplicants[i]);
      literalCost += termLiteralCount(remainingImplicants[i].term);
      remainingImplicants[i].members.forEach(m => cover.add(m));
    }

    const valid = remainingMinterms.every(m => cover.has(m));
    if (!valid) continue;

    if (!bestSubset) {
      bestSubset = { subset, literalCost };
      continue;
    }

    if (
      subset.length < bestSubset.subset.length ||
      (subset.length === bestSubset.subset.length && literalCost < bestSubset.literalCost)
    ) {
      bestSubset = { subset, literalCost };
    }
  }

  return [...essentialUnique, ...(bestSubset?.subset || [])];
}

export function simplifyMinterms(minterms, varCount, variables = defaultVariables(varCount)) {
  const unique = uniqueSortedNumbers(minterms);
  const maxMinterms = 2 ** varCount;

  if (!unique.length) {
    return {
      expression: '0',
      primeImplicants: [],
      selectedImplicants: [],
      steps: [
        { title: 'No asserted minterms', body: 'The function is 0 for all input combinations, so the simplified output is 0.' },
      ],
    };
  }

  if (unique.length === maxMinterms) {
    return {
      expression: '1',
      primeImplicants: [{ term: '-'.repeat(varCount), members: unique }],
      selectedImplicants: [{ term: '-'.repeat(varCount), members: unique }],
      steps: [
        { title: 'All cells are 1', body: 'Every possible input combination is included, so the simplified function is 1.' },
      ],
    };
  }

  const primeImplicants = generatePrimeImplicants(unique, varCount);
  const selectedImplicants = minimalCover(primeImplicants, unique, varCount);
  const expression = selectedImplicants.map(item => implicantToExpression(item.term, variables)).join(' + ') || '0';

  const steps = [
    {
      title: 'Canonical minterms',
      body: `The function is formed from minterms m(${unique.join(', ')}).`,
    },
    {
      title: 'Prime implicants',
      body: primeImplicants.length
        ? primeImplicants.map(item => `${item.term} → ${implicantToExpression(item.term, variables)}`).join(' | ')
        : 'No prime implicants were generated.',
    },
    {
      title: 'Minimal cover selection',
      body: selectedImplicants.map(item => `${item.term} → ${implicantToExpression(item.term, variables)}`).join(' | '),
    },
    {
      title: 'Simplified SOP',
      body: `The reduced sum-of-products expression is ${expression}.`,
    },
  ];

  return { expression, primeImplicants, selectedImplicants, steps };
}

function replacePostfixNot(expr) {
  let output = expr;
  let previous = '';
  while (previous !== output) {
    previous = output;
    output = output.replace(/(\([^()]+\)|[A-Z01])'/g, '!$1');
  }
  return output;
}

function insertImplicitAnd(expr) {
  let output = '';
  const needsAndBetween = (left, right) => {
    const leftIsOperand = /[A-Z01)]/.test(left);
    const rightIsOperandStart = /[A-Z01(!(]/.test(right);
    return leftIsOperand && rightIsOperandStart;
  };

  for (let i = 0; i < expr.length; i += 1) {
    const current = expr[i];
    const next = expr[i + 1];
    output += current;
    if (next && needsAndBetween(current, next)) output += '*';
  }
  return output;
}

export function normalizeExpression(expression) {
  if (!expression || !expression.trim()) throw new Error('Please enter a Boolean expression.');

  let expr = expression.toUpperCase().replace(/\s+/g, '');
  expr = expr.replace(/\bNOT\b/g, '!').replace(/\bAND\b/g, '*').replace(/\bOR\b/g, '+');
  expr = expr.replace(/[·.]/g, '*').replace(/⊕/g, '^');
  expr = replacePostfixNot(expr);
  expr = insertImplicitAnd(expr);
  return expr;
}

export function tokenizeExpression(expression) {
  const expr = normalizeExpression(expression);
  const tokens = [];
  for (let i = 0; i < expr.length; i += 1) {
    const ch = expr[i];
    if (/[A-Z]/.test(ch)) tokens.push({ type: 'var', value: ch });
    else if (/[01]/.test(ch)) tokens.push({ type: 'const', value: ch });
    else if ('!*+^()'.includes(ch)) tokens.push({ type: ch, value: ch });
    else throw new Error(`Unsupported symbol "${ch}" in expression.`);
  }
  return tokens;
}

export function variablesFromExpression(expression) {
  const vars = tokenizeExpression(expression)
    .filter(token => token.type === 'var')
    .map(token => token.value);
  return [...new Set(vars)].sort();
}

const precedence = { '!': 4, '*': 3, '^': 2, '+': 1 };
const associativity = { '!': 'right', '*': 'left', '^': 'left', '+': 'left' };

export function toRPN(expression) {
  const tokens = tokenizeExpression(expression);
  const output = [];
  const operators = [];

  tokens.forEach(token => {
    if (token.type === 'var' || token.type === 'const') {
      output.push(token);
      return;
    }

    if (token.type === '(') {
      operators.push(token);
      return;
    }

    if (token.type === ')') {
      while (operators.length && operators[operators.length - 1].type !== '(') {
        output.push(operators.pop());
      }
      if (!operators.length) throw new Error('Mismatched parentheses detected.');
      operators.pop();
      return;
    }

    while (operators.length) {
      const top = operators[operators.length - 1];
      if (!precedence[top.type]) break;
      const higher = precedence[top.type] > precedence[token.type];
      const sameAndLeft = precedence[top.type] === precedence[token.type] && associativity[token.type] === 'left';
      if (!(higher || sameAndLeft)) break;
      output.push(operators.pop());
    }
    operators.push(token);
  });

  while (operators.length) {
    const top = operators.pop();
    if (top.type === '(' || top.type === ')') throw new Error('Mismatched parentheses detected.');
    output.push(top);
  }

  return output;
}

export function evaluateRPN(rpnTokens, context) {
  const stack = [];

  rpnTokens.forEach(token => {
    if (token.type === 'var') {
      stack.push(Number(Boolean(context[token.value])));
      return;
    }
    if (token.type === 'const') {
      stack.push(Number(token.value));
      return;
    }
    if (token.type === '!') {
      const a = stack.pop();
      stack.push(a ? 0 : 1);
      return;
    }
    const b = stack.pop();
    const a = stack.pop();
    if (typeof a === 'undefined' || typeof b === 'undefined') {
      throw new Error('The expression is incomplete or malformed.');
    }
    if (token.type === '*') stack.push(a && b ? 1 : 0);
    if (token.type === '+') stack.push(a || b ? 1 : 0);
    if (token.type === '^') stack.push(a !== b ? 1 : 0);
  });

  if (stack.length !== 1) throw new Error('The expression could not be evaluated.');
  return stack[0];
}

export function buildTruthTable(expression) {
  const vars = variablesFromExpression(expression);
  if (!vars.length) throw new Error('Please include at least one variable in the expression.');
  const rpn = toRPN(expression);
  const rows = [];

  for (let i = 0; i < (2 ** vars.length); i += 1) {
    const binary = toBinary(i, vars.length);
    const context = {};
    vars.forEach((variable, index) => {
      context[variable] = Number(binary[index]);
    });
    const output = evaluateRPN(rpn, context);
    rows.push({ ...context, output, minterm: i });
  }

  return { vars, rows, rpn };
}

export function parseBaseValue(value, base) {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) throw new Error('Please enter a value to convert.');

  const patterns = {
    2: /^-?[01]+$/,
    8: /^-?[0-7]+$/,
    10: /^-?\d+$/,
    16: /^-?[0-9A-F]+$/,
  };

  if (!patterns[base]?.test(trimmed)) {
    throw new Error(`The value is not valid for base ${base}.`);
  }

  const sign = trimmed.startsWith('-') ? -1n : 1n;
  const body = trimmed.replace('-', '');
  let parsed = BigInt(parseInt(body, base));
  if (body.length > 12) {
    parsed = [...body].reduce((acc, ch) => {
      const digit = BigInt(parseInt(ch, base));
      return acc * BigInt(base) + digit;
    }, 0n);
  }
  return sign * parsed;
}

export function formatBigIntInBase(value, base) {
  const sign = value < 0n ? '-' : '';
  const body = (value < 0n ? -value : value).toString(base).toUpperCase();
  return `${sign}${body}`;
}

export function grayOrder(bits) {
  if (bits === 1) return ['0', '1'];
  if (bits === 2) return ['00', '01', '11', '10'];
  return [];
}

export function colorPalette() {
  return ['#56CCF2', '#6FCF97', '#F2994A', '#BB6BD9', '#FF6B8A', '#2D9CDB', '#F2C94C', '#27AE60'];
}
