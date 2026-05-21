import { Howl, Howler } from "howler";

type SoundName =
  | "dice"
  | "move"
  | "kill"
  | "home"
  | "winner"
  | "timerWarning"
  | "disconnect"
  | "chat";

const SOUNDS_BASE = import.meta.env.VITE_SOUNDS_URL || "/sounds";

const registry: Partial<Record<SoundName, Howl>> = {};

const SOUND_FILES: Record<SoundName, string> = {
  dice: `${SOUNDS_BASE}/dice.mp3`,
  move: `${SOUNDS_BASE}/move.mp3`,
  kill: `${SOUNDS_BASE}/kill.mp3`,
  home: `${SOUNDS_BASE}/home.mp3`,
  winner: `${SOUNDS_BASE}/winner.mp3`,
  timerWarning: `${SOUNDS_BASE}/timer-warning.mp3`,
  disconnect: `${SOUNDS_BASE}/disconnect.mp3`,
  chat: `${SOUNDS_BASE}/chat.mp3`,
};

export const sounds = {
  preload(): void {
    (Object.entries(SOUND_FILES) as [SoundName, string][]).forEach(
      ([name, src]) => {
        registry[name] = new Howl({ src: [src], preload: true, volume: 0.6 });
      },
    );
  },

  play(name: SoundName): void {
    registry[name]?.play();
  },

  setVolume(volume: number): void {
    Howler.volume(volume);
  },

  mute(muted: boolean): void {
    Howler.mute(muted);
  },
};
