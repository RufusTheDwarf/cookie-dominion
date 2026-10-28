export type WorkshopStation =
  | 'lavender' | 'mint' | 'rose' | 'bergamot' | 'sandalwood' | 'jasmine' | 'resin'
  | 'laboratory' | 'counter';

export type MoveDirection = 'up' | 'down' | 'left' | 'right';

export interface WorkshopScene {
  move(direction: MoveDirection): void;
  interact(): void;
  destroy(): void;
}

interface Station {
  id: WorkshopStation;
  x: number;
  y: number;
  title: string;
  detail: string;
  color: string;
}

const WIDTH = 960;
const HEIGHT = 440;
const STATIONS: Station[] = [
  { id: 'lavender', x: 92, y: 145, title: 'LAVANDE', detail: 'Parcelle 01', color: '#798e64' },
  { id: 'mint', x: 218, y: 145, title: 'MENTHE', detail: 'Parcelle 02', color: '#6f9c77' },
  { id: 'rose', x: 92, y: 300, title: 'ROSIER', detail: 'Parcelle 03', color: '#b96e7b' },
  { id: 'bergamot', x: 218, y: 300, title: 'BERGAMOTE', detail: 'Parcelle 04', color: '#b5a849' },
  { id: 'sandalwood', x: 338, y: 145, title: 'SANTAL', detail: 'Parcelle 05', color: '#a66b4c' },
  { id: 'jasmine', x: 338, y: 300, title: 'JASMIN', detail: 'Parcelle 06', color: '#d8c99b' },
  { id: 'resin', x: 438, y: 145, title: 'RÉSINE', detail: 'Parcelle 07', color: '#c28a42' },
  { id: 'laboratory', x: 590, y: 220, title: 'LABORATOIRE', detail: 'Formuler un parfum', color: '#b28a4d' },
  { id: 'counter', x: 830, y: 220, title: 'COMPTOIR', detail: 'Vendre un flacon', color: '#53694c' },
];

export function createWorkshopScene(
  canvas: HTMLCanvasElement,
  onInteract: (station: WorkshopStation) => void,
  onNearbyChange: (station: WorkshopStation | null) => void,
): WorkshopScene {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D indisponible');

  const player = { x: 505, y: 345 };
  const keys = new Set<string>();
  let destination: { x: number; y: number } | null = null;
  let frame = 0;
  let lastFrame = performance.now();
  let nearby: WorkshopStation | null = null;
  let destroyed = false;
  let lastReported: WorkshopStation | null = null;

  const resize = (): void => {
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(bounds.width * ratio));
    canvas.height = Math.max(1, Math.round(bounds.height * ratio));
    context!.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
    draw();
  };

  const roundedRect = (x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string): void => {
    context!.beginPath();
    context!.roundRect(x, y, w, h, r);
    context!.fillStyle = fill;
    context!.fill();
    if (stroke) {
      context!.strokeStyle = stroke;
      context!.lineWidth = 2;
      context!.stroke();
    }
  };

  function drawStation(station: Station): void {
    const c = context!;
    c.save();
    c.translate(station.x, station.y);
    c.fillStyle = 'rgba(37,42,31,.15)';
    c.beginPath();
    c.ellipse(0, 21, 34, 9, 0, 0, Math.PI * 2);
    c.fill();
    if (station.id === 'laboratory') {
      roundedRect(-37, -26, 74, 48, 5, '#806747', '#4d4938');
      roundedRect(-29, -19, 58, 27, 3, '#d8c59c', '#aa8b55');
      c.fillStyle = '#4b7564';
      c.beginPath();
      c.arc(-12, -6, 7, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#b26b4e';
      c.beginPath();
      c.arc(10, -6, 7, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#f3e7c9';
      c.fillRect(-2, -20, 4, 24);
    } else if (station.id === 'counter') {
      roundedRect(-39, -22, 78, 44, 4, '#5a4735', '#3c352a');
      roundedRect(-34, -18, 68, 12, 2, '#c7a86c', '#8e7144');
      c.fillStyle = '#f0e7d4';
      c.fillRect(-18, -13, 36, 3);
      c.fillStyle = '#8f6546';
      c.fillRect(-28, 5, 56, 11);
    } else {
      roundedRect(-32, -24, 64, 48, 6, '#b7a47d', '#7e755c');
      roundedRect(-27, -19, 54, 38, 4, '#657e58', '#e1d3b0');
      for (let i = 0; i < 5; i++) {
        const px = -19 + (i % 3) * 19;
        const py = -10 + Math.floor(i / 3) * 17;
        c.strokeStyle = station.color;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(px, py + 7);
        c.lineTo(px + 2, py - 3);
        c.stroke();
        c.fillStyle = station.color;
        c.beginPath();
        c.ellipse(px - 4, py + 1, 5, 2.5, -.5, 0, Math.PI * 2);
        c.ellipse(px + 5, py - 2, 5, 2.5, .5, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.fillStyle = '#f6f0e2';
    c.font = 'bold 10px system-ui';
    c.textAlign = 'center';
    c.fillText(station.title, 0, 43);
    c.fillStyle = '#5e604d';
    c.font = '10px system-ui';
    c.fillText(station.detail, 0, 56);
    if (nearby === station.id) {
      c.strokeStyle = '#b28a4d';
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(0, 0, 44, 39, 0, 0, Math.PI * 2);
      c.stroke();
      roundedRect(-18, -54, 36, 19, 5, '#344735');
      c.fillStyle = '#f6f0e2';
      c.font = 'bold 12px system-ui';
      c.fillText('E', 0, -41);
    }
    c.restore();
  }

  function draw(): void {
    const c = context!;
    c.clearRect(0, 0, WIDTH, HEIGHT);
    c.fillStyle = '#cfc5a9';
    c.fillRect(0, 0, WIDTH, HEIGHT);

    c.fillStyle = '#9ca98a';
    c.fillRect(0, 0, 470, HEIGHT);
    c.fillStyle = '#d9c8a3';
    c.fillRect(470, 0, 250, HEIGHT);
    c.fillStyle = '#c2b18f';
    c.fillRect(720, 0, 240, HEIGHT);

    c.strokeStyle = 'rgba(57,65,47,.10)';
    c.lineWidth = 1;
    for (let x = 0; x <= WIDTH; x += 32) {
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, HEIGHT); c.stroke();
    }
    for (let y = 0; y <= HEIGHT; y += 32) {
      c.beginPath(); c.moveTo(0, y); c.lineTo(WIDTH, y); c.stroke();
    }

    roundedRect(14, 14, 442, 40, 6, 'rgba(246,240,226,.88)', '#aaa087');
    roundedRect(484, 14, 220, 40, 6, 'rgba(246,240,226,.88)', '#aaa087');
    roundedRect(734, 14, 212, 40, 6, 'rgba(246,240,226,.88)', '#aaa087');
    c.fillStyle = '#344735';
    c.textAlign = 'left';
    c.font = 'bold 13px system-ui';
    c.fillText('JARDIN BOTANIQUE', 28, 39);
    c.fillText('LABORATOIRE', 498, 39);
    c.fillText('BOUTIQUE', 748, 39);

    c.strokeStyle = '#8c846e';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(470, 0); c.lineTo(470, 150); c.moveTo(470, 270); c.lineTo(470, HEIGHT);
    c.moveTo(720, 0); c.lineTo(720, 150); c.moveTo(720, 270); c.lineTo(720, HEIGHT);
    c.stroke();
    c.strokeStyle = '#e9dfc9';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(470, 155); c.lineTo(470, 265); c.moveTo(720, 155); c.lineTo(720, 265);
    c.stroke();

    STATIONS.forEach(drawStation);

    c.fillStyle = 'rgba(41,44,36,.16)';
    c.beginPath();
    c.ellipse(player.x, player.y + 16, 13, 6, 0, 0, Math.PI * 2);
    c.fill();
    roundedRect(player.x - 10, player.y - 11, 20, 27, 6, '#344735', '#f6f0e2');
    c.fillStyle = '#e0c28b';
    c.beginPath();
    c.arc(player.x, player.y - 13, 9, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#5a4534';
    c.beginPath();
    c.arc(player.x, player.y - 16, 9, Math.PI, Math.PI * 2);
    c.fill();
    c.fillStyle = '#f6f0e2';
    c.font = 'bold 10px system-ui';
    c.textAlign = 'center';
    c.fillText('TOI', player.x, player.y + 31);
  }

  function nearestStation(): Station | null {
    let result: Station | null = null;
    let best = 66;
    for (const station of STATIONS) {
      const distance = Math.hypot(player.x - station.x, player.y - station.y);
      if (distance < best) {
        best = distance;
        result = station;
      }
    }
    return result;
  }

  function update(now: number): void {
    if (destroyed) return;
    const elapsed = Math.min(.05, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    let dx = 0;
    let dy = 0;
    if (keys.has('arrowleft') || keys.has('a') || keys.has('q')) dx -= 1;
    if (keys.has('arrowright') || keys.has('d')) dx += 1;
    if (keys.has('arrowup') || keys.has('w') || keys.has('z')) dy -= 1;
    if (keys.has('arrowdown') || keys.has('s')) dy += 1;
    if (dx !== 0 || dy !== 0) destination = null;
    if (destination) {
      const tx = destination.x - player.x;
      const ty = destination.y - player.y;
      const distance = Math.hypot(tx, ty);
      if (distance < 4) destination = null;
      else { dx = tx / distance; dy = ty / distance; }
    }
    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy);
      player.x = Math.max(24, Math.min(WIDTH - 24, player.x + dx / length * 175 * elapsed));
      player.y = Math.max(72, Math.min(HEIGHT - 24, player.y + dy / length * 175 * elapsed));
    }
    nearby = nearestStation()?.id ?? null;
    if (nearby !== lastReported) {
      lastReported = nearby;
      onNearbyChange(nearby);
    }
    draw();
    frame = requestAnimationFrame(update);
  }

  const keydown = (event: KeyboardEvent): void => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    const key = event.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd', 'z', 'q'].includes(key)) {
      keys.add(key);
      event.preventDefault();
    } else if (key === 'e' || key === ' ') {
      if (nearby) { onInteract(nearby); event.preventDefault(); }
    }
  };
  const keyup = (event: KeyboardEvent): void => { keys.delete(event.key.toLowerCase()); };
  const pointer = (event: PointerEvent): void => {
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width * WIDTH;
    const y = (event.clientY - bounds.top) / bounds.height * HEIGHT;
    const station = STATIONS.find((item) => Math.hypot(item.x - x, item.y - y) < 54);
    destination = station ? { x: station.x + (station.x > WIDTH - 120 ? -48 : 48), y: station.y + 8 } : { x, y };
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  canvas.addEventListener('pointerdown', pointer);
  resize();
  frame = requestAnimationFrame(update);

  return {
    move(direction: MoveDirection): void {
      const distance = 54;
      if (direction === 'up') player.y = Math.max(72, player.y - distance);
      if (direction === 'down') player.y = Math.min(HEIGHT - 24, player.y + distance);
      if (direction === 'left') player.x = Math.max(24, player.x - distance);
      if (direction === 'right') player.x = Math.min(WIDTH - 24, player.x + distance);
      destination = null;
      draw();
      nearby = nearestStation()?.id ?? null;
      onNearbyChange(nearby);
    },
    interact(): void { if (nearby) onInteract(nearby); },
    destroy(): void {
      destroyed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      canvas.removeEventListener('pointerdown', pointer);
    },
  };
}
