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
  player1Score?: number;
  player2Score?: number;
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
    const control = { deadline: Date.now() + 65, nodes: 0, timedOut: false };
    const rootMoves = this.orderMoves(state, moves).slice(0, 5);
    let bestMove = rootMoves[0];

    for (let depth = 1; depth <= 5; depth++) {
      let iterationMove = bestMove;
      let iterationScore = Number.NEGATIVE_INFINITY;
      let alpha = Number.NEGATIVE_INFINITY;

      for (const move of rootMoves) {
        const child = this.applyMove(state, move);
        const score = this.search(child, depth - 1, alpha, Number.POSITIVE_INFINITY, state.currentPlayer, control);
        if (control.timedOut) break;
        if (score > iterationScore) {
          iterationScore = score;
          iterationMove = move;
        }
        alpha = Math.max(alpha, iterationScore);
      }

      if (control.timedOut) break;
      bestMove = iterationMove;
    }

    return bestMove;
  }

  private static orderMoves(state: DotsBoxesState, moves: Edge[]): Edge[] {
    return moves
      .map((move) => ({ move, score: this.evaluateMove(state, move) }))
      .sort((a, b) => b.score - a.score)
      .map(({ move }) => move);
  }

  private static applyMove(state: DotsBoxesState, move: Edge): DotsBoxesState {
    const horizontalLines = state.horizontalLines.map((line) => [...line]);
    const verticalLines = state.verticalLines.map((line) => [...line]);
    const boxes = state.boxes.map((line) => [...line]);
    if (move.type === 'horizontal') horizontalLines[move.row][move.col] = true;
    else verticalLines[move.row][move.col] = true;

    let completedBoxes = 0;
    const adjacentBoxes = move.type === 'horizontal'
      ? [[move.row - 1, move.col], [move.row, move.col]]
      : [[move.row, move.col - 1], [move.row, move.col]];
    for (const [row, col] of adjacentBoxes) {
      if (
        row >= 0 && row < boxes.length &&
        col >= 0 && col < boxes[row].length &&
        boxes[row][col] === 0
      ) {
        const boxState = { ...state, horizontalLines, verticalLines };
        if (this.countBoxEdges(boxState, row, col) === 4) {
          boxes[row][col] = state.currentPlayer;
          completedBoxes++;
        }
      }
    }

    return {
      horizontalLines,
      verticalLines,
      boxes,
      currentPlayer: completedBoxes > 0
        ? state.currentPlayer
        : state.currentPlayer === 1 ? 2 : 1,
    };
  }

  private static search(
    state: DotsBoxesState,
    depth: number,
    alpha: number,
    beta: number,
    rootPlayer: 1 | 2,
    control: { deadline: number; nodes: number; timedOut: boolean },
  ): number {
    if (control.nodes++ >= 1800 || Date.now() >= control.deadline) {
      control.timedOut = true;
      return 0;
    }
    if (depth === 0) return this.evaluateState(state, rootPlayer);

    const legalMoves = this.getLegalMoves(state);
    if (legalMoves.length === 0) return this.evaluateState(state, rootPlayer);
    const maximizing = state.currentPlayer === rootPlayer;
    const candidates = this.orderMoves(state, legalMoves).slice(0, 5);
    let value = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

    for (const move of candidates) {
      const score = this.search(this.applyMove(state, move), depth - 1, alpha, beta, rootPlayer, control);
      if (control.timedOut) return 0;
      if (maximizing) {
        value = Math.max(value, score);
        alpha = Math.max(alpha, value);
      } else {
        value = Math.min(value, score);
        beta = Math.min(beta, value);
      }
      if (beta <= alpha) break;
    }
    return value;
  }

  private static evaluateState(state: DotsBoxesState, rootPlayer: 1 | 2): number {
    let score = 0;
    for (const row of state.boxes) {
      for (const owner of row) {
        if (owner === rootPlayer) score += 100;
        else if (owner !== 0) score -= 100;
      }
    }
    const completingMoves = this.getLegalMoves(state).filter((move) => this.willCompleteBox(state, move)).length;
    return score + (state.currentPlayer === rootPlayer ? completingMoves : -completingMoves) * 8;
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
    const control = { deadline: Date.now() + 65, nodes: 0, timedOut: false };
    const rootMoves = this.orderMoves(state, emptyCells).slice(0, 4);
    let bestMove = rootMoves[0];

    for (let depth = 1; depth <= 5; depth++) {
      let iterationMove = bestMove;
      let iterationScore = Number.NEGATIVE_INFINITY;
      let alpha = Number.NEGATIVE_INFINITY;
      for (const move of rootMoves) {
        const child = this.applyMove(state, move);
        const score = this.search(child, depth - 1, alpha, Number.POSITIVE_INFINITY, state.currentPlayer, control);
        if (control.timedOut) break;
        if (score > iterationScore) {
          iterationScore = score;
          iterationMove = move;
        }
        alpha = Math.max(alpha, iterationScore);
      }
      if (control.timedOut) break;
      bestMove = iterationMove;
    }
    return bestMove;
  }

  private static orderMoves(
    state: SOSState,
    emptyCells: { row: number; col: number }[],
  ): { row: number; col: number; letter: 'S' | 'O' }[] {
    const promisingMoves = emptyCells.flatMap((cell) => (['S', 'O'] as const).map((letter) => ({
      ...cell,
      letter,
      score: this.evaluateCell(state, cell.row, cell.col) +
        (this.willCompleteSOS(state, cell.row, cell.col, letter) ? 100 : 0),
    })))
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    return promisingMoves
      .map((move) => ({
        ...move,
        score: move.score - (this.willGiveSOSAfterMove(state, move.row, move.col, move.letter) ? 20 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ row, col, letter }) => ({ row, col, letter }));
  }

  private static applyMove(
    state: SOSState,
    move: { row: number; col: number; letter: 'S' | 'O' },
  ): SOSState {
    const grid = state.grid.map((line) => [...line]);
    grid[move.row][move.col] = move.letter;
    const points = this.countSOS(grid, move.row, move.col);
    const player1Score = (state.player1Score ?? 0) + (state.currentPlayer === 1 ? points : 0);
    const player2Score = (state.player2Score ?? 0) + (state.currentPlayer === 2 ? points : 0);
    return {
      grid,
      player1Score,
      player2Score,
      currentPlayer: points > 0 ? state.currentPlayer : state.currentPlayer === 1 ? 2 : 1,
    };
  }

  private static search(
    state: SOSState,
    depth: number,
    alpha: number,
    beta: number,
    rootPlayer: 1 | 2,
    control: { deadline: number; nodes: number; timedOut: boolean },
  ): number {
    if (control.nodes++ >= 1200 || Date.now() >= control.deadline) {
      control.timedOut = true;
      return 0;
    }
    if (depth === 0) return this.evaluateState(state, rootPlayer);

    const emptyCells = state.grid.flatMap((line, row) =>
      line.flatMap((cell, col) => cell === '' ? [{ row, col }] : []),
    );
    if (emptyCells.length === 0) return this.evaluateState(state, rootPlayer);
    const maximizing = state.currentPlayer === rootPlayer;
    const candidates = this.orderMoves(state, emptyCells);
    let value = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

    for (const move of candidates) {
      const score = this.search(this.applyMove(state, move), depth - 1, alpha, beta, rootPlayer, control);
      if (control.timedOut) return 0;
      if (maximizing) {
        value = Math.max(value, score);
        alpha = Math.max(alpha, value);
      } else {
        value = Math.min(value, score);
        beta = Math.min(beta, value);
      }
      if (beta <= alpha) break;
    }
    return value;
  }

  private static evaluateState(state: SOSState, rootPlayer: 1 | 2): number {
    const scoreDifference = (state.player1Score ?? 0) - (state.player2Score ?? 0);
    return rootPlayer === 1 ? scoreDifference * 100 : -scoreDifference * 100;
  }

  private static willCompleteSOS(state: SOSState, row: number, col: number, letter: 'S' | 'O'): boolean {
    state.grid[row][col] = letter;
    const completesSOS = this.countSOS(state.grid, row, col) > 0;
    state.grid[row][col] = '';
    return completesSOS;
  }

  private static willGiveSOS(state: SOSState, row: number, col: number, letter: 'S' | 'O'): boolean {
    const tempGrid = state.grid.map((line) => [...line]);
    tempGrid[row][col] = letter;
    const directions = [
      [0, 1], [0, -1], [1, 0], [-1, 0],
      [1, 1], [1, -1], [-1, 1], [-1, -1],
    ];

    for (const [dr, dc] of directions) {
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (nextRow < 0 || nextRow >= 10 || nextCol < 0 || nextCol >= 10 || tempGrid[nextRow][nextCol] !== '') continue;

      for (const opponentLetter of ['S', 'O'] as const) {
        tempGrid[nextRow][nextCol] = opponentLetter;
        if (this.countSOS(tempGrid, nextRow, nextCol) > 0) return true;
        tempGrid[nextRow][nextCol] = '';
      }
    }
    return false;
  }

  private static willGiveSOSAfterMove(state: SOSState, row: number, col: number, letter: 'S' | 'O'): boolean {
    state.grid[row][col] = letter;
    let givesSOS = false;
    for (let candidateRow = Math.max(0, row - 2); candidateRow <= Math.min(9, row + 2) && !givesSOS; candidateRow++) {
      for (let candidateCol = Math.max(0, col - 2); candidateCol <= Math.min(9, col + 2) && !givesSOS; candidateCol++) {
        if (state.grid[candidateRow][candidateCol] !== '') continue;
        for (const opponentLetter of ['S', 'O'] as const) {
          state.grid[candidateRow][candidateCol] = opponentLetter;
          givesSOS = this.countSOS(state.grid, candidateRow, candidateCol) > 0;
          state.grid[candidateRow][candidateCol] = '';
          if (givesSOS) break;
        }
      }
    }
    state.grid[row][col] = '';
    return givesSOS;
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
    const directions = grid[row][col] === 'O'
      ? [[0, 1], [1, 0], [1, 1], [1, -1]]
      : [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];

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
    if (difficulty !== 'hard' && captureMoves.length > 0) {
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
    const control = { deadline: Date.now() + 65, nodes: 0, timedOut: false };
    const captures = moves.filter((move) => move.isCapture);
    const choices = captures.length > 0 ? captures : moves;
    const orderedMoves = this.orderMoves(state, choices, null).slice(0, 4);
    let bestMove = orderedMoves[0];

    for (let depth = 1; depth <= 5; depth++) {
      let iterationMove = bestMove;
      let iterationScore = Number.NEGATIVE_INFINITY;
      let alpha = Number.NEGATIVE_INFINITY;
      for (const move of orderedMoves) {
        const child = this.applyMove(state, move);
        const score = this.search(child.state, child.forcedNode, depth - 1, alpha, Number.POSITIVE_INFINITY, state.currentPlayer, control);
        if (control.timedOut) break;
        if (score > iterationScore) {
          iterationScore = score;
          iterationMove = move;
        }
        alpha = Math.max(alpha, iterationScore);
      }
      if (control.timedOut) break;
      bestMove = iterationMove;
    }
    return { from: bestMove.from, to: bestMove.to };
  }

  private static orderMoves(
    state: SholoGutiState,
    moves: { from: number; to: number; isCapture: boolean }[],
    forcedNode: number | null,
  ): { from: number; to: number; isCapture: boolean }[] {
    return moves
      .map((move) => ({ move, score: this.evaluateMove(state, move) }))
      .sort((a, b) => b.score - a.score)
      .map(({ move }) => move)
      .filter((move) => forcedNode === null || (move.from === forcedNode && move.isCapture));
  }

  private static getSearchMoves(
    state: SholoGutiState,
    forcedNode: number | null,
  ): { from: number; to: number; isCapture: boolean }[] {
    if (forcedNode !== null) {
      return getValidMoves(forcedNode, state.pieces)
        .filter((move) => move.isCapture)
        .map((move) => ({ from: forcedNode, to: move.to, isCapture: true }));
    }
    const moves = this.getLegalMoves(state);
    const captures = moves.filter((move) => move.isCapture);
    return captures.length > 0 ? captures : moves;
  }

  private static applyMove(
    state: SholoGutiState,
    move: { from: number; to: number; isCapture: boolean },
  ): { state: SholoGutiState; forcedNode: number | null } {
    const pieces = [...state.pieces];
    pieces[move.from] = 0;
    pieces[move.to] = state.currentPlayer;
    if (move.isCapture) {
      const jumpedNode = getValidMoves(move.from, state.pieces)
        .find((candidate) => candidate.to === move.to)?.capturedNode;
      if (jumpedNode !== undefined) pieces[jumpedNode] = 0;
      if (getValidMoves(move.to, pieces).some((candidate) => candidate.isCapture)) {
        return { state: { pieces, currentPlayer: state.currentPlayer }, forcedNode: move.to };
      }
    }
    return {
      state: { pieces, currentPlayer: state.currentPlayer === 1 ? 2 : 1 },
      forcedNode: null,
    };
  }

  private static search(
    state: SholoGutiState,
    forcedNode: number | null,
    depth: number,
    alpha: number,
    beta: number,
    rootPlayer: 1 | 2,
    control: { deadline: number; nodes: number; timedOut: boolean },
  ): number {
    if (control.nodes++ >= 1400 || Date.now() >= control.deadline) {
      control.timedOut = true;
      return 0;
    }
    const moves = this.getSearchMoves(state, forcedNode);
    if (depth === 0 || moves.length === 0) {
      if (moves.length === 0) return state.currentPlayer === rootPlayer ? -100000 : 100000;
      return this.evaluateState(state, rootPlayer);
    }

    const maximizing = state.currentPlayer === rootPlayer;
    const candidates = this.orderMoves(state, moves, forcedNode).slice(0, 4);
    let value = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
    for (const move of candidates) {
      const child = this.applyMove(state, move);
      const score = this.search(child.state, child.forcedNode, depth - 1, alpha, beta, rootPlayer, control);
      if (control.timedOut) return 0;
      if (maximizing) {
        value = Math.max(value, score);
        alpha = Math.max(alpha, value);
      } else {
        value = Math.min(value, score);
        beta = Math.min(beta, value);
      }
      if (beta <= alpha) break;
    }
    return value;
  }

  private static evaluateState(state: SholoGutiState, rootPlayer: 1 | 2): number {
    const opponent = rootPlayer === 1 ? 2 : 1;
    let material = 0;
    for (const piece of state.pieces) {
      if (piece === rootPlayer) material++;
      else if (piece === opponent) material--;
    }

    let rootMobility = 0;
    let opponentMobility = 0;
    let rootThreats = 0;
    let opponentThreats = 0;
    for (let node = 0; node < state.pieces.length; node++) {
      if (state.pieces[node] === rootPlayer) {
        const moves = getValidMoves(node, state.pieces);
        rootMobility += moves.length;
        rootThreats += moves.filter((move) => move.isCapture).length;
      } else if (state.pieces[node] === opponent) {
        const moves = getValidMoves(node, state.pieces);
        opponentMobility += moves.length;
        opponentThreats += moves.filter((move) => move.isCapture).length;
      }
    }
    return material * 1000 + (rootMobility - opponentMobility) * 3 +
      (rootThreats - opponentThreats) * 35;
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
          if (oppMove.isCapture && oppMove.capturedNode === move.to) {
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
