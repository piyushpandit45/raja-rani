// AI Bot Service for all games
// Handles Easy, Medium, and Hard difficulty levels

import { getValidMoves, NODE_COORDINATES } from './sholoGutiGraph';

export type DifficultyType = 'easy' | 'medium' | 'hard';

// Dots & Boxes specific types
export interface DotsBoxesState {
  horizontalLines: boolean[][];
  verticalLines: boolean[][];
  boxes: number[][];
  currentPlayer: 1 | 2;
}

export interface Edge {
  type: 'horizontal' | 'vertical';
  row: number;
  col: number;
}

// SOS Game specific types
export interface SOSState {
  grid: ('' | 'S' | 'O')[][];
  currentPlayer: 1 | 2;
}

// Sholo Guti specific types
export interface SholoGutiState {
  pieces: number[]; // 37 nodes: 0 = empty, 1 = player1, 2 = player2
  currentPlayer: 1 | 2;
}

// ==================== DOTS & BOXES AI ====================

export class DotsBoxesAI {
  static getMove(state: DotsBoxesState, difficulty: DifficultyType): Edge {
    const legalMoves = this.getLegalMoves(state);

    if (legalMoves.length === 0) {
      throw new Error('No legal moves available');
    }

    switch (difficulty) {
      case 'easy':
        return this.getEasyMove(legalMoves);
      case 'medium':
        return this.getMediumMove(state, legalMoves);
      case 'hard':
        return this.getHardMove(state, legalMoves);
      default:
        return this.getEasyMove(legalMoves);
    }
  }

  private static getLegalMoves(state: DotsBoxesState): Edge[] {
    const moves: Edge[] = [];

    for (let row = 0; row < state.horizontalLines.length; row++) {
      for (let col = 0; col < state.horizontalLines[row].length; col++) {
        if (!state.horizontalLines[row][col]) {
          moves.push({ type: 'horizontal', row, col });
        }
      }
    }

    for (let row = 0; row < state.verticalLines.length; row++) {
      for (let col = 0; col < state.verticalLines[row].length; col++) {
        if (!state.verticalLines[row][col]) {
          moves.push({ type: 'vertical', row, col });
        }
      }
    }

    return moves;
  }

  private static getEasyMove(moves: Edge[]): Edge {
    const randomIndex = Math.floor(Math.random() * moves.length);
    return moves[randomIndex];
  }

  private static getMediumMove(state: DotsBoxesState, moves: Edge[]): Edge {
    // Priority 1: Complete a box (take the 4th edge)
    const completingMoves = moves.filter((move) =>
      this.willCompleteBox(state, move)
    );

    if (completingMoves.length > 0) {
      return this.getEasyMove(completingMoves);
    }

    // Priority 2: Avoid giving opponent a box (don't add 3rd edge to a box)
    const safeMoves = moves.filter((move) => !this.willGiveBox(state, move));

    if (safeMoves.length > 0) {
      return this.getEasyMove(safeMoves);
    }

    // Fallback to random
    return this.getEasyMove(moves);
  }

  private static getHardMove(state: DotsBoxesState, moves: Edge[]): Edge {
    // Priority 1: Complete a box
    const completingMoves = moves.filter((move) =>
      this.willCompleteBox(state, move)
    );

    if (completingMoves.length > 0) {
      return this.getEasyMove(completingMoves);
    }

    // Priority 2: Evaluate moves based on chain avoidance
    const scoredMoves = moves.map((move) => ({
      move,
      score: this.evaluateMove(state, move),
    }));

    scoredMoves.sort((a, b) => b.score - a.score);

    // Pick from top 3 best moves to add some variety
    const topMoves = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
    return this.getEasyMove(topMoves.map((m) => m.move));
  }

  private static willCompleteBox(state: DotsBoxesState, move: Edge): boolean {
    const { type, row, col } = move;

    if (type === 'horizontal') {
      // Check box above (if exists)
      if (row > 0) {
        const boxRow = row - 1;
        const boxCol = col;
        if (
          state.boxes[boxRow][boxCol] === 0 &&
          this.countBoxEdges(state, boxRow, boxCol) === 3
        ) {
          return true;
        }
      }
      // Check box below (if exists)
      if (row < state.boxes.length) {
        const boxRow = row;
        const boxCol = col;
        if (
          state.boxes[boxRow][boxCol] === 0 &&
          this.countBoxEdges(state, boxRow, boxCol) === 3
        ) {
          return true;
        }
      }
    } else {
      // Check box to the left (if exists)
      if (col > 0) {
        const boxRow = row;
        const boxCol = col - 1;
        if (
          state.boxes[boxRow][boxCol] === 0 &&
          this.countBoxEdges(state, boxRow, boxCol) === 3
        ) {
          return true;
        }
      }
      // Check box to the right (if exists)
      if (col < state.boxes[0].length) {
        const boxRow = row;
        const boxCol = col;
        if (
          state.boxes[boxRow][boxCol] === 0 &&
          this.countBoxEdges(state, boxRow, boxCol) === 3
        ) {
          return true;
        }
      }
    }

    return false;
  }

  private static willGiveBox(state: DotsBoxesState, move: Edge): boolean {
    const { type, row, col } = move;

    if (type === 'horizontal') {
      // Check box above (if exists)
      if (row > 0) {
        const boxRow = row - 1;
        const boxCol = col;
        if (
          state.boxes[boxRow][boxCol] === 0 &&
          this.countBoxEdges(state, boxRow, boxCol) === 2
        ) {
          return true;
        }
      }
      // Check box below (if exists)
      if (row < state.boxes.length) {
        const boxRow = row;
        const boxCol = col;
        if (
          state.boxes[boxRow][boxCol] === 0 &&
          this.countBoxEdges(state, boxRow, boxCol) === 2
        ) {
          return true;
        }
      }
    } else {
      // Check box to the left (if exists)
      if (col > 0) {
        const boxRow = row;
        const boxCol = col - 1;
        if (
          state.boxes[boxRow][boxCol] === 0 &&
          this.countBoxEdges(state, boxRow, boxCol) === 2
        ) {
          return true;
        }
      }
      // Check box to the right (if exists)
      if (col < state.boxes[0].length) {
        const boxRow = row;
        const boxCol = col;
        if (
          state.boxes[boxRow][boxCol] === 0 &&
          this.countBoxEdges(state, boxRow, boxCol) === 2
        ) {
          return true;
        }
      }
    }

    return false;
  }

  private static countBoxEdges(state: DotsBoxesState, boxRow: number, boxCol: number): number {
    let count = 0;

    // Top edge
    if (state.horizontalLines[boxRow][boxCol]) count++;
    // Bottom edge
    if (state.horizontalLines[boxRow + 1][boxCol]) count++;
    // Left edge
    if (state.verticalLines[boxRow][boxCol]) count++;
    // Right edge
    if (state.verticalLines[boxRow][boxCol + 1]) count++;

    return count;
  }

  private static evaluateMove(state: DotsBoxesState, move: Edge): number {
    let score = 0;

    // Penalty for giving opponent a box
    if (this.willGiveBox(state, move)) {
      score -= 10;
    }

    // Small bonus for moves that don't give boxes
    if (!this.willGiveBox(state, move)) {
      score += 1;
    }

    // Prefer edges in less crowded areas (simplified heuristic)
    const { type, row, col } = move;
    let adjacentEdges = 0;

    if (type === 'horizontal') {
      if (col > 0 && state.horizontalLines[row][col - 1]) adjacentEdges++;
      if (col < state.horizontalLines[row].length - 1 && state.horizontalLines[row][col + 1]) adjacentEdges++;
    } else {
      if (row > 0 && state.verticalLines[row - 1][col]) adjacentEdges++;
      if (row < state.verticalLines.length - 1 && state.verticalLines[row + 1][col]) adjacentEdges++;
    }

    score -= adjacentEdges * 0.5;

    return score;
  }
}

// ==================== SOS GAME AI ====================

export class SOSAI {
  static getMove(state: SOSState, difficulty: DifficultyType): { row: number; col: number; letter: 'S' | 'O' } {
    const emptyCells: { row: number; col: number }[] = [];

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (state.grid[row][col] === '') {
          emptyCells.push({ row, col });
        }
      }
    }

    if (emptyCells.length === 0) {
      throw new Error('No empty cells available');
    }

    switch (difficulty) {
      case 'easy':
        return this.getEasyMove(emptyCells);
      case 'medium':
        return this.getMediumMove(state, emptyCells);
      case 'hard':
        return this.getHardMove(state, emptyCells);
      default:
        return this.getEasyMove(emptyCells);
    }
  }

  private static getEasyMove(emptyCells: { row: number; col: number }[]): { row: number; col: number; letter: 'S' | 'O' } {
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const letter = Math.random() > 0.5 ? 'S' : 'O';
    return { ...randomCell, letter };
  }

  private static getMediumMove(state: SOSState, emptyCells: { row: number; col: number }[]): { row: number; col: number; letter: 'S' | 'O' } {
    // Priority 1: Complete an SOS
    for (const cell of emptyCells) {
      for (const letter of ['S', 'O'] as const) {
        if (this.willCompleteSOS(state, cell.row, cell.col, letter)) {
          return { ...cell, letter };
        }
      }
    }

    // Priority 2: Avoid giving opponent SOS
    const safeCells = emptyCells.filter((cell) => {
      for (const letter of ['S', 'O'] as const) {
        if (this.willGiveSOS(state, cell.row, cell.col, letter)) {
          return false;
        }
      }
      return true;
    });

    if (safeCells.length > 0) {
      return this.getEasyMove(safeCells);
    }

    return this.getEasyMove(emptyCells);
  }

  private static getHardMove(state: SOSState, emptyCells: { row: number; col: number }[]): { row: number; col: number; letter: 'S' | 'O' } {
    // Priority 1: Complete an SOS
    for (const cell of emptyCells) {
      for (const letter of ['S', 'O'] as const) {
        if (this.willCompleteSOS(state, cell.row, cell.col, letter)) {
          return { ...cell, letter };
        }
      }
    }

    // Priority 2: Evaluate cells based on strategic value
    const scoredCells = emptyCells.map((cell) => ({
      cell,
      score: this.evaluateCell(state, cell.row, cell.col),
    }));

    scoredCells.sort((a, b) => b.score - a.score);

    const topCells = scoredCells.slice(0, Math.min(3, scoredCells.length));
    const bestCell = this.getEasyMove(topCells.map((c) => c.cell));

    // Choose letter strategically
    const letter = this.chooseLetter(state, bestCell.row, bestCell.col);
    return { ...bestCell, letter };
  }

  private static willCompleteSOS(state: SOSState, row: number, col: number, letter: 'S' | 'O'): boolean {
    const tempGrid = state.grid.map(r => [...r]);
    tempGrid[row][col] = letter;
    return this.countSOS(tempGrid, row, col) > 0;
  }

  private static willGiveSOS(state: SOSState, row: number, col: number, letter: 'S' | 'O'): boolean {
    const tempGrid = state.grid.map(r => [...r]);
    tempGrid[row][col] = letter;

    // Check if placing this letter allows opponent to complete SOS on their next turn
    // This is a simplified check - in a full implementation, we'd check all adjacent cells
    const directions = [
      [0, 1], [0, -1], [1, 0], [-1, 0],
      [1, 1], [1, -1], [-1, 1], [-1, -1],
    ];

    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;

      if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10 && tempGrid[nr][nc] === '') {
        // Check if opponent could complete SOS by placing S or O here
        for (const oppLetter of ['S', 'O'] as const) {
          tempGrid[nr][nc] = oppLetter;
          if (this.countSOS(tempGrid, nr, nc) > 0) {
            return true;
          }
          tempGrid[nr][nc] = '';
        }
      }
    }

    return false;
  }

  private static evaluateCell(state: SOSState, row: number, col: number): number {
    let score = 0;

    // Central positions are more valuable
    const centerDist = Math.abs(row - 4.5) + Math.abs(col - 4.5);
    score -= centerDist * 0.5;

    // Bonus for cells that can complete SOS
    for (const letter of ['S', 'O'] as const) {
      if (this.willCompleteSOS(state, row, col, letter)) {
        score += 10;
      }
    }

    return score;
  }

  private static chooseLetter(state: SOSState, row: number, col: number): 'S' | 'O' {
    // Simplified: prefer O in center, S on edges
    const isCenter = row >= 3 && row <= 6 && col >= 3 && col <= 6;
    return isCenter ? 'O' : 'S';
  }

  private static countSOS(grid: ('' | 'S' | 'O')[][], row: number, col: number): number {
    let count = 0;
    const directions = [
      [0, 1], [0, -1], [1, 0], [-1, 0], // Horizontal, Vertical
      [1, 1], [1, -1], [-1, 1], [-1, -1], // Diagonals
    ];

    for (const [dr, dc] of directions) {
      // Check if this cell forms SOS in this direction
      if (this.checkSOSInDirection(grid, row, col, dr, dc)) {
        count++;
      }
    }

    return count;
  }

  private static checkSOSInDirection(grid: ('' | 'S' | 'O')[][], row: number, col: number, dr: number, dc: number): boolean {
    const letter = grid[row][col];
    if (letter !== 'S' && letter !== 'O') return false;

    if (letter === 'S') {
      // Check if there's an O and S following
      const or = row + dr;
      const oc = col + dc;
      const sr = row + 2 * dr;
      const sc = col + 2 * dc;

      if (
        or >= 0 && or < 10 && oc >= 0 && oc < 10 &&
        sr >= 0 && sr < 10 && sc >= 0 && sc < 10
      ) {
        return grid[or][oc] === 'O' && grid[sr][sc] === 'S';
      }
    } else if (letter === 'O') {
      // Check if there's S before and after
      const s1r = row - dr;
      const s1c = col - dc;
      const s2r = row + dr;
      const s2c = col + dc;

      if (
        s1r >= 0 && s1r < 10 && s1c >= 0 && s1c < 10 &&
        s2r >= 0 && s2r < 10 && s2c >= 0 && s2c < 10
      ) {
        return grid[s1r][s1c] === 'S' && grid[s2r][s2c] === 'S';
      }
    }

    return false;
  }
}

// ==================== SHOLO GUTI AI ====================

export class SholoGutiAI {
  static getMove(state: SholoGutiState, difficulty: DifficultyType): { from: number; to: number } {
    const legalMoves = this.getLegalMoves(state);

    if (legalMoves.length === 0) {
      throw new Error('No legal moves available');
    }

    const captureMoves = legalMoves.filter((move) => move.isCapture);
    if (captureMoves.length > 0) {
      return this.getEasyMove(captureMoves);
    }

    switch (difficulty) {
      case 'easy':
        return this.getEasyMove(legalMoves);
      case 'medium':
        return this.getMediumMove(state, legalMoves);
      case 'hard':
        return this.getHardMove(state, legalMoves);
      default:
        return this.getEasyMove(legalMoves);
    }
  }

  private static getLegalMoves(state: SholoGutiState): { from: number; to: number; isCapture: boolean }[] {
    const moves: { from: number; to: number; isCapture: boolean }[] = [];
    const currentPlayer = state.currentPlayer;

    for (let node = 0; node < 37; node++) {
      if (state.pieces[node] === currentPlayer) {
        const pieceMoves = getValidMoves(node, state.pieces);
        for (const move of pieceMoves) {
          moves.push({ from: node, to: move.to, isCapture: move.isCapture });
        }
      }
    }

    return moves;
  }

  private static getEasyMove(moves: { from: number; to: number; isCapture: boolean }[]): { from: number; to: number } {
    const randomIndex = Math.floor(Math.random() * moves.length);
    return { from: moves[randomIndex].from, to: moves[randomIndex].to };
  }

  private static getMediumMove(state: SholoGutiState, moves: { from: number; to: number; isCapture: boolean }[]): { from: number; to: number } {
    // Priority 1: Execute capture moves (mandatory in Sholo Guti)
    const captureMoves = moves.filter((move) => move.isCapture);

    if (captureMoves.length > 0) {
      return this.getEasyMove(captureMoves);
    }

    // Priority 2: Avoid dangerous positions
    const safeMoves = moves.filter((move) => !this.isDangerous(state, move));

    if (safeMoves.length > 0) {
      return this.getEasyMove(safeMoves);
    }

    return this.getEasyMove(moves);
  }

  private static getHardMove(state: SholoGutiState, moves: { from: number; to: number; isCapture: boolean }[]): { from: number; to: number } {
    // Priority 1: Execute capture moves
    const captureMoves = moves.filter((move) => move.isCapture);

    if (captureMoves.length > 0) {
      // Prefer multi-capture opportunities
      const multiCaptureMoves = captureMoves.filter((move) =>
        this.canContinueCapture(state, move.to)
      );

      if (multiCaptureMoves.length > 0) {
        return this.getEasyMove(multiCaptureMoves);
      }
      return this.getEasyMove(captureMoves);
    }

    // Priority 2: Evaluate moves using heuristic
    const scoredMoves = moves.map((move) => ({
      move,
      score: this.evaluateMove(state, move),
    }));

    scoredMoves.sort((a, b) => b.score - a.score);

    const topMoves = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
    return this.getEasyMove(topMoves.map((m) => m.move));
  }

  private static isDangerous(state: SholoGutiState, move: { from: number; to: number; isCapture: boolean }): boolean {
    // Check if moving to this position puts the piece in danger of being captured
    const opponent = state.currentPlayer === 1 ? 2 : 1;
    const tempPieces = [...state.pieces];
    tempPieces[move.from] = 0;
    tempPieces[move.to] = state.currentPlayer;

    // Check if any opponent piece can capture this piece
    for (let node = 0; node < 37; node++) {
      if (tempPieces[node] === opponent) {
        const opponentMoves = getValidMoves(node, tempPieces);
        for (const oppMove of opponentMoves) {
          if (oppMove.isCapture && oppMove.to === move.to) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private static canContinueCapture(state: SholoGutiState, toNode: number): boolean {
    // Check if the piece at toNode has any available capture moves
    const moves = getValidMoves(toNode, state.pieces);
    return moves.some((move) => move.isCapture);
  }

  private static evaluateMove(state: SholoGutiState, move: { from: number; to: number; isCapture: boolean }): number {
    let score = 0;

    // Bonus for captures
    if (move.isCapture) {
      score += 100;
    }

    // Check for multi-capture potential
    const tempPieces = [...state.pieces];
    tempPieces[move.from] = 0;
    tempPieces[move.to] = state.currentPlayer;

    if (this.canContinueCapture({ pieces: tempPieces, currentPlayer: state.currentPlayer }, move.to)) {
      score += 50;
    }

    // Centrality bonus - prefer central positions
    const toCoord = NODE_COORDINATES[move.to];
    const centerX = 180;
    const centerY = 250;
    const distance = Math.sqrt(Math.pow(toCoord.x - centerX, 2) + Math.pow(toCoord.y - centerY, 2));
    score -= distance * 0.1;

    // Mobility bonus - count available moves after this move
    const newMoves = getValidMoves(move.to, tempPieces);
    score += newMoves.length * 5;

    // Threat penalty - check if piece is threatened after move
    if (this.isDangerous(state, move)) {
      score -= 30;
    }

    // Defensive bonus - protect threatened pieces
    const fromMoves = getValidMoves(move.from, state.pieces);
    if (fromMoves.some((m) => m.isCapture)) {
      score += 20; // Was attacking, losing attack potential
    }

    return score;
  }
}
