import { initConverter } from './tools/converter.js';
import { initKMap } from './tools/kmap.js';
import { initTruthTable } from './tools/truthTable.js';
import { initLogicSimulator } from './tools/logic.js';
import { initSimplifier } from './tools/simplifier.js';
import { initFlipFlop } from './tools/flipflop.js';
import { initArithmetic } from './tools/arithmetic.js';
import { setMode, getMode } from './tools/utils.js';


const homeView = document.getElementById('homeView');
const toolViews = [...document.querySelectorAll('.tool-view')];

const cards = [...document.querySelectorAll(".tool-card")];

// mouse light effect
cards.forEach(card => {
  card.addEventListener("mousemove", e => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--x", `${e.clientX - rect.left}px`);
    card.style.setProperty("--y", `${e.clientY - rect.top}px`);
  });
});
const backButtons = [...document.querySelectorAll('[data-back]')];
const modeButtons = [...document.querySelectorAll('.mode-btn')];
const splashScreen = document.getElementById('splashScreen');

function showView(id) {
  homeView.classList.remove('active');
  toolViews.forEach(view => view.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.body.classList.remove("no-scroll"); 
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showHome() {
  toolViews.forEach(view => view.classList.remove('active'));
  homeView.classList.add('active');
  document.body.classList.add("no-scroll");
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

cards.forEach(card => card.addEventListener('click', () => showView(card.dataset.target)));
backButtons.forEach(btn => btn.addEventListener('click', showHome));

modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    modeButtons.forEach(item => item.classList.remove('active'));
    btn.classList.add('active');
    setMode(btn.dataset.mode);
    document.body.dataset.mode = getMode();
    document.dispatchEvent(new CustomEvent('modechange', { detail: { mode: getMode() } }));
  });
});

document.body.dataset.mode = getMode();
window.addEventListener("load", () => {
  const splash = document.getElementById("splashScreen");

  if (!splash) return;

  document.body.classList.add("no-scroll");

  setTimeout(() => {
    splash.classList.add("hide");

    // completely remove after animation
    setTimeout(() => {
      splash.remove();
    }, 600);
  }, 1500);
});
initConverter();
initKMap();
initTruthTable();
initLogicSimulator();
initSimplifier();
initFlipFlop();
initArithmetic();
