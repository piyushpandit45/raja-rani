import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio';

export type GameSound =
  | 'sholoMove'
  | 'sholoCapture'
  | 'dotsMove'
  | 'dotsScore'
  | 'sosMove'
  | 'sosScore'
  | 'sholoWin'
  | 'dotsWin'
  | 'sosWin'
  | 'lose'
  | 'draw';

const SOUND_SOURCES: Record<GameSound, number> = {
  sholoMove: require('../../assets/audio/wood-thud.wav'),
  sholoCapture: require('../../assets/audio/capture-snap.wav'),
  dotsMove: require('../../assets/audio/pencil-click.wav'),
  dotsScore: require('../../assets/audio/box-chime.wav'),
  sosMove: require('../../assets/audio/digital-tap.wav'),
  sosScore: require('../../assets/audio/sos-strike.wav'),
  sholoWin: require('../../assets/audio/victory-fanfare.wav'),
  dotsWin: require('../../assets/audio/dots-cheer.wav'),
  sosWin: require('../../assets/audio/sos-victory.wav'),
  lose: require('../../assets/audio/lose.wav'),
  draw: require('../../assets/audio/draw.wav'),
};

const players = new Map<GameSound, AudioPlayer>();
let soundsEnabled = true;
let audioModeSetup: Promise<void> | null = null;
let playerGeneration = 0;

function ensureAudioMode(): Promise<void> {
  if (!audioModeSetup) {
    audioModeSetup = setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch((error: unknown) => {
      audioModeSetup = null;
      throw error;
    });
  }
  return audioModeSetup;
}

export function setGameSoundsEnabled(enabled: boolean): void {
  soundsEnabled = enabled;
  if (!enabled) {
    players.forEach((player) => player.pause());
  }
}

export function toggleGameSounds(): boolean {
  setGameSoundsEnabled(!soundsEnabled);
  return soundsEnabled;
}

export function areGameSoundsEnabled(): boolean {
  return soundsEnabled;
}

export function playGameSound(sound: GameSound): void {
  if (!soundsEnabled) return;
  const generation = playerGeneration;

  void (async () => {
    await ensureAudioMode();
    if (!soundsEnabled || generation !== playerGeneration) return;

    let player = players.get(sound);
    if (!player) {
      player = createAudioPlayer(SOUND_SOURCES[sound]);
      player.volume = 0.65;
      players.set(sound, player);
    }

    const activePlayer = player;
    await activePlayer.seekTo(0);
    if (soundsEnabled && players.get(sound) === activePlayer) {
      activePlayer.play();
    }
  })().catch((error: unknown) => {
    console.error(`Failed to play game sound "${sound}":`, error);
  });
}

export function releaseGameSounds(): void {
  playerGeneration += 1;
  players.forEach((player, sound) => {
    try {
      player.release();
    } catch (error) {
      console.error(`Failed to release game sound "${sound}":`, error);
    }
  });
  players.clear();
}
