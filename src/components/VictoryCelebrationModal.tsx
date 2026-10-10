import { RoyalColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

interface VictoryCelebrationModalProps {
  visible: boolean;
  outcome: 'player' | 'opponent' | 'draw';
  headline: string;
  message: string;
  stats: { label: string; value: string | number }[];
  onRematch: () => void;
  onHome: () => void;
}

const PARTICLE_COLORS = ['#F59E0B', '#06B6D4', '#F43F5E', '#FDE68A'];
const PARTICLE_COUNT = 28;

export default function VictoryCelebrationModal({
  visible,
  outcome,
  headline,
  message,
  stats,
  onRematch,
  onHome,
}: VictoryCelebrationModalProps) {
  const { width, height } = useWindowDimensions();
  const [sunRotation] = useState(() => new Animated.Value(0));
  const [trophyScale] = useState(() => new Animated.Value(0));
  const [cardOpacity] = useState(() => new Animated.Value(0));
  const [particles] = useState(() =>
    Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0)),
  );

  useEffect(() => {
    if (!visible) return;

    sunRotation.setValue(0);
    trophyScale.setValue(0);
    cardOpacity.setValue(0);
    particles.forEach((particle) => particle.setValue(0));

    const sunAnimation = Animated.loop(
      Animated.timing(sunRotation, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const trophyAnimation = Animated.sequence([
      Animated.timing(trophyScale, {
        toValue: 1.25,
        duration: 430,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.spring(trophyScale, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
    ]);
    const cardAnimation = Animated.timing(cardOpacity, {
      toValue: 1,
      duration: 420,
      delay: 180,
      useNativeDriver: true,
    });
    const particleAnimations = particles.map((particle, index) =>
      Animated.loop(
        Animated.timing(particle, {
          toValue: 1,
          duration: 2200 + (index % 5) * 230,
          delay: (index % 9) * 150,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
    );

    sunAnimation.start();
    trophyAnimation.start();
    cardAnimation.start();
    particleAnimations.forEach((animation) => animation.start());

    return () => {
      sunAnimation.stop();
      trophyAnimation.stop();
      cardAnimation.stop();
      particleAnimations.forEach((animation) => animation.stop());
    };
  }, [visible, sunRotation, trophyScale, cardOpacity, particles]);

  const isPlayerWin = outcome === 'player';
  const isDraw = outcome === 'draw';
  const glowColor = isPlayerWin ? '#22C55E' : outcome === 'opponent' ? '#F43F5E' : RoyalColors.gold;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onHome}
    >
      <View style={styles.overlay}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {particles.map((particle, index) => {
            const left = ((index * 47 + 17) % 100) * width / 100;
            const size = index % 3 === 0 ? 7 : 5;
            return (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    left,
                    width: size,
                    height: size * 1.6,
                    backgroundColor: PARTICLE_COLORS[index % PARTICLE_COLORS.length],
                    opacity: particle.interpolate({
                      inputRange: [0, 0.08, 0.82, 1],
                      outputRange: [0, 1, 1, 0],
                    }),
                    transform: [
                      {
                        translateY: particle.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-24, height + 30],
                        }),
                      },
                      {
                        rotate: particle.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', `${(index % 2 ? 1 : -1) * 720}deg`],
                        }),
                      },
                    ],
                  },
                ]}
              />
            );
          })}
        </View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.sunburst,
            {
              transform: [{
                rotate: sunRotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              }],
            },
          ]}
        >
          {Array.from({ length: 12 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.sunRay,
                { transform: [{ rotate: `${index * 30}deg` }] },
              ]}
            />
          ))}
        </Animated.View>

        <View style={styles.content}>
          <Animated.View
            style={[
              styles.trophyWrap,
              {
                shadowColor: glowColor,
                transform: [{ scale: trophyScale }],
              },
            ]}
          >
            <Ionicons
              name={isDraw ? 'ribbon' : isPlayerWin ? 'trophy' : 'shield'}
              size={76}
              color={isPlayerWin ? '#FDE68A' : outcome === 'opponent' ? '#FDA4AF' : RoyalColors.gold}
            />
          </Animated.View>

          <Animated.View style={[styles.card, { opacity: cardOpacity, borderColor: glowColor }]}>
            <Text style={[styles.headline, { color: isPlayerWin ? '#86EFAC' : isDraw ? RoyalColors.gold : '#FDA4AF' }]}>
              {headline}
            </Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.stats}>
              {stats.map(({ label, value }) => (
                <View key={label} style={styles.stat}>
                  <Text style={styles.statValue}>{value}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              style={styles.rematchButton}
              onPress={onRematch}
            >
              <LinearGradient
                colors={isPlayerWin ? ['#16A34A', '#D97706'] : ['#D97706', '#B45309']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Ionicons name="refresh" size={19} color="#FFFFFF" />
                <Text style={styles.rematchText}>Play Again / Rematch</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.homeButton}
              onPress={onHome}
            >
              <Ionicons name="home-outline" size={17} color={RoyalColors.gold} />
              <Text style={styles.homeText}>Return to Kingdom (Home)</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
    backgroundColor: 'rgba(3, 7, 18, 0.9)',
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
  },
  sunburst: {
    position: 'absolute',
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sunRay: {
    position: 'absolute',
    width: 14,
    height: 135,
    top: 5,
    borderRadius: 7,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  content: {
    width: '100%',
    maxWidth: 430,
    alignItems: 'center',
  },
  trophyWrap: {
    width: 112,
    height: 112,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -16,
    borderRadius: 56,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    shadowOpacity: 0.9,
    shadowRadius: 25,
    elevation: 15,
    zIndex: 1,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 18,
    borderWidth: 1.5,
    borderRadius: 22,
    backgroundColor: '#111827',
    gap: 12,
  },
  headline: {
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.7,
  },
  message: {
    color: RoyalColors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  stats: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 5,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: RoyalColors.gold,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: RoyalColors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  rematchButton: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 12,
  },
  buttonGradient: {
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
  },
  rematchText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  homeButton: {
    width: '100%',
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.55)',
    borderRadius: 12,
  },
  homeText: {
    color: RoyalColors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
});
