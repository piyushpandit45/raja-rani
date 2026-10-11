import GameCard from '@/components/GameCard';
import GameConfigModal, {
  DifficultyType,
  OpponentType,
} from '@/components/GameConfigModal';
import RuleModal from '@/components/RuleModal';
import { RoyalColors, Spacing } from '@/constants/theme';
import { GameType } from '@/utils/gameRulesData';
import {
  deleteAccessToken,
  deletePlayerName,
  deleteUserSession,
  getPlayerName,
} from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [playerName, setPlayerName] = useState('Guest');
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [rulesGame, setRulesGame] = useState<GameType | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void getPlayerName()
      .then((name) => {
        if (isMounted && name) setPlayerName(name);
      })
      .catch((error: unknown) => {
        console.error('Unable to load player name:', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleGamePress = (gameType: GameType) => {
    setSelectedGame(gameType);
    setShowConfigModal(true);
  };

  const handleRulesPress = (gameType: GameType) => {
    setRulesGame(gameType);
  };

  const handleStartGame = (config: {
    opponent: OpponentType;
    difficulty: DifficultyType;
  }) => {
    setShowConfigModal(false);
    if (selectedGame === 'sholoGuti') {
      router.push({
        pathname: '/game/sholo-guti',
        params: {
          playerName,
          opponent: config.opponent,
          difficulty: config.difficulty,
        },
      });
    } else if (selectedGame === 'dotsBoxes') {
      router.push({
        pathname: '/game/dots-boxes',
        params: {
          playerName,
          opponent: config.opponent,
          difficulty: config.difficulty,
        },
      });
    } else if (selectedGame === 'sos') {
      router.push({
        pathname: '/game/sos',
        params: {
          playerName,
          opponent: config.opponent,
          difficulty: config.difficulty,
        },
      });
    }
  };

  const handleLogout = async () => {
    try {
      await Promise.all([
        deletePlayerName(),
        deleteAccessToken(),
        deleteUserSession(),
      ]);
      router.replace('/');
    } catch (error) {
      console.error('Unable to switch users:', error);
    }
  };

  const games = [
    {
      type: 'sholoGuti' as GameType,
      title: 'Sholo Guti (16 Beads)',
      description: 'Classic Indian 37-node strategy draughts game',
      icon: 'grid-outline' as const,
    },
    {
      type: 'dotsBoxes' as GameType,
      title: 'Dots & Boxes (10x10)',
      description: 'Territorial grid-connection game',
      icon: 'extension-puzzle-outline' as const,
    },
    {
      type: 'sos' as GameType,
      title: 'SOS Game (10x10)',
      description: 'Strategic 8-directional letter alignment game',
      icon: 'text-outline' as const,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[RoyalColors.background, RoyalColors.cardDark]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBadge}>
              <Image
                source={require('../../assets/images/logo.png.png')}
                resizeMode="cover"
                style={styles.logoImage}
              />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.welcomeText}>Welcome,</Text>
              <Text style={styles.playerName}>{playerName}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={RoyalColors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Select Your Game</Text>

          {games.map((game) => (
            <GameCard
              key={game.type}
              gameType={game.type}
              title={game.title}
              description={game.description}
              icon={game.icon}
              onPress={() => handleGamePress(game.type)}
              onRulesPress={() => handleRulesPress(game.type)}
            />
          ))}
        </ScrollView>
      </LinearGradient>

      {selectedGame && (
        <GameConfigModal
          visible={showConfigModal}
          gameType={selectedGame}
          playerName={playerName}
          onClose={() => setShowConfigModal(false)}
          onStartGame={handleStartGame}
        />
      )}
      {rulesGame && (
        <RuleModal
          visible={rulesGame !== null}
          gameType={rulesGame}
          onClose={() => setRulesGame(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: RoyalColors.neonBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: RoyalColors.gold,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.one,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: RoyalColors.gold,
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  headerTextContainer: {
    marginLeft: Spacing.one,
  },
  welcomeText: {
    fontSize: 14,
    color: RoyalColors.textSecondary,
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: RoyalColors.textPrimary,
  },
  headerButton: {
    padding: Spacing.two,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: RoyalColors.gold,
    marginBottom: Spacing.four,
  },
});
