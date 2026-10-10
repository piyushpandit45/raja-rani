import RuleModal from '@/components/RuleModal';
import ExitConfirmationModal from '@/components/ExitConfirmationModal';
import ScoreBoard from '@/components/ScoreBoard';
import VictoryCelebrationModal from '@/components/VictoryCelebrationModal';
import { RoyalColors, Spacing } from '@/constants/theme';
import useGameExitConfirmation from '@/hooks/useGameExitConfirmation';
import { DifficultyType, DotsBoxesAI, DotsBoxesState, Edge } from '@/utils/aiBotService';
import { recordMatchSilently } from '@/services/api';
import { playGameSound, releaseGameSounds } from '@/utils/soundManager';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const GRID_SIZE = 7;

interface LastMove {
  id: string;
  type: 'h' | 'v';
  row: number;
  col: number;
  playedBy: 'player1' | 'player2' | 'ai';
}

export default function DotsBoxesScreen() {
  const params = useLocalSearchParams();
  const playerName = (params.playerName as string) || 'Player 1';
  const opponent = (params.opponent as 'computer' | 'passAndPlay') || 'computer';
  const difficulty = (params.difficulty as DifficultyType) || 'medium';

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const availableHeight = height - insets.top - insets.bottom - 42 - 56 - 16;
  const availableWidth = width - 24;
  const BOARD_SIZE = Math.floor(Math.min(availableWidth, availableHeight));
  const DOT_SIZE = 12;
  const DOT_SPACING = BOARD_SIZE / (GRID_SIZE - 1);
  const LINE_LENGTH = DOT_SPACING - DOT_SIZE;

  const [horizontalLines, setHorizontalLines] = useState<boolean[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE - 1).fill(false))
  );
  const [verticalLines, setVerticalLines] = useState<boolean[][]>(
    Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE).fill(false))
  );
  const [horizontalLineOwners, setHorizontalLineOwners] = useState<(0 | 1 | 2)[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE - 1).fill(0))
  );
  const [verticalLineOwners, setVerticalLineOwners] = useState<(0 | 1 | 2)[][]>(
    Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE).fill(0))
  );
  const [boxes, setBoxes] = useState<number[][]>(
    Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE - 1).fill(0))
  );
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [turnsTaken, setTurnsTaken] = useState(0);
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const exitConfirmation = useGameExitConfirmation();
  const [showGameOver, setShowGameOver] = useState(false);
  const [winner, setWinner] = useState<1 | 2 | 'draw' | null>(null);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [lastMovePulse] = useState(() => new Animated.Value(0));
  const matchSyncStarted = useRef(false);

  useEffect(() => () => releaseGameSounds(), []);

  useEffect(() => {
    if (!showGameOver || winner === null) return;
    if (matchSyncStarted.current) return;
    matchSyncStarted.current = true;
    playGameSound(
      winner === 'draw' ? 'draw' : winner === 1 ? 'dotsWin' : 'lose',
    );
    void recordMatchSilently({
      game_type: 'dots_boxes',
      winner,
      final_score: { p1: player1Score, p2: player2Score },
      turns: turnsTaken,
    }).catch((error: unknown) => {
      console.warn('Background match sync failed; gameplay continues locally:', error);
    });
  }, [showGameOver, winner, player1Score, player2Score, turnsTaken]);

  useEffect(() => {
    if (!lastMove || lastMove.playedBy === 'player1') {
      lastMovePulse.setValue(0);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(lastMovePulse, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(lastMovePulse, {
          toValue: 0,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [lastMove, lastMovePulse]);

  const lastMoveOpacity = lastMovePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1],
  });
  const lastMoveScale = lastMovePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.16],
  });

  const checkCompletedBoxes = useCallback((edge: Edge, newHorizontalLines: boolean[][], newVerticalLines: boolean[][], type: 'horizontal' | 'vertical', currentBoxes: number[][]): { row: number; col: number }[] => {
    const { row, col } = edge;
    const completed: { row: number; col: number }[] = [];

    if (type === 'horizontal') {
      // Check box above
      if (row > 0) {
        const boxRow = row - 1;
        const boxCol = col;
        if (
          currentBoxes[boxRow][boxCol] === 0 &&
          newHorizontalLines[boxRow][boxCol] &&
          newHorizontalLines[boxRow + 1][boxCol] &&
          newVerticalLines[boxRow][boxCol] &&
          newVerticalLines[boxRow][boxCol + 1]
        ) {
          completed.push({ row: boxRow, col: boxCol });
        }
      }
      // Check box below
      if (row < GRID_SIZE - 1) {
        const boxRow = row;
        const boxCol = col;
        if (
          currentBoxes[boxRow][boxCol] === 0 &&
          newHorizontalLines[boxRow][boxCol] &&
          newHorizontalLines[boxRow + 1][boxCol] &&
          newVerticalLines[boxRow][boxCol] &&
          newVerticalLines[boxRow][boxCol + 1]
        ) {
          completed.push({ row: boxRow, col: boxCol });
        }
      }
    } else {
      // Check box to the left
      if (col > 0) {
        const boxRow = row;
        const boxCol = col - 1;
        if (
          currentBoxes[boxRow][boxCol] === 0 &&
          newHorizontalLines[boxRow][boxCol] &&
          newHorizontalLines[boxRow + 1][boxCol] &&
          newVerticalLines[boxRow][boxCol] &&
          newVerticalLines[boxRow][boxCol + 1]
        ) {
          completed.push({ row: boxRow, col: boxCol });
        }
      }
      // Check box to the right
      if (col < GRID_SIZE - 1) {
        const boxRow = row;
        const boxCol = col;
        if (
          currentBoxes[boxRow][boxCol] === 0 &&
          newHorizontalLines[boxRow][boxCol] &&
          newHorizontalLines[boxRow + 1][boxCol] &&
          newVerticalLines[boxRow][boxCol] &&
          newVerticalLines[boxRow][boxCol + 1]
        ) {
          completed.push({ row: boxRow, col: boxCol });
        }
      }
    }

    return completed;
  }, []);

  const checkGameOver = useCallback((
    p1Score: number,
    p2Score: number,
    completedHorizontalLines: boolean[][],
    completedVerticalLines: boolean[][],
  ) => {
    const totalLines = (GRID_SIZE * (GRID_SIZE - 1)) * 2;
    const currentLines =
      completedHorizontalLines.flat().filter(Boolean).length +
      completedVerticalLines.flat().filter(Boolean).length;

    if (currentLines === totalLines) {
      if (p1Score > p2Score) {
        setWinner(1);
      } else if (p2Score > p1Score) {
        setWinner(2);
      } else {
        setWinner('draw');
      }
      setShowGameOver(true);
    }
  }, []);

  const handleLinePress = useCallback(
    (edge: Edge, isComputerMove = false) => {
      if (isComputerThinking && !isComputerMove) return;

      const { type, row, col } = edge;

      // Check if line already exists
      if (type === 'horizontal' && horizontalLines[row][col]) return;
      if (type === 'vertical' && verticalLines[row][col]) return;

      // Create new arrays for state updates
      let newHorizontalLines = horizontalLines;
      let newVerticalLines = verticalLines;

      if (type === 'horizontal') {
        newHorizontalLines = horizontalLines.map(r => [...r]);
        newHorizontalLines[row][col] = true;
        setHorizontalLines(newHorizontalLines);
        const newOwners = horizontalLineOwners.map((line) => [...line]);
        newOwners[row][col] = currentPlayer;
        setHorizontalLineOwners(newOwners);
      } else {
        newVerticalLines = verticalLines.map(r => [...r]);
        newVerticalLines[row][col] = true;
        setVerticalLines(newVerticalLines);
        const newOwners = verticalLineOwners.map((line) => [...line]);
        newOwners[row][col] = currentPlayer;
        setVerticalLineOwners(newOwners);
      }

      setLastMove({
        id: `${type === 'horizontal' ? 'h' : 'v'}-${row}-${col}`,
        type: type === 'horizontal' ? 'h' : 'v',
        row,
        col,
        playedBy: isComputerMove ? 'ai' : currentPlayer === 1 ? 'player1' : 'player2',
      });

      const completedBoxes = checkCompletedBoxes(edge, newHorizontalLines, newVerticalLines, type, boxes);
      playGameSound(completedBoxes.length > 0 ? 'dotsScore' : 'dotsMove');
      setTurnsTaken((turns) => turns + 1);
      let nextPlayer1Score = player1Score;
      let nextPlayer2Score = player2Score;

      if (completedBoxes.length > 0) {
        // Claim boxes
        const newBoxes = boxes.map((r) => [...r]);
        completedBoxes.forEach(({ row: boxRow, col: boxCol }) => {
          newBoxes[boxRow][boxCol] = currentPlayer;
        });
        setBoxes(newBoxes);

        if (currentPlayer === 1) {
          nextPlayer1Score += completedBoxes.length;
          setPlayer1Score(nextPlayer1Score);
        } else {
          nextPlayer2Score += completedBoxes.length;
          setPlayer2Score(nextPlayer2Score);
        }

        // Bonus turn - don't switch player
      } else {
        // Switch player
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      }

      checkGameOver(
        nextPlayer1Score,
        nextPlayer2Score,
        newHorizontalLines,
        newVerticalLines,
      );
    },
    [
      horizontalLines,
      verticalLines,
      horizontalLineOwners,
      verticalLineOwners,
      boxes,
      currentPlayer,
      isComputerThinking,
      player1Score,
      player2Score,
      checkGameOver,
      checkCompletedBoxes,
    ]
  );

  // AI Turn
  useEffect(() => {
    if (
      opponent === 'computer' &&
      currentPlayer === 2 &&
      !showGameOver &&
      !isComputerThinking
    ) {
      const delay = Math.random() * 200 + 600; // 600-800ms delay

      const timer = setTimeout(() => {
        setIsComputerThinking(true);

        try {
          const state: DotsBoxesState = {
            horizontalLines,
            verticalLines,
            boxes,
            currentPlayer,
          };

          const move = DotsBoxesAI.getMove(state, difficulty);
          handleLinePress(move, true);
        } catch (error) {
          console.error('AI move error:', error);
        } finally {
          setIsComputerThinking(false);
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [currentPlayer, opponent, horizontalLines, verticalLines, boxes, showGameOver, isComputerThinking, difficulty, handleLinePress]);

  const handleReset = () => {
    setHorizontalLines(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE - 1).fill(false)));
    setVerticalLines(Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE).fill(false)));
    setHorizontalLineOwners(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE - 1).fill(0)));
    setVerticalLineOwners(Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE).fill(0)));
    setBoxes(Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE - 1).fill(0)));
    setCurrentPlayer(1);
    setPlayer1Score(0);
    setPlayer2Score(0);
    setTurnsTaken(0);
    setWinner(null);
    setShowGameOver(false);
    setLastMove(null);
  };

  const gridWidth = BOARD_SIZE;
  const gridHeight = BOARD_SIZE;
  const horizontalTrackHeight = 4;
  const verticalTrackWidth = 4;

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
            {/* Dots and Lines */}
            {Array.from({ length: GRID_SIZE }).map((_, row) =>
              Array.from({ length: GRID_SIZE }).map((_, col) => (
                <React.Fragment key={`${row}-${col}`}>
                  {/* Dot */}
                  <View
                    style={[
                      styles.dot,
                      {
                        left: col * DOT_SPACING - DOT_SIZE / 2,
                        top: row * DOT_SPACING - DOT_SIZE / 2,
                      },
                    ]}
                    pointerEvents="none"
                  />

                  {/* Horizontal Line (to the right) */}
                  {col < GRID_SIZE - 1 && (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.horizontalLine,
                          {
                            left: col * DOT_SPACING + DOT_SIZE / 2,
                            top: row * DOT_SPACING - horizontalTrackHeight / 2,
                            width: LINE_LENGTH,
                            height: horizontalTrackHeight,
                            backgroundColor: horizontalLines[row][col]
                              ? horizontalLineOwners[row][col] === 1 ? '#06B6D4' : '#F43F5E'
                              : 'rgba(255, 255, 255, 0.15)',
                          },
                        ]}
                        activeOpacity={0.7}
                        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                        onPress={() => handleLinePress({ type: 'horizontal', row, col })}
                        disabled={horizontalLines[row][col] || isComputerThinking || (opponent === 'computer' && currentPlayer !== 1)}
                      />
                      {lastMove?.playedBy !== 'player1' && lastMove?.id === `h-${row}-${col}` && (
                        <Animated.View
                          pointerEvents="none"
                          style={[
                            styles.lastMoveGlow,
                            {
                              left: col * DOT_SPACING + DOT_SIZE / 2,
                              top: row * DOT_SPACING - 4,
                              width: LINE_LENGTH,
                              height: 8,
                              opacity: lastMoveOpacity,
                              transform: [{ scaleX: lastMoveScale }],
                            },
                          ]}
                        />
                      )}
                    </>
                  )}

                  {/* Vertical Line (below) */}
                  {row < GRID_SIZE - 1 && (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.verticalLine,
                          {
                            left: col * DOT_SPACING - verticalTrackWidth / 2,
                            top: row * DOT_SPACING + DOT_SIZE / 2,
                            width: verticalTrackWidth,
                            height: LINE_LENGTH,
                            backgroundColor: verticalLines[row][col]
                              ? verticalLineOwners[row][col] === 1 ? '#06B6D4' : '#F43F5E'
                              : 'rgba(255, 255, 255, 0.15)',
                          },
                        ]}
                        activeOpacity={0.7}
                        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                        onPress={() => handleLinePress({ type: 'vertical', row, col })}
                        disabled={verticalLines[row][col] || isComputerThinking || (opponent === 'computer' && currentPlayer !== 1)}
                      />
                      {lastMove?.playedBy !== 'player1' && lastMove?.id === `v-${row}-${col}` && (
                        <Animated.View
                          pointerEvents="none"
                          style={[
                            styles.lastMoveGlow,
                            {
                              left: col * DOT_SPACING - 4,
                              top: row * DOT_SPACING + DOT_SIZE / 2,
                              width: 8,
                              height: LINE_LENGTH,
                              opacity: lastMoveOpacity,
                              transform: [{ scaleY: lastMoveScale }],
                            },
                          ]}
                        />
                      )}
                    </>
                  )}
                </React.Fragment>
              ))
            )}

            {/* Boxes */}
            {Array.from({ length: GRID_SIZE - 1 }).map((_, row) =>
              Array.from({ length: GRID_SIZE - 1 }).map((_, col) => (
                <View
                  pointerEvents="none"
                  key={`box-${row}-${col}`}
                  style={[
                    styles.box,
                    {
                      left: col * DOT_SPACING + DOT_SIZE / 2,
                      top: row * DOT_SPACING + DOT_SIZE / 2,
                      width: LINE_LENGTH,
                      height: LINE_LENGTH,
                      backgroundColor: boxes[row][col] === 1
                        ? 'rgba(6, 182, 212, 0.2)'
                        : boxes[row][col] === 2
                          ? 'rgba(244, 63, 94, 0.2)'
                          : 'transparent',
                    },
                  ]}
                >
                  {boxes[row][col] !== 0 && (
                    <Text style={styles.crownBadge}>👑</Text>
                  )}
                </View>
              ))
            )}
        </View>
      </View>
      <View style={styles.bottomBar}>
        <Text style={styles.bottomStatus}>
          {isComputerThinking ? 'Computer is thinking…' : `Claim boxes by completing a side · ${player1Score + player2Score}/36`}
        </Text>
      </View>

      <RuleModal visible={showRules} gameType="dotsBoxes" onClose={() => setShowRules(false)} />
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
          { label: 'Boxes claimed', value: `${player1Score} - ${player2Score}` },
          { label: 'Points scored', value: player1Score + player2Score },
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
    paddingHorizontal: 12,
  },
  grid: {
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
    zIndex: 2,
  },
  horizontalLine: {
    position: 'absolute',
    borderRadius: 2,
    zIndex: 1,
  },
  verticalLine: {
    position: 'absolute',
    borderRadius: 2,
    zIndex: 1,
  },
  lastMoveGlow: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: '#FDE047',
    shadowColor: '#FDE047',
    shadowOpacity: 0.95,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 3,
  },
  box: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  crownBadge: {
    fontSize: 18,
    lineHeight: 22,
  },
  bottomBar: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: RoyalColors.card,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  bottomStatus: {
    color: RoyalColors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
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
