import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoyalColors } from '@/constants/theme';

interface ScoreBoardProps {
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  currentPlayer: 1 | 2;
  difficulty?: 'easy' | 'medium' | 'hard';
  onReset?: () => void;
  onRules?: () => void;
  onBack?: () => void;
  isComputerThinking?: boolean;
}

export default function ScoreBoard({
  player1Name,
  player2Name,
  player1Score,
  player2Score,
  currentPlayer,
  onReset,
  onRules,
  onBack,
}: ScoreBoardProps) {
  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to lobby"
          style={styles.backButton}
          onPress={onBack}
        >
          <Ionicons name="chevron-back" size={19} color={RoyalColors.textPrimary} />
        </TouchableOpacity>
      )}
      <View style={[styles.player, currentPlayer === 1 && styles.playerActive]}>
        <View style={[styles.avatar, styles.playerAvatar]}>
          <Ionicons name="person" size={17} color={RoyalColors.raja} />
          <Text style={styles.crown}>♛</Text>
        </View>
        <View style={styles.playerDetails}>
          <Text numberOfLines={1} style={styles.name}>{player1Name}</Text>
          <Text style={[styles.score, styles.playerScore]}>👑 {player1Score}</Text>
        </View>
      </View>

      <View style={styles.center}>
        <View style={styles.vsRow}>
          <View style={[styles.turnDot, currentPlayer === 1 && styles.turnDotActive]} />
          <Text style={styles.vs}>VS</Text>
          <View style={[styles.turnDot, currentPlayer === 2 && styles.turnDotActive]} />
        </View>
        {onReset && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Restart game"
            style={styles.iconButton}
            onPress={onReset}
          >
            <Ionicons name="refresh" size={16} color={RoyalColors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[
        styles.player,
        styles.opponent,
        currentPlayer === 2 && styles.opponentActive,
      ]}>
        <View style={styles.playerDetails}>
          <Text numberOfLines={1} style={[styles.name, styles.opponentName]}>{player2Name}</Text>
          <Text style={[styles.score, styles.opponentScore]}>🤖 {player2Score}</Text>
        </View>
        <View style={[styles.avatar, styles.opponentAvatar]}>
          <Ionicons name="hardware-chip-outline" size={17} color={RoyalColors.rani} />
        </View>
      </View>

      {onRules && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="How to play"
          style={styles.rulesButton}
          onPress={onRules}
        >
          <Ionicons name="help" size={19} color={RoyalColors.gold} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 42,
    maxHeight: 42,
    position: 'relative',
    zIndex: 20,
    elevation: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 4,
    backgroundColor: RoyalColors.cardDark,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  backButton: {
    width: 28,
    height: 30,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  player: {
    flex: 1,
    minWidth: 0,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 10,
  },
  opponent: {
    justifyContent: 'flex-end',
  },
  playerActive: {
    borderColor: RoyalColors.raja,
    shadowColor: RoyalColors.raja,
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 4,
  },
  opponentActive: {
    borderColor: RoyalColors.rani,
    shadowColor: RoyalColors.rani,
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    flexShrink: 0,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  playerAvatar: {
    borderColor: 'rgba(6, 182, 212, 0.55)',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
  },
  opponentAvatar: {
    borderColor: 'rgba(244, 63, 94, 0.55)',
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
  },
  crown: {
    position: 'absolute',
    right: -3,
    top: -6,
    fontSize: 10,
    color: RoyalColors.gold,
  },
  playerDetails: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 1,
  },
  name: {
    color: RoyalColors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  opponentName: {
    textAlign: 'right',
  },
  score: {
    fontSize: 10,
    fontWeight: '700',
  },
  playerScore: {
    color: RoyalColors.rajaLight,
  },
  opponentScore: {
    color: RoyalColors.raniLight,
    textAlign: 'right',
  },
  center: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsRow: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  vs: {
    color: RoyalColors.gold,
    fontSize: 9,
    fontWeight: '800',
  },
  turnDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#475569',
  },
  turnDotActive: {
    backgroundColor: RoyalColors.gold,
  },
  iconButton: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulesButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    zIndex: 9999,
    elevation: 24,
  },
});
