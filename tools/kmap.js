import {
  clearResult,
  renderError,
  renderSuccess,
  renderSteps,
  createStatCard,
  parseMinterms,
  simplifyMinterms,
  colorPalette,
  grayOrder,
  defaultVariables,
  implicantToExpression,
} from './utils.js';

function kmapStructure(varCount) {
  const vars = defaultVariables(varCount);
  if (varCount === 2) {
    return {
      rowVars: vars[0],
      colVars: vars[1],
      rowBits: grayOrder(1),
      colBits: grayOrder(1),
      className: 'two',
    };
  }
  if (varCount === 3) {
    return {
      rowVars: vars[0],
      colVars: `${vars[1]}${vars[2]}`,
      rowBits: grayOrder(1),
      colBits: grayOrder(2),
      className: 'three',
    };
  }
  return {
    rowVars: `${vars[0]}${vars[1]}`,
    colVars: `${vars[2]}${vars[3]}`,
    rowBits: grayOrder(2),
    colBits: grayOrder(2),
    className: 'four',
  };
}

function buildKMapHTML(varCount, minterms, selectedImplicants) {
  const structure = kmapStructure(varCount);
  const palette = colorPalette();
  const groupLookup = new Map();

  selectedImplicants.forEach((item, index) => {
    item.members.forEach(member => {
      if (!minterms.includes(member)) return;
      if (!groupLookup.has(member)) groupLookup.set(member, []);
      groupLookup.get(member).push({ label: `G${index + 1}`, color: palette[index % palette.length] });
    });
  });

  let html = `<div class="kmap-grid ${structure.className}">`;
  html += `<div class="kmap-axis kmap-corner">${structure.rowVars} \ ${structure.colVars}</div>`;
  structure.colBits.forEach(label => {
    html += `<div class="kmap-axis">${label}</div>`;
  });

  structure.rowBits.forEach(row => {
    html += `<div class="kmap-axis">${row}</div>`;
    structure.colBits.forEach(col => {
      const binary = row + col;
      const index = parseInt(binary, 2);
      const isOne = minterms.includes(index);
      const groups = groupLookup.get(index) || [];
      html += `
        <div class="kmap-cell" style="border-color:${groups[0]?.color || 'rgba(255,255,255,0.08)'}">
          <strong>m${index}</strong>
          <small>Value: ${isOne ? '1' : '0'}</small>
          <div class="kmap-badges">
            ${groups.map(group => `<span class="group-chip" style="background:${group.color}">${group.label}</span>`).join('')}
          </div>
        </div>
      `;
    });
  });

  html += `</div>`;
  return html;
}

function buildGroupList(selectedImplicants) {
  const palette = colorPalette();
  return selectedImplicants.map((item, index) => `
    <div class="group-line">
      <span class="group-chip" style="background:${palette[index % palette.length]}">G${index + 1}</span>
      <strong>${implicantToExpression(item.term)}</strong>
      <span>Covers minterms: ${item.members.join(', ')}</span>
    </div>
  `).join('');
}

export function initKMap() {
  const variables = document.getElementById('kmapVariables');
  const mintermsInput = document.getElementById('kmapMinterms');
  const result = document.getElementById('kmapResult');
  const solveBtn = document.getElementById('kmapSolveBtn');
  const sampleBtn = document.getElementById('kmapSampleBtn');
  const resetBtn = document.getElementById('kmapResetBtn');

  clearResult(result, 'Select variable count, enter minterms, and solve for a simplified SOP expression.');

  function run() {
    try {
      const varCount = Number(variables.value);
      const minterms = parseMinterms(mintermsInput.value, varCount);
      const solution = simplifyMinterms(minterms, varCount);
      const groupedHtml = buildKMapHTML(varCount, minterms, solution.selectedImplicants);
      const groupsHtml = buildGroupList(solution.selectedImplicants);

      renderSuccess(result, `
        <div class="result-head">
          <h4 class="result-title">K-Map Solution</h4>
          <span class="value-pill">${varCount} Variables</span>
        </div>
        <div class="result-grid">
          ${createStatCard('Minterms', minterms.length ? minterms.join(', ') : 'None')}
          ${createStatCard('Simplified SOP', solution.expression)}
        </div>
        <h4 class="section-subtitle">Grouped K-Map</h4>
        ${groupedHtml}
        <h4 class="section-subtitle">Selected Groups</h4>
        ${groupsHtml || '<div class="notice">No groups available for the current input.</div>'}
        ${renderSteps(solution.steps)}
      `);
    } catch (error) {
      renderError(result, error.message);
    }
  }

  solveBtn.addEventListener('click', run);
  sampleBtn.addEventListener('click', () => {
    variables.value = '4';
    mintermsInput.value = '0,2,5,7,8,10,13,15';
    run();
  });
  resetBtn.addEventListener('click', () => {
    variables.value = '4';
    mintermsInput.value = '';
    clearResult(result, 'Select variable count, enter minterms, and solve for a simplified SOP expression.');
  });
}
