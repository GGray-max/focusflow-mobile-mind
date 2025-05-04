
import { Howl } from 'howler';

class SoundService {
  private sounds: Record<string, Howl> = {};

  constructor() {
    this.sounds = {
      timerComplete: new Howl({
        src: ['/sounds/timer-complete.mp3'],
        volume: 0.7,
        preload: true
      }),
      timerTick: new Howl({
        src: ['/sounds/timer-tick.mp3'],
        volume: 0.3,
        preload: true
      })
    };
  }

  play(soundName: 'timerComplete' | 'timerTick') {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.play();
    }
  }

  stop(soundName: 'timerComplete' | 'timerTick') {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.stop();
    }
  }
}

export default new SoundService();
