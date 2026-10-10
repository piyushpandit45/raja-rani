export interface Coordinate {
  x: number;
  y: number;
}

export interface Node extends Coordinate {
  id: number;
}

export interface Edge {
  from: number;
  to: number;
}

export const NODES: Node[] = [
  { id: 0, x: 90, y: 25 }, { id: 1, x: 180, y: 25 }, { id: 2, x: 270, y: 25 },
  { id: 3, x: 135, y: 80 }, { id: 4, x: 180, y: 80 }, { id: 5, x: 225, y: 80 },
  { id: 6, x: 30, y: 140 }, { id: 7, x: 105, y: 140 }, { id: 8, x: 180, y: 140 }, { id: 9, x: 255, y: 140 }, { id: 10, x: 330, y: 140 },
  { id: 11, x: 30, y: 195 }, { id: 12, x: 105, y: 195 }, { id: 13, x: 180, y: 195 }, { id: 14, x: 255, y: 195 }, { id: 15, x: 330, y: 195 },
  { id: 16, x: 30, y: 250 }, { id: 17, x: 105, y: 250 }, { id: 18, x: 180, y: 250 }, { id: 19, x: 255, y: 250 }, { id: 20, x: 330, y: 250 },
  { id: 21, x: 30, y: 305 }, { id: 22, x: 105, y: 305 }, { id: 23, x: 180, y: 305 }, { id: 24, x: 255, y: 305 }, { id: 25, x: 330, y: 305 },
  { id: 26, x: 30, y: 360 }, { id: 27, x: 105, y: 360 }, { id: 28, x: 180, y: 360 }, { id: 29, x: 255, y: 360 }, { id: 30, x: 330, y: 360 },
  { id: 31, x: 135, y: 420 }, { id: 32, x: 180, y: 420 }, { id: 33, x: 225, y: 420 },
  { id: 34, x: 90, y: 475 }, { id: 35, x: 180, y: 475 }, { id: 36, x: 270, y: 475 },
];

export const NODE_COORDINATES: Coordinate[] = NODES;

const edgeKeys = new Set<string>();
export const EDGES: Edge[] = [];

function connect(from: number, to: number) {
  const key = `${Math.min(from, to)}-${Math.max(from, to)}`;
  if (!edgeKeys.has(key)) {
    edgeKeys.add(key);
    EDGES.push({ from, to });
  }
}

function connectRow(firstNode: number, count: number) {
  for (let index = 0; index < count - 1; index++) {
    connect(firstNode + index, firstNode + index + 1);
  }
}

// Horizontal tracks across the crowns and all five central grid rows.
connectRow(0, 3);
connectRow(3, 3);
for (let row = 0; row < 5; row++) {
  connectRow(6 + row * 5, 5);
}

connectRow(31, 3);
connectRow(34, 3);

// Four complete outer spines.
for (const columnStart of [6, 7, 9, 10]) {
  for (let row = 0; row < 4; row++) {
    connect(columnStart + row * 5, columnStart + (row + 1) * 5);
  }
}

// Central spine links the crown tips through the center column.
for (const [from, to] of [
  [1, 4], [4, 8], [8, 13], [13, 18],
  [18, 23], [23, 28], [28, 32], [32, 35],
]) {
  connect(from, to);
}

function connectPath(...nodes: number[]) {
  for (let index = 0; index < nodes.length - 1; index++) {
    connect(nodes[index], nodes[index + 1]);
  }
}

// Crown sides have no cross-lines.
connectPath(0, 3, 8);
connectPath(2, 5, 8);
connectPath(28, 31, 34);
connectPath(28, 33, 36);

// Four isolated X patterns through the center of each 2x2 grid quadrant.
connectPath(6, 12, 18);
connectPath(8, 12, 16);
connectPath(8, 14, 20);
connectPath(10, 14, 18);
connectPath(16, 22, 28);
connectPath(18, 22, 26);
connectPath(18, 24, 30);
connectPath(20, 24, 28);

export const ADJACENCY_LIST: Record<number, number[]> = Object.fromEntries(
  NODES.map(({ id }) => [id, []]),
);

for (const { from, to } of EDGES) {
  ADJACENCY_LIST[from].push(to);
  ADJACENCY_LIST[to].push(from);
}

export const JUMP_MAP: Record<string, number> = {};

for (const start of NODES) {
  for (const jumpedId of ADJACENCY_LIST[start.id]) {
    const jumped = NODES[jumpedId];
    for (const landingId of ADJACENCY_LIST[jumpedId]) {
      if (landingId === start.id) continue;

      const landing = NODES[landingId];
      const firstDx = jumped.x - start.x;
      const firstDy = jumped.y - start.y;
      const secondDx = landing.x - jumped.x;
      const secondDy = landing.y - jumped.y;
      const crossProduct = firstDx * secondDy - firstDy * secondDx;
      const firstLength = Math.hypot(firstDx, firstDy);
      const secondLength = Math.hypot(secondDx, secondDy);

      if (
        Math.abs(crossProduct) < 0.01 &&
        Math.abs(firstLength - secondLength) <= Math.max(firstLength, secondLength) * 0.15
      ) {
        JUMP_MAP[`${start.id}-${jumpedId}`] = landingId;
      }
    }
  }
}

export const INITIAL_PIECES: number[] = Array(37).fill(0);

for (let node = 0; node <= 15; node++) {
  INITIAL_PIECES[node] = 2;
}

for (let node = 21; node <= 36; node++) {
  INITIAL_PIECES[node] = 1;
}

export function areCollinear(node1: number, node2: number, node3: number): boolean {
  const first = NODES[node1];
  const second = NODES[node2];
  const third = NODES[node3];

  const area = first.x * (second.y - third.y) +
    second.x * (third.y - first.y) +
    third.x * (first.y - second.y);

  return Math.abs(area) < 0.1;
}

export function getJumpLanding(start: number, jumped: number): number | null {
  return JUMP_MAP[`${start}-${jumped}`] ?? null;
}

export function hasSubsequentJump(node: number, pieces: number[]): boolean {
  return getValidMoves(node, pieces).some((move) => move.isCapture);
}

export function isValidCapture(
  start: number,
  jumped: number,
  landing: number,
  pieces: number[],
): boolean {
  const jumpedPiece = pieces[jumped];
  const currentPiece = pieces[start];

  if (jumpedPiece === 0 || jumpedPiece === currentPiece || pieces[landing] !== 0) {
    return false;
  }

  return getJumpLanding(start, jumped) === landing;
}

export function getValidMoves(
  node: number,
  pieces: number[],
): { to: number; isCapture: boolean; capturedNode?: number }[] {
  const moves: { to: number; isCapture: boolean; capturedNode?: number }[] = [];
  const currentPiece = pieces[node];

  if (currentPiece === 0) return moves;

  for (const neighbor of ADJACENCY_LIST[node]) {
    if (pieces[neighbor] === 0) {
      moves.push({ to: neighbor, isCapture: false });
    } else if (pieces[neighbor] !== currentPiece) {
      const landing = getJumpLanding(node, neighbor);
      if (landing !== null && pieces[landing] === 0) {
        moves.push({ to: landing, isCapture: true, capturedNode: neighbor });
      }
    }
  }

  return moves;
}

export function isPlayerTerritory(node: number, player: 1 | 2): boolean {
  return player === 1 ? node >= 21 : node <= 15;
}
