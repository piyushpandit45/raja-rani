import WelcomeScreen from '@/screens/WelcomeScreen';
import { getUserSession } from '@/utils/storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;
    void getUserSession()
      .then((session) => {
        if (session) router.replace('/home');
      })
      .catch((error: unknown) => {
        console.error('Unable to load saved user session:', error);
      })
      .finally(() => {
        if (isMounted) setIsCheckingSession(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isCheckingSession) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <WelcomeScreen />;
}
