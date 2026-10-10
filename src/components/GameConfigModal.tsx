import { RoyalColors, Spacing } from '@/constants/theme';
import { GameType } from '@/utils/gameRulesData';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export type OpponentType = 'computer' | 'passAndPlay';
export type DifficultyType = 'easy' | 'medium' | 'hard';

interface GameConfigModalProps {
  visible: boolean;
  gameType: GameType;
  playerName: string;
  onClose: () => void;
  onStartGame: (config: {
    opponent: OpponentType;
    difficulty: DifficultyType;
  }) => void;
}

export default function GameConfigModal({
  visible,
  gameType,
  playerName,
  onClose,
  onStartGame,
}: GameConfigModalProps) {
  const [opponent, setOpponent] = useState<OpponentType>('computer');
  const [difficulty, setDifficulty] = useState<DifficultyType>('medium');

  const handleStartGame = () => {
    onStartGame({ opponent, difficulty });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[RoyalColors.card, RoyalColors.cardDark]}
            style={styles.modalContent}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Match Setup</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color={RoyalColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Opponent</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    opponent === 'computer' && styles.toggleButtonActive,
                  ]}
                  onPress={() => setOpponent('computer')}
                >
                  <Ionicons
                    name="desktop-outline"
                    size={20}
                    color={
                      opponent === 'computer'
                        ? RoyalColors.background
                        : RoyalColors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.toggleButtonText,
                      opponent === 'computer' && styles.toggleButtonTextActive,
                    ]}
                  >
                    Computer (AI)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    opponent === 'passAndPlay' && styles.toggleButtonActive,
                  ]}
                  onPress={() => setOpponent('passAndPlay')}
                >
                  <Ionicons
                    name="people-outline"
                    size={20}
                    color={
                      opponent === 'passAndPlay'
                        ? RoyalColors.background
                        : RoyalColors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.toggleButtonText,
                      opponent === 'passAndPlay' && styles.toggleButtonTextActive,
                    ]}
                  >
                    Pass & Play
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {opponent === 'computer' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Difficulty</Text>
                <View style={styles.difficultyContainer}>
                  {(['easy', 'medium', 'hard'] as DifficultyType[]).map((diff) => (
                    <TouchableOpacity
                      key={diff}
                      style={[
                        styles.difficultyButton,
                        difficulty === diff && styles.difficultyButtonActive,
                        {
                          borderColor:
                            difficulty === diff
                              ? diff === 'easy'
                                ? RoyalColors.raja
                                : diff === 'medium'
                                ? RoyalColors.gold
                                : RoyalColors.rani
                              : RoyalColors.textSecondary,
                        },
                      ]}
                      onPress={() => setDifficulty(diff)}
                    >
                      <Text
                        style={[
                          styles.difficultyButtonText,
                          difficulty === diff && styles.difficultyButtonTextActive,
                        ]}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Players</Text>
              <View style={styles.playersContainer}>
                <View style={styles.playerBox}>
                  <Ionicons name="person" size={20} color={RoyalColors.raja} />
                  <Text style={styles.playerName}>Player 1: {playerName}</Text>
                </View>
                <View style={styles.playerBox}>
                  <Ionicons
                    name={opponent === 'computer' ? 'desktop' : 'person'}
                    size={20}
                    color={RoyalColors.rani}
                  />
                  <Text style={styles.playerName}>
                    Player 2: {opponent === 'computer' ? 'Computer (AI)' : 'Player 2'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rulesButton]}
                onPress={onClose}
              >
                <Ionicons name="book-outline" size={20} color={RoyalColors.textSecondary} />
                <Text style={styles.rulesButtonText}>View Rules</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.startButton]}
                onPress={handleStartGame}
              >
                <Ionicons name="play" size={20} color={RoyalColors.background} />
                <Text style={styles.startButtonText}>Start Match</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalContainer: {
    width: Math.min(width * 0.95, 500),
    maxHeight: height * 0.8,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  modalContent: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: RoyalColors.gold,
  },
  section: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: RoyalColors.textPrimary,
    marginBottom: Spacing.two,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: RoyalColors.background,
    borderWidth: 1,
    borderColor: RoyalColors.textSecondary,
    gap: Spacing.one,
  },
  toggleButtonActive: {
    backgroundColor: RoyalColors.raja,
    borderColor: RoyalColors.raja,
  },
  toggleButtonText: {
    color: RoyalColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: RoyalColors.background,
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: RoyalColors.background,
    borderWidth: 2,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: RoyalColors.cardDark,
  },
  difficultyButtonText: {
    color: RoyalColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  difficultyButtonTextActive: {
    color: RoyalColors.textPrimary,
  },
  playersContainer: {
    gap: Spacing.two,
  },
  playerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    backgroundColor: RoyalColors.background,
    borderRadius: Spacing.two,
  },
  playerName: {
    color: RoyalColors.textPrimary,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.one,
  },
  rulesButton: {
    backgroundColor: RoyalColors.background,
    borderWidth: 1,
    borderColor: RoyalColors.textSecondary,
  },
  rulesButtonText: {
    color: RoyalColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: RoyalColors.rani,
  },
  startButtonText: {
    color: RoyalColors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
