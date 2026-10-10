import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RoyalColors, Spacing } from '@/constants/theme';

interface DynamicLeadBannerProps {
  player1Name: string;
  player1Score: number;
  player2Score: number;
}

export default function DynamicLeadBanner({
  player1Name,
  player1Score,
  player2Score,
}: DynamicLeadBannerProps) {
  const scoreDiff = player1Score - player2Score;

  if (scoreDiff > 0) {
    return (
      <View style={[styles.container, styles.leadContainer]}>
        <Text style={styles.leadEmoji}>🟢</Text>
        <Text style={styles.leadText}>
          {player1Name} is Leading (+{scoreDiff})
        </Text>
      </View>
    );
  } else if (scoreDiff < 0) {
    return (
      <View style={[styles.container, styles.behindContainer]}>
        <Text style={styles.leadEmoji}>🔴</Text>
        <Text style={styles.leadText}>
          Computer is Leading (+{Math.abs(scoreDiff)})
        </Text>
      </View>
    );
  } else {
    return (
      <View style={[styles.container, styles.tiedContainer]}>
        <Text style={styles.leadEmoji}>🟡</Text>
        <Text style={styles.leadText}>Match Tied (Level Score)</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    backgroundColor: RoyalColors.cardDark,
    borderBottomWidth: 1,
    borderBottomColor: RoyalColors.neonBorder,
  },
  leadContainer: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  behindContainer: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
  tiedContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  leadEmoji: {
    fontSize: 20,
  },
  leadText: {
    fontSize: 16,
    fontWeight: '600',
    color: RoyalColors.textPrimary,
  },
});
