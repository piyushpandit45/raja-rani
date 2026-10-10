import React from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RoyalColors } from '@/constants/theme';
import { GameRules, GameType } from '@/utils/gameRulesData';

interface RuleModalProps {
  visible: boolean;
  gameType: GameType;
  onClose: () => void;
}

export default function RuleModal({ visible, gameType, onClose }: RuleModalProps) {
  const rules = GameRules[gameType];
  const { width, height } = useWindowDimensions();
  const scrollMaxHeight = Math.max(120, Math.min(height * 0.56, height * 0.85 - 178));

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss rules"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.modalContainer, { width: Math.min(width - 32, 500), maxHeight: height * 0.85 }]}>
          <View>
            <LinearGradient
              colors={['#111827', '#0B1120']}
              style={styles.modalContent}
            >
              <View style={styles.header}>
                <View style={styles.titleBlock}>
                  <Text style={styles.eyebrow}>📜 HOW TO PLAY</Text>
                  <Text style={styles.title}>{rules.title}</Text>
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Close rules"
                  style={styles.closeIcon}
                  onPress={onClose}
                >
                  <Ionicons name="close" size={22} color={RoyalColors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={[styles.scrollContent, { maxHeight: scrollMaxHeight }]}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.description}>{rules.description}</Text>

                <View style={styles.rulesList}>
                  {rules.rules.map((rule, index) => (
                    <View key={index} style={styles.ruleItem}>
                      <View style={styles.ruleNumberContainer}>
                        <Text style={styles.ruleNumber}>{index + 1}</Text>
                      </View>
                      <Text style={styles.ruleText}>{rule}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                accessibilityRole="button"
                style={styles.closeButton}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>Understood / Let&apos;s Play</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    maxWidth: 500,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 10000,
    elevation: 24,
  },
  modalContent: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: RoyalColors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  closeIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: RoyalColors.gold,
  },
  scrollContent: {
    marginBottom: 14,
  },
  scrollContentContainer: {
    paddingBottom: 4,
  },
  description: {
    fontSize: 14,
    color: RoyalColors.textSecondary,
    marginBottom: 16,
  },
  rulesList: {
    gap: 13,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  ruleNumberContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: RoyalColors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  ruleNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: RoyalColors.background,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    color: RoyalColors.textPrimary,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: RoyalColors.raja,
    paddingVertical: 13,
    borderRadius: 11,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: RoyalColors.background,
  },
});
