import { useState, useEffect } from "react";
import {
  AudioSystem,
  AudioSettings as AudioSettingsType,
} from "@/game/systems/AudioSystem";

interface AudioSettingsProps {
  audioSystem: AudioSystem | null;
  onClose: () => void;
}

export default function AudioSettings({
  audioSystem,
  onClose,
}: AudioSettingsProps) {
  const [settings, setSettings] = useState<AudioSettingsType>({
    masterVolume: 0.9,
    sfxVolume: 0.6,
    musicVolume: 1.0, // Maximum music volume for prominent techno
    enabled: true,
  });

  useEffect(() => {
    if (audioSystem) {
      setSettings(audioSystem.getSettings());

      const unsubscribe = audioSystem.subscribe((newSettings) => {
        setSettings(newSettings);
      });

      return unsubscribe;
    }
  }, [audioSystem]);

  const updateSetting = (
    key: keyof AudioSettingsType,
    value: number | boolean
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (audioSystem) {
      audioSystem.updateSettings({ [key]: value });
    }
  };

  const testSound = () => {
    if (audioSystem) {
      audioSystem.playSound("menu_click", 1.0);
    }
  };

  const VolumeSlider = ({
    label,
    value,
    onChange,
    disabled = false,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-lg font-medium text-gray-300">{label}</label>
        <span className="text-lg font-mono text-yellow-400 min-w-[3rem] text-right">
          {Math.round(value * 100)}%
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className={`w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider ${
            disabled ? "opacity-50" : "hover:bg-gray-600"
          }`}
          style={{
            background: disabled
              ? "#374151"
              : `linear-gradient(to right, #facc15 0%, #facc15 ${
                  value * 100
                }%, #374151 ${value * 100}%, #374151 100%)`,
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-gray-600 p-8 max-w-lg w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-mono text-yellow-400 font-bold tracking-wider mb-2">
            AUDIO SETTINGS
          </h2>
          <div className="w-24 h-1 bg-yellow-400 mx-auto"></div>
        </div>

        {/* Audio Enable Toggle */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <label className="text-xl font-medium text-gray-300">
              Audio Enabled
            </label>
            <button
              onClick={() => updateSetting("enabled", !settings.enabled)}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                settings.enabled ? "bg-green-600" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.enabled ? "translate-x-9" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <p className="text-lg text-gray-400 mt-2">
            {settings.enabled ? "Audio is enabled" : "Audio is disabled"}
          </p>
        </div>

        {/* Volume Controls */}
        <div className="space-y-6 mb-8">
          <VolumeSlider
            label="Master Volume"
            value={settings.masterVolume}
            onChange={(value) => updateSetting("masterVolume", value)}
            disabled={!settings.enabled}
          />

          <VolumeSlider
            label="Sound Effects"
            value={settings.sfxVolume}
            onChange={(value) => updateSetting("sfxVolume", value)}
            disabled={!settings.enabled}
          />

          <VolumeSlider
            label="Background Music"
            value={settings.musicVolume}
            onChange={(value) => updateSetting("musicVolume", value)}
            disabled={!settings.enabled}
          />
        </div>

        {/* Test Sound Button */}
        <div className="mb-8">
          <button
            onClick={testSound}
            disabled={!settings.enabled}
            className={`w-full px-6 py-3 font-mono text-lg font-medium border-2 transition-colors ${
              settings.enabled
                ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
                : "bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed"
            }`}
          >
            TEST SOUND
          </button>
        </div>

        {/* Enhanced Audio Info */}
        <div className="mb-8 p-4 bg-gray-800 border border-gray-600">
          <h3 className="text-lg font-mono text-green-400 mb-3 font-bold">
            AUDIO FEATURES
          </h3>
          <div className="space-y-2 text-lg text-gray-300">
            <div>• Authentic 16-bit style sound effects</div>
            <div>• Cohesive procedural music with recurring themes</div>
            <div>• Doom & heroic motifs for narrative cohesion</div>
            <div>• Dynamic filter automation and smooth transitions</div>
            <div>• Call-and-response patterns between instruments</div>
            <div>• Tension-based harmonic progression system</div>
            <div>• Individual volume controls for all audio categories</div>
          </div>
        </div>

        {/* Music Theory Info */}
        <div className="mb-8 p-4 bg-purple-900 border border-purple-700">
          <h3 className="text-lg font-mono text-purple-400 mb-3 font-bold">
            COHESIVE COMPOSITION
          </h3>
          <div className="space-y-2 text-lg text-gray-300">
            <div>
              • <strong>Key:</strong> E Minor with strategic modulations
            </div>
            <div>
              • <strong>Tempo:</strong> 120 BPM with rhythmic cohesion
            </div>
            <div>
              • <strong>Themes:</strong> Doom (descending) & Heroic (ascending)
              motifs
            </div>
            <div>
              • <strong>Progression:</strong> Em - Am - C - D - Em - B7 - Am -
              Em
            </div>
            <div>
              • <strong>Transitions:</strong> Risers, builds, drops, filter
              sweeps
            </div>
            <div>
              • <strong>Structure:</strong> Verse-chorus with call-and-response
            </div>
            <div>
              • <strong>Atmosphere:</strong> Cohesive narrative through music
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-mono text-lg font-bold border-2 border-green-500 transition-colors"
          >
            APPLY & CLOSE
          </button>
        </div>

        {/* Browser Compatibility Note */}
        <div className="mt-6 p-3 bg-yellow-900 border border-yellow-700">
          <p className="text-yellow-400 text-lg font-medium text-center">
            Note: Audio requires user interaction to start due to browser
            policies
          </p>
        </div>
      </div>
    </div>
  );
}
