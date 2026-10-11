import { RoyalColors } from '@/constants/theme';
import { ApiNetworkError, onboardPlayer } from '@/services/api';
import { getAccessToken, setPlayerName, setUserSession } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const appLogo = require('../../assets/images/logo.png.png');

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width - 48, 220);
  const [playerName, setPlayerNameInput] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationName, setCelebrationName] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [rajaX] = useState(() => new Animated.Value(-(width / 2 + 60)));
  const [raniX] = useState(() => new Animated.Value(width / 2 + 60));
  const [shockwaveScale] = useState(() => new Animated.Value(0.8));
  const [shockwaveOpacity] = useState(() => new Animated.Value(0));
  const [insigniaOpacity] = useState(() => new Animated.Value(0));
  const [insigniaY] = useState(() => new Animated.Value(0));
  const [titleOpacity] = useState(() => new Animated.Value(0));
  const [titleScale] = useState(() => new Animated.Value(0.94));
  const [titleY] = useState(() => new Animated.Value(14));
  const [logoScale] = useState(() => new Animated.Value(0.82));
  const [titleShimmer] = useState(() => new Animated.Value(0));
  const [cardOpacity] = useState(() => new Animated.Value(0));
  const [cardY] = useState(() => new Animated.Value(40));
  const [onboardingButtonScale] = useState(() => new Animated.Value(1));
  const [celebrationOpacity] = useState(() => new Animated.Value(0));
  const [celebrationScale] = useState(() => new Animated.Value(0.7));
  const [borderRotation] = useState(() => new Animated.Value(0));
  const introAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyboardScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const focusedInput = useRef<'name' | 'age' | null>(null);

  useEffect(() => () => {
    if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
    if (keyboardScrollTimer.current) clearTimeout(keyboardScrollTimer.current);
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      Keyboard.scheduleLayoutAnimation(event);
      const screenHeight = Dimensions.get('screen').height;
      const visibleKeyboardHeight = Math.max(
        event.endCoordinates.height,
        screenHeight - event.endCoordinates.screenY,
      );
      setKeyboardHeight(visibleKeyboardHeight);

      if (keyboardScrollTimer.current) clearTimeout(keyboardScrollTimer.current);
      keyboardScrollTimer.current = setTimeout(() => {
        if (focusedInput.current === 'age') {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        } else if (focusedInput.current === 'name') {
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
      }, Platform.OS === 'ios' ? 0 : 80);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, (event) => {
      Keyboard.scheduleLayoutAnimation(event);
      setKeyboardHeight(0);
      focusedInput.current = null;
      if (keyboardScrollTimer.current) {
        clearTimeout(keyboardScrollTimer.current);
        keyboardScrollTimer.current = null;
      }
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const borderAnimation = Animated.loop(
      Animated.timing(borderRotation, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      }),
    );
    borderAnimation.start();

    return () => borderAnimation.stop();
  }, [borderRotation]);

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(rajaX, {
          toValue: -36,
          duration: 2000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(raniX, {
          toValue: 36,
          duration: 2000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(shockwaveScale, {
          toValue: 2.2,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(shockwaveOpacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shockwaveOpacity, {
            toValue: 0,
            duration: 1100,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(insigniaOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(insigniaY, {
          toValue: -60,
          duration: 1800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(titleY, {
          toValue: 0,
          duration: 1800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 42,
          useNativeDriver: true,
        }),
        Animated.timing(titleShimmer, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.spring(titleScale, {
          toValue: 1,
          friction: 8,
          tension: 45,
          useNativeDriver: true,
        }),
      ]),
    ]);

    introAnimation.current = animation;
    animation.start(({ finished }) => {
      if (!finished) return;
      setIntroComplete(true);
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 360,
          useNativeDriver: true,
        }),
        Animated.timing(cardY, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });

    return () => {
      animation.stop();
      introAnimation.current = null;
    };
  }, [
    cardOpacity,
    cardY,
    insigniaOpacity,
    insigniaY,
    logoScale,
    rajaX,
    raniX,
    shockwaveOpacity,
    shockwaveScale,
    titleOpacity,
    titleScale,
    titleShimmer,
    titleY,
  ]);

  const revealNow = () => {
    introAnimation.current?.stop();
    setIntroComplete(true);
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(cardY, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(titleY, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(titleShimmer, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(insigniaOpacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(insigniaY, {
        toValue: -50,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(rajaX, {
        toValue: -36,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(raniX, {
        toValue: 36,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const beginRoyalJourney = async () => {
    setErrorMessage('');
    const trimmedName = playerName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 30) {
      setErrorMessage('Your name must be between 2 and 30 characters.');
      return;
    }

    if (!/^\d+$/.test(age)) {
      setErrorMessage('Enter your age as a whole number.');
      return;
    }
    const numericAge = Number(age);
    if (numericAge < 4 || numericAge > 120) {
      setErrorMessage('Age must be between 4 and 120.');
      return;
    }

    setLoading(true);
    try {
      const user = await onboardPlayer(trimmedName, numericAge);
      await setPlayerName(user.username);
      const token = await getAccessToken();
      if (!token) {
        throw new Error('The server did not return a valid login session.');
      }
      await setUserSession({
        user_id: user.id,
        name: user.username,
        token,
        onboarded: true,
      });
      setCelebrationName(user.username);
      setCelebrating(true);
      Animated.parallel([
        Animated.timing(celebrationOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.spring(celebrationScale, {
          toValue: 1,
          friction: 5,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          celebrationTimer.current = setTimeout(() => router.replace('/home'), 1900);
        }
      });
    } catch (error) {
      console.error('Unable to save onboarding profile:', error);
      if (error instanceof ApiNetworkError) {
        Alert.alert(
          'Network Error',
          'Turn on your mobile data or Wi-Fi to enter the game.',
        );
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to save your profile. Please try again.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const animatePress = (value: Animated.Value, toValue: number) => {
    Animated.spring(value, {
      toValue,
      friction: 5,
      tension: 90,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#090D17', '#111827', '#0B0F19']}
        style={styles.background}
      >
        <View pointerEvents="none" style={styles.rgbFrame}>
          <Animated.View
            style={[
              styles.rgbRotator,
              {
                transform: [{
                  rotate: borderRotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                }],
              },
            ]}
          >
            <LinearGradient
              colors={['#06B6D4', '#8B5CF6', '#F43F5E', '#F59E0B', '#06B6D4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rgbGradient}
            />
          </Animated.View>
        </View>
        <LinearGradient
          colors={['#090D17', '#111827', '#0B0F19']}
          style={styles.backgroundInterior}
        >
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
          {!introComplete && (
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.skipButton}
              onPress={revealNow}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}

          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
          <View style={styles.scrollContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={[
              styles.content,
              keyboardHeight > 0 && styles.contentKeyboard,
              keyboardHeight > 0 && { paddingBottom: Math.min(keyboardHeight, 48) + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            bounces={false}
          >
            {keyboardHeight === 0 && <View style={styles.hero}>
              <View style={styles.emblemStage}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.shockwave,
                    {
                      opacity: shockwaveOpacity,
                      transform: [{ scale: shockwaveScale }],
                    },
                  ]}
                />

                <Animated.View
                  style={[
                    styles.crest,
                    styles.rajaCrest,
                    { transform: [{ translateX: rajaX }] },
                  ]}
                >
                  <Ionicons name="shield" size={48} color={RoyalColors.raja} />
                  <Ionicons
                    name="flash"
                    size={19}
                    color="#CFFAFE"
                    style={styles.crestMark}
                  />
                </Animated.View>
                <Animated.View
                  style={[
                    styles.crest,
                    styles.raniCrest,
                    { transform: [{ translateX: raniX }] },
                  ]}
                >
                  <Ionicons name="shield" size={48} color={RoyalColors.rani} />
                  <Ionicons
                    name="heart"
                    size={18}
                    color="#FFE4E6"
                    style={styles.crestMark}
                  />
                </Animated.View>

                <Animated.View
                  style={[
                    styles.union,
                    {
                      opacity: insigniaOpacity,
                      transform: [{ translateY: insigniaY }],
                    },
                  ]}
                >
                  <View style={[styles.sparkle, styles.sparkleOne]}>
                    <Ionicons name="sparkles" size={17} color={RoyalColors.gold} />
                  </View>
                  <View style={[styles.sparkle, styles.sparkleTwo]}>
                    <Ionicons name="sparkles" size={12} color="#FDE68A" />
                  </View>
                  <View style={[styles.sparkle, styles.sparkleThree]}>
                    <Ionicons name="star" size={11} color="#FDE68A" />
                  </View>
                  <Ionicons name="trophy" size={56} color={RoyalColors.gold} />
                  <Ionicons name="heart" size={19} color="#FFF1C2" style={styles.unionHeart} />
                </Animated.View>
              </View>

              <Animated.View
                style={[
                  styles.titleGroup,
                  {
                    opacity: titleOpacity,
                    transform: [{ scale: titleScale }, { translateY: titleY }],
                  },
                ]}
              >
                <Text style={styles.brandTitle}>RAJA &amp; RANI</Text>
                <Animated.Image
                  source={appLogo}
                  accessibilityLabel="Raja and Rani royal board games"
                  resizeMode="contain"
                  style={[
                    styles.logoImage,
                    {
                      width: logoSize,
                      height: logoSize,
                      transform: [{ scale: logoScale }],
                    },
                  ]}
                />
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.titleSparkle,
                    {
                      opacity: titleShimmer.interpolate({
                        inputRange: [0, 0.35, 1],
                        outputRange: [0, 1, 0],
                      }),
                      transform: [{
                        translateX: titleShimmer.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-90, 90],
                        }),
                      }],
                    },
                  ]}
                >
                  <Ionicons name="sparkles" size={18} color="#FFF1C2" />
                </Animated.View>
                <Text style={styles.subtitle}>The Royal Realm of Board Games</Text>
              </Animated.View>
            </View>}

            <Animated.View
              pointerEvents={introComplete && !loading ? 'auto' : 'none'}
              style={[
                styles.authCard,
                { opacity: cardOpacity, transform: [{ translateY: cardY }] },
                width > 560 && styles.authCardWide,
                keyboardHeight > 0 && styles.authCardKeyboard,
              ]}
            >
              {celebrating ? (
                <Animated.View
                  style={[
                    styles.celebration,
                    {
                      opacity: celebrationOpacity,
                      transform: [{ scale: celebrationScale }],
                    },
                  ]}
                >
                  <View style={styles.celebrationCrown}>
                    <Ionicons name="trophy" size={42} color={RoyalColors.gold} />
                    <Ionicons name="sparkles" size={18} color="#FFF1C2" style={styles.celebrationSparkle} />
                  </View>
                  <Text style={styles.cardHeading}>Welcome to the kingdom,</Text>
                  <Text style={styles.celebrationName}>{celebrationName}!</Text>
                  <Text style={styles.cardDescription}>Your royal adventure begins now.</Text>
                </Animated.View>
              ) : (
                <>
                  <Text style={styles.cardHeading}>Create your royal profile</Text>
                  <Text style={styles.cardDescription}>
                    Share your name and age to enter the kingdom.
                  </Text>

                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={19} color={RoyalColors.gold} />
                    <TextInput
                      style={styles.input}
                      placeholder="Your name"
                      placeholderTextColor="#94A3B8"
                      value={playerName}
                      onChangeText={setPlayerNameInput}
                      autoCapitalize="words"
                      autoComplete="name"
                      maxLength={30}
                      returnKeyType="next"
                      onFocus={() => {
                        focusedInput.current = 'name';
                        requestAnimationFrame(() => scrollViewRef.current?.scrollTo({ y: 0, animated: true }));
                      }}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="calendar-outline" size={19} color={RoyalColors.gold} />
                    <TextInput
                      style={styles.input}
                      placeholder="Your age"
                      placeholderTextColor="#94A3B8"
                      value={age}
                      onChangeText={setAge}
                      keyboardType="number-pad"
                      maxLength={3}
                      returnKeyType="done"
                      onFocus={() => {
                        focusedInput.current = 'age';
                        requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd({ animated: true }));
                      }}
                    />
                  </View>

                  {errorMessage !== '' && (
                    <Text accessibilityRole="alert" style={styles.errorText}>
                      {errorMessage}
                    </Text>
                  )}

                  <Animated.View style={{ transform: [{ scale: onboardingButtonScale }] }}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      style={styles.button}
                      onPress={beginRoyalJourney}
                      onPressIn={() => animatePress(onboardingButtonScale, 0.98)}
                      onPressOut={() => animatePress(onboardingButtonScale, 1)}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={[RoyalColors.raja, RoyalColors.rani]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.buttonGradient}
                      >
                        <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>
                          {loading ? 'Preparing your welcome…' : 'Begin Royal Journey'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                </>
              )}
            </Animated.View>
          </ScrollView>
          </View>
          </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </LinearGradient>
      </LinearGradient>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: RoyalColors.background,
  },
  background: {
    flex: 1,
    position: 'relative',
  },
  rgbFrame: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    borderRadius: 28,
  },
  rgbRotator: {
    position: 'absolute',
    width: '200%',
    height: '200%',
    left: '-50%',
    top: '-50%',
  },
  rgbGradient: {
    flex: 1,
  },
  backgroundInterior: {
    flex: 1,
    margin: 3,
    overflow: 'hidden',
    borderRadius: 25,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 8,
  },
  contentKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 16,
  },
  authCardKeyboard: {
    marginTop: 8,
    marginBottom: 16,
  },
  skipButton: {
    position: 'absolute',
    zIndex: 5,
    top: 10,
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  skipText: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '600',
  },
  hero: {
    width: '100%',
    alignItems: 'center',
  },
  emblemStage: {
    width: 220,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crest: {
    position: 'absolute',
    top: 49,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
  },
  rajaCrest: {
    left: 46,
    shadowColor: RoyalColors.raja,
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 8,
  },
  raniCrest: {
    right: 46,
    shadowColor: RoyalColors.rani,
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 8,
  },
  crestMark: {
    position: 'absolute',
  },
  shockwave: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: RoyalColors.gold,
    shadowColor: RoyalColors.gold,
    shadowOpacity: 0.9,
    shadowRadius: 14,
  },
  union: {
    position: 'absolute',
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 38,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    shadowColor: RoyalColors.gold,
    shadowOpacity: 0.85,
    shadowRadius: 18,
    elevation: 10,
  },
  unionHeart: {
    position: 'absolute',
    top: 33,
  },
  sparkle: {
    position: 'absolute',
    zIndex: 1,
  },
  sparkleOne: {
    top: -5,
    right: 2,
  },
  sparkleTwo: {
    top: 15,
    left: -4,
  },
  sparkleThree: {
    bottom: 4,
    right: -7,
  },
  titleGroup: {
    alignItems: 'center',
    marginTop: -2,
    position: 'relative',
  },
  brandTitle: {
    color: '#FDE68A',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 4,
    textShadowColor: 'rgba(245, 158, 11, 0.8)',
    textShadowRadius: 12,
    marginBottom: 2,
  },
  titleSparkle: {
    position: 'absolute',
    top: 1,
    zIndex: 1,
  },
  logoImage: {
    shadowColor: '#F59E0B',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 5,
  },
  subtitle: {
    marginTop: 7,
    color: RoyalColors.textSecondary,
    fontSize: 13,
    letterSpacing: 1,
    textAlign: 'center',
  },
  authCard: {
    width: '100%',
    maxWidth: 440,
    padding: 20,
    gap: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  authCardWide: {
    paddingHorizontal: 28,
  },
  cardHeading: {
    color: RoyalColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardDescription: {
    color: RoyalColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: -7,
    marginBottom: 2,
  },
  inputContainer: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
  },
  input: {
    flex: 1,
    minHeight: 46,
    color: RoyalColors.textPrimary,
    fontSize: 15,
  },
  celebration: {
    alignItems: 'center',
    gap: 9,
    paddingVertical: 12,
  },
  celebrationCrown: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    borderRadius: 36,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.42)',
    shadowColor: RoyalColors.gold,
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  },
  celebrationSparkle: {
    position: 'absolute',
    top: 5,
    right: 2,
  },
  celebrationName: {
    color: '#FDE68A',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(245, 158, 11, 0.7)',
    textShadowRadius: 12,
  },
  errorText: {
    color: '#FDA4AF',
    fontSize: 12,
  },
  button: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  buttonGradient: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
