// ──────────────────────────────────────────────
//  CONFIG — edit these paths to your PNG files
// ──────────────────────────────────────────────
const IMAGES = {
  heads: 'images/heads.png',
  tails: 'images/tails.png'
};

// ──────────────────────────────────────────────
//  Setup
// ──────────────────────────────────────────────
const coin     = document.getElementById('coin');
const result   = document.getElementById('result');
const btn      = document.getElementById('tossBtn');
const headsEl  = document.getElementById('headsCount');
const tailsEl  = document.getElementById('tailsCount');
const totalEl  = document.getElementById('totalCount');
const headsImg = document.getElementById('headsImg');
const tailsImg = document.getElementById('tailsImg');

// Apply image paths from config
headsImg.src = IMAGES.heads;
tailsImg.src = IMAGES.tails;

let heads = 0, tails = 0, total = 0;
let isAnimating = false;
// Track actual face shown (0 = heads, 180 = tails)
let currentRot = 0;

// ──────────────────────────────────────────────
//  Toss logic
// ──────────────────────────────────────────────
function toss() {
  if (isAnimating) return;
  isAnimating = true;
  btn.disabled = true;

  // Hide result
  result.classList.remove('show');

  // Decide outcome
  const outcome = Math.random() < 0.5 ? 'heads' : 'tails';

  // Remove idle bob + any previous landing class, and hide both faces
  coin.classList.remove('idle', 'land-heads', 'land-tails', 'show-heads', 'show-tails');

  // Start toss
  coin.classList.add('tossing');

  // After toss keyframe ends, play landing
  coin.addEventListener('animationend', function onToss(e) {
    if (e.animationName !== 'toss') return;
    coin.removeEventListener('animationend', onToss);
    coin.classList.remove('tossing');

    const landClass = outcome === 'heads' ? 'land-heads' : 'land-tails';
    coin.classList.add(landClass);

    coin.addEventListener('animationend', function onLand() {
      coin.removeEventListener('animationend', onLand);
      coin.classList.remove(landClass);

      // Reveal the correct face image
      coin.classList.add(outcome === 'heads' ? 'show-heads' : 'show-tails');

      // Resume idle bob
      coin.classList.add('idle');

      // Update counters & label
      total++;
      if (outcome === 'heads') {
        heads++;
        result.textContent = 'Heads';
      } else {
        tails++;
        result.textContent = 'Tails';
      }
      headsEl.textContent = heads;
      tailsEl.textContent = tails;
      totalEl.textContent = total;

      result.classList.add('show');
      btn.disabled = false;
      isAnimating = false;
    }, { once: true });
  });
}

btn.addEventListener('click', toss);

// ──────────────────────────────────────────────
//  Stats visibility toggle (eye)
// ──────────────────────────────────────────────
const statsToggle = document.getElementById('statsToggle');
const statsEl     = document.getElementById('stats');

statsToggle.addEventListener('click', () => {
  const hidden = statsEl.classList.toggle('hidden');       // true when now hidden
  statsToggle.classList.toggle('is-hidden', hidden);       // swap eye icon
  statsToggle.setAttribute('aria-pressed', String(!hidden));
  statsToggle.setAttribute('aria-label', hidden ? 'Show statistics' : 'Hide statistics');
});
