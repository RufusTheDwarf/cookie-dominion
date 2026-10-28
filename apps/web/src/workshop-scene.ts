export type WorkshopStation =
  | 'lavender' | 'mint' | 'rose' | 'bergamot' | 'sandalwood' | 'jasmine' | 'resin'
  | 'laboratory' | 'counter' | 'stairs';

export type MoveDirection = 'up' | 'down' | 'left' | 'right';

export interface WorkshopTheme {
  background: number;
  floorColor: number;
  accent: number;
  belt: number;
}

export interface WorkshopMachineVisual {
  id: string;
  short: string;
  name: string;
  floor: number;
  count: number;
}

export interface WorkshopScene {
  move(direction: MoveDirection): void;
  interact(): void;
  setEnvironment(theme: WorkshopTheme, floor: number, machines: WorkshopMachineVisual[]): void;
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
  { id: 'stairs', x: 925, y: 520, title: 'ESCALIER', detail: 'Ouvrir un étage', color: '#8e7051' },
  { id: 'counter', x: 1225, y: 355, title: 'COMPTOIR', detail: 'Vendre un flacon', color: '#53694c' },
];

const HERB_COLORS = ['#71885b', '#8ba36a', '#b2b67a', '#d5c99b', '#6e8e70'];
const MATERIAL_STATION_IDS = new Set<WorkshopStation>([
  'lavender', 'mint', 'rose', 'bergamot', 'sandalwood', 'jasmine', 'resin',
]);
const MACHINE_POSITIONS: Record<number, Record<string, { x: number; y: number }>> = {
  0: {
    'formulation-table': { x: 730, y: 230 },
    'copper-still': { x: 1125, y: 230 },
  },
  1: {
    'bottling-line': { x: 170, y: 180 },
    'perfumer-studio': { x: 420, y: 180 },
    'botanical-garden': { x: 170, y: 520 },
    'enfleurage-press': { x: 420, y: 520 },
    'luxury-atelier': { x: 790, y: 170 },
  },
  2: {
    'astral-extractor': { x: 180, y: 180 },
    'crystal-distiller': { x: 420, y: 180 },
    'orbital-manufactory': { x: 300, y: 520 },
  },
};

function blendColor(base: number, overlay: number, amount: number): number {
  const ratio = Math.max(0, Math.min(1, amount));
  const channel = (shift: number): number => {
    const a = (base >> shift) & 0xff;
    const b = (overlay >> shift) & 0xff;
    return Math.round(a * (1 - ratio) + b * ratio);
  };
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

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
  let currentFloor = 0;
  let placedMachines: WorkshopMachineVisual[] = [];
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

    if (station.id === 'stairs') {
      if (active) {
        c.shadowColor = '#dfc28c';
        c.shadowBlur = 14 + glow;
      }
      roundedRect(-38, -8, 76, 35, 5, '#6f5a42', '#47382a');
      c.shadowBlur = 0;
      roundedRect(-31, -31, 62, 56, 4, '#bba37e', '#72583d');
      for (let step = 0; step < 4; step++) {
        const y = -24 + step * 12;
        roundedRect(-25 + step * 3, y, 50 - step * 6, 9, 2,
          step % 2 === 0 ? '#e3d1ac' : '#c7ad80', '#8a6e48');
      }
      c.strokeStyle = '#6d5537';
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(-30, -28); c.lineTo(30, -28); c.stroke();
      c.fillStyle = '#f2e7ce';
      c.beginPath(); c.moveTo(0, -39); c.lineTo(-6, -32); c.lineTo(6, -32); c.closePath(); c.fill();
    } else if (station.id === 'laboratory') {
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
    const palette: WorkshopTheme = currentFloor === 0 ? theme : currentFloor === 1 ? {
      background: blendColor(theme.background, 0x526b7b, 0.55),
      floorColor: blendColor(theme.floorColor, 0xbac7ce, 0.35),
      accent: blendColor(theme.accent, 0x42515a, 0.30),
      belt: blendColor(theme.belt, 0x697f8b, 0.35),
    } : {
      background: blendColor(theme.background, 0x252e64, 0.65),
      floorColor: blendColor(theme.floorColor, 0x9badd2, 0.30),
      accent: blendColor(theme.accent, 0x302c65, 0.50),
      belt: blendColor(theme.belt, 0x8a74ba, 0.45),
    };
    c.fillStyle = colorHex(palette.floorColor);
    c.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    c.fillStyle = colorHex(palette.background);
    c.fillRect(0, 0, 650, WORLD_HEIGHT);
    c.fillStyle = blendHex(palette.floorColor, 0xffffff, 0.10);
    c.fillRect(650, 0, 350, WORLD_HEIGHT);
    c.fillStyle = blendHex(palette.floorColor, palette.belt, 0.18);
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
    const pathFill = blendHex(palette.floorColor, palette.belt, 0.22);
    const pathStroke = blendHex(palette.floorColor, palette.accent, 0.22);
    roundedRect(52, 82, 550, 32, 9, pathFill, pathStroke);
    roundedRect(52, 625, 550, 28, 8, pathFill, pathStroke);
    roundedRect(604, 115, 34, 495, 8, pathFill, pathStroke);
    roundedRect(680, 84, 292, 38, 8, pathFill, pathStroke);
    roundedRect(680, 605, 292, 34, 8, pathFill, pathStroke);
    roundedRect(1030, 84, 370, 38, 8, blendHex(palette.floorColor, palette.belt, 0.30), pathStroke);
    roundedRect(1030, 605, 370, 34, 8, blendHex(palette.floorColor, palette.belt, 0.30), pathStroke);

    // Doorways remain open between the three connected rooms.
    c.fillStyle = blendHex(palette.accent, 0x000000, 0.22);
    c.fillRect(646, 0, 8, DOOR_TOP);
    c.fillRect(646, DOOR_BOTTOM, 8, WORLD_HEIGHT - DOOR_BOTTOM);
    c.fillRect(996, 0, 8, DOOR_TOP);
    c.fillRect(996, DOOR_BOTTOM, 8, WORLD_HEIGHT - DOOR_BOTTOM);
    c.fillStyle = blendHex(palette.floorColor, 0xffffff, 0.24);
    c.fillRect(648, DOOR_TOP, 4, DOOR_BOTTOM - DOOR_TOP);
    c.fillRect(998, DOOR_TOP, 4, DOOR_BOTTOM - DOOR_TOP);

    // Room signs are painted into the world, not fixed to the screen.
    roundedRect(36, 20, 330, 44, 7, 'rgba(246,240,226,.92)', '#aaa087');
    roundedRect(676, 20, 300, 44, 7, 'rgba(246,240,226,.92)', '#aaa087');
    roundedRect(1026, 20, 350, 44, 7, 'rgba(246,240,226,.92)', '#aaa087');
    c.fillStyle = colorHex(theme.accent);
    c.textAlign = 'left';
    c.font = 'bold 15px system-ui';
    const roomTitles = currentFloor === 0
      ? ['JARDIN BOTANIQUE', 'LABORATOIRE', 'BOUTIQUE']
      : currentFloor === 1
        ? ['PRODUCTION', 'CONDITIONNEMENT', 'EXPÉDITION']
        : ['EXTRACTION RARE', 'DISTILLATION', 'RÉSERVE D’ESSENCES'];
    c.fillText(roomTitles[0], 52, 47);
    c.fillText(roomTitles[1], 692, 47);
    c.fillText(roomTitles[2], 1042, 47);
    roundedRect(1210, 672, 195, 28, 6, 'rgba(246,240,226,.92)', '#aaa087');
    c.textAlign = 'center';
    c.font = 'bold 11px system-ui';
    c.fillText('ÉTAGE ' + currentFloor + ' · ' + ['ARTISANAT', 'MANUFACTURE', 'ESSENCES RARES'][currentFloor], 1307, 690);

    // Storage shelves and barrels add depth to the workshop rooms.
    for (let i = 0; i < 4; i++) {
      const x = 1050 + i * 83;
      roundedRect(x, 145, 62, 35, 4, colorHex(palette.belt), colorHex(palette.accent));
      for (let j = 0; j < 3; j++) {
        c.fillStyle = [colorHex(palette.background), colorHex(palette.floorColor), colorHex(palette.accent)][j];
        c.beginPath();
        c.arc(x + 13 + j * 18, 159, 6, 0, Math.PI * 2);
        c.fill();
      }
    }
    roundedRect(1050, 525, 70, 48, 6, colorHex(palette.belt), colorHex(palette.accent));
    roundedRect(1134, 525, 70, 48, 6, colorHex(palette.belt), colorHex(palette.accent));
    roundedRect(1218, 525, 70, 48, 6, colorHex(palette.belt), colorHex(palette.accent));
  }

  function drawPlacedMachines(): void {
    const c = context!;
    const positions = MACHINE_POSITIONS[currentFloor] ?? {};
    placedMachines.forEach((machine, index) => {
      if (machine.floor !== currentFloor || machine.count <= 0) return;
      const position = positions[machine.id];
      if (!position) return;
      const { x, y } = position;
      const pulse = 0.5 + (Math.sin(elapsedWorld * 2.8 + index * 1.7) + 1) * 0.5;
      const isBottling = machine.id === 'bottling-line';
      const isDistiller = machine.id.includes('still') || machine.id.includes('extractor') || machine.id.includes('distiller');
      const isGarden = machine.id === 'botanical-garden';
      const isPress = machine.id === 'enfleurage-press';
      const metal = currentFloor === 2 ? '#514b83' : currentFloor === 1 ? '#596d78' : '#73553c';
      const trim = currentFloor === 2 ? '#b7a4ef' : currentFloor === 1 ? '#c3d3d6' : '#c9a66d';
      c.save();
      c.translate(x, y);
      c.fillStyle = 'rgba(30,34,29,.23)';
      c.beginPath(); c.ellipse(0, 24, 43, 10, 0, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 0.12 + pulse * 0.12;
      c.fillStyle = trim;
      c.beginPath(); c.ellipse(0, 0, 43 + pulse * 3, 28 + pulse * 2, 0, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
      if (isGarden) {
        roundedRect(-38, -10, 76, 35, 5, '#765840', '#4c3a2c');
        roundedRect(-33, -20, 66, 20, 4, '#637b4d', '#405538');
        for (let plant = 0; plant < 5; plant++) {
          const px = -25 + plant * 12;
          const sway = Math.sin(elapsedWorld * 2.3 + plant) * 2;
          c.strokeStyle = '#334c31'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(px, -18); c.lineTo(px + sway, -34); c.stroke();
          c.fillStyle = ['#a5bb78', '#7fa66d', '#d1bf80'][plant % 3];
          c.beginPath(); c.ellipse(px + sway - 4, -29, 5, 2.8, -0.35, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.ellipse(px + sway + 4, -24, 5, 2.8, 0.3, 0, Math.PI * 2); c.fill();
        }
      } else if (isBottling) {
        roundedRect(-43, 5, 86, 17, 4, metal, '#343b39');
        c.fillStyle = '#384a4d'; c.fillRect(-34, -1, 68, 9);
        c.fillStyle = trim; c.fillRect(-37, 1 + Math.sin(elapsedWorld * 4) * 2, 74, 3);
        for (let bottle = 0; bottle < 3; bottle++) {
          const bx = -23 + bottle * 23 + Math.sin(elapsedWorld * 1.3 + bottle) * 2;
          roundedRect(bx - 6, -21, 12, 21, 3, '#b6d4c4', '#607d70');
          c.fillStyle = '#e9d6a4'; c.fillRect(bx - 3, -26, 6, 6);
        }
        c.fillStyle = trim; c.fillRect(-7, -34, 14, 10);
      } else if (isDistiller) {
        roundedRect(-30, -1, 60, 25, 5, metal, '#343b39');
        roundedRect(-20, -28, 40, 28, 8, '#b6d0d2', '#4c777d');
        c.fillStyle = currentFloor === 2 ? '#a99bea' : '#d8bd7d';
        c.globalAlpha = 0.55 + pulse * 0.3;
        c.beginPath(); c.ellipse(0, -13, 15, 8 + pulse * 2, 0, 0, Math.PI * 2); c.fill();
        c.globalAlpha = 1; c.strokeStyle = trim; c.lineWidth = 4;
        c.beginPath(); c.moveTo(0, -28); c.lineTo(0, -39); c.lineTo(18, -39); c.lineTo(18, -27); c.stroke();
        c.fillStyle = trim; c.beginPath(); c.arc(18, -26, 4 + pulse * 1.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#e9e5d6'; c.fillRect(-16, 7, 32, 4);
      } else if (isPress) {
        roundedRect(-32, -2, 64, 29, 4, metal, '#343b39');
        roundedRect(-24, -39, 48, 7, 2, trim, '#604d3a');
        c.fillStyle = trim; c.fillRect(-20, -32, 5, 31); c.fillRect(15, -32, 5, 31);
        c.fillRect(-22, -11 + Math.sin(elapsedWorld * 2.4) * 2, 44, 5);
        c.fillStyle = '#8eae9b'; c.beginPath(); c.arc(0, 7, 10, 0, Math.PI * 2); c.fill();
      } else {
        roundedRect(-39, -3, 78, 27, 5, metal, '#343b39');
        roundedRect(-32, -18, 64, 16, 3, trim, '#6e573a');
        for (let vial = 0; vial < 3; vial++) {
          const vx = -22 + vial * 22;
          const bob = Math.sin(elapsedWorld * 2 + vial) * 1.5;
          roundedRect(vx - 5, -34 - bob, 10, 17, 3, ['#b3d0c1', '#d2b8a0', '#b2bde0'][vial], '#665d4e');
          c.fillStyle = '#e9d9b4'; c.fillRect(vx - 2, -38 - bob, 4, 5);
        }
      }
      roundedRect(-39, 31, 78, 17, 4, 'rgba(248,241,218,.94)', '#a28c64');
      c.fillStyle = '#3f4938'; c.textAlign = 'center'; c.font = 'bold 8px system-ui';
      c.fillText(machine.short.toUpperCase(), 0, 42);
      roundedRect(22, -40, 28, 17, 5, '#344735', trim);
      c.fillStyle = '#fff6df'; c.font = 'bold 9px system-ui';
      c.fillText('×' + machine.count, 36, -28);
      c.restore();
    });
  }

  function draw(): void {
    const c = context!;
    c.setTransform(canvas.width / VIEW_WIDTH, 0, 0, canvas.height / VIEW_HEIGHT, 0, 0);
    c.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    c.save();
    c.translate(-cameraX, -cameraY);
    drawGround();
    if (currentFloor === 0) {
      STATIONS.filter((station) => !['laboratory', 'counter', 'stairs'].includes(station.id)).forEach((station, i) => {
        drawHerbBed(station, i);
      });
    }
    STATIONS.filter((station) => station.id === 'laboratory' || station.id === 'counter' || station.id === 'stairs').forEach(drawMachine);
    drawPlacedMachines();

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
      if (currentFloor > 0 && MATERIAL_STATION_IDS.has(station.id)) continue;
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
      const offset = station.id === 'counter' || station.id === 'laboratory' ? -72 : station.id === 'stairs' ? -64 : 64;
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
    setEnvironment(nextTheme: WorkshopTheme, floor: number, nextMachines: WorkshopMachineVisual[]): void {
      theme = {
        background: nextTheme.background,
        floorColor: nextTheme.floorColor,
        accent: nextTheme.accent,
        belt: nextTheme.belt,
      };
      currentFloor = Number.isInteger(floor) ? Math.max(0, Math.min(2, floor)) : 0;
      placedMachines = nextMachines.map((machine) => ({ ...machine }));
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
