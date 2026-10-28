export type WorkshopStation =
  | 'lavender' | 'mint' | 'rose' | 'bergamot' | 'sandalwood' | 'jasmine' | 'resin'
  | 'laboratory' | 'counter';

export type MoveDirection = 'up' | 'down' | 'left' | 'right';

export interface WorkshopTheme {
  background: number;
  floorColor: number;
  accent: number;
  belt: number;
}

export interface WorkshopScene {
  move(direction: MoveDirection): void;
  interact(): void;
  setTheme(theme: WorkshopTheme): void;
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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 440;
const WORLD_WIDTH = 1440;
const WORLD_HEIGHT = 720;
const WALLS = [650, 1000];
const DOOR_TOP = 285;
const DOOR_BOTTOM = 425;
const PLAYER_SPEED = 190;

const STATIONS: Station[] = [
  { id: 'lavender', x: 112, y: 172, title: 'LAVANDE', detail: 'Parcelle 01', color: '#798e64' },
  { id: 'mint', x: 292, y: 172, title: 'MENTHE', detail: 'Parcelle 02', color: '#6f9c77' },
  { id: 'rose', x: 112, y: 365, title: 'ROSIER', detail: 'Parcelle 03', color: '#b96e7b' },
  { id: 'bergamot', x: 292, y: 365, title: 'BERGAMOTE', detail: 'Parcelle 04', color: '#b5a849' },
  { id: 'sandalwood', x: 472, y: 172, title: 'SANTAL', detail: 'Parcelle 05', color: '#a66b4c' },
  { id: 'jasmine', x: 472, y: 365, title: 'JASMIN', detail: 'Parcelle 06', color: '#d8c99b' },
  { id: 'resin', x: 472, y: 545, title: 'RÉSINE', detail: 'Parcelle 07', color: '#c28a42' },
  { id: 'laboratory', x: 820, y: 355, title: 'LABORATOIRE', detail: 'Formuler un parfum', color: '#b28a4d' },
  { id: 'counter', x: 1225, y: 355, title: 'COMPTOIR', detail: 'Vendre un flacon', color: '#53694c' },
];

const HERB_COLORS = ['#71885b', '#8ba36a', '#b2b67a', '#d5c99b', '#6e8e70'];

function colorHex(value: number): string {
  return '#' + Math.max(0, Math.min(0xffffff, Math.round(value))).toString(16).padStart(6, '0');
}

function blendHex(base: number, overlay: number, amount: number): string {
  const ratio = Math.max(0, Math.min(1, amount));
  const channel = (shift: number): number => {
    const a = (base >> shift) & 0xff;
    const b = (overlay >> shift) & 0xff;
    return Math.round(a * (1 - ratio) + b * ratio);
  };
  return '#' + [channel(16), channel(8), channel(0)]
    .map((value) => value.toString(16).padStart(2, '0')).join('');
}

export function createWorkshopScene(
  canvas: HTMLCanvasElement,
  onInteract: (station: WorkshopStation) => void,
  onNearbyChange: (station: WorkshopStation | null) => void,
): WorkshopScene {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D indisponible');

  const player = { x: 735, y: 520 };
  const keys = new Set<string>();
  const particles: Particle[] = [];
  let destination: { x: number; y: number } | null = null;
  let frame = 0;
  let lastFrame = performance.now();
  let nearby: WorkshopStation | null = null;
  let theme: WorkshopTheme = {
    background: 0x9da88f,
    floorColor: 0xe3d5b7,
    accent: 0x4b5a43,
    belt: 0xa46f4e,
  };
  let destroyed = false;
  let lastReported: WorkshopStation | null = null;
  let elapsedWorld = 0;
  let facing: MoveDirection = 'down';
  let walking = false;
  let actionUntil = 0;
  let actionStation: WorkshopStation | null = null;
  let cameraX = 0;
  let cameraY = 0;

  const resize = (): void => {
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(bounds.width * ratio));
    canvas.height = Math.max(1, Math.round(bounds.height * ratio));
    context!.setTransform(canvas.width / VIEW_WIDTH, 0, 0, canvas.height / VIEW_HEIGHT, 0, 0);
    draw();
  };

  const roundedRect = (
    x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string,
  ): void => {
    const c = context!;
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.fillStyle = fill;
    c.fill();
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 2;
      c.stroke();
    }
  };

  function addBurst(x: number, y: number, color: string, count = 9): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * .3;
      const speed = 24 + Math.random() * 48;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 12,
        life: .55 + Math.random() * .45,
        maxLife: .55 + Math.random() * .45,
        color,
        size: 2 + Math.random() * 2.5,
      });
    }
  }

  function triggerInteraction(stationId: WorkshopStation): void {
    const station = STATIONS.find((item) => item.id === stationId);
    if (!station) return;
    actionStation = stationId;
    actionUntil = elapsedWorld + .65;
    addBurst(station.x, station.y - 28, station.color, stationId === 'laboratory' ? 14 : 9);
    onInteract(stationId);
  }

  function drawHerbBed(station: Station, index: number): void {
    const c = context!;
    const sway = Math.sin(elapsedWorld * 2.1 + index * 1.7) * 2.1;
    c.save();
    c.translate(station.x, station.y);
    c.fillStyle = 'rgba(40,48,31,.18)';
    c.beginPath();
    c.ellipse(0, 28, 47, 11, 0, 0, Math.PI * 2);
    c.fill();
    roundedRect(-43, -28, 86, 58, 7, '#a98e65', '#75684e');
    roundedRect(-38, -23, 76, 48, 5, '#5e7650', '#d1bd91');
    for (let i = 0; i < 7; i++) {
      const px = -27 + (i % 4) * 18;
      const py = -13 + Math.floor(i / 4) * 24;
      c.strokeStyle = '#425d3f';
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(px, py + 9);
      c.quadraticCurveTo(px + sway * .4, py, px + sway, py - 7);
      c.stroke();
      c.fillStyle = HERB_COLORS[(i + index) % HERB_COLORS.length];
      c.beginPath();
      c.ellipse(px - 5 + sway, py + 1, 6, 3.5, -.55 + sway * .02, 0, Math.PI * 2);
      c.ellipse(px + 5 + sway, py - 4, 6, 3.5, .55 + sway * .02, 0, Math.PI * 2);
      c.fill();
      if (station.id === 'rose' || station.id === 'lavender' || station.id === 'jasmine') {
        c.fillStyle = station.color;
        c.beginPath();
        c.arc(px + sway, py - 8, station.id === 'lavender' ? 3 : 4, 0, Math.PI * 2);
        c.fill();
      }
    }
    drawStationLabel(station);
    c.restore();
  }

  function drawStationLabel(station: Station): void {
    const c = context!;
    c.fillStyle = '#f6f0e2';
    c.font = 'bold 11px system-ui';
    c.textAlign = 'center';
    c.fillText(station.title, 0, 48);
    c.fillStyle = '#4c5841';
    c.font = '10px system-ui';
    c.fillText(station.detail, 0, 62);
    if (nearby === station.id) {
      c.strokeStyle = '#f2ce83';
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(0, 0, 51, 42, 0, 0, Math.PI * 2);
      c.stroke();
      roundedRect(-24, -60, 48, 22, 6, '#344735', '#f2ce83');
      c.fillStyle = '#fff7e4';
      c.font = 'bold 13px system-ui';
      c.fillText('E · AGIR', 0, -45);
    }
  }

  function drawMachine(station: Station): void {
    const c = context!;
    const active = actionStation === station.id && elapsedWorld < actionUntil;
    const glow = active ? 5 + Math.sin(elapsedWorld * 25) * 2 : 0;
    c.save();
    c.translate(station.x, station.y);
    c.fillStyle = 'rgba(37,42,31,.2)';
    c.beginPath();
    c.ellipse(0, 31, 52, 12, 0, 0, Math.PI * 2);
    c.fill();

    if (station.id === 'laboratory') {
      if (active) {
        c.shadowColor = '#d7b96f';
        c.shadowBlur = 18 + glow;
      }
      roundedRect(-52, -35, 104, 64, 7, '#76583e', '#443b2d');
      c.shadowBlur = 0;
      roundedRect(-44, -28, 88, 45, 4, '#d4c29b', '#ad8b57');
      roundedRect(-36, -22, 21, 29, 4, '#4e7465', '#355648');
      roundedRect(-9, -22, 21, 29, 4, '#b66b4c', '#7d4c37');
      roundedRect(19, -22, 18, 29, 4, '#7b8f9b', '#4b626c');
      c.fillStyle = 'rgba(241,228,179,.8)';
      c.fillRect(-32, -15 + Math.sin(elapsedWorld * 5) * 2, 13, 3);
      c.fillRect(-5, -8 + Math.sin(elapsedWorld * 4 + 1) * 2, 13, 3);
      c.fillStyle = '#b8a178';
      c.fillRect(-47, 19, 8, 13);
      c.fillRect(39, 19, 8, 13);
      c.strokeStyle = '#e7d4a7';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-25, -35); c.lineTo(-25, -43); c.lineTo(25, -43); c.lineTo(25, -35);
      c.stroke();
      c.fillStyle = '#d9e2d1';
      c.beginPath();
      c.arc(0, -44, 4 + Math.sin(elapsedWorld * 6) * 1.3, 0, Math.PI * 2);
      c.fill();
    } else {
      if (active) {
        c.shadowColor = '#d7b96f';
        c.shadowBlur = 18 + glow;
      }
      roundedRect(-55, -32, 110, 62, 5, '#5a4735', '#3c352a');
      c.shadowBlur = 0;
      roundedRect(-49, -26, 98, 21, 3, '#c7a86c', '#8e7144');
      c.fillStyle = '#f0e7d4';
      c.fillRect(-25, -19, 50, 4);
      c.fillStyle = '#8f6546';
      c.fillRect(-40, 1, 80, 20);
      for (let i = 0; i < 3; i++) {
        const bx = -27 + i * 27;
        c.fillStyle = '#e6d7b6';
        c.beginPath();
        c.moveTo(bx - 8, -4); c.lineTo(bx - 7, -15); c.quadraticCurveTo(bx, -21, bx + 7, -15);
        c.lineTo(bx + 8, -4); c.closePath(); c.fill();
        c.fillStyle = ['#81977a', '#ba8b91', '#bfa66a'][i];
        c.fillRect(bx - 4, -12, 8, 8);
      }
      c.fillStyle = '#44372b';
      c.fillRect(-43, 25, 9, 9);
      c.fillRect(34, 25, 9, 9);
    }
    drawStationLabel(station);
    c.restore();
  }

  function drawPlayer(): void {
    const c = context!;
    const isActing = actionStation !== null && elapsedWorld < actionUntil;
    const walkPhase = walking ? Math.sin(elapsedWorld * 15) : 0;
    const bob = walking ? Math.abs(Math.sin(elapsedWorld * 15)) * 2.5 : Math.sin(elapsedWorld * 2.4) * .7;
    const armSwing = walking ? walkPhase * 5 : 0;
    c.save();
    c.translate(player.x, player.y + bob);
    c.fillStyle = 'rgba(41,44,36,.22)';
    c.beginPath();
    c.ellipse(0, 17, 15, 7, 0, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = '#4b3a2c';
    c.lineWidth = 5;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-5, 9); c.lineTo(-6 + armSwing * .55, 16 + Math.abs(walkPhase) * 1.5);
    c.moveTo(5, 9); c.lineTo(6 - armSwing * .55, 16 + Math.abs(walkPhase) * 1.5);
    c.stroke();

    c.strokeStyle = '#344735';
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(-7, 0); c.lineTo(-8 - armSwing * .35, 8);
    c.moveTo(7, 0); c.lineTo(8 + armSwing * .35, 8);
    c.stroke();

    roundedRect(-10, -12, 20, 25, 6, '#344735', '#f6f0e2');
    c.fillStyle = '#c5a36c';
    c.fillRect(-7, -3, 14, 3);
    c.fillStyle = '#e0c28b';
    c.beginPath();
    c.arc(0, -17, 9, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#5a4534';
    c.beginPath();
    c.arc(0, -20, 9, Math.PI, Math.PI * 2);
    c.lineTo(8, -17);
    c.quadraticCurveTo(0, -22, -8, -17);
    c.closePath();
    c.fill();

    const eyeY = facing === 'up' ? -19 : -15;
    if (facing !== 'up') {
      c.fillStyle = '#3c3328';
      const eyeX = facing === 'left' ? -4 : facing === 'right' ? 4 : 0;
      c.beginPath();
      c.arc(eyeX - (facing === 'down' ? 3 : 0), eyeY, 1.2, 0, Math.PI * 2);
      c.arc(eyeX + (facing === 'down' ? 3 : 0), eyeY, 1.2, 0, Math.PI * 2);
      c.fill();
    }

    if (isActing) {
      const reach = Math.sin((actionUntil - elapsedWorld) / .65 * Math.PI) * 8;
      c.strokeStyle = '#e0c28b';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(7, -5); c.lineTo(13 + reach, -9 - reach * .4);
      c.stroke();
    }
    c.fillStyle = '#f6f0e2';
    c.font = 'bold 10px system-ui';
    c.textAlign = 'center';
    c.fillText('TOI', 0, 31);
    c.restore();
  }

  function drawGround(): void {
    const c = context!;
    c.fillStyle = colorHex(theme.floorColor);
    c.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    c.fillStyle = colorHex(theme.background);
    c.fillRect(0, 0, 650, WORLD_HEIGHT);
    c.fillStyle = blendHex(theme.floorColor, 0xffffff, 0.10);
    c.fillRect(650, 0, 350, WORLD_HEIGHT);
    c.fillStyle = blendHex(theme.floorColor, theme.belt, 0.18);
    c.fillRect(1000, 0, WORLD_WIDTH - 1000, WORLD_HEIGHT);

    c.fillStyle = 'rgba(248,241,218,.24)';
    c.fillRect(650, 0, 350, WORLD_HEIGHT);
    c.fillStyle = 'rgba(255,255,255,.09)';
    for (let y = 20; y < WORLD_HEIGHT; y += 64) {
      c.fillRect(24, y, 590, 2);
      c.fillRect(1024, y, 390, 2);
    }

    c.strokeStyle = 'rgba(57,65,47,.10)';
    c.lineWidth = 1;
    for (let x = 0; x <= WORLD_WIDTH; x += 32) {
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, WORLD_HEIGHT); c.stroke();
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += 32) {
      c.beginPath(); c.moveTo(0, y); c.lineTo(WORLD_WIDTH, y); c.stroke();
    }

    // Footpaths and decorative planters give the garden a readable layout.
    const pathFill = blendHex(theme.floorColor, theme.belt, 0.22);
    const pathStroke = blendHex(theme.floorColor, theme.accent, 0.22);
    roundedRect(52, 82, 550, 32, 9, pathFill, pathStroke);
    roundedRect(52, 625, 550, 28, 8, pathFill, pathStroke);
    roundedRect(604, 115, 34, 495, 8, pathFill, pathStroke);
    roundedRect(680, 84, 292, 38, 8, pathFill, pathStroke);
    roundedRect(680, 605, 292, 34, 8, pathFill, pathStroke);
    roundedRect(1030, 84, 370, 38, 8, blendHex(theme.floorColor, theme.belt, 0.30), pathStroke);
    roundedRect(1030, 605, 370, 34, 8, blendHex(theme.floorColor, theme.belt, 0.30), pathStroke);

    // Doorways remain open between the three connected rooms.
    c.fillStyle = blendHex(theme.accent, 0x000000, 0.22);
    c.fillRect(646, 0, 8, DOOR_TOP);
    c.fillRect(646, DOOR_BOTTOM, 8, WORLD_HEIGHT - DOOR_BOTTOM);
    c.fillRect(996, 0, 8, DOOR_TOP);
    c.fillRect(996, DOOR_BOTTOM, 8, WORLD_HEIGHT - DOOR_BOTTOM);
    c.fillStyle = blendHex(theme.floorColor, 0xffffff, 0.24);
    c.fillRect(648, DOOR_TOP, 4, DOOR_BOTTOM - DOOR_TOP);
    c.fillRect(998, DOOR_TOP, 4, DOOR_BOTTOM - DOOR_TOP);

    // Room signs are painted into the world, not fixed to the screen.
    roundedRect(36, 20, 330, 44, 7, 'rgba(246,240,226,.92)', '#aaa087');
    roundedRect(676, 20, 300, 44, 7, 'rgba(246,240,226,.92)', '#aaa087');
    roundedRect(1026, 20, 350, 44, 7, 'rgba(246,240,226,.92)', '#aaa087');
    c.fillStyle = colorHex(theme.accent);
    c.textAlign = 'left';
    c.font = 'bold 15px system-ui';
    c.fillText('JARDIN BOTANIQUE', 52, 47);
    c.fillText('LABORATOIRE', 692, 47);
    c.fillText('BOUTIQUE', 1042, 47);

    // Storage shelves and barrels add depth to the workshop rooms.
    for (let i = 0; i < 4; i++) {
      const x = 1050 + i * 83;
      roundedRect(x, 145, 62, 35, 4, colorHex(theme.belt), colorHex(theme.accent));
      for (let j = 0; j < 3; j++) {
        c.fillStyle = [colorHex(theme.background), colorHex(theme.floorColor), colorHex(theme.accent)][j];
        c.beginPath();
        c.arc(x + 13 + j * 18, 159, 6, 0, Math.PI * 2);
        c.fill();
      }
    }
    roundedRect(1050, 525, 70, 48, 6, colorHex(theme.belt), colorHex(theme.accent));
    roundedRect(1134, 525, 70, 48, 6, colorHex(theme.belt), colorHex(theme.accent));
    roundedRect(1218, 525, 70, 48, 6, colorHex(theme.belt), colorHex(theme.accent));
  }

  function draw(): void {
    const c = context!;
    c.setTransform(canvas.width / VIEW_WIDTH, 0, 0, canvas.height / VIEW_HEIGHT, 0, 0);
    c.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    c.save();
    c.translate(-cameraX, -cameraY);
    drawGround();
    STATIONS.filter((station) => !['laboratory', 'counter'].includes(station.id)).forEach((station, i) => {
      drawHerbBed(station, i);
    });
    STATIONS.filter((station) => station.id === 'laboratory' || station.id === 'counter').forEach(drawMachine);

    for (const particle of particles) {
      c.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      c.fillStyle = particle.color;
      c.beginPath();
      c.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
    drawPlayer();
    c.restore();

    // Subtle edge vignette frames the camera view.
    const vignette = c.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
    vignette.addColorStop(0, 'rgba(54,54,39,.08)');
    vignette.addColorStop(.18, 'rgba(54,54,39,0)');
    vignette.addColorStop(.82, 'rgba(54,54,39,0)');
    vignette.addColorStop(1, 'rgba(54,54,39,.08)');
    c.fillStyle = vignette;
    c.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }

  function nearestStation(): Station | null {
    let result: Station | null = null;
    let best = 68;
    for (const station of STATIONS) {
      const distance = Math.hypot(player.x - station.x, player.y - station.y);
      if (distance < best) {
        best = distance;
        result = station;
      }
    }
    return result;
  }

  function movePlayer(dx: number, dy: number): void {
    const nextX = Math.max(22, Math.min(WORLD_WIDTH - 22, player.x + dx));
    const nextY = Math.max(76, Math.min(WORLD_HEIGHT - 24, player.y + dy));
    const crossesWall = WALLS.some((wall) =>
      ((player.x < wall && nextX >= wall) || (player.x > wall && nextX <= wall)) &&
      (nextY < DOOR_TOP || nextY > DOOR_BOTTOM),
    );
    if (!crossesWall) player.x = nextX;
    player.y = nextY;
    if (dx < 0) facing = 'left';
    else if (dx > 0) facing = 'right';
    if (dy < 0 && Math.abs(dy) >= Math.abs(dx)) facing = 'up';
    else if (dy > 0 && Math.abs(dy) >= Math.abs(dx)) facing = 'down';
  }

  function update(now: number): void {
    if (destroyed) return;
    const elapsed = Math.min(.05, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    elapsedWorld += elapsed;
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
      if (distance < 5) destination = null;
      else { dx = tx / distance; dy = ty / distance; }
    }
    walking = dx !== 0 || dy !== 0;
    if (walking) {
      const length = Math.hypot(dx, dy);
      movePlayer(dx / length * PLAYER_SPEED * elapsed, dy / length * PLAYER_SPEED * elapsed);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i]!;
      particle.life -= elapsed;
      particle.x += particle.vx * elapsed;
      particle.y += particle.vy * elapsed;
      particle.vy += 25 * elapsed;
      if (particle.life <= 0) particles.splice(i, 1);
    }

    const targetCameraX = Math.max(0, Math.min(WORLD_WIDTH - VIEW_WIDTH, player.x - VIEW_WIDTH / 2));
    const targetCameraY = Math.max(0, Math.min(WORLD_HEIGHT - VIEW_HEIGHT, player.y - VIEW_HEIGHT / 2));
    cameraX += (targetCameraX - cameraX) * Math.min(1, elapsed * 8);
    cameraY += (targetCameraY - cameraY) * Math.min(1, elapsed * 8);

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
      if (nearby) { triggerInteraction(nearby); event.preventDefault(); }
    }
  };
  const keyup = (event: KeyboardEvent): void => { keys.delete(event.key.toLowerCase()); };
  const pointer = (event: PointerEvent): void => {
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width * VIEW_WIDTH + cameraX;
    const y = (event.clientY - bounds.top) / bounds.height * VIEW_HEIGHT + cameraY;
    const station = STATIONS.find((item) => Math.hypot(item.x - x, item.y - y) < 58);
    if (station) {
      const offset = station.id === 'counter' || station.id === 'laboratory' ? -72 : 64;
      destination = { x: station.x + offset, y: station.y + 48 };
    } else {
      destination = { x, y };
    }
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
      const distance = 48;
      if (direction === 'up') movePlayer(0, -distance);
      if (direction === 'down') movePlayer(0, distance);
      if (direction === 'left') movePlayer(-distance, 0);
      if (direction === 'right') movePlayer(distance, 0);
      destination = null;
      draw();
      nearby = nearestStation()?.id ?? null;
      onNearbyChange(nearby);
    },
    interact(): void { if (nearby) triggerInteraction(nearby); },
    setTheme(nextTheme: WorkshopTheme): void {
      theme = {
        background: nextTheme.background,
        floorColor: nextTheme.floorColor,
        accent: nextTheme.accent,
        belt: nextTheme.belt,
      };
      draw();
    },
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
