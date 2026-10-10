import { RoyalColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ExitConfirmationModalProps {
  visible: boolean;
  onResume: () => void;
  onExit: () => void;
}

export default function ExitConfirmationModal({
  visible,
  onResume,
  onExit,
}: ExitConfirmationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onResume}
    >
      <View style={styles.backdrop}>
        <LinearGradient colors={[RoyalColors.card, RoyalColors.cardDark]} style={styles.dialog}>
          <View style={styles.icon}>
            <Ionicons name="shield-half" size={28} color={RoyalColors.gold} />
          </View>
          <Text style={styles.title}>Leave Kingdom Match?</Text>
          <Text style={styles.message}>
            Progress will be lost.
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.resumeButton}
              onPress={onResume}
            >
              <Text style={styles.resumeText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.exitButton}
              onPress={onExit}
            >
              <Text style={styles.exitText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.76)',
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    padding: 24,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    gap: 14,
  },
  icon: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 27,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  title: {
    color: RoyalColors.gold,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: RoyalColors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  resumeButton: {
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RoyalColors.gold,
    borderRadius: 12,
  },
  resumeText: {
    color: RoyalColors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  exitButton: {
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: RoyalColors.rani,
  },
  exitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
