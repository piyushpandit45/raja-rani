import { useNavigation } from 'expo-router/react-navigation';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';

export default function useGameExitConfirmation() {
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);
  const allowNavigation = useRef(false);

  const requestExit = useCallback(() => {
    setVisible(true);
  }, []);

  useEffect(() => {
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
      requestExit();
      return true;
    });
    const removeSubscription = navigation.addListener('beforeRemove', (event) => {
      if (allowNavigation.current) return;
      event.preventDefault();
      requestExit();
    });

    return () => {
      backSubscription.remove();
      removeSubscription();
    };
  }, [navigation, requestExit]);

  const resume = useCallback(() => {
    setVisible(false);
  }, []);

  const confirmExit = useCallback(() => {
    setVisible(false);
    allowNavigation.current = true;
    router.replace('/home');
  }, []);

  return { visible, requestExit, resume, confirmExit };
}
