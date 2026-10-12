import RuleModal from '@/components/RuleModal';
import ExitConfirmationModal from '@/components/ExitConfirmationModal';
import ScoreBoard from '@/components/ScoreBoard';
import VictoryCelebrationModal from '@/components/VictoryCelebrationModal';
import { RoyalColors, Spacing } from '@/constants/theme';
import useGameExitConfirmation from '@/hooks/useGameExitConfirmation';
import { DifficultyType, SOSAI, SOSState } from '@/utils/aiBotService';
import { recordMatchSilently } from '@/services/api';
import { playGameSound, releaseGameSounds } from '@/utils/soundManager';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
      StyleSheet,
      Text,
      TouchableOpacity,
      useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Line, Svg } from 'react-native-svg';

const GRID_SIZE = 10;

interface SOSCompleted {
  row1: number;
  col1: number;
  row2: number;
  col2: number;
  row3: number;
  col3: number;
  player: 1 | 2;
}

export default function SosGameScreen() {
  const params = useLocalSearchParams();
  const playerName = (params.playerName as string) || 'Player 1';
  const opponent = (params.opponent as 'computer' | 'passAndPlay') || 'computer';
  const difficulty = (params.difficulty as DifficultyType) || 'medium';

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const availableHeight = height - insets.top - insets.bottom - 42 - 56 - 16;
  const availableWidth = width - 24;
  const BOARD_SIZE = Math.floor(Math.min(availableWidth, availableHeight));
  const CELL_GAP = 2;
  const CELL_SIZE = (BOARD_SIZE - (GRID_SIZE - 1) * CELL_GAP) / GRID_SIZE;

  const [grid, setGrid] = useState<('' | 'S' | 'O')[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''))
  );
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [selectedLetter, setSelectedLetter] = useState<'S' | 'O'>('S');
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [turnsTaken, setTurnsTaken] = useState(0);
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const exitConfirmation = useGameExitConfirmation();
  const [showGameOver, setShowGameOver] = useState(false);
  const [winner, setWinner] = useState<1 | 2 | 'draw' | null>(null);
  const [completedSOS, setCompletedSOS] = useState<SOSCompleted[]>([]);
  const [cellAnimations, setCellAnimations] = useState<{ [key: string]: Animated.Value }>({});
  const matchSyncStarted = useRef(false);

  useEffect(() => () => releaseGameSounds(), []);

  useEffect(() => {
    if (!showGameOver || winner === null) return;
    if (matchSyncStarted.current) return;
    matchSyncStarted.current = true;
    playGameSound(
      winner === 'draw' ? 'draw' : winner === 1 ? 'sosWin' : 'lose',
    );
    void recordMatchSilently({
      game_type: 'sos',
      winner,
      final_score: { p1: player1Score, p2: player2Score },
      turns: turnsTaken,
    }).catch((error: unknown) => {
      console.warn('Background match sync failed; gameplay continues locally:', error);
    });
  }, [showGameOver, winner, player1Score, player2Score, turnsTaken]);

  const checkSOSCompletions = useCallback((
    newGrid: ('' | 'S' | 'O')[][],
    row: number,
    col: number,
    letter: 'S' | 'O'
  ): { row1: number; col1: number; row2: number; col2: number; row3: number; col3: number }[] => {
    const completions: { row1: number; col1: number; row2: number; col2: number; row3: number; col3: number }[] = [];
    const directions = letter === 'S'
      ? [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]
      : [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (const [dr, dc] of directions) {
      if (letter === 'S') {
        // Check if there's an O and S following
        const or = row + dr;
        const oc = col + dc;
        const sr = row + 2 * dr;
        const sc = col + 2 * dc;

        if (
          or >= 0 && or < GRID_SIZE && oc >= 0 && oc < GRID_SIZE &&
          sr >= 0 && sr < GRID_SIZE && sc >= 0 && sc < GRID_SIZE
        ) {
          if (newGrid[or][oc] === 'O' && newGrid[sr][sc] === 'S') {
            completions.push({ row1: row, col1: col, row2: or, col2: oc, row3: sr, col3: sc });
          }
        }
      } else if (letter === 'O') {
        // Check if there's S before and after
        const s1r = row - dr;
        const s1c = col - dc;
        const s2r = row + dr;
        const s2c = col + dc;

        if (
          s1r >= 0 && s1r < GRID_SIZE && s1c >= 0 && s1c < GRID_SIZE &&
          s2r >= 0 && s2r < GRID_SIZE && s2c >= 0 && s2c < GRID_SIZE
        ) {
          if (newGrid[s1r][s1c] === 'S' && newGrid[s2r][s2c] === 'S') {
            completions.push({ row1: s1r, col1: s1c, row2: row, col2: col, row3: s2r, col3: s2c });
          }
        }
      }
    }

    return completions;
  }, []);

  const applyMove = useCallback((
    row: number,
    col: number,
    letter: 'S' | 'O',
    player: 1 | 2,
  ) => {
    if (grid[row][col] !== '') return;

    const nextGrid = grid.map((line) => [...line]);
    nextGrid[row][col] = letter;
    setTurnsTaken((turns) => turns + 1);
    setGrid(nextGrid);

    const key = `${row}-${col}`;
    const animValue = new Animated.Value(0);
    setCellAnimations((previous) => ({ ...previous, [key]: animValue }));
    Animated.spring(animValue, {
      toValue: 1,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();

    const completions = checkSOSCompletions(nextGrid, row, col, letter);
    playGameSound(completions.length > 0 ? 'sosScore' : 'sosMove');
    let nextPlayer1Score = player1Score;
    let nextPlayer2Score = player2Score;

    if (completions.length > 0) {
      setCompletedSOS((previous) => [
        ...previous,
        ...completions.map((sos) => ({ ...sos, player })),
      ]);

      if (player === 1) {
        nextPlayer1Score += completions.length;
        setPlayer1Score(nextPlayer1Score);
      } else {
        nextPlayer2Score += completions.length;
        setPlayer2Score(nextPlayer2Score);
      }
    } else {
      setCurrentPlayer(player === 1 ? 2 : 1);
    }

    if (nextGrid.every((line) => line.every((cell) => cell !== ''))) {
      setWinner(
        nextPlayer1Score > nextPlayer2Score
          ? 1
          : nextPlayer2Score > nextPlayer1Score
            ? 2
            : 'draw',
      );
      setShowGameOver(true);
    }
  }, [grid, player1Score, player2Score, checkSOSCompletions]);

  const handleCellPress = useCallback((row: number, col: number) => {
    if (
      isComputerThinking ||
      showGameOver ||
      (opponent === 'computer' && currentPlayer !== 1) ||
      grid[row][col] !== ''
    ) {
      return;
    }

    applyMove(row, col, selectedLetter, currentPlayer);
  }, [
    isComputerThinking,
    showGameOver,
    opponent,
    currentPlayer,
    grid,
    applyMove,
    selectedLetter,
  ]);

  // AI Turn
  useEffect(() => {
    if (
      opponent === 'computer' &&
      currentPlayer === 2 &&
      !showGameOver &&
      !isComputerThinking
    ) {
      const timer = setTimeout(() => {
        setIsComputerThinking(true);

        try {
          const state: SOSState = {
            grid,
            currentPlayer,
            player1Score,
            player2Score,
          };

          const move = SOSAI.getMove(state, difficulty);
          applyMove(move.row, move.col, move.letter, 2);
        } catch (error) {
          console.error('AI move error:', error);
          setWinner(player1Score >= player2Score ? 1 : 2);
          setShowGameOver(true);
        } finally {
          setIsComputerThinking(false);
        }
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [
    currentPlayer,
    opponent,
    grid,
    showGameOver,
    isComputerThinking,
    difficulty,
    applyMove,
    player1Score,
    player2Score,
  ]);

  const handleReset = () => {
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('')));
    setCurrentPlayer(1);
    setSelectedLetter('S');
    setPlayer1Score(0);
    setPlayer2Score(0);
    setTurnsTaken(0);
    setWinner(null);
    setShowGameOver(false);
    setCompletedSOS([]);
    setCellAnimations({});
  };

  const gridWidth = BOARD_SIZE;
  const gridHeight = BOARD_SIZE;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScoreBoard
        player1Name={playerName}
        player2Name={opponent === 'computer' ? 'Computer (AI)' : 'Player 2'}
        player1Score={player1Score}
        player2Score={player2Score}
        currentPlayer={currentPlayer}
        onBack={exitConfirmation.requestExit}
        onReset={handleReset}
        onRules={() => setShowRules(true)}
      />

      <View style={styles.gameContainer}>
          <View style={[styles.grid, { width: gridWidth, height: gridHeight }]}>
            {/* Grid Cells */}
            {Array.from({ length: GRID_SIZE }).map((_, row) =>
              Array.from({ length: GRID_SIZE }).map((_, col) => {
                const key = `${row}-${col}`;
                const animValue = cellAnimations[key];

                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.cell,
                      {
                        left: col * (CELL_SIZE + CELL_GAP),
                        top: row * (CELL_SIZE + CELL_GAP),
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        borderRadius: Math.max(4, Math.floor(CELL_SIZE / 8)),
                      },
                    ]}
                    onPress={() => handleCellPress(row, col)}
                    disabled={
                      grid[row][col] !== '' ||
                      isComputerThinking ||
                      showGameOver ||
                      (opponent === 'computer' && currentPlayer !== 1)
                    }
                    activeOpacity={0.7}
                  >
                    {animValue ? (
                      <Animated.View
                        style={[
                          styles.cellContent,
                          {
                            transform: [{ scale: animValue }],
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.cellText,
                            {
                              color:
                                grid[row][col] === 'S'
                                  ? RoyalColors.raja
                                  : RoyalColors.rani,
                              fontSize: Math.max(14, Math.floor(CELL_SIZE / 1.5)),
                            },
                          ]}
                        >
                          {grid[row][col]}
                        </Text>
                      </Animated.View>
                    ) : (
                      <View style={styles.cellContent}>
                        <Text
                          style={[
                            styles.cellText,
                            {
                              color:
                                grid[row][col] === 'S'
                                  ? RoyalColors.raja
                                  : RoyalColors.rani,
                              fontSize: Math.max(14, Math.floor(CELL_SIZE / 1.5)),
                            },
                          ]}
                        >
                          {grid[row][col]}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}

            {/* SOS Strikethrough Lines */}
            <Svg
              pointerEvents="none"
              style={styles.svgOverlay}
              width={gridWidth}
              height={gridHeight}
            >
              {completedSOS.map((sos, index) => {
                const x1 = sos.col1 * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
                const y1 = sos.row1 * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
                const x2 = sos.col3 * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
                const y2 = sos.row3 * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;

                return (
                  <Line
                    key={index}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={sos.player === 1 ? RoyalColors.raja : RoyalColors.rani}
                    strokeWidth={Math.max(2, Math.floor(CELL_SIZE / 15))}
                    strokeLinecap="round"
                  />
                );
              })}
            </Svg>
          </View>
        </View>

      {/* Letter Selector Bar */}
      <View style={styles.selectorBar}>
        <TouchableOpacity
          style={[
            styles.selectorButton,
            selectedLetter === 'S' && styles.selectorButtonActive,
          ]}
          onPress={() => setSelectedLetter('S')}
          disabled={
            isComputerThinking ||
            showGameOver ||
            (opponent === 'computer' && currentPlayer !== 1)
          }
        >
          <Text
            style={[
              styles.selectorButtonText,
              selectedLetter === 'S' && styles.selectorButtonTextActive,
              selectedLetter === 'S' && { color: RoyalColors.raja },
            ]}
          >
            S
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.selectorButton,
            selectedLetter === 'O' && styles.selectorButtonActive,
          ]}
          onPress={() => setSelectedLetter('O')}
          disabled={
            isComputerThinking ||
            showGameOver ||
            (opponent === 'computer' && currentPlayer !== 1)
          }
        >
          <Text
            style={[
              styles.selectorButtonText,
              selectedLetter === 'O' && styles.selectorButtonTextActive,
              selectedLetter === 'O' && { color: RoyalColors.rani },
            ]}
          >
            O
          </Text>
        </TouchableOpacity>
      </View>

      <RuleModal visible={showRules} gameType="sos" onClose={() => setShowRules(false)} />
      <ExitConfirmationModal
        visible={exitConfirmation.visible}
        onResume={exitConfirmation.resume}
        onExit={exitConfirmation.confirmExit}
      />

      <VictoryCelebrationModal
        visible={showGameOver}
        outcome={winner === 'draw' ? 'draw' : winner === 1 ? 'player' : 'opponent'}
        headline={
          winner === 'draw'
            ? 'A ROYAL DRAW'
            : winner === 1
              ? 'VICTORY!'
              : opponent === 'computer'
                ? 'DEFEAT!'
                : 'PLAYER 2 WINS'
        }
        message={
          winner === 'draw'
            ? 'The kingdom stands evenly matched.'
            : winner === 1
              ? `The Kingdom Bows to ${playerName} 👑`
              : opponent === 'computer'
                ? 'Computer Claims the Throne ⚔️'
                : 'Player 2 Claims the Throne ⚔️'
        }
        stats={[
          { label: 'SOS scored', value: `${player1Score} - ${player2Score}` },
          { label: 'Total sequences', value: player1Score + player2Score },
          { label: 'Turns taken', value: turnsTaken },
        ]}
        onRematch={handleReset}
        onHome={exitConfirmation.confirmExit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RoyalColors.background,
  },
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    position: 'relative',
  },
  cell: {
    position: 'absolute',
    backgroundColor: RoyalColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RoyalColors.neonBorder,
  },
  cellContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  selectorBar: {
    flexDirection: 'row',
    height: 56,
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RoyalColors.cardDark,
    borderTopWidth: 1,
    borderTopColor: RoyalColors.neonBorder,
  },
  selectorButton: {
    width: 64,
    height: 44,
    borderRadius: 10,
    backgroundColor: RoyalColors.background,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorButtonActive: {
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 6,
  },
  selectorButtonText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: RoyalColors.textSecondary,
  },
  selectorButtonTextActive: {
    color: RoyalColors.textPrimary,
  },
  gameOverOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  gameOverContent: {
    padding: Spacing.six,
    borderRadius: Spacing.three,
    alignItems: 'center',
    gap: Spacing.four,
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: RoyalColors.gold,
  },
  gameOverMessage: {
    fontSize: 18,
    color: RoyalColors.textPrimary,
    textAlign: 'center',
  },
  gameOverButtons: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  gameOverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.two,
  },
  playAgainButton: {
    backgroundColor: RoyalColors.raja,
  },
  playAgainButtonText: {
    color: RoyalColors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  lobbyButton: {
    backgroundColor: RoyalColors.cardDark,
    borderWidth: 1,
    borderColor: RoyalColors.textSecondary,
  },
  lobbyButtonText: {
    color: RoyalColors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
