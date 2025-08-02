export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  enabled: boolean;
}

export interface GameStateForMusic {
  playerHealth: number;
  playerMaxHealth: number;
  enemyCount: number;
  nearbyEnemyCount: number; // Enemies within close proximity
  closestEnemyDistance: number;
  isInCombat: boolean;
  isBossLevel: boolean;
  currentFloor: number;
  gameStatus: "playing" | "paused" | "victory" | "defeat";
}

export interface ProceduralSongConfig {
  seed: number;
  songType: "exploration" | "combat" | "boss" | "victory" | "defeat";
  intensity: number; // 0-1, affects tempo, complexity, dissonance
  baseKey: string;
  measures: number;
  adaptiveFeatures: {
    healthBasedTempo: boolean;
    proximityDissonance: boolean;
    combatRhythm: boolean;
    dynamicHarmony: boolean;
  };
}

export type SoundType =
  | "pistol_fire"
  | "shotgun_fire"
  | "chaingun_fire"
  | "enemy_hit"
  | "enemy_death"
  | "pickup_health"
  | "pickup_ammo"
  | "pickup_weapon"
  | "player_hurt"
  | "footstep"
  | "menu_click"
  | "weapon_switch"
  | "ambient_doom";

/**
 * Seeded random number generator for deterministic procedural generation
 * @author @darianrosebrook
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Generate a pseudo-random number between 0 and 1
   */
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Generate a random integer between min and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Choose a random element from an array
   */
  choose<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}

// Enhanced music theory constants for multiple scales and moods
const MUSICAL_SCALES = {
  E_MINOR: {
    // Bass frequencies (lower octave)
    E1: 41.2,
    Fs1: 46.25,
    G1: 49.0,
    A1: 55.0,
    B1: 61.74,
    C2: 65.41,
    D2: 73.42,
    // Mid-range frequencies
    E2: 82.41,
    Fs2: 92.5,
    G2: 98.0,
    A2: 110.0,
    B2: 123.47,
    C3: 130.81,
    D3: 146.83,
    // Higher frequencies for leads and arpeggios
    E3: 164.81,
    Fs3: 185.0,
    G3: 196.0,
    A3: 220.0,
    B3: 246.94,
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    Fs4: 369.99,
    G4: 392.0,
    A4: 440.0,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    // Tritones for dissonance and tension
    As1: 58.27,
    As2: 116.54,
    As3: 233.08,
    As4: 466.16,
    Ds2: 77.78,
    Ds3: 155.56,
    Ds4: 311.13,
    Ds5: 622.25,
  },

  C_MAJOR: {
    // Happy, heroic scale
    C1: 32.7,
    D1: 36.71,
    E1: 41.2,
    F1: 43.65,
    G1: 49.0,
    A1: 55.0,
    B1: 61.74,
    C2: 65.41,
    D2: 73.42,
    E2: 82.41,
    F2: 87.31,
    G2: 98.0,
    A2: 110.0,
    B2: 123.47,
    C3: 130.81,
    D3: 146.83,
    E3: 164.81,
    F3: 174.61,
    G3: 196.0,
    A3: 220.0,
    B3: 246.94,
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.0,
    A4: 440.0,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    F5: 698.46,
    G5: 783.99,
    A5: 880.0,
    B5: 987.77,
  },

  A_HARMONIC_MINOR: {
    // Haunting, creepy scale
    A1: 55.0,
    B1: 61.74,
    C2: 65.41,
    D2: 73.42,
    E2: 82.41,
    F2: 87.31,
    Gs2: 103.83,
    A2: 110.0,
    B2: 123.47,
    C3: 130.81,
    D3: 146.83,
    E3: 164.81,
    F3: 174.61,
    Gs3: 207.65,
    A3: 220.0,
    B3: 246.94,
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    Gs4: 415.3,
    A4: 440.0,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    F5: 698.46,
    Gs5: 830.61,
  },

  D_DORIAN: {
    // Cool, mysterious scale
    D1: 36.71,
    E1: 41.2,
    F1: 43.65,
    G1: 49.0,
    A1: 55.0,
    B1: 61.74,
    C2: 65.41,
    D2: 73.42,
    E2: 82.41,
    F2: 87.31,
    G2: 98.0,
    A2: 110.0,
    B2: 123.47,
    C3: 130.81,
    D3: 146.83,
    E3: 164.81,
    F3: 174.61,
    G3: 196.0,
    A3: 220.0,
    B3: 246.94,
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.0,
    A4: 440.0,
    B4: 493.88,
    C5: 523.25,
  },
};

// Legacy alias for backward compatibility
const E_MINOR_SCALE = MUSICAL_SCALES.E_MINOR;

// Central musical themes for cohesion
const MUSICAL_THEMES = {
  // Main doom theme - a descending minor motif
  DOOM_MOTIF: [
    E_MINOR_SCALE.E4, // 1 - root
    E_MINOR_SCALE.D4, // b7 - tension
    E_MINOR_SCALE.C4, // b6 - darkness
    E_MINOR_SCALE.B3, // 5 - stability
    E_MINOR_SCALE.G3, // b3 - minor quality
    E_MINOR_SCALE.E3, // octave - resolution
  ],

  // Heroic counter-theme - ascending pattern
  HEROIC_MOTIF: [
    E_MINOR_SCALE.E3, // root
    E_MINOR_SCALE.G3, // b3
    E_MINOR_SCALE.B3, // 5
    E_MINOR_SCALE.D4, // b7
    E_MINOR_SCALE.E4, // octave
  ],

  // Tension theme using tritones
  TENSION_MOTIF: [
    E_MINOR_SCALE.E3, // root
    E_MINOR_SCALE.As3, // tritone
    E_MINOR_SCALE.E4, // octave
    E_MINOR_SCALE.As3, // tritone return
  ],

  // Rhythmic bass theme
  BASS_MOTIF: [
    E_MINOR_SCALE.E2, // root
    E_MINOR_SCALE.E2, // repeat for emphasis
    E_MINOR_SCALE.G2, // b3
    E_MINOR_SCALE.A2, // 4
    E_MINOR_SCALE.B2, // 5
    E_MINOR_SCALE.G2, // b3
    E_MINOR_SCALE.E2, // back to root
    E_MINOR_SCALE.D2, // b7 for tension
  ],
};

// Enhanced chord progression with better voice leading
const CHORD_PROGRESSION = [
  {
    name: "Em",
    bass: E_MINOR_SCALE.E2,
    notes: [E_MINOR_SCALE.E3, E_MINOR_SCALE.G3, E_MINOR_SCALE.B3],
    tension: 0.2,
    measures: 2,
  },
  {
    name: "Am",
    bass: E_MINOR_SCALE.A2,
    notes: [E_MINOR_SCALE.A3, E_MINOR_SCALE.C4, E_MINOR_SCALE.E4],
    tension: 0.4,
    measures: 2,
  },
  {
    name: "C",
    bass: E_MINOR_SCALE.C3,
    notes: [E_MINOR_SCALE.C4, E_MINOR_SCALE.E4, E_MINOR_SCALE.G4],
    tension: 0.3,
    measures: 2,
  },
  {
    name: "D",
    bass: E_MINOR_SCALE.D2,
    notes: [E_MINOR_SCALE.D4, E_MINOR_SCALE.Fs4, E_MINOR_SCALE.A4],
    tension: 0.7,
    measures: 2,
  },
  {
    name: "Em",
    bass: E_MINOR_SCALE.E2,
    notes: [E_MINOR_SCALE.E3, E_MINOR_SCALE.G3, E_MINOR_SCALE.B3],
    tension: 0.2,
    measures: 2,
  },
  {
    name: "B7",
    bass: E_MINOR_SCALE.B2,
    notes: [E_MINOR_SCALE.B3, E_MINOR_SCALE.Ds4, E_MINOR_SCALE.Fs4],
    tension: 0.9,
    measures: 2,
  },
  {
    name: "Am",
    bass: E_MINOR_SCALE.A2,
    notes: [E_MINOR_SCALE.A3, E_MINOR_SCALE.C4, E_MINOR_SCALE.E4],
    tension: 0.4,
    measures: 2,
  },
  {
    name: "Em",
    bass: E_MINOR_SCALE.E2,
    notes: [E_MINOR_SCALE.E3, E_MINOR_SCALE.G3, E_MINOR_SCALE.B3],
    tension: 0.1,
    measures: 2,
  },
];

// Global AudioContext to prevent multiple context issues
let globalAudioContext: AudioContext | null = null;

function getGlobalAudioContext(): AudioContext | null {
  if (!globalAudioContext) {
    try {
      globalAudioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn("AudioContext not supported:", error);
      return null;
    }
  }
  return globalAudioContext;
}

// Enhanced timing constants for cohesive techno patterns
const BPM = 120; // Cohesive techno BPM matching documentation
const BEAT_DURATION = 60 / BPM; // 0.5 seconds per beat
const QUARTER_NOTE = BEAT_DURATION;
const EIGHTH_NOTE = BEAT_DURATION / 2;
const SIXTEENTH_NOTE = BEAT_DURATION / 4;
const THIRTY_SECOND_NOTE = BEAT_DURATION / 8;
const MEASURE_DURATION = BEAT_DURATION * 4;

// Enhanced volume levels for prominent music
const VOLUME_MULTIPLIERS = {
  KICK: 2.5,
  BASS: 2.8,
  LEAD: 2.2,
  PAD: 1.8,
  PERCUSSION: 2.0,
  EFFECTS: 1.5,
};

// Advanced syncopation patterns for complex rhythms
const SYNCOPATION_PATTERNS = {
  // Complex offbeat patterns
  OFFBEAT_HEAVY: [0, 0.9, 0, 1.0, 0, 0.8, 0, 0.95], // Emphasizes offbeats
  BREAKBEAT: [1.0, 0, 0.6, 0, 0.9, 0, 0.7, 0.8], // Breakbeat style
  TRIBAL: [0.9, 0.5, 0.8, 0.6, 1.0, 0.4, 0.9, 0.7], // Tribal percussion
  INDUSTRIAL: [1.0, 0.7, 0, 0.9, 0.8, 0, 1.0, 0.6], // Industrial techno
  ACID: [0.9, 1.0, 0.7, 0.95, 0.6, 1.0, 0.8, 0.9], // Acid house style
  MODERN_TECHNO: [1.0, 0.6, 0.8, 0.4, 0.9, 0.7, 0.5, 0.8], // Modern techno syncopation
  AGGRESSIVE: [1.0, 0.9, 0.7, 0.8, 1.0, 0.6, 0.9, 0.7], // Aggressive patterns
  WOBBLE: [1.0, 0.8, 1.0, 0.6, 1.0, 0.9, 1.0, 0.7], // Dubstep-style wobble
};

/**
 * Procedural song type definitions with different structures and characteristics
 */
const SONG_TYPES = {
  exploration: {
    scale: "E_MINOR",
    baseBpm: 100,
    structure: { INTRO: 2, VERSE_1: 8, BRIDGE: 4, VERSE_2: 8, OUTRO: 2 },
    complexity: 0.4,
    dissonance: 0.2,
    patterns: ["OFFBEAT_HEAVY", "TRIBAL"],
    description: "Atmospheric, mysterious exploration music",
  },

  combat: {
    scale: "A_HARMONIC_MINOR",
    baseBpm: 140,
    structure: {
      INTRO: 1,
      VERSE_1: 4,
      CHORUS_1: 8,
      VERSE_2: 4,
      CHORUS_2: 8,
      BREAKDOWN: 4,
      OUTRO: 1,
    },
    complexity: 0.8,
    dissonance: 0.6,
    patterns: ["INDUSTRIAL", "AGGRESSIVE", "MODERN_TECHNO"],
    description: "High-energy combat music with driving rhythms",
  },

  boss: {
    scale: "A_HARMONIC_MINOR",
    baseBpm: 160,
    structure: {
      INTRO: 2,
      VERSE_1: 6,
      CHORUS_1: 12,
      BREAKDOWN: 8,
      FINALE: 12,
      OUTRO: 2,
    },
    complexity: 1.0,
    dissonance: 0.9,
    patterns: ["AGGRESSIVE", "WOBBLE", "INDUSTRIAL"],
    description: "Intense boss battle music with maximum complexity",
  },

  victory: {
    scale: "C_MAJOR",
    baseBpm: 120,
    structure: {
      INTRO: 4,
      VERSE_1: 8,
      CHORUS_1: 12,
      BRIDGE: 4,
      CHORUS_2: 8,
      OUTRO: 4,
    },
    complexity: 0.6,
    dissonance: 0.1,
    patterns: ["OFFBEAT_HEAVY", "MODERN_TECHNO"],
    description: "Triumphant victory music",
  },

  defeat: {
    scale: "D_DORIAN",
    baseBpm: 80,
    structure: { INTRO: 4, VERSE: 12, OUTRO: 8 },
    complexity: 0.3,
    dissonance: 0.7,
    patterns: ["TRIBAL", "ACID"],
    description: "Somber defeat music",
  },
};

// Dynamic song structure that adapts based on song type
const SONG_STRUCTURE = {
  INTRO: 4,
  VERSE_1: 16,
  CHORUS_1: 16,
  VERSE_2: 16,
  CHORUS_2: 16,
  BREAKDOWN: 8,
  OUTRO: 8,
  get TOTAL_MEASURES() {
    return (
      this.INTRO +
      this.VERSE_1 +
      this.CHORUS_1 +
      this.VERSE_2 +
      this.CHORUS_2 +
      this.BREAKDOWN +
      this.OUTRO
    );
  },
};

export class AudioSystem {
  private audioContext: AudioContext | null = null;
  private settings: AudioSettings = {
    masterVolume: 1,
    sfxVolume: 0.6,
    musicVolume: 1.2, // Boost music volume significantly
    enabled: true,
  };
  private activeSounds: Set<AudioBufferSourceNode> = new Set();
  private ambientSource: AudioBufferSourceNode | null = null;
  private musicGainNode: GainNode | null = null;

  // Procedural music state
  private currentSongConfig: ProceduralSongConfig | null = null;
  private lastMusicUpdate: number = 0;
  private seededRandom: SeededRandom | null = null;
  private listeners: Array<(settings: AudioSettings) => void> = [];

  constructor() {
    this.initializeAudioContext();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      // Use the global audio context to prevent conflicts
      this.audioContext = getGlobalAudioContext();

      if (!this.audioContext) {
        this.settings.enabled = false;
        return;
      }

      // Create master gain node for music
      this.musicGainNode = this.audioContext.createGain();
      this.musicGainNode.connect(this.audioContext.destination);

      // Handle browser autoplay policies
      if (this.audioContext.state === "suspended") {
        const resumeAudio = async () => {
          if (this.audioContext && this.audioContext.state === "suspended") {
            try {
              await this.audioContext.resume();
            } catch (error) {
              console.warn("Failed to resume audio context:", error);
            }
          }
        };

        document.addEventListener("click", resumeAudio, { once: true });
        document.addEventListener("keydown", resumeAudio, { once: true });
      }
    } catch (error) {
      console.warn("AudioContext initialization failed:", error);
      this.settings.enabled = false;
    }
  }

  /**
   * Enhanced note generation with aggressive processing for modern techno
   */
  private generateNote(
    frequency: number,
    duration: number,
    waveType: OscillatorType = "sawtooth",
    envelope: {
      attack: number;
      decay: number;
      sustain: number;
      release: number;
    } = { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 },
    volume: number = 1,
    filter?: { type: BiquadFilterType; frequency: number; resonance?: number }
  ): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const phase = (t * frequency * 2 * Math.PI) % (2 * Math.PI);

      let sample: number;
      switch (waveType) {
        case "sawtooth":
          sample = phase / Math.PI - 1;
          break;
        case "square":
          sample = phase < Math.PI ? 1 : -1;
          break;
        case "triangle":
          sample =
            phase < Math.PI
              ? (2 * phase) / Math.PI - 1
              : 3 - (2 * phase) / Math.PI;
          break;
        case "sine":
        default:
          sample = Math.sin(phase);
          break;
      }

      // Enhanced ADSR envelope for punchy electronic sounds
      let amplitude = 1;
      const attackTime = envelope.attack;
      const decayTime = envelope.decay;
      const releaseStart = duration - envelope.release;

      if (t < attackTime) {
        // Sharp attack for electronic sounds
        amplitude = Math.pow(t / attackTime, 0.3);
      } else if (t < attackTime + decayTime) {
        const decayProgress = (t - attackTime) / decayTime;
        amplitude = 1 - decayProgress * (1 - envelope.sustain);
      } else if (t < releaseStart) {
        amplitude = envelope.sustain;
      } else {
        const releaseProgress = (t - releaseStart) / envelope.release;
        amplitude = envelope.sustain * (1 - releaseProgress);
      }

      // Apply enhanced filtering with resonance
      if (filter && t > 0) {
        const cutoff = filter.frequency;
        const resonance = filter.resonance || 1;
        const nyquist = sampleRate / 2;

        if (cutoff < nyquist) {
          // Enhanced filter with resonance simulation
          const alpha = Math.exp((-2 * Math.PI * cutoff) / sampleRate);
          const resonanceGain = 1 + (resonance - 1) * 0.1; // Convert resonance to gain

          if (i > 0) {
            switch (filter.type) {
              case "lowpass":
                sample =
                  alpha * data[i - 1] + (1 - alpha) * sample * resonanceGain;
                break;
              case "highpass":
                sample =
                  (1 - alpha) *
                  (sample - (i > 0 ? data[i - 1] : 0)) *
                  resonanceGain;
                break;
              case "bandpass":
                // Simple bandpass approximation
                const lowpass = alpha * data[i - 1] + (1 - alpha) * sample;
                sample = (sample - lowpass) * resonanceGain;
                break;
              default:
                sample =
                  alpha * data[i - 1] + (1 - alpha) * sample * resonanceGain;
            }
          }
        }
      }

      // Apply soft distortion for aggressive techno sound
      let processedSample = sample * amplitude * volume;

      // Soft clipping distortion for aggressive sound
      if (Math.abs(processedSample) > 0.7) {
        processedSample =
          Math.sign(processedSample) *
          (0.7 + 0.3 * Math.tanh((Math.abs(processedSample) - 0.7) * 3));
      }

      // Boost overall volume significantly for prominent music
      data[i] = processedSample * 1.2; // Increased base volume for more prominent music
    }
    return buffer;
  }

  /**
   * Generate complex layered techno track with verse-chorus structure
   */
  private generateAmbientTrack(): AudioBuffer | null {
    if (!this.audioContext) return null;

    const totalDuration = MEASURE_DURATION * SONG_STRUCTURE.TOTAL_MEASURES;
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * totalDuration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    // Generate different layers with enhanced cohesive elements
    this.generateKickPattern(leftChannel, rightChannel);
    this.generateSyncopatedBass(leftChannel);
    this.generateAcidBass(rightChannel); // Add acid bass line
    this.generateArpeggiatedLead(rightChannel);
    this.generateHarmonyPads(leftChannel, rightChannel);
    this.generatePerussionLayer(rightChannel);
    this.generateComplexPercussion(leftChannel, rightChannel);
    this.generatePolyrhythmicElements(leftChannel, rightChannel);
    this.generateBreakdownEffects(leftChannel, rightChannel);
    this.generateIndustrialElements(leftChannel, rightChannel); // Add industrial elements
    this.generateTransitionEffects(leftChannel, rightChannel); // Add smooth transitions
    this.generateCallAndResponse(leftChannel, rightChannel); // Add call and response

    return buffer;
  }

  /**
   * Generate four-on-the-floor kick pattern with variations per section
   */
  private generateKickPattern(
    leftChannel: Float32Array,
    rightChannel: Float32Array
  ): void {
    if (!this.audioContext) return;

    let currentMeasure = 0;
    const sections = [
      { name: "intro", measures: SONG_STRUCTURE.INTRO, intensity: 0.3 },
      { name: "verse1", measures: SONG_STRUCTURE.VERSE_1, intensity: 0.6 },
      { name: "chorus1", measures: SONG_STRUCTURE.CHORUS_1, intensity: 0.9 },
      { name: "verse2", measures: SONG_STRUCTURE.VERSE_2, intensity: 0.6 },
      { name: "chorus2", measures: SONG_STRUCTURE.CHORUS_2, intensity: 1.0 },
      { name: "breakdown", measures: SONG_STRUCTURE.BREAKDOWN, intensity: 0.4 },
      { name: "outro", measures: SONG_STRUCTURE.OUTRO, intensity: 0.2 },
    ];

    sections.forEach((section) => {
      for (let measure = 0; measure < section.measures; measure++) {
        const measureStart = (currentMeasure + measure) * MEASURE_DURATION;

        // Four-on-the-floor pattern with variations
        for (let beat = 0; beat < 4; beat++) {
          const beatTime = measureStart + beat * QUARTER_NOTE;

          // Main kick on every beat - much more powerful
          if (section.name !== "breakdown" || beat % 2 === 0) {
            const kickBuffer = this.generateNote(
              45, // Deep kick frequency
              QUARTER_NOTE * 0.8,
              "sine",
              { attack: 0.001, decay: 0.12, sustain: 0.2, release: 0.08 },
              section.intensity * VOLUME_MULTIPLIERS.KICK
            );
            if (kickBuffer) {
              this.mixAudioBuffer(leftChannel, kickBuffer, beatTime);
              this.mixAudioBuffer(rightChannel, kickBuffer, beatTime);
            }
          }
        }

        // Add syncopated kick variations in chorus sections - more aggressive
        if (section.name.includes("chorus") && measure % 2 === 1) {
          const syncoKickTime = measureStart + 3 * QUARTER_NOTE + EIGHTH_NOTE;
          const syncoKickBuffer = this.generateNote(
            52,
            EIGHTH_NOTE * 0.6,
            "sine",
            { attack: 0.001, decay: 0.08, sustain: 0.08, release: 0.06 },
            section.intensity * VOLUME_MULTIPLIERS.KICK * 0.7
          );
          if (syncoKickBuffer) {
            this.mixAudioBuffer(leftChannel, syncoKickBuffer, syncoKickTime);
            this.mixAudioBuffer(rightChannel, syncoKickBuffer, syncoKickTime);
          }
        }
      }
      currentMeasure += section.measures;
    });
  }

  /**
   * Generate thematic bass patterns that follow chord progression and incorporate motifs
   */
  private generateSyncopatedBass(channel: Float32Array): void {
    if (!this.audioContext) return;

    let currentMeasure = 0;
    let chordIndex = 0;

    const sections = [
      {
        name: "intro",
        measures: SONG_STRUCTURE.INTRO,
        volume: 0.4,
        useMotif: false,
        pattern: SYNCOPATION_PATTERNS.MODERN_TECHNO,
      },
      {
        name: "verse1",
        measures: SONG_STRUCTURE.VERSE_1,
        volume: 0.7,
        useMotif: true,
        pattern: SYNCOPATION_PATTERNS.MODERN_TECHNO,
      },
      {
        name: "chorus1",
        measures: SONG_STRUCTURE.CHORUS_1,
        volume: 0.9,
        useMotif: true,
        pattern: SYNCOPATION_PATTERNS.AGGRESSIVE,
      },
      {
        name: "verse2",
        measures: SONG_STRUCTURE.VERSE_2,
        volume: 0.7,
        useMotif: true,
        pattern: SYNCOPATION_PATTERNS.MODERN_TECHNO,
      },
      {
        name: "chorus2",
        measures: SONG_STRUCTURE.CHORUS_2,
        volume: 1.0,
        useMotif: true,
        pattern: SYNCOPATION_PATTERNS.AGGRESSIVE,
      },
      {
        name: "breakdown",
        measures: SONG_STRUCTURE.BREAKDOWN,
        volume: 0.3,
        useMotif: false,
        pattern: SYNCOPATION_PATTERNS.INDUSTRIAL,
      },
      {
        name: "outro",
        measures: SONG_STRUCTURE.OUTRO,
        volume: 0.2,
        useMotif: false,
        pattern: SYNCOPATION_PATTERNS.MODERN_TECHNO,
      },
    ];

    sections.forEach((section) => {
      for (let measure = 0; measure < section.measures; measure++) {
        const measureStart = (currentMeasure + measure) * MEASURE_DURATION;
        const chord = CHORD_PROGRESSION[chordIndex % CHORD_PROGRESSION.length];

        // Advance chord progression every chord.measures
        if (measure % chord.measures === 0 && measure > 0) {
          chordIndex++;
        }

        // Choose between chord bass note and bass motif
        if (section.useMotif && measure % 2 === 1) {
          // Use bass motif on odd measures for variation
          MUSICAL_THEMES.BASS_MOTIF.forEach((frequency, noteIndex) => {
            const noteTime = measureStart + noteIndex * EIGHTH_NOTE;
            if (noteIndex < 8) {
              // Ensure we don't exceed measure boundary
              const bassBuffer = this.generateNote(
                frequency,
                EIGHTH_NOTE * 0.95,
                "sawtooth",
                { attack: 0.002, decay: 0.08, sustain: 0.8, release: 0.15 },
                section.volume * VOLUME_MULTIPLIERS.BASS,
                {
                  type: "lowpass",
                  frequency: 300 + chord.tension * 200,
                  resonance: 3 + chord.tension,
                }
              );
              if (bassBuffer) {
                this.mixAudioBuffer(channel, bassBuffer, noteTime);
              }
            }
          });
        } else {
          // Use chord bass note with syncopated pattern
          section.pattern.forEach((velocity, index) => {
            if (velocity > 0) {
              const noteTime = measureStart + index * EIGHTH_NOTE;
              const bassBuffer = this.generateNote(
                chord.bass,
                EIGHTH_NOTE * 0.95,
                "sawtooth",
                { attack: 0.002, decay: 0.08, sustain: 0.8, release: 0.15 },
                velocity * section.volume * VOLUME_MULTIPLIERS.BASS,
                {
                  type: "lowpass",
                  frequency: 250 + chord.tension * 300, // Dynamic filtering based on chord tension
                  resonance: 3 + chord.tension * 2,
                }
              );
              if (bassBuffer) {
                this.mixAudioBuffer(channel, bassBuffer, noteTime);
              }
            }
          });
        }
      }
      currentMeasure += section.measures;
    });
  }

  /**
   * Generate thematic lead sequences incorporating doom and heroic motifs
   */
  private generateArpeggiatedLead(channel: Float32Array): void {
    if (!this.audioContext) return;

    let currentMeasure = 0;
    let chordIndex = 0;

    const sections = [
      { name: "intro", measures: SONG_STRUCTURE.INTRO, active: false },
      {
        name: "verse1",
        measures: SONG_STRUCTURE.VERSE_1,
        active: true,
        speed: SIXTEENTH_NOTE,
        theme: "doom",
        volume: 0.6,
      },
      {
        name: "chorus1",
        measures: SONG_STRUCTURE.CHORUS_1,
        active: true,
        speed: THIRTY_SECOND_NOTE,
        theme: "heroic",
        volume: 0.8,
      },
      {
        name: "verse2",
        measures: SONG_STRUCTURE.VERSE_2,
        active: true,
        speed: SIXTEENTH_NOTE,
        theme: "doom",
        volume: 0.6,
      },
      {
        name: "chorus2",
        measures: SONG_STRUCTURE.CHORUS_2,
        active: true,
        speed: THIRTY_SECOND_NOTE,
        theme: "heroic",
        volume: 1.0,
      },
      {
        name: "breakdown",
        measures: SONG_STRUCTURE.BREAKDOWN,
        active: true,
        speed: EIGHTH_NOTE,
        theme: "tension",
        volume: 0.4,
      },
      { name: "outro", measures: SONG_STRUCTURE.OUTRO, active: false },
    ];

    sections.forEach((section) => {
      if (!section.active) {
        currentMeasure += section.measures;
        return;
      }

      for (let measure = 0; measure < section.measures; measure++) {
        const measureStart = (currentMeasure + measure) * MEASURE_DURATION;
        const chord = CHORD_PROGRESSION[chordIndex % CHORD_PROGRESSION.length];

        // Advance chord progression
        if (measure % chord.measures === 0 && measure > 0) {
          chordIndex++;
        }

        // Choose theme based on section
        let motif: number[];
        switch (section.theme) {
          case "heroic":
            motif = MUSICAL_THEMES.HEROIC_MOTIF;
            break;
          case "tension":
            motif = MUSICAL_THEMES.TENSION_MOTIF;
            break;
          case "doom":
          default:
            motif = MUSICAL_THEMES.DOOM_MOTIF;
            break;
        }

        // Play motif at beginning of every 4 measures, arpeggios otherwise
        if (measure % 4 === 0) {
          // Play the main motif
          motif.forEach((frequency, noteIndex) => {
            const noteTime =
              measureStart + noteIndex * (section.speed ?? SIXTEENTH_NOTE);
            const leadBuffer = this.generateNote(
              frequency,
              (section.speed ?? SIXTEENTH_NOTE) * 1.5, // Slightly longer for motif notes
              "sawtooth",
              { attack: 0.002, decay: 0.08, sustain: 0.6, release: 0.2 },
              (section.volume ?? 0.6) * VOLUME_MULTIPLIERS.LEAD,
              {
                type: "lowpass",
                frequency: 1500 + chord.tension * 1000, // Dynamic filtering
                resonance: 6 + chord.tension * 4,
              }
            );
            if (leadBuffer) {
              this.mixAudioBuffer(channel, leadBuffer, noteTime);
            }
          });
        } else {
          // Play chord arpeggios
          const arpeggio = chord.notes.concat([
            chord.notes[0] + (E_MINOR_SCALE.E5 - E_MINOR_SCALE.E4),
          ]); // Add octave
          const notesPerMeasure = Math.floor(
            MEASURE_DURATION / (section.speed ?? SIXTEENTH_NOTE)
          );

          for (let noteIndex = 0; noteIndex < notesPerMeasure; noteIndex++) {
            const noteTime =
              measureStart + noteIndex * (section.speed ?? SIXTEENTH_NOTE);
            const frequency = arpeggio[noteIndex % arpeggio.length];

            const leadBuffer = this.generateNote(
              frequency,
              (section.speed ?? SIXTEENTH_NOTE) * 0.95,
              "sawtooth",
              { attack: 0.002, decay: 0.05, sustain: 0.4, release: 0.15 },
              (section.volume ?? 0.6) * VOLUME_MULTIPLIERS.LEAD * 0.7, // Slightly quieter than motif
              {
                type: "lowpass",
                frequency: 2000 + chord.tension * 500,
                resonance: 4 + chord.tension * 2,
              }
            );
            if (leadBuffer) {
              this.mixAudioBuffer(channel, leadBuffer, noteTime);
            }
          }
        }
      }
      currentMeasure += section.measures;
    });
  }

  /**
   * Generate acid bass line with filter sweeps
   */
  private generateAcidBass(channel: Float32Array): void {
    if (!this.audioContext) return;

    let currentMeasure = 0;
    const sections = [
      { name: "intro", measures: SONG_STRUCTURE.INTRO, intensity: 0.2 },
      { name: "verse1", measures: SONG_STRUCTURE.VERSE_1, intensity: 0.6 },
      { name: "chorus1", measures: SONG_STRUCTURE.CHORUS_1, intensity: 0.9 },
      { name: "verse2", measures: SONG_STRUCTURE.VERSE_2, intensity: 0.7 },
      { name: "chorus2", measures: SONG_STRUCTURE.CHORUS_2, intensity: 1.0 },
      { name: "breakdown", measures: SONG_STRUCTURE.BREAKDOWN, intensity: 0.5 },
      { name: "outro", measures: SONG_STRUCTURE.OUTRO, intensity: 0.3 },
    ];

    const acidSequence = [
      E_MINOR_SCALE.E2,
      E_MINOR_SCALE.E2,
      E_MINOR_SCALE.G2,
      E_MINOR_SCALE.A2,
      E_MINOR_SCALE.B2,
      E_MINOR_SCALE.A2,
      E_MINOR_SCALE.G2,
      E_MINOR_SCALE.E2,
      E_MINOR_SCALE.E2,
      E_MINOR_SCALE.As2,
      E_MINOR_SCALE.B2,
      E_MINOR_SCALE.C3,
      E_MINOR_SCALE.B2,
      E_MINOR_SCALE.As2,
      E_MINOR_SCALE.G2,
      E_MINOR_SCALE.E2,
    ];

    sections.forEach((section) => {
      for (let measure = 0; measure < section.measures; measure++) {
        const measureStart = (currentMeasure + measure) * MEASURE_DURATION;

        // Generate acid bass pattern with 16th note resolution
        for (let step = 0; step < 16; step++) {
          const stepTime = measureStart + step * SIXTEENTH_NOTE;
          const frequency = acidSequence[step % acidSequence.length];

          // Add filter sweep based on position in measure
          const filterFreq = 200 + (step / 16) * 1500; // Sweep from 200Hz to 1.7kHz
          const resonance = 8 + Math.sin(step * 0.5) * 4; // Varying resonance

          if (SYNCOPATION_PATTERNS.ACID[step % 8] > 0.5) {
            const acidBuffer = this.generateNote(
              frequency,
              SIXTEENTH_NOTE * 0.8,
              "sawtooth",
              { attack: 0.001, decay: 0.05, sustain: 0.6, release: 0.1 },
              section.intensity * VOLUME_MULTIPLIERS.BASS * 0.9,
              { type: "lowpass", frequency: filterFreq, resonance }
            );
            if (acidBuffer) {
              this.mixAudioBuffer(channel, acidBuffer, stepTime);
            }
          }
        }
      }
      currentMeasure += section.measures;
    });
  }

  /**
   * Generate harmonic pad layers following the chord progression
   */
  private generateHarmonyPads(
    leftChannel: Float32Array,
    rightChannel: Float32Array
  ): void {
    if (!this.audioContext) return;

    let currentMeasure = 0;
    let chordIndex = 0;

    const sections = [
      {
        name: "intro",
        measures: SONG_STRUCTURE.INTRO,
        volume: 0.2,
        active: true,
      },
      {
        name: "verse1",
        measures: SONG_STRUCTURE.VERSE_1,
        volume: 0.3,
        active: true,
      },
      {
        name: "chorus1",
        measures: SONG_STRUCTURE.CHORUS_1,
        volume: 0.5,
        active: true,
      },
      {
        name: "verse2",
        measures: SONG_STRUCTURE.VERSE_2,
        volume: 0.3,
        active: true,
      },
      {
        name: "chorus2",
        measures: SONG_STRUCTURE.CHORUS_2,
        volume: 0.6,
        active: true,
      },
      {
        name: "breakdown",
        measures: SONG_STRUCTURE.BREAKDOWN,
        volume: 0.8,
        active: true,
      },
      {
        name: "outro",
        measures: SONG_STRUCTURE.OUTRO,
        volume: 0.1,
        active: true,
      },
    ];

    sections.forEach((section) => {
      if (!section.active) {
        currentMeasure += section.measures;
        return;
      }

      for (let measure = 0; measure < section.measures; measure++) {
        const chord = CHORD_PROGRESSION[chordIndex % CHORD_PROGRESSION.length];

        // Play chord at the beginning of each chord.measures period
        if (measure % chord.measures === 0) {
          const chordStart = (currentMeasure + measure) * MEASURE_DURATION;
          const chordDuration = chord.measures * MEASURE_DURATION;

          // Add subtle movement to pads by varying attack times
          chord.notes.forEach((frequency, noteIndex) => {
            const attackDelay = noteIndex * 0.1; // Stagger note attacks slightly
            const adjustedStart = chordStart + attackDelay;

            const padBuffer = this.generateNote(
              frequency,
              chordDuration - attackDelay,
              "triangle",
              {
                attack: 0.3 + chord.tension * 0.2, // Longer attack for tense chords
                decay: 0.8,
                sustain: 0.8 - chord.tension * 0.2, // Lower sustain for tense chords
                release: 1.2 + chord.tension * 0.5,
              },
              section.volume *
                VOLUME_MULTIPLIERS.PAD *
                (0.6 + chord.tension * 0.2),
              {
                type: "lowpass",
                frequency: 1800 + chord.tension * 700, // Dynamic brightness
                resonance: 1.5 + chord.tension * 2,
              }
            );
            if (padBuffer) {
              // Pan notes across stereo field based on harmonic function
              if (noteIndex % 2 === 0) {
                this.mixAudioBuffer(leftChannel, padBuffer, adjustedStart);
              } else {
                this.mixAudioBuffer(rightChannel, padBuffer, adjustedStart);
              }
            }
          });

          // Add chord extensions for richer harmony in chorus sections
          if (section.name.includes("chorus")) {
            const extension = (frequency: number) => frequency * 1.5; // Perfect fifth above
            chord.notes.forEach((frequency, noteIndex) => {
              const extendedFreq = extension(frequency);
              const padBuffer = this.generateNote(
                extendedFreq,
                chordDuration * 0.8,
                "sine",
                { attack: 0.5, decay: 1.0, sustain: 0.6, release: 1.5 },
                section.volume * VOLUME_MULTIPLIERS.PAD * 0.3, // Quieter extensions
                { type: "lowpass", frequency: 3000 }
              );
              if (padBuffer) {
                // Pan extensions opposite to base notes
                if (noteIndex % 2 === 1) {
                  this.mixAudioBuffer(leftChannel, padBuffer, chordStart + 0.2);
                } else {
                  this.mixAudioBuffer(
                    rightChannel,
                    padBuffer,
                    chordStart + 0.2
                  );
                }
              }
            });
          }

          chordIndex++;
        }
      }
      currentMeasure += section.measures;
    });
  }

  /**
   * Generate percussion layer with hi-hats and snares
   */
  private generatePerussionLayer(channel: Float32Array): void {
    if (!this.audioContext) return;

    let currentMeasue = 0;
    const sections = [
      { name: "intro", measures: SONG_STRUCTURE.INTRO, intensity: 0.2 },
      { name: "verse1", measures: SONG_STRUCTURE.VERSE_1, intensity: 0.5 },
      { name: "chorus1", measures: SONG_STRUCTURE.CHORUS_1, intensity: 0.8 },
      { name: "verse2", measures: SONG_STRUCTURE.VERSE_2, intensity: 0.5 },
      { name: "chorus2", measures: SONG_STRUCTURE.CHORUS_2, intensity: 1.0 },
      { name: "breakdown", measures: SONG_STRUCTURE.BREAKDOWN, intensity: 0.3 },
      { name: "outro", measures: SONG_STRUCTURE.OUTRO, intensity: 0.1 },
    ];

    sections.forEach((section) => {
      for (let measure = 0; measure < section.measures; measure++) {
        const measureStart = (currentMeasue + measure) * MEASURE_DURATION;

        // Hi-hat pattern (8th notes with variations)
        for (let beat = 0; beat < 8; beat++) {
          const hatTime = measureStart + beat * EIGHTH_NOTE;
          const isOffBeat = beat % 2 === 1;
          const volume = isOffBeat
            ? section.intensity * 0.3
            : section.intensity * 0.15;

          if (section.intensity > 0.1) {
            const hatBuffer = this.generateNote(
              9000 + Math.random() * 3000, // Higher and more varied frequency
              EIGHTH_NOTE * 0.15,
              "square",
              { attack: 0.001, decay: 0.015, sustain: 0.0, release: 0.03 },
              volume * VOLUME_MULTIPLIERS.PERCUSSION, // More prominent hi-hats
              { type: "highpass", frequency: 7000, resonance: 2 }
            );
            if (hatBuffer) {
              this.mixAudioBuffer(channel, hatBuffer, hatTime);
            }
          }
        }

        // Snare on beats 2 and 4
        [1, 3].forEach((beat) => {
          const snareTime = measureStart + beat * QUARTER_NOTE;
          if (section.intensity > 0.3) {
            const snareBuffer = this.generateNote(
              220 + Math.random() * 150, // More varied snare frequencies
              QUARTER_NOTE * 0.4,
              "square",
              { attack: 0.001, decay: 0.08, sustain: 0.15, release: 0.12 },
              section.intensity * VOLUME_MULTIPLIERS.PERCUSSION * 0.6, // Punchier snares
              { type: "bandpass", frequency: 1200, resonance: 3 }
            );
            if (snareBuffer) {
              this.mixAudioBuffer(channel, snareBuffer, snareTime);
            }
          }
        });
      }
      currentMeasue += section.measures;
    });
  }

  /**
   * Generate complex polyrhythmic percussion patterns
   */
  private generateComplexPercussion(
    leftChannel: Float32Array,
    rightChannel: Float32Array
  ): void {
    if (!this.audioContext) return;

    const hihatPatterns = {
      CLOSED: [0.4, 0, 0.6, 0, 0.4, 0, 0.7, 0.3], // Closed hi-hat pattern
      OPEN: [0, 0, 0, 0.8, 0, 0, 0, 0.9], // Open hi-hat accents
      SNARE: [0, 0, 0.9, 0, 0, 0, 0.8, 0], // Snare on 2 and 4
      CRASH: [0.9, 0, 0, 0, 0, 0, 0, 0], // Crash accents
    };

    let currentMeasure = 0;
    const sections = [
      { name: "intro", measures: SONG_STRUCTURE.INTRO, complexity: 0.3 },
      { name: "verse1", measures: SONG_STRUCTURE.VERSE_1, complexity: 0.6 },
      { name: "chorus1", measures: SONG_STRUCTURE.CHORUS_1, complexity: 0.9 },
      { name: "verse2", measures: SONG_STRUCTURE.VERSE_2, complexity: 0.7 },
      { name: "chorus2", measures: SONG_STRUCTURE.CHORUS_2, complexity: 1.0 },
      {
        name: "breakdown",
        measures: SONG_STRUCTURE.BREAKDOWN,
        complexity: 0.4,
      },
      { name: "outro", measures: SONG_STRUCTURE.OUTRO, complexity: 0.2 },
    ];

    sections.forEach((section) => {
      for (let measure = 0; measure < section.measures; measure++) {
        const measureStart = (currentMeasure + measure) * MEASURE_DURATION;

        // Hi-hat pattern (higher frequency, left channel)
        hihatPatterns.CLOSED.forEach((velocity, index) => {
          if (velocity > 0 && Math.random() < section.complexity) {
            const noteTime = measureStart + index * EIGHTH_NOTE;
            const hihatBuffer = this.generateNote(
              9500 + Math.random() * 2500, // Higher frequency with more variation
              THIRTY_SECOND_NOTE * 3,
              "square",
              { attack: 0.001, decay: 0.025, sustain: 0.0, release: 0.015 },
              velocity * VOLUME_MULTIPLIERS.PERCUSSION * 0.5, // More prominent
              { type: "highpass", frequency: 7500, resonance: 1.5 }
            );
            if (hihatBuffer) {
              this.mixAudioBuffer(leftChannel, hihatBuffer, noteTime);
            }
          }
        });

        // Snare pattern (mid frequency, right channel)
        hihatPatterns.SNARE.forEach((velocity, index) => {
          if (velocity > 0) {
            const noteTime = measureStart + index * EIGHTH_NOTE;
            const snareBuffer = this.generateNote(
              250 + Math.random() * 150, // More aggressive snare frequency
              SIXTEENTH_NOTE * 4,
              "square",
              { attack: 0.001, decay: 0.12, sustain: 0.15, release: 0.08 },
              velocity *
                section.complexity *
                VOLUME_MULTIPLIERS.PERCUSSION *
                0.8, // Much more prominent
              { type: "bandpass", frequency: 1300, resonance: 4 } // More resonant
            );
            if (snareBuffer) {
              this.mixAudioBuffer(rightChannel, snareBuffer, noteTime);
            }
          }
        });

        // Open hi-hat accents
        if (measure % 4 === 3 && section.complexity > 0.5) {
          hihatPatterns.OPEN.forEach((velocity, index) => {
            if (velocity > 0) {
              const noteTime = measureStart + index * EIGHTH_NOTE;
              const openHihatBuffer = this.generateNote(
                10000 + Math.random() * 1000,
                QUARTER_NOTE,
                "sawtooth",
                { attack: 0.001, decay: 0.3, sustain: 0.2, release: 0.4 },
                velocity * 0.2,
                { type: "highpass", frequency: 8000 }
              );
              if (openHihatBuffer) {
                this.mixAudioBuffer(leftChannel, openHihatBuffer, noteTime);
              }
            }
          });
        }
      }
      currentMeasure += section.measures;
    });
  }

  /**
   * Generate polyrhythmic elements that create complex timing interactions
   */
  private generatePolyrhythmicElements(
    leftChannel: Float32Array,
    rightChannel: Float32Array
  ): void {
    if (!this.audioContext) return;

    // 3-against-4 polyrhythm (triplets against quarter notes)
    const tripletDuration = MEASURE_DURATION / 3;
    const quintupletDuration = MEASURE_DURATION / 5;

    let currentMeasure = 0;
    const sections = [
      { name: "intro", measures: SONG_STRUCTURE.INTRO, polyrhythm: false },
      { name: "verse1", measures: SONG_STRUCTURE.VERSE_1, polyrhythm: true },
      { name: "chorus1", measures: SONG_STRUCTURE.CHORUS_1, polyrhythm: true },
      { name: "verse2", measures: SONG_STRUCTURE.VERSE_2, polyrhythm: true },
      { name: "chorus2", measures: SONG_STRUCTURE.CHORUS_2, polyrhythm: true },
      {
        name: "breakdown",
        measures: SONG_STRUCTURE.BREAKDOWN,
        polyrhythm: false,
      },
      { name: "outro", measures: SONG_STRUCTURE.OUTRO, polyrhythm: false },
    ];

    sections.forEach((section) => {
      if (section.polyrhythm) {
        for (let measure = 0; measure < section.measures; measure++) {
          const measureStart = (currentMeasure + measure) * MEASURE_DURATION;

          // Triplet rhythm (left channel)
          for (let triplet = 0; triplet < 3; triplet++) {
            const tripletTime = measureStart + triplet * tripletDuration;
            if (Math.random() > 0.3) {
              // 70% chance to play
              const tripletBuffer = this.generateNote(
                E_MINOR_SCALE.E4 + Math.random() * 100,
                tripletDuration * 0.8,
                "triangle",
                { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 },
                0.3,
                { type: "bandpass", frequency: 2000, resonance: 1.5 }
              );
              if (tripletBuffer) {
                this.mixAudioBuffer(leftChannel, tripletBuffer, tripletTime);
              }
            }
          }

          // Quintuplet rhythm (right channel) - creates complex interaction
          if (measure % 2 === 1) {
            // Every other measure
            for (let quintuplet = 0; quintuplet < 5; quintuplet++) {
              const quintupletTime =
                measureStart + quintuplet * quintupletDuration;
              if (Math.random() > 0.4) {
                // 60% chance to play
                const quintupletBuffer = this.generateNote(
                  E_MINOR_SCALE.G4 + Math.random() * 50,
                  quintupletDuration * 0.6,
                  "sine",
                  { attack: 0.005, decay: 0.05, sustain: 0.4, release: 0.1 },
                  0.25,
                  { type: "lowpass", frequency: 3000 }
                );
                if (quintupletBuffer) {
                  this.mixAudioBuffer(
                    rightChannel,
                    quintupletBuffer,
                    quintupletTime
                  );
                }
              }
            }
          }
        }
      }
      currentMeasure += section.measures;
    });
  }

  /**
   * Generate special effects for breakdown section
   */
  private generateBreakdownEffects(
    leftChannel: Float32Array,
    rightChannel: Float32Array
  ): void {
    if (!this.audioContext) return;

    const breakdownStart =
      (SONG_STRUCTURE.INTRO +
        SONG_STRUCTURE.VERSE_1 +
        SONG_STRUCTURE.CHORUS_1 +
        SONG_STRUCTURE.VERSE_2 +
        SONG_STRUCTURE.CHORUS_2) *
      MEASURE_DURATION;

    // Generate sweeping tritone effects during breakdown
    for (let measure = 0; measure < SONG_STRUCTURE.BREAKDOWN; measure++) {
      const measureStart = breakdownStart + measure * MEASURE_DURATION;

      // Tritone sweep effect
      const startFreq = E_MINOR_SCALE.As3;
      const endFreq = E_MINOR_SCALE.Ds4;
      const sweepDuration = MEASURE_DURATION * 2;

      for (let i = 0; i < 20; i++) {
        const time = measureStart + (i / 20) * sweepDuration;
        const progress = i / 20;
        const frequency = startFreq + (endFreq - startFreq) * progress;

        const sweepBuffer = this.generateNote(
          frequency,
          QUARTER_NOTE,
          "sawtooth",
          { attack: 0.1, decay: 0.3, sustain: 0.2, release: 0.4 },
          0.2 * (1 - progress),
          { type: "lowpass", frequency: 1500 - progress * 500 }
        );
        if (sweepBuffer) {
          // Alternate between channels for stereo effect
          if (i % 2 === 0) {
            this.mixAudioBuffer(leftChannel, sweepBuffer, time);
          } else {
            this.mixAudioBuffer(rightChannel, sweepBuffer, time);
          }
        }
      }
    }
  }

  /**
   * Generate industrial techno elements (metallic hits, noise bursts, distorted leads)
   */
  private generateIndustrialElements(
    leftChannel: Float32Array,
    rightChannel: Float32Array
  ): void {
    if (!this.audioContext) return;

    let currentMeasure = 0;
    const sections = [
      { name: "intro", measures: SONG_STRUCTURE.INTRO, intensity: 0.1 },
      { name: "verse1", measures: SONG_STRUCTURE.VERSE_1, intensity: 0.4 },
      { name: "chorus1", measures: SONG_STRUCTURE.CHORUS_1, intensity: 0.7 },
      { name: "verse2", measures: SONG_STRUCTURE.VERSE_2, intensity: 0.5 },
      { name: "chorus2", measures: SONG_STRUCTURE.CHORUS_2, intensity: 0.9 },
      { name: "breakdown", measures: SONG_STRUCTURE.BREAKDOWN, intensity: 1.0 },
      { name: "outro", measures: SONG_STRUCTURE.OUTRO, intensity: 0.2 },
    ];

    sections.forEach((section) => {
      for (let measure = 0; measure < section.measures; measure++) {
        const measureStart = (currentMeasure + measure) * MEASURE_DURATION;

        // Industrial metallic hits on certain beats
        if (section.intensity > 0.3 && measure % 4 === 0) {
          [0.75, 2.25, 3.5].forEach((beatOffset) => {
            const hitTime = measureStart + beatOffset * QUARTER_NOTE;
            const metallicBuffer = this.generateNote(
              800 + Math.random() * 400, // Metallic frequency range
              EIGHTH_NOTE * 0.3,
              "square",
              { attack: 0.001, decay: 0.02, sustain: 0.0, release: 0.05 },
              section.intensity * VOLUME_MULTIPLIERS.EFFECTS * 0.4,
              { type: "bandpass", frequency: 1500, resonance: 6 }
            );
            if (metallicBuffer) {
              // Alternate channels for stereo spread
              if (Math.random() > 0.5) {
                this.mixAudioBuffer(leftChannel, metallicBuffer, hitTime);
              } else {
                this.mixAudioBuffer(rightChannel, metallicBuffer, hitTime);
              }
            }
          });
        }

        // Noise bursts in breakdown sections
        if (section.name === "breakdown" && Math.random() > 0.7) {
          const noiseTime = measureStart + Math.random() * MEASURE_DURATION;
          const noiseBuffer = this.generateNote(
            100 + Math.random() * 200, // Low frequency noise
            SIXTEENTH_NOTE * (1 + Math.random()),
            "sawtooth",
            { attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.2 },
            section.intensity * VOLUME_MULTIPLIERS.EFFECTS * 0.3,
            { type: "highpass", frequency: 2000, resonance: 8 }
          );
          if (noiseBuffer) {
            this.mixAudioBuffer(
              Math.random() > 0.5 ? leftChannel : rightChannel,
              noiseBuffer,
              noiseTime
            );
          }
        }

        // Distorted lead stabs in chorus sections
        if (section.name.includes("chorus") && measure % 2 === 1) {
          const stabTime = measureStart + 1.5 * QUARTER_NOTE;
          const leadFreq = [
            E_MINOR_SCALE.E4,
            E_MINOR_SCALE.G4,
            E_MINOR_SCALE.B4,
          ][Math.floor(Math.random() * 3)];
          const stabBuffer = this.generateNote(
            leadFreq,
            EIGHTH_NOTE * 0.8,
            "sawtooth",
            { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.15 },
            section.intensity * VOLUME_MULTIPLIERS.LEAD * 0.6,
            { type: "lowpass", frequency: 1800, resonance: 12 } // Heavy distortion-like filtering
          );
          if (stabBuffer) {
            this.mixAudioBuffer(rightChannel, stabBuffer, stabTime);
          }
        }
      }
      currentMeasure += section.measures;
    });
  }

  /**
   * Create complex sounds by layering multiple components
   */
  private createComplexSound(
    components: Array<{
      frequency: number;
      duration: number;
      type: OscillatorType;
      volume: number;
      delay?: number;
      envelope?: {
        attack: number;
        decay: number;
        sustain: number;
        release: number;
      };
    }>
  ): AudioBuffer | null {
    if (!this.audioContext || components.length === 0) return null;

    const maxDuration = Math.max(
      ...components.map((c) => (c.delay || 0) + c.duration)
    );
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * maxDuration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Layer each component
    for (const component of components) {
      const componentBuffer = this.generateNote(
        component.frequency,
        component.duration,
        component.type,
        component.envelope
      );

      if (componentBuffer) {
        const componentData = componentBuffer.getChannelData(0);
        const delayOffset = Math.floor((component.delay || 0) * sampleRate);

        for (
          let i = 0;
          i < componentData.length && i + delayOffset < data.length;
          i++
        ) {
          data[i + delayOffset] += componentData[i] * component.volume;
        }
      }
    }

    return buffer;
  }

  private getSoundBuffer(soundType: SoundType): AudioBuffer | null {
    if (!this.audioContext) return null;

    switch (soundType) {
      case "pistol_fire":
        return this.createComplexSound([
          {
            frequency: 150,
            duration: 0.1,
            type: "square",
            volume: 0.4,
            envelope: {
              attack: 0.001,
              decay: 0.05,
              sustain: 0.2,
              release: 0.04,
            },
          },
          {
            frequency: 800,
            duration: 0.05,
            type: "sawtooth",
            volume: 0.3,
            envelope: {
              attack: 0.001,
              decay: 0.02,
              sustain: 0.1,
              release: 0.03,
            },
          },
        ]);

      case "shotgun_fire":
        return this.createComplexSound([
          {
            frequency: 80,
            duration: 0.2,
            type: "square",
            volume: 7.0,
            envelope: {
              attack: 0.001,
              decay: 0.1,
              sustain: 0.1,
              release: 0.09,
            },
          },
          {
            frequency: 200,
            duration: 0.15,
            type: "sawtooth",
            volume: 0.6,
            envelope: {
              attack: 0.001,
              decay: 0.05,
              sustain: 0.2,
              release: 0.1,
            },
          },
        ]);

      case "chaingun_fire":
        return this.createComplexSound([
          {
            frequency: 120,
            duration: 0.06,
            type: "square",
            volume: 0.5,
            envelope: {
              attack: 0.001,
              decay: 0.02,
              sustain: 0.3,
              release: 0.03,
            },
          },
        ]);

      case "enemy_hit":
        return this.createComplexSound([
          {
            frequency: 300,
            duration: 0.08,
            type: "sawtooth",
            volume: 0.6,
            envelope: {
              attack: 0.001,
              decay: 0.03,
              sustain: 0.2,
              release: 0.04,
            },
          },
        ]);

      case "enemy_death":
        return this.createComplexSound([
          {
            frequency: 200,
            duration: 0.3,
            type: "sawtooth",
            volume: 0.8,
            envelope: {
              attack: 0.001,
              decay: 0.15,
              sustain: 0.1,
              release: 0.14,
            },
          },
          {
            frequency: 100,
            duration: 0.4,
            type: "square",
            volume: 0.5,
            envelope: {
              attack: 0.01,
              decay: 0.2,
              sustain: 0.05,
              release: 0.19,
            },
          },
        ]);

      case "pickup_health":
        return this.createComplexSound([
          {
            frequency: E_MINOR_SCALE.C4,
            duration: 0.3,
            type: "sine",
            volume: 0.7,
            envelope: { attack: 0.1, decay: 0.1, sustain: 0.6, release: 0.1 },
          },
          {
            frequency: E_MINOR_SCALE.E4,
            duration: 0.3,
            type: "sine",
            volume: 0.5,
            delay: 0.1,
            envelope: { attack: 0.1, decay: 0.1, sustain: 0.6, release: 0.1 },
          },
        ]);

      case "pickup_ammo":
        return this.createComplexSound([
          {
            frequency: E_MINOR_SCALE.G3,
            duration: 0.2,
            type: "square",
            volume: 0.6,
            envelope: { attack: 0.05, decay: 0.05, sustain: 0.5, release: 0.1 },
          },
        ]);

      case "pickup_weapon":
        return this.createComplexSound([
          {
            frequency: E_MINOR_SCALE.E4,
            duration: 0.4,
            type: "sawtooth",
            volume: 0.8,
            envelope: { attack: 0.1, decay: 0.1, sustain: 0.7, release: 0.2 },
          },
          {
            frequency: E_MINOR_SCALE.G4,
            duration: 0.4,
            type: "sawtooth",
            volume: 0.6,
            delay: 0.1,
            envelope: { attack: 0.1, decay: 0.1, sustain: 0.7, release: 0.2 },
          },
        ]);

      case "player_hurt":
        return this.createComplexSound([
          {
            frequency: E_MINOR_SCALE.As2, // Tritone for dissonance
            duration: 0.2,
            type: "sawtooth",
            volume: 0.8,
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.09 },
          },
        ]);

      case "footstep":
        return this.createComplexSound([
          {
            frequency: 80,
            duration: 0.1,
            type: "square",
            volume: 0.3,
            envelope: {
              attack: 0.001,
              decay: 0.05,
              sustain: 0.1,
              release: 0.044,
            },
          },
        ]);

      case "menu_click":
        return this.createComplexSound([
          {
            frequency: E_MINOR_SCALE.B3,
            duration: 0.1,
            type: "square",
            volume: 0.5,
            envelope: {
              attack: 0.01,
              decay: 0.04,
              sustain: 0.2,
              release: 0.05,
            },
          },
        ]);

      case "weapon_switch":
        return this.createComplexSound([
          {
            frequency: E_MINOR_SCALE.D3,
            duration: 0.15,
            type: "sawtooth",
            volume: 0.6,
            envelope: {
              attack: 0.02,
              decay: 0.08,
              sustain: 0.3,
              release: 0.05,
            },
          },
        ]);

      case "ambient_doom":
      default:
        return this.generateAmbientTrack();
    }
  }

  /**
   * Generate smooth transition effects between sections (risers, sweeps, builds)
   */
  private generateTransitionEffects(
    leftChannel: Float32Array,
    rightChannel: Float32Array
  ): void {
    if (!this.audioContext) return;

    const transitionPoints = [
      {
        name: "intro_to_verse1",
        start: SONG_STRUCTURE.INTRO * MEASURE_DURATION - MEASURE_DURATION,
        duration: MEASURE_DURATION * 2,
        type: "riser",
      },
      {
        name: "verse1_to_chorus1",
        start:
          (SONG_STRUCTURE.INTRO + SONG_STRUCTURE.VERSE_1) * MEASURE_DURATION -
          MEASURE_DURATION,
        duration: MEASURE_DURATION * 2,
        type: "build",
      },
      {
        name: "chorus1_to_verse2",
        start:
          (SONG_STRUCTURE.INTRO +
            SONG_STRUCTURE.VERSE_1 +
            SONG_STRUCTURE.CHORUS_1) *
            MEASURE_DURATION -
          MEASURE_DURATION * 0.5,
        duration: MEASURE_DURATION,
        type: "drop",
      },
      {
        name: "verse2_to_chorus2",
        start:
          (SONG_STRUCTURE.INTRO +
            SONG_STRUCTURE.VERSE_1 +
            SONG_STRUCTURE.CHORUS_1 +
            SONG_STRUCTURE.VERSE_2) *
            MEASURE_DURATION -
          MEASURE_DURATION,
        duration: MEASURE_DURATION * 2,
        type: "build",
      },
      {
        name: "chorus2_to_breakdown",
        start:
          (SONG_STRUCTURE.INTRO +
            SONG_STRUCTURE.VERSE_1 +
            SONG_STRUCTURE.CHORUS_1 +
            SONG_STRUCTURE.VERSE_2 +
            SONG_STRUCTURE.CHORUS_2) *
            MEASURE_DURATION -
          MEASURE_DURATION * 0.5,
        duration: MEASURE_DURATION,
        type: "filter_sweep",
      },
    ];

    transitionPoints.forEach((transition) => {
      switch (transition.type) {
        case "riser":
          // White noise riser
          for (let i = 0; i < 100; i++) {
            const progress = i / 100;
            const time = transition.start + progress * transition.duration;
            const frequency = 100 + progress * 2000; // Rising frequency
            const volume = progress * 0.3; // Increasing volume

            const risingBuffer = this.generateNote(
              frequency,
              transition.duration / 100,
              "sawtooth",
              { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.1 },
              volume,
              { type: "highpass", frequency: frequency * 0.5, resonance: 4 }
            );
            if (risingBuffer) {
              // Alternate channels for stereo effect
              if (i % 2 === 0) {
                this.mixAudioBuffer(leftChannel, risingBuffer, time);
              } else {
                this.mixAudioBuffer(rightChannel, risingBuffer, time);
              }
            }
          }
          break;

        case "build":
          // Tension building with increasing drum rolls
          const rollCount = 32;
          for (let i = 0; i < rollCount; i++) {
            const progress = i / rollCount;
            const time = transition.start + progress * transition.duration;
            const intensity = Math.pow(progress, 2); // Exponential build

            const drumBuffer = this.generateNote(
              200 + Math.random() * 100,
              0.05,
              "square",
              { attack: 0.001, decay: 0.02, sustain: 0.1, release: 0.03 },
              intensity * 0.5,
              { type: "bandpass", frequency: 1000, resonance: 3 }
            );
            if (drumBuffer) {
              this.mixAudioBuffer(
                progress > 0.5 ? rightChannel : leftChannel,
                drumBuffer,
                time
              );
            }
          }
          break;

        case "drop":
          // Sudden filter drop
          const dropBuffer = this.generateNote(
            E_MINOR_SCALE.E1,
            transition.duration,
            "sawtooth",
            { attack: 0.001, decay: 0.3, sustain: 0.2, release: 0.5 },
            0.8,
            { type: "lowpass", frequency: 80, resonance: 8 }
          );
          if (dropBuffer) {
            this.mixAudioBuffer(leftChannel, dropBuffer, transition.start);
            this.mixAudioBuffer(rightChannel, dropBuffer, transition.start);
          }
          break;

        case "filter_sweep":
          // Filter sweep effect
          for (let i = 0; i < 50; i++) {
            const progress = i / 50;
            const time = transition.start + progress * transition.duration;
            const filterFreq = 2000 - progress * 1800; // Sweeping down

            const sweepBuffer = this.generateNote(
              E_MINOR_SCALE.E3,
              transition.duration / 50,
              "sawtooth",
              { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.1 },
              0.3,
              { type: "lowpass", frequency: filterFreq, resonance: 6 }
            );
            if (sweepBuffer) {
              this.mixAudioBuffer(leftChannel, sweepBuffer, time);
              this.mixAudioBuffer(rightChannel, sweepBuffer, time);
            }
          }
          break;
      }
    });
  }

  /**
   * Generate call and response patterns between different instruments
   */
  private generateCallAndResponse(
    leftChannel: Float32Array,
    rightChannel: Float32Array
  ): void {
    if (!this.audioContext) return;

    let currentMeasure = 0;
    const sections = [
      { name: "intro", measures: SONG_STRUCTURE.INTRO, active: false },
      { name: "verse1", measures: SONG_STRUCTURE.VERSE_1, active: true },
      { name: "chorus1", measures: SONG_STRUCTURE.CHORUS_1, active: true },
      { name: "verse2", measures: SONG_STRUCTURE.VERSE_2, active: true },
      { name: "chorus2", measures: SONG_STRUCTURE.CHORUS_2, active: true },
      { name: "breakdown", measures: SONG_STRUCTURE.BREAKDOWN, active: true },
      { name: "outro", measures: SONG_STRUCTURE.OUTRO, active: false },
    ];

    sections.forEach((section) => {
      if (!section.active) {
        currentMeasure += section.measures;
        return;
      }

      // Generate call and response every 4 measures
      for (let measure = 0; measure < section.measures; measure += 4) {
        const measureStart = (currentMeasure + measure) * MEASURE_DURATION;

        // "Call" - left channel plays doom motif
        MUSICAL_THEMES.DOOM_MOTIF.slice(0, 4).forEach(
          (frequency, noteIndex) => {
            const noteTime = measureStart + noteIndex * QUARTER_NOTE;
            const callBuffer = this.generateNote(
              frequency * 0.75, // Lower octave for call
              QUARTER_NOTE * 0.8,
              "sine",
              { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.3 },
              0.4,
              { type: "lowpass", frequency: 1500, resonance: 2 }
            );
            if (callBuffer) {
              this.mixAudioBuffer(leftChannel, callBuffer, noteTime);
            }
          }
        );

        // "Response" - right channel responds with heroic motif (delayed)
        MUSICAL_THEMES.HEROIC_MOTIF.slice(0, 4).forEach(
          (frequency, noteIndex) => {
            const noteTime =
              measureStart + MEASURE_DURATION + noteIndex * QUARTER_NOTE;
            const responseBuffer = this.generateNote(
              frequency * 1.25, // Higher octave for response
              QUARTER_NOTE * 0.8,
              "triangle",
              { attack: 0.02, decay: 0.15, sustain: 0.5, release: 0.25 },
              0.3,
              { type: "bandpass", frequency: 2000, resonance: 1.5 }
            );
            if (
              responseBuffer &&
              noteTime < (currentMeasure + section.measures) * MEASURE_DURATION
            ) {
              this.mixAudioBuffer(rightChannel, responseBuffer, noteTime);
            }
          }
        );
      }
      currentMeasure += section.measures;
    });
  }

  /**
   * Mix audio buffer into target channel
   */
  private mixAudioBuffer(
    targetChannel: Float32Array,
    sourceBuffer: AudioBuffer,
    startTime: number
  ): void {
    if (!this.audioContext) return;
    const sourceData = sourceBuffer.getChannelData(0);
    const startSample = Math.floor(startTime * this.audioContext.sampleRate);

    for (let i = 0; i < sourceData.length; i++) {
      if (startSample + i < targetChannel.length) {
        targetChannel[startSample + i] += sourceData[i];
      }
    }
  }

  /**
   * Play a sound effect
   */
  public playSound(soundType: SoundType, volume: number = 1): void {
    if (!this.settings.enabled || !this.audioContext) return;

    try {
      const buffer = this.getSoundBuffer(soundType);
      if (!buffer) return;

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      const finalVolume =
        volume * this.settings.sfxVolume * this.settings.masterVolume;
      gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime);

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      this.activeSounds.add(source);
      source.addEventListener("ended", () => {
        this.activeSounds.delete(source);
      });

      source.start();
    } catch (error) {
      console.warn(`Failed to play sound ${soundType}:`, error);
    }
  }

  /**
   * Play ambient music
   */
  public playAmbientMusic(): void {
    if (!this.settings.enabled || !this.audioContext || this.ambientSource)
      return;

    try {
      const buffer = this.getSoundBuffer("ambient_doom");
      if (!buffer) return;

      this.ambientSource = this.audioContext.createBufferSource();
      this.ambientSource.buffer = buffer;
      this.ambientSource.loop = true;

      if (this.musicGainNode) {
        this.ambientSource.connect(this.musicGainNode);
        // Apply improved volume scaling for ambient music

        // Apply much more aggressive volume scaling for prominent techno
        const aggressiveVolume =
          Math.pow(
            this.settings.musicVolume * this.settings.masterVolume,
            0.7
          ) * 2.5; // Significantly boost music volume
        this.musicGainNode.gain.setValueAtTime(
          aggressiveVolume,
          this.audioContext.currentTime
        );
      }

      this.ambientSource.start();
    } catch (error) {
      console.warn("Failed to play ambient music:", error);
    }
  }

  /**
   * Stop ambient music
   */
  public stopAmbientMusic(): void {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
      } catch (error) {
        console.warn("Error stopping ambient music:", error);
      }
      this.ambientSource = null;
    }
  }

  /**
   * Update audio settings
   */
  public updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    // Update music volume if playing - with improved volume scaling
    if (this.musicGainNode && this.audioContext) {
      // Apply much more aggressive volume scaling for prominent techno
      const aggressiveVolume =
        Math.pow(this.settings.musicVolume * this.settings.masterVolume, 0.7) *
        2.5; // Significantly boost music volume
      this.musicGainNode.gain.setValueAtTime(
        aggressiveVolume,
        this.audioContext.currentTime
      );
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener(this.settings));
  }

  /**
   * Subscribe to settings changes
   */
  public subscribe(listener: (settings: AudioSettings) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  /**
   * Get current settings
   */
  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /**
   * Update game state for adaptive music generation
   * @param gameState Current game state information
   */
  public updateGameStateForMusic(gameState: GameStateForMusic): void {
    // Check if we need to switch song types based on game state
    const newSongType = this.determineSongType(gameState);

    if (
      !this.currentSongConfig ||
      this.currentSongConfig.songType !== newSongType
    ) {
      this.generateAdaptiveMusic(newSongType, gameState);
    } else if (Date.now() - this.lastMusicUpdate > 100) {
      // Update existing music with new parameters
      this.updateMusicParameters(gameState);
      this.lastMusicUpdate = Date.now();
    }
  }

  /**
   * Determine appropriate song type based on game state
   */
  private determineSongType(
    gameState: GameStateForMusic
  ): "exploration" | "combat" | "boss" | "victory" | "defeat" {
    if (gameState.gameStatus === "victory") return "victory";
    if (gameState.gameStatus === "defeat") return "defeat";
    if (gameState.isBossLevel && gameState.isInCombat) return "boss";
    if (gameState.isInCombat || gameState.nearbyEnemyCount > 0) return "combat";
    return "exploration";
  }

  /**
   * Generate adaptive procedural music based on game state
   */
  public generateAdaptiveMusic(
    songType: "exploration" | "combat" | "boss" | "victory" | "defeat",
    gameState: GameStateForMusic
  ): void {
    if (!this.audioContext) return;

    // Create seed based on current floor and song type for deterministic generation
    const seed =
      gameState.currentFloor * 1000 +
      songType.charCodeAt(0) * 100 +
      (Date.now() % 1000);

    this.currentSongConfig = {
      seed,
      songType,
      intensity: this.calculateIntensity(gameState),
      baseKey: SONG_TYPES[songType].scale,
      measures: this.calculateSongLength(songType, gameState),
      adaptiveFeatures: {
        healthBasedTempo: true,
        proximityDissonance: true,
        combatRhythm: gameState.isInCombat,
        dynamicHarmony: true,
      },
    };

    this.seededRandom = new SeededRandom(seed);
    this.generateProceduralSong(this.currentSongConfig, gameState);
  }

  /**
   * Calculate music intensity based on game state
   */
  private calculateIntensity(gameState: GameStateForMusic): number {
    let intensity = SONG_TYPES[this.determineSongType(gameState)].complexity;

    // Increase intensity based on nearby enemies
    intensity += gameState.nearbyEnemyCount * 0.1;

    // Increase intensity if health is low (creates urgency)
    const healthRatio = gameState.playerHealth / gameState.playerMaxHealth;
    if (healthRatio < 0.3) {
      intensity += 0.3;
    } else if (healthRatio < 0.5) {
      intensity += 0.2;
    }

    return Math.min(1.0, intensity);
  }

  /**
   * Calculate appropriate song length based on type and game state
   */
  private calculateSongLength(
    songType: string,
    _gameState: GameStateForMusic
  ): number {
    const baseLength = Object.values(
      SONG_TYPES[songType as keyof typeof SONG_TYPES].structure
    ).reduce((sum, measures) => sum + measures, 0);

    // Boss fights get longer, more complex songs
    if (songType === "boss") return baseLength * 1.5;
    if (songType === "combat") return baseLength * 1.2;

    return baseLength;
  }

  /**
   * Generate a complete procedural song based on configuration
   */
  private generateProceduralSong(
    config: ProceduralSongConfig,
    gameState: GameStateForMusic
  ): void {
    if (!this.audioContext || !this.seededRandom) return;

    // Stop current music
    this.stopAmbientMusic();

    const songType = SONG_TYPES[config.songType];
    const scale = MUSICAL_SCALES[songType.scale as keyof typeof MUSICAL_SCALES];

    // Calculate adaptive BPM
    const adaptiveBpm = this.calculateAdaptiveBpm(
      songType.baseBpm,
      gameState,
      config
    );
    const beatDuration = 60 / adaptiveBpm;
    const measureDuration = beatDuration * 4;

    // Generate song structure based on type
    const songStructure = this.generateSongStructure(config, songType);
    const totalDuration =
      Object.values(songStructure).reduce(
        (sum, measures) => sum + measures,
        0
      ) * measureDuration;

    // Create audio buffer for the complete song
    const buffer = this.audioContext.createBuffer(
      2,
      Math.ceil(totalDuration * this.audioContext.sampleRate),
      this.audioContext.sampleRate
    );
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    // Generate musical elements
    this.generateAdaptiveRhythm(
      leftChannel,
      rightChannel,
      songStructure,
      scale,
      beatDuration,
      config,
      gameState
    );
    this.generateAdaptiveMelody(
      leftChannel,
      rightChannel,
      songStructure,
      scale,
      beatDuration,
      config,
      gameState
    );
    this.generateAdaptiveBass(
      leftChannel,
      rightChannel,
      songStructure,
      scale,
      beatDuration,
      config,
      gameState
    );

    if (
      config.adaptiveFeatures.proximityDissonance &&
      gameState.nearbyEnemyCount > 0
    ) {
      this.generateProximityDissonance(
        leftChannel,
        rightChannel,
        songStructure,
        scale,
        beatDuration,
        gameState
      );
    }

    // Play the generated song
    this.playGeneratedSong(buffer);
  }

  /**
   * Calculate adaptive BPM based on game state
   */
  private calculateAdaptiveBpm(
    baseBpm: number,
    gameState: GameStateForMusic,
    config: ProceduralSongConfig
  ): number {
    let bpm = baseBpm;

    if (config.adaptiveFeatures.healthBasedTempo) {
      const healthRatio = gameState.playerHealth / gameState.playerMaxHealth;

      // Double time when health is critically low
      if (healthRatio < 0.2) {
        bpm *= 2;
      } else if (healthRatio < 0.4) {
        bpm *= 1.5;
      }
    }

    // Increase tempo based on nearby enemies
    bpm += gameState.nearbyEnemyCount * 5;

    return Math.min(200, Math.max(60, bpm)); // Clamp between reasonable limits
  }

  /**
   * Generate song structure based on configuration
   */
  private generateSongStructure(
    _config: ProceduralSongConfig,
    songType: any
  ): Record<string, number> {
    if (!this.seededRandom) return songType.structure;

    // Add some variation to the base structure
    const structure: Record<string, number> = {};

    Object.entries(songType.structure).forEach(([section, measures]) => {
      // Add slight random variation (±25%) to section lengths
      const variation = this.seededRandom!.next() * 0.5 - 0.25; // -25% to +25%
      structure[section] = Math.max(
        1,
        Math.round((measures as number) * (1 + variation))
      );
    });

    return structure;
  }

  /**
   * Generate adaptive rhythm section
   */
  private generateAdaptiveRhythm(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    songStructure: Record<string, number>,
    scale: any,
    beatDuration: number,
    config: ProceduralSongConfig,
    _gameState: GameStateForMusic
  ): void {
    if (!this.seededRandom) return;

    let currentTime = 0;
    const measureDuration = beatDuration * 4;

    Object.entries(songStructure).forEach(([_sectionName, measures]) => {
      // Choose rhythm pattern based on song type and game state
      const availablePatterns = SONG_TYPES[config.songType].patterns;
      const patternName = this.seededRandom!.choose(availablePatterns);
      const pattern =
        SYNCOPATION_PATTERNS[patternName as keyof typeof SYNCOPATION_PATTERNS];

      for (let measure = 0; measure < measures; measure++) {
        const measureStart = currentTime + measure * measureDuration;

        // Generate kicks and snares
        for (let beat = 0; beat < 8; beat++) {
          // 8th note resolution
          const beatTime = measureStart + (beat * beatDuration) / 2;
          const intensity = pattern[beat % pattern.length] * config.intensity;

          if (intensity > 0.6) {
            // Generate kick drum
            const kickBuffer = this.generateNote(
              scale.E1 ?? 41.2,
              beatDuration * 0.3,
              "sine",
              { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.1 },
              intensity * VOLUME_MULTIPLIERS.KICK * 0.8,
              { type: "lowpass", frequency: 100 }
            );
            if (kickBuffer) {
              this.mixAudioBuffer(leftChannel, kickBuffer, beatTime);
              this.mixAudioBuffer(rightChannel, kickBuffer, beatTime);
            }
          }

          // Add snare on offbeats in combat situations
          if (
            config.adaptiveFeatures.combatRhythm &&
            beat % 4 === 2 &&
            intensity > 0.4
          ) {
            const snareBuffer = this.generateNote(
              200 + this.seededRandom!.next() * 100,
              beatDuration * 0.2,
              "triangle",
              { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.05 },
              intensity * VOLUME_MULTIPLIERS.PERCUSSION * 0.6,
              { type: "highpass", frequency: 1000 }
            );
            if (snareBuffer) {
              this.mixAudioBuffer(leftChannel, snareBuffer, beatTime + 0.01);
              this.mixAudioBuffer(rightChannel, snareBuffer, beatTime + 0.01);
            }
          }
        }
      }

      currentTime += measures * measureDuration;
    });
  }

  /**
   * Generate adaptive melody
   */
  private generateAdaptiveMelody(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    songStructure: Record<string, number>,
    scale: any,
    beatDuration: number,
    config: ProceduralSongConfig,
    _gameState: GameStateForMusic
  ): void {
    if (!this.seededRandom) return;

    // Create melody note pool from scale
    const melodyNotes = [
      scale.E3,
      scale.G3,
      scale.A3,
      scale.B3,
      scale.C4,
      scale.D4,
      scale.E4,
      scale.G4,
      scale.A4,
    ].filter((note) => note !== undefined);

    let currentTime = 0;
    let lastNoteIndex = Math.floor(melodyNotes.length / 2); // Start in middle range

    Object.entries(songStructure).forEach(([_sectionName, measures]) => {
      const measureDuration = beatDuration * 4;

      for (let measure = 0; measure < measures; measure++) {
        const measureStart = currentTime + measure * measureDuration;

        // Generate melody phrases (groups of 4 beats)
        for (let phrase = 0; phrase < 2; phrase++) {
          // 2 phrases per measure
          const phraseStart = measureStart + (phrase * measureDuration) / 2;

          // Generate 4-8 notes per phrase depending on complexity
          const notesInPhrase = Math.floor(2 + config.intensity * 6);

          for (let noteIndex = 0; noteIndex < notesInPhrase; noteIndex++) {
            const noteTime =
              phraseStart + ((noteIndex / notesInPhrase) * measureDuration) / 2;

            // Small interval movement (walk, don't jump)
            const maxInterval = Math.ceil(config.intensity * 3) + 1;
            const intervalChange = this.seededRandom!.nextInt(
              -maxInterval,
              maxInterval
            );
            lastNoteIndex = Math.max(
              0,
              Math.min(melodyNotes.length - 1, lastNoteIndex + intervalChange)
            );

            const frequency = melodyNotes[lastNoteIndex];
            const noteDuration =
              (measureDuration / 2 / notesInPhrase) *
              (0.7 + this.seededRandom!.next() * 0.6);

            // Add dissonance if enemies are near
            let finalFrequency = frequency;
            if (
              config.adaptiveFeatures.proximityDissonance &&
              _gameState.closestEnemyDistance < 5
            ) {
              const dissonanceAmount =
                (5 - _gameState.closestEnemyDistance) / 5;
              finalFrequency +=
                frequency *
                0.1 *
                dissonanceAmount *
                (this.seededRandom!.next() - 0.5);
            }

            const noteBuffer = this.generateNote(
              finalFrequency,
              noteDuration,
              "sawtooth",
              { attack: 0.02, decay: 0.1, sustain: 0.6, release: 0.2 },
              config.intensity * VOLUME_MULTIPLIERS.LEAD * 0.4,
              { type: "lowpass", frequency: 1500 + config.intensity * 1500 }
            );

            if (noteBuffer) {
              // Stereo placement based on note pitch
              const stereoPosition =
                (lastNoteIndex / melodyNotes.length) * 2 - 1; // -1 to 1
              const leftGain = stereoPosition < 0 ? 1 : 1 - stereoPosition;
              const rightGain = stereoPosition > 0 ? 1 : 1 + stereoPosition;

              this.mixAudioBufferWithGain(
                leftChannel,
                noteBuffer,
                noteTime,
                leftGain
              );
              this.mixAudioBufferWithGain(
                rightChannel,
                noteBuffer,
                noteTime,
                rightGain
              );
            }
          }
        }
      }

      currentTime += measures * measureDuration;
    });
  }

  /**
   * Generate adaptive bass line
   */
  private generateAdaptiveBass(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    songStructure: Record<string, number>,
    scale: any,
    beatDuration: number,
    config: ProceduralSongConfig,
    _gameState: GameStateForMusic
  ): void {
    if (!this.seededRandom) return;

    const bassNotes = [
      scale.E1,
      scale.G1,
      scale.A1,
      scale.B1,
      scale.C2,
      scale.D2,
    ].filter((note) => note !== undefined);

    let currentTime = 0;

    Object.entries(songStructure).forEach(([_sectionName, measures]) => {
      const measureDuration = beatDuration * 4;

      for (let measure = 0; measure < measures; measure++) {
        const measureStart = currentTime + measure * measureDuration;

        // Bass typically plays on strong beats
        for (let beat = 0; beat < 4; beat++) {
          const beatTime = measureStart + beat * beatDuration;

          // Play bass on beat 1 and 3 primarily
          if (
            beat === 0 ||
            beat === 2 ||
            (config.intensity > 0.7 && this.seededRandom!.next() > 0.5)
          ) {
            const bassNote = this.seededRandom!.choose(bassNotes);

            const bassBuffer = this.generateNote(
              bassNote,
              beatDuration * 0.8,
              "triangle",
              { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.3 },
              config.intensity * VOLUME_MULTIPLIERS.BASS * 0.6,
              { type: "lowpass", frequency: 200 }
            );

            if (bassBuffer) {
              this.mixAudioBuffer(leftChannel, bassBuffer, beatTime);
              this.mixAudioBuffer(rightChannel, bassBuffer, beatTime);
            }
          }
        }
      }

      currentTime += measures * measureDuration;
    });
  }

  /**
   * Generate proximity-based dissonance effects
   */
  private generateProximityDissonance(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    songStructure: Record<string, number>,
    scale: any,
    beatDuration: number,
    gameState: GameStateForMusic
  ): void {
    if (!this.seededRandom || gameState.closestEnemyDistance > 10) return;

    const dissonanceIntensity = Math.max(
      0,
      (10 - gameState.closestEnemyDistance) / 10
    );
    let currentTime = 0;

    Object.entries(songStructure).forEach(([_sectionName, measures]) => {
      const measureDuration = beatDuration * 4;

      for (let measure = 0; measure < measures; measure++) {
        const measureStart = currentTime + measure * measureDuration;

        // Generate unsettling tritone intervals
        if (this.seededRandom!.next() < dissonanceIntensity * 0.3) {
          const tritoneTime =
            measureStart + this.seededRandom!.next() * measureDuration;

          const tritoneBuffer = this.generateNote(
            scale.As3 ?? 233.08, // Tritone
            beatDuration * 2,
            "sawtooth",
            { attack: 0.1, decay: 0.5, sustain: 0.3, release: 0.5 },
            dissonanceIntensity * 0.3,
            { type: "bandpass", frequency: 500 }
          );

          if (tritoneBuffer) {
            // Alternate channels for unsettling stereo effect
            if (measure % 2 === 0) {
              this.mixAudioBuffer(leftChannel, tritoneBuffer, tritoneTime);
            } else {
              this.mixAudioBuffer(rightChannel, tritoneBuffer, tritoneTime);
            }
          }
        }
      }

      currentTime += measures * measureDuration;
    });
  }

  /**
   * Mix audio buffer with gain control
   */
  private mixAudioBufferWithGain(
    targetChannel: Float32Array,
    sourceBuffer: AudioBuffer,
    startTime: number,
    gain: number
  ): void {
    if (!this.audioContext) return;
    const sourceData = sourceBuffer.getChannelData(0);
    const startSample = Math.floor(startTime * this.audioContext.sampleRate);

    for (let i = 0; i < sourceData.length; i++) {
      if (startSample + i < targetChannel.length) {
        targetChannel[startSample + i] += sourceData[i] * gain;
      }
    }
  }

  /**
   * Play a generated song buffer
   */
  private playGeneratedSong(buffer: AudioBuffer): void {
    if (!this.audioContext) return;

    // Create and configure source
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    // Apply music volume settings
    if (!this.musicGainNode) {
      this.musicGainNode = this.audioContext.createGain();
      this.musicGainNode.connect(this.audioContext.destination);
    }

    const finalVolume = this.settings.musicVolume * this.settings.masterVolume;
    this.musicGainNode.gain.setValueAtTime(
      finalVolume,
      this.audioContext.currentTime
    );

    source.connect(this.musicGainNode);
    source.loop = true; // Loop the procedural song
    source.start();

    // Store reference for cleanup
    this.ambientSource = source;
  }

  /**
   * Update music parameters in real-time based on game state changes
   */
  private updateMusicParameters(gameState: GameStateForMusic): void {
    if (!this.musicGainNode || !this.currentSongConfig) return;

    // Adjust volume based on health (gets quieter as health drops critically low)
    const healthRatio = gameState.playerHealth / gameState.playerMaxHealth;
    let volumeMultiplier = 1.0;

    if (healthRatio < 0.1) {
      volumeMultiplier = 0.3; // Very quiet when near death
    } else if (healthRatio < 0.3) {
      volumeMultiplier = 0.7;
    }

    const finalVolume =
      this.settings.musicVolume * this.settings.masterVolume * volumeMultiplier;
    this.musicGainNode.gain.setTargetAtTime(
      finalVolume,
      this.audioContext!.currentTime,
      0.1
    );
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopAmbientMusic();

    // Stop all active sounds
    this.activeSounds.forEach((source) => {
      try {
        source.stop();
      } catch (error) {
        console.warn("Error stopping sound:", error);
      }
    });
    this.activeSounds.clear();

    // Don't close the global audio context as other instances might be using it
    this.audioContext = null;
    this.musicGainNode = null;
  }
}
