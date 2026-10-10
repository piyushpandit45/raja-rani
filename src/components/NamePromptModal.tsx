import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RoyalColors, Spacing } from '@/constants/theme';

interface NamePromptModalProps {
  visible: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
}

export default function NamePromptModal({
  visible,
  onSave,
  onClose,
}: NamePromptModalProps) {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName('');
    }
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
            <Text style={styles.title}>Enter Your Royal Name</Text>
            <Text style={styles.subtitle}>Raja / Rani</Text>

            <TextInput
              style={styles.input}
              placeholder="Your name..."
              placeholderTextColor={RoyalColors.textSecondary}
              value={name}
              onChangeText={setName}
              autoFocus
              maxLength={20}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Enter Kingdom</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalContainer: {
    width: Math.min(width * 0.9, 400),
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  modalContent: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: RoyalColors.gold,
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 16,
    color: RoyalColors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  input: {
    backgroundColor: RoyalColors.background,
    borderWidth: 1,
    borderColor: RoyalColors.neonBorder,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    fontSize: 18,
    color: RoyalColors.textPrimary,
    marginBottom: Spacing.four,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: RoyalColors.cardDark,
    borderWidth: 1,
    borderColor: RoyalColors.textSecondary,
  },
  cancelButtonText: {
    color: RoyalColors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: RoyalColors.raja,
  },
  saveButtonText: {
    color: RoyalColors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
