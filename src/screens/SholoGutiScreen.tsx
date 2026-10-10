import RuleModal from '@/components/RuleModal';
import ExitConfirmationModal from '@/components/ExitConfirmationModal';
import ScoreBoard from '@/components/ScoreBoard';
import VictoryCelebrationModal from '@/components/VictoryCelebrationModal';
import { RoyalColors, Spacing } from '@/constants/theme';
import useGameExitConfirmation from '@/hooks/useGameExitConfirmation';
import { DifficultyType, SholoGutiAI, SholoGutiState } from '@/utils/aiBotService';
import { recordMatchSilently } from '@/services/api';
import {
  EDGES,
  INITIAL_PIECES,
  NODE_COORDINATES,
  hasSubsequentJump,
  getValidMoves
} from '@/utils/sholoGutiGraph';
import { playGameSound, releaseGameSounds } from '@/utils/soundManager';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, Defs, Line, RadialGradient, Stop, Svg } from 'react-native-svg';

export default function SholoGutiScreen() {
  const params = useLocalSearchParams();
  const playerName = (params.playerName as string) || 'Player 1';
  const opponent = (params.opponent as 'computer' | 'passAndPlay') || 'computer';
  const difficulty = (params.difficulty as DifficultyType) || 'medium';

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const BOARD_WIDTH = width - 16;
  const availableBoardHeight = height - insets.top - insets.bottom - 42 - 38;
  const BOARD_HEIGHT = Math.max(0, Math.min(height * 0.76, 560, availableBoardHeight));
  const ARTWORK_WIDTH = Math.max(0, BOARD_WIDTH - 12);
  const ARTWORK_HEIGHT = Math.max(0, BOARD_HEIGHT - 12);
  const SVG_SCALE = Math.min(ARTWORK_WIDTH / 360, ARTWORK_HEIGHT / 500);
  const SVG_OFFSET_X = (ARTWORK_WIDTH - 360 * SVG_SCALE) / 2;
  const SVG_OFFSET_Y = (ARTWORK_HEIGHT - 500 * SVG_SCALE) / 2;

  const [pieces, setPieces] = useState<number[]>([...INITIAL_PIECES]);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<{ to: number; isCapture: boolean; capturedNode?: number }[]>([]);
  const [player1Beads, setPlayer1Beads] = useState(16);
  const [player2Beads, setPlayer2Beads] = useState(16);
  const [turnsTaken, setTurnsTaken] = useState(0);
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [winner, setWinner] = useState<1 | 2 | 'draw' | null>(null);
  const [mustContinueCapture, setMustContinueCapture] = useState(false);
  const [captureNode, setCaptureNode] = useState<number | null>(null);
  const matchSyncStarted = useRef(false);
  const exitConfirmation = useGameExitConfirmation();

  useEffect(() => () => releaseGameSounds(), []);

  useEffect(() => {
    if (!showGameOver || winner === null) return;
    if (matchSyncStarted.current) return;
    matchSyncStarted.current = true;
    playGameSound(
      winner === 'draw' ? 'draw' : winner === 1 ? 'sholoWin' : 'lose',
    );
    void recordMatchSilently({
      game_type: 'sholo_guti',
      winner,
      final_score: {
        p1: 16 - player1Beads,
        p2: 16 - player2Beads,
      },
      turns: turnsTaken,
    }).catch((error: unknown) => {
      console.warn('Background match sync failed; gameplay continues locally:', error);
    });
  }, [showGameOver, winner, player1Beads, player2Beads, turnsTaken]);

  const checkGameOver = useCallback((
    nextPieces: number[],
    nextPlayer1Beads: number,
    nextPlayer2Beads: number,
    nextPlayer: 1 | 2,
  ) => {
    if (nextPlayer1Beads === 0) {
      setWinner(2);
      setShowGameOver(true);
      return;
    }
    if (nextPlayer2Beads === 0) {
      setWinner(1);
      setShowGameOver(true);
      return;
    }

    let hasLegalMoves = false;
    for (let node = 0; node < 37; node++) {
      if (nextPieces[node] === nextPlayer) {
        const moves = getValidMoves(node, nextPieces);
        if (moves.length > 0) {
          hasLegalMoves = true;
          break;
        }
      }
    }

    if (!hasLegalMoves) {
      setWinner(nextPlayer === 1 ? 2 : 1);
      setShowGameOver(true);
    }
  }, []);

  const executeMove = useCallback((from: number, move: { to: number; isCapture: boolean; capturedNode?: number }) => {
    playGameSound(move.isCapture ? 'sholoCapture' : 'sholoMove');
    const newPieces = [...pieces];
    newPieces[from] = 0;
    newPieces[move.to] = currentPlayer;
    let nextPlayer1Beads = player1Beads;
    let nextPlayer2Beads = player2Beads;

    if (move.isCapture && move.capturedNode !== undefined) {
      newPieces[move.capturedNode] = 0;

      if (currentPlayer === 1) {
        nextPlayer2Beads -= 1;
      } else {
        nextPlayer1Beads -= 1;
      }
      setPlayer1Beads(nextPlayer1Beads);
      setPlayer2Beads(nextPlayer2Beads);

      // Check for multi-capture
      if (hasSubsequentJump(move.to, newPieces)) {
        const continueMoves = getValidMoves(move.to, newPieces).filter((m) => m.isCapture);
        setPieces(newPieces);
        setSelectedNode(move.to);
        setValidMoves(continueMoves);
        setMustContinueCapture(true);
        setCaptureNode(move.to);
        return; // Don't switch player, continue capturing
      }
    }

    setPieces(newPieces);
    setSelectedNode(null);
    setValidMoves([]);
    setMustContinueCapture(false);
    setCaptureNode(null);

    // Switch player
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    setTurnsTaken((turns) => turns + 1);
    setCurrentPlayer(nextPlayer);

    checkGameOver(newPieces, nextPlayer1Beads, nextPlayer2Beads, nextPlayer);
  }, [pieces, currentPlayer, player1Beads, player2Beads, checkGameOver]);

  const handleNodePress = useCallback(
    (node: number) => {
      if (isComputerThinking) return;

      const piece = pieces[node];

      if (mustContinueCapture) {
        if (node === captureNode) {
          setSelectedNode(node);
          setValidMoves(getValidMoves(node, pieces).filter((move) => move.isCapture));
          return;
        }

        const forcedCapture = validMoves.find((move) => move.to === node && move.isCapture);
        if (captureNode !== null && selectedNode === captureNode && forcedCapture) {
          executeMove(captureNode, forcedCapture);
        }
        return;
      }

      // If clicking on own piece, select it
      if (piece === currentPlayer) {
        setSelectedNode(node);
        const moves = getValidMoves(node, pieces);
        setValidMoves(moves);
        return;
      }

      // If a piece is selected and clicking on a valid move
      if (selectedNode !== null) {
        const move = validMoves.find((m) => m.to === node);
        if (move) {
          executeMove(selectedNode, move);
        } else {
          // Deselect if clicking elsewhere
          setSelectedNode(null);
          setValidMoves([]);
        }
      }
    },
    [pieces, currentPlayer, selectedNode, validMoves, isComputerThinking, mustContinueCapture, captureNode, executeMove]
  );

  // AI Turn
  useEffect(() => {
    if (
      opponent === 'computer' &&
      currentPlayer === 2 &&
      !showGameOver &&
      !isComputerThinking
    ) {
      const delay = Math.random() * 300 + 600; // 600-900ms delay

      const timer = setTimeout(() => {
        setIsComputerThinking(true);

        try {
          const state: SholoGutiState = {
            pieces,
            currentPlayer,
          };

          let move: { from: number; to: number };
          if (mustContinueCapture && captureNode !== null) {
            const forcedMove = getValidMoves(captureNode, pieces)
              .find((candidate) => candidate.isCapture);
            if (!forcedMove) {
              throw new Error('No follow-up capture available');
            }
            move = { from: captureNode, to: forcedMove.to };
          } else {
            move = SholoGutiAI.getMove(state, difficulty);
          }

          // Get the move details
          const moves = getValidMoves(move.from, pieces);
          const moveDetails = moves.find((m) => m.to === move.to);

          if (moveDetails) {
            executeMove(move.from, moveDetails);
          }
        } catch (error) {
          console.error('AI move error:', error);
          // If AI has no moves, game over
          setWinner(1);
          setShowGameOver(true);
        } finally {
          setIsComputerThinking(false);
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [
    currentPlayer,
    opponent,
    pieces,
    showGameOver,
    isComputerThinking,
    difficulty,
    executeMove,
    mustContinueCapture,
    captureNode,
  ]);

  const handleReset = () => {
    setPieces([...INITIAL_PIECES]);
    setCurrentPlayer(1);
    setSelectedNode(null);
    setValidMoves([]);
    setPlayer1Beads(16);
    setPlayer2Beads(16);
    setTurnsTaken(0);
    setWinner(null);
    setShowGameOver(false);
    setMustContinueCapture(false);
    setCaptureNode(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScoreBoard
        player1Name={playerName}
        player2Name={opponent === 'computer' ? 'Computer (AI)' : 'Player 2'}
        player1Score={player1Beads}
        player2Score={player2Beads}
        currentPlayer={currentPlayer}
        onBack={exitConfirmation.requestExit}
        onReset={handleReset}
        onRules={() => setShowRules(true)}
      />

      <View style={styles.gameContainer}>
            <View style={[styles.boardContainer, { width: BOARD_WIDTH, height: BOARD_HEIGHT }]}>
              <Svg
                style={styles.boardArtwork}
                width={ARTWORK_WIDTH}
                height={ARTWORK_HEIGHT}
                viewBox="0 0 360 500"
                preserveAspectRatio="xMidYMid meet"
                pointerEvents="none"
              >
                <Defs>
                  <RadialGradient id="redGlass" cx="35%" cy="28%" rx="70%" ry="70%">
                    <Stop offset="0%" stopColor="#FCA5A5" />
                    <Stop offset="42%" stopColor="#EF4444" />
                    <Stop offset="100%" stopColor="#991B1B" />
                  </RadialGradient>
                  <RadialGradient id="blueGlass" cx="35%" cy="28%" rx="70%" ry="70%">
                    <Stop offset="0%" stopColor="#A5F3FC" />
                    <Stop offset="42%" stopColor="#06B6D4" />
                    <Stop offset="100%" stopColor="#155E75" />
                  </RadialGradient>
                </Defs>
              {/* Draw edges */}
              {EDGES.map((edge, index) => {
                const fromCoord = NODE_COORDINATES[edge.from];
                const toCoord = NODE_COORDINATES[edge.to];
                return (
                  <Line
                    key={index}
                    x1={fromCoord.x}
                    y1={fromCoord.y}
                    x2={toCoord.x}
                    y2={toCoord.y}
                    stroke="#4A2810"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Draw nodes and pieces */}
              {NODE_COORDINATES.map((coord, index) => {
                const piece = pieces[index];
                const isSelected = selectedNode === index;
                const isValidMove = validMoves.some((m) => m.to === index);

                const nodeRadius = 7;
                const pieceRadius = 12.5;
                const cx = coord.x;
                const cy = coord.y;

                return (
                  <React.Fragment key={index}>
                    {/* Node circle */}
                    {isValidMove && (
                      <Circle
                        cx={cx}
                        cy={cy}
                        r={nodeRadius + 7}
                        fill="#FBBF24"
                        opacity={0.28}
                      />
                    )}
                    <Circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? nodeRadius * 1.5 : nodeRadius}
                      fill={
                        isValidMove
                          ? '#FBBF24'
                          : '#EAC998'
                      }
                      stroke={
                        isSelected
                          ? '#4ADE80'
                          : isValidMove
                          ? '#FBBF24'
                          : '#4A2A12'
                      }
                      strokeWidth={isSelected ? 3 : 2}
                    />

                    {/* Piece */}
                    {piece !== 0 && (
                      <>
                        <Circle
                          cx={cx}
                          cy={cy + 2}
                          r={pieceRadius + 2}
                          fill="#2B160B"
                          opacity={0.4}
                        />
                        {isSelected && (
                          <Circle
                            cx={cx}
                            cy={cy}
                            r={pieceRadius + 6}
                            fill="none"
                            stroke="#4ADE80"
                            strokeWidth={3}
                            opacity={0.95}
                          />
                        )}
                        <Circle
                          cx={cx}
                          cy={cy}
                          r={pieceRadius}
                          fill={piece === 2 ? 'url(#redGlass)' : 'url(#blueGlass)'}
                          stroke={piece === 2 ? '#7F1D1D' : '#155E75'}
                          strokeWidth={2}
                        />
                        <Circle
                          cx={cx - 4}
                          cy={cy - 5}
                          r={4}
                          fill="#FFFFFF"
                          opacity={0.78}
                        />
                      </>
                    )}
                  </React.Fragment>
                );
              })}
              </Svg>

              {/* Touch overlay for node interactions */}
              <View
                style={[
                  styles.touchOverlay,
                  { width: ARTWORK_WIDTH, height: ARTWORK_HEIGHT },
                ]}
              >
              {NODE_COORDINATES.map((coord, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.touchNode,
                    {
                      left: SVG_OFFSET_X + coord.x * SVG_SCALE - 12 * SVG_SCALE,
                      top: SVG_OFFSET_Y + coord.y * SVG_SCALE - 12 * SVG_SCALE,
                      width: 24 * SVG_SCALE,
                      height: 24 * SVG_SCALE,
                    },
                  ]}
                  onPress={() => handleNodePress(index)}
                  disabled={isComputerThinking}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                />
              ))}
              </View>
            </View>
      </View>

      <View style={styles.bottomBar}>
        {mustContinueCapture ? (
          <View style={styles.continueCaptureBanner}>
            <Ionicons name="arrow-redo" size={20} color={RoyalColors.gold} />
            <Text style={styles.continueCaptureText}>Continue Capturing!</Text>
          </View>
        ) : (
          <Text style={styles.bottomStatus}>
            {isComputerThinking ? 'Computer is thinking…' : 'Move along a line or jump an opponent bead'}
          </Text>
        )}
      </View>

      <RuleModal visible={showRules} gameType="sholoGuti" onClose={() => setShowRules(false)} />
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
          { label: 'Pieces captured', value: 32 - player1Beads - player2Beads },
          { label: 'Beads left', value: `${player1Beads} - ${player2Beads}` },
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
  boardContainer: {
    position: 'relative',
    backgroundColor: '#D8A56A',
    borderRadius: 18,
    borderWidth: 6,
    borderColor: '#5C381E',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  boardArtwork: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  touchNode: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    height: 38,
    minHeight: 38,
    maxHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    backgroundColor: RoyalColors.card,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  bottomStatus: {
    color: RoyalColors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  continueCaptureBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: RoyalColors.gold,
  },
  continueCaptureText: {
    color: RoyalColors.gold,
    fontSize: 16,
    fontWeight: 'bold',
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
