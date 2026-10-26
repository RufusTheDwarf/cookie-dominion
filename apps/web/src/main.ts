import Phaser from 'phaser';
import {
  addCrumbs,
  buyOven,
  ovenCost,
  parseSavedState,
  productionPerSecond,
  type GameState,
} from './economy';
import './style.css';

const SAVE_KEY = 'cookie-dominion-save-v1';
const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing app root');

app.innerHTML = [
  '<main class="shell">',
  '  <header class="topbar">',
  '    <div><div class="eyebrow">COOKIE INDUSTRIES // EST. 2026</div><h1>OVEN<span>FALL</span></h1></div>',
  '    <div class="save-state" id="save-state">LOCAL SAVE</div>',
  '  </header>',
  '  <section class="dashboard">',
  '    <aside class="panel stats-panel">',
  '      <div class="eyebrow">TREASURY</div><div class="crumb-total" id="crumb-total">0</div><div class="muted">crumbs available</div>',
  '      <div class="rule"></div>',
  '      <div class="stat-row"><span>Production</span><strong id="production">0 / sec</strong></div>',
  '      <div class="stat-row"><span>Lifetime crumbs</span><strong id="lifetime">0</strong></div>',
  '      <div class="stat-row"><span>Ovens online</span><strong id="oven-count">0</strong></div>',
  '      <button class="primary" id="bake-button">BAKE COOKIE <span>+1</span></button>',
  '      <div class="hint">Click the cookie or press SPACE.</div>',
  '    </aside>',
  '    <section class="panel bakery-panel">',
  '      <div class="panel-heading"><div><div class="eyebrow">PRODUCTION FLOOR</div><h2>THE BAKERY</h2></div><div class="live-dot">SYSTEM ONLINE</div></div>',
  '      <div id="game-canvas" class="game-canvas"></div>',
  '      <div class="floor-caption"><span>SECTOR 01 / STARTER DISTRICT</span><span id="status-message">Your empire starts here.</span></div>',
  '    </section>',
  '    <aside class="panel building-panel">',
  '      <div class="eyebrow">CONSTRUCTION</div><h2>BUILDINGS</h2>',
  '      <button class="building-card" id="buy-oven">',
  '        <span class="building-icon">OV</span><span class="building-copy"><strong>Brick Oven</strong><small>Produces 0.5 crumbs/sec</small><small id="oven-owned">Owned: 0</small></span><span class="building-cost" id="oven-cost">25</span>',
  '      </button>',
  '      <div class="rule"></div><div class="eyebrow">NEXT OBJECTIVE</div>',
  '      <p class="objective" id="objective">Bake 25 crumbs to build your first oven.</p>',
  '      <div class="progress-track"><div id="objective-progress" class="progress-fill"></div></div>',
  '      <div class="hint">Progress saves automatically on this device.</div>',
  '    </aside>',
  '  </section>',
  '  <footer><span>VERTICAL SLICE 0.1.0</span><span>NO ACCOUNT REQUIRED // LOCAL SAVE</span></footer>',
  '</main>',
].join('');

let state: GameState = parseSavedState(localStorage.getItem(SAVE_KEY));
let saveTimer = 0;
let statusTimer = 0;

const $ = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error('Missing element: ' + id);
  return element as T;
};
const format = (value: number) =>
  new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 1 }).format(value);

function setStatus(message: string): void {
  $('status-message').textContent = message;
  window.clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => {
    $('status-message').textContent = 'Your empire starts here.';
  }, 2400);
}

function save(): void {
  state.lastSavedAt = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    $('save-state').textContent = 'SAVED LOCALLY';
  } catch {
    $('save-state').textContent = 'SAVE FAILED';
    setStatus('Save failed. Check browser storage permissions.');
  }
}

function render(): void {
  $('crumb-total').textContent = format(state.crumbs);
  $('production').textContent = format(productionPerSecond(state)) + ' / sec';
  $('lifetime').textContent = format(state.lifetimeCrumbs);
  $('oven-count').textContent = String(state.ovens);
  $('oven-owned').textContent = 'Owned: ' + state.ovens;
  $('oven-cost').textContent = format(ovenCost(state.ovens));
  $('buy-oven').toggleAttribute('disabled', state.crumbs < ovenCost(state.ovens));
  $('objective-progress').style.width = Math.min(100, (state.lifetimeCrumbs / 25) * 100) + '%';
  $('objective').textContent = state.ovens === 0
    ? 'Bake ' + format(Math.max(0, 25 - state.crumbs)) + ' more crumbs to build your first oven.'
    : 'First oven online. Keep building your production chain.';
}

function bake(): void {
  state = addCrumbs(state, 1);
  render();
  bakeryScene?.pulseCookie();
}

$('bake-button').addEventListener('click', bake);
$('buy-oven').addEventListener('click', () => {
  const next = buyOven(state);
  if (next === state) {
    setStatus('Not enough crumbs for a Brick Oven.');
    return;
  }
  state = next;
  render();
  setStatus('Brick Oven commissioned. Production is running.');
  save();
  bakeryScene?.addOven();
});
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !(event.target instanceof HTMLInputElement)) {
    event.preventDefault();
    bake();
  }
});
window.addEventListener('beforeunload', save);

class BakeryScene extends Phaser.Scene {
  private cookie?: Phaser.GameObjects.Container;
  private ovenGroup?: Phaser.GameObjects.Container;
  private ovenSprites: Phaser.GameObjects.Container[] = [];

  constructor() {
    super('BakeryScene');
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    this.add.rectangle(width / 2, height / 2, width, height, 0x211a15);
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x453326, 0.5);
    for (let x = 0; x < width; x += 36) grid.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 36) grid.lineBetween(0, y, width, y);
    this.add.ellipse(width / 2, height * 0.52, 230, 46, 0x080706, 0.45);
    this.cookie = this.makeCookie(width / 2, height * 0.48, 1);
    this.cookie.setInteractive(new Phaser.Geom.Circle(0, 0, 63), Phaser.Geom.Circle.Contains);
    this.cookie.on('pointerdown', bake);
    this.tweens.add({
      targets: this.cookie,
      y: height * 0.48 - 5,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.ovenGroup = this.add.container(40, height - 65);
    this.add.text(18, 16, 'BAKERY FLOOR // 001', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#bda58b',
      letterSpacing: 1,
    });
    for (let i = 0; i < state.ovens; i++) this.addOven();
    this.scale.on('resize', () => this.scene.restart());
  }

  private makeCookie(x: number, y: number, scale: number): Phaser.GameObjects.Container {
    const parts: Phaser.GameObjects.GameObject[] = [];
    parts.push(this.add.circle(0, 0, 58, 0x9b592d).setStrokeStyle(5, 0xe6b16b));
    parts.push(this.add.circle(-8, -8, 48, 0xb8733c));
    const chips = [[-24, -18], [8, -27], [25, -4], [-6, 4], [17, 23], [-26, 22], [0, 34], [31, 17], [-35, 1]];
    for (const [cx, cy] of chips) {
      parts.push(this.add.ellipse(cx, cy, 10, 7, 0x40261c).setRotation(-0.35));
    }
    parts.push(this.add.arc(-20, -24, 18, 205, 320, false, 0xf0c487).setStrokeStyle(3, 0xf0c487));
    const cookie = this.add.container(x, y, parts).setScale(scale);
    cookie.setSize(120, 120);
    return cookie;
  }

  pulseCookie(): void {
    if (!this.cookie?.active) return;
    this.tweens.add({
      targets: this.cookie,
      scale: 0.92,
      duration: 65,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
    const spark = this.add.text(
      this.cookie.x + Phaser.Math.Between(-24, 24),
      this.cookie.y - 54,
      '+1',
      { fontFamily: 'monospace', fontSize: '16px', color: '#f7d7a3', stroke: '#211a15', strokeThickness: 3 },
    );
    this.tweens.add({
      targets: spark,
      y: spark.y - 38,
      alpha: 0,
      duration: 600,
      onComplete: () => spark.destroy(),
    });
  }

  addOven(): void {
    if (!this.ovenGroup?.active) return;
    const index = this.ovenSprites.length;
    const x = (index % 4) * 45;
    const y = -Math.floor(index / 4) * 42;
    const body = this.add.rectangle(x, y, 34, 29, 0x70503a).setStrokeStyle(2, 0xc28a55);
    const mouth = this.add.rectangle(x, y + 3, 18, 13, 0x241611).setStrokeStyle(1, 0xe5a15e);
    const fire = this.add.circle(x, y + 4, 4, 0xffa33a);
    const oven = this.add.container(0, 0, [body, mouth, fire]);
    this.ovenGroup.add(oven);
    this.ovenSprites.push(oven);
    this.tweens.add({ targets: fire, alpha: 0.4, scale: 0.75, duration: 500, yoyo: true, repeat: -1 });
  }
}

let bakeryScene: BakeryScene | undefined;
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-canvas',
  width: 640,
  height: 360,
  backgroundColor: '#211a15',
  render: { antialias: true, pixelArt: false },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [class extends BakeryScene {
    create(): void {
      bakeryScene = this;
      super.create();
    }
  }],
});

let gameTime = performance.now();
function tick(now: number): void {
  const elapsed = Math.min(1, Math.max(0, (now - gameTime) / 1000));
  gameTime = now;
  if (elapsed > 0) {
    const production = productionPerSecond(state) * elapsed;
    if (production > 0) {
      state = addCrumbs(state, production);
      render();
    }
  }
  saveTimer += elapsed;
  if (saveTimer >= 10) {
    save();
    saveTimer = 0;
  }
  requestAnimationFrame(tick);
}
render();
requestAnimationFrame(tick);
