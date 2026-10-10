import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RoyalColors, Spacing } from '@/constants/theme';
import { GameType } from '@/utils/gameRulesData';

interface GameCardProps {
  gameType: GameType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  onRulesPress: () => void;
}

export default function GameCard({
  gameType,
  title,
  description,
  icon,
  onPress,
  onRulesPress,
}: GameCardProps) {
  const accentColor =
    gameType === 'sholoGuti'
      ? RoyalColors.raja
      : gameType === 'dotsBoxes'
      ? RoyalColors.rani
      : RoyalColors.gold;

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={[RoyalColors.card, RoyalColors.cardDark]}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { borderColor: accentColor }]}>
            <Ionicons name={icon} size={32} color={accentColor} />
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.rulesButton, { borderColor: RoyalColors.textSecondary }]}
            onPress={onRulesPress}
          >
            <Ionicons name="book-outline" size={18} color={RoyalColors.textSecondary} />
            <Text style={styles.rulesButtonText}>How to Play</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: accentColor }]}
            onPress={onPress}
          >
            <Ionicons name="play" size={20} color={RoyalColors.background} />
            <Text style={styles.playButtonText}>Play Now</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: Spacing.four,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: RoyalColors.neonBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: Spacing.three,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
    backgroundColor: RoyalColors.background,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: RoyalColors.textPrimary,
    marginBottom: Spacing.one,
  },
  cardDescription: {
    fontSize: 14,
    color: RoyalColors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rulesButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    gap: Spacing.one,
  },
  rulesButtonText: {
    color: RoyalColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.one,
  },
  playButtonText: {
    color: RoyalColors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
