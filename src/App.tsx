import React, { useState, useCallback, useRef } from "react";
import GameEngine from "@/components/GameEngine";
import AudioSettings from "@/components/AudioSettings";

import HUD from "@/components/HUD";
import Minimap from "@/components/Minimap";
import { GameState } from "@/game/core/GameStateManager";
import { AudioSystem } from "@/game/systems/AudioSystem";

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  const [currentGameState, setCurrentGameState] = useState<GameState | null>(
    null
  );
  const gameEngineRef = useRef<any>(null);
  const audioSystemRef = useRef<AudioSystem | null>(null);

  // Initialize shared audio system
  React.useEffect(() => {
    if (!audioSystemRef.current) {
      audioSystemRef.current = new AudioSystem();
    }

    return () => {
      if (audioSystemRef.current) {
        audioSystemRef.current.cleanup();
        audioSystemRef.current = null;
      }
    };
  }, []);

  const handleGameStateChange = useCallback((state: GameState) => {
    setCurrentGameState(state);
  }, []);

  const playMenuSound = () => {
    if (audioSystemRef.current) {
      try {
        audioSystemRef.current.playSound("menu_click", 0.8);
      } catch (error) {
        console.warn("Failed to play menu click sound:", error);
      }
    }
  };

  const startGame = () => {
    playMenuSound();
    setGameStarted(true);
  };

  const returnToMenu = () => {
    playMenuSound();
    setGameStarted(false);
    setCurrentGameState(null);
  };

  const handleMenuClick = (action: () => void) => {
    playMenuSound();
    action();
  };

  const getAudioSystem = (): AudioSystem | null => {
    return audioSystemRef.current;
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center game-container">
        <div className="text-center space-y-8 p-4">
          <div className="space-y-4">
            <h1 className="text-6xl font-mono text-red-500 tracking-wider font-bold">
              DOOM
            </h1>
            <p className="text-2xl text-gray-400 font-medium">
              Browser Edition
            </p>
            <p className="text-xl text-green-400 font-medium">
              🎵 AGGRESSIVE TECHNO SOUNDTRACK @ 128 BPM! 🎵
            </p>
            <p className="text-lg text-purple-400 font-medium">
              ⚡ Heavy Syncopation • Acid Bass • Industrial Elements ⚡
            </p>
            <p className="text-lg text-blue-400 font-medium">
              🔊 Enhanced Audio System • Prominent Music
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={startGame}
              className="block mx-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-mono text-2xl font-bold border-2 border-red-500 transition-colors retro-button"
            >
              START GAME
            </button>

            <button
              onClick={() =>
                handleMenuClick(() => setShowInstructions(!showInstructions))
              }
              className="block mx-auto px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-mono text-xl font-medium border-2 border-gray-600 transition-colors retro-button"
            >
              INSTRUCTIONS
            </button>

            <button
              onClick={() => handleMenuClick(() => setShowAudioSettings(true))}
              className="block mx-auto px-8 py-4 bg-yellow-600 hover:bg-yellow-700 text-white font-mono text-xl font-medium border-2 border-yellow-500 transition-colors retro-button"
            >
              🔊 AUDIO SETTINGS
            </button>
          </div>

          {showInstructions && (
            <div className="mt-8 p-6 bg-gray-900 border border-gray-700 text-left max-w-4xl">
              <h3 className="text-2xl font-mono text-green-400 mb-4 font-bold">
                MISSION BRIEFING
              </h3>
              <div className="space-y-3 text-lg">
                <p className="font-medium">
                  <strong>OBJECTIVE:</strong> Eliminate all hostile entities in
                  the facility
                </p>
                <p className="font-medium">
                  <strong>MOVEMENT:</strong> WASD or Arrow Keys
                </p>
                <p className="font-medium">
                  <strong>LOOK:</strong> Mouse movement (click canvas to lock
                  cursor)
                </p>
                <p className="font-medium">
                  <strong>FIRE:</strong> Left mouse click (when cursor is
                  locked)
                </p>
                <p className="font-medium">
                  <strong>WEAPON SWITCHING:</strong> Number keys 1, 2, 3
                </p>
                <p className="font-medium">
                  <strong>PAUSE:</strong> ESC key
                </p>
                <p className="font-medium">
                  <strong>HEALTH:</strong> Avoid enemy attacks to stay alive
                </p>
                <p className="font-medium">
                  <strong>AMMO:</strong> Limited ammunition - make every shot
                  count
                </p>
                <p className="font-medium">
                  <strong>PICKUPS:</strong> Enemies drop health, ammo, and
                  weapons when defeated
                </p>
                <p className="font-medium">
                  <strong>ENEMIES:</strong> Grunts (G), Soldiers (S), and
                  Captains (C) with varying difficulty
                </p>
                <p className="font-medium">
                  <strong>WEAPONS:</strong> Start with pistol, find shotgun and
                  chaingun upgrades
                </p>
              </div>
              <div className="mt-4 p-4 bg-red-900 border border-red-700">
                <p className="text-red-400 text-lg font-medium">
                  <strong>WARNING:</strong> Enemies will hunt you down. Captains
                  are extremely dangerous!
                </p>
              </div>
              <div className="mt-4 p-4 bg-blue-900 border border-blue-700">
                <p className="text-blue-400 text-lg font-medium">
                  <strong>TIP:</strong> Each weapon has different damage, range,
                  and attack speed. Use the right tool for the job!
                </p>
              </div>
              <div className="mt-4 p-4 bg-yellow-900 border border-yellow-700">
                <p className="text-yellow-400 text-lg font-medium">
                  <strong>NEW:</strong> Switch weapons with number keys 1, 2, 3.
                  Responsive canvas adapts to your screen!
                </p>
              </div>
              <div className="mt-4 p-4 bg-green-900 border border-green-700">
                <p className="text-green-400 text-lg font-medium">
                  <strong>AUDIO:</strong> Experience authentic 16-bit sound
                  effects and dynamic ambient music. Adjust settings in Audio
                  Settings menu!
                </p>
              </div>
              <div className="mt-4 p-4 bg-purple-900 border border-purple-700">
                <p className="text-purple-400 text-lg font-medium">
                  <strong>ENHANCED MUSIC:</strong> Features a complex techno
                  soundtrack in E minor at 128 BPM with syncopated rhythms,
                  arpeggiated leads, and authentic tritone "devil's intervals"!
                </p>
              </div>
              <div className="mt-4 p-4 bg-indigo-900 border border-indigo-700">
                <p className="text-indigo-400 text-lg font-medium">
                  <strong>SONG STRUCTURE:</strong> Intro → Verse → Chorus →
                  Verse → Chorus → Breakdown → Outro with seamless looping and
                  dynamic layering!
                </p>
              </div>
              <div className="mt-4 p-4 bg-cyan-900 border border-cyan-700">
                <p className="text-cyan-400 text-lg font-medium">
                  <strong>MUSIC BUILDER:</strong> Create your own custom E minor
                  compositions with the built-in music builder! Compose,
                  preview, and use in-game!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Audio Settings Modal */}
        {showAudioSettings && (
          <AudioSettings
            audioSystem={getAudioSystem()}
            onClose={() => handleMenuClick(() => setShowAudioSettings(false))}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col game-container overflow-hidden">
      {/* Game Title Bar */}
      <div className="bg-gray-900 text-white p-2 border-b border-gray-700 shrink-0">
        <div className="flex justify-between items-center">
          <h1 className="font-mono text-xl text-red-400 font-bold">
            DOOM - Browser Edition 🎵 Techno E♭♯♭ @ 128 BPM
            {currentGameState && (
              <span className="text-blue-400 ml-4">
                Floor {currentGameState.currentFloor}
                {currentGameState.isBossFloor && (
                  <span className="text-red-400 ml-2">BOSS FLOOR</span>
                )}
              </span>
            )}
          </h1>
          <div className="flex items-center space-x-6">
            {/* Pause indicator */}
            {currentGameState?.isPaused && (
              <div className="flex items-center space-x-2 text-yellow-400">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-lg font-medium">PAUSED</span>
              </div>
            )}

            {/* Current weapon display */}
            {currentGameState && (
              <div className="flex items-center space-x-2">
                <span className="text-lg text-gray-400 font-medium">
                  WEAPON:
                </span>
                <span
                  className={`text-lg font-bold ${
                    currentGameState.player.weapon === "pistol"
                      ? "text-yellow-400"
                      : currentGameState.player.weapon === "shotgun"
                      ? "text-orange-400"
                      : "text-red-400"
                  }`}
                >
                  {currentGameState.player.weapon.toUpperCase()}
                </span>
                {currentGameState.player.isAttacking && (
                  <span className="text-red-500 text-lg animate-pulse">●</span>
                )}
              </div>
            )}

            {/* Available weapons display */}
            {currentGameState && (
              <div className="flex items-center space-x-2">
                <span className="text-lg text-gray-400 font-medium">
                  AVAILABLE:
                </span>
                <div className="flex space-x-1">
                  {Array.from(currentGameState.player.availableWeapons).map(
                    (weapon) => (
                      <span
                        key={weapon}
                        className={`text-lg font-mono font-bold px-2 py-1 border ${
                          weapon === currentGameState.player.weapon
                            ? "bg-gray-600 border-gray-400 text-white"
                            : "border-gray-600 text-gray-400"
                        }`}
                      >
                        {weapon === "pistol"
                          ? "1"
                          : weapon === "shotgun"
                          ? "2"
                          : "3"}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Enemy count display */}
            {currentGameState && (
              <div className="flex items-center space-x-2 text-red-400">
                <span className="text-lg font-medium">
                  ENEMIES: {currentGameState.enemies.length}
                </span>
              </div>
            )}

            {/* Pickup count display */}
            {currentGameState && currentGameState.pickups.length > 0 && (
              <div className="flex items-center space-x-2 text-green-400">
                <span className="text-lg font-medium">
                  ITEMS: {currentGameState.pickups.length}
                </span>
              </div>
            )}

            {/* Audio Settings Button */}
            <button
              onClick={() => {
                playMenuSound();
                setShowAudioSettings(true);
              }}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-lg font-medium border border-yellow-500 transition-colors retro-button"
            >
              🔊
            </button>

            <button
              onClick={returnToMenu}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-lg font-medium border border-gray-600 transition-colors retro-button"
            >
              MAIN MENU
            </button>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 relative w-full h-full" style={{ minHeight: 0 }}>
          <GameEngine
            ref={gameEngineRef}
            onGameStateChange={handleGameStateChange}
            onExitToMenu={returnToMenu}
            sharedAudioSystem={audioSystemRef.current}
          />

          {/* Minimap overlay - hide when paused */}
          {currentGameState && !currentGameState.isPaused && (
            <Minimap
              playerX={currentGameState.player.x}
              playerY={currentGameState.player.y}
              playerAngle={currentGameState.player.angle}
              enemies={currentGameState.enemies}
              pickups={currentGameState.pickups}
              worldMap={currentGameState.worldMap}
            />
          )}

          {/* Instructions overlay - hide when paused */}
          {!currentGameState?.isPaused && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-4 text-lg border border-gray-600">
              <div className="space-y-2">
                <div className="font-medium">WASD: Move</div>
                <div className="font-medium">Mouse: Look</div>
                <div className="font-medium">Click: Fire</div>
                <div className="font-medium">1/2/3: Switch Weapon</div>
                <div className="font-medium">ESC: Pause</div>
                <div className="font-medium">Objective: Kill all enemies</div>
                <div className="font-medium text-green-400">
                  Walk near items to collect
                </div>
                <div className="font-medium text-purple-400">
                  🎵 Techno E♭ + Syncopation
                </div>
                <div className="font-medium text-cyan-400">
                  🎹 V-C-V-C-B Structure
                </div>
                <div className="font-medium text-yellow-400">
                  {currentGameState?.player.weapon
                    ? `Weapon: ${currentGameState.player.weapon.toUpperCase()}`
                    : ""}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* HUD - show during gameplay, even when paused */}
        {currentGameState && (
          <div
            className="shrink-0 bg-gray-800 border-t-2 border-gray-600"
            style={{
              height: "200px",
              zIndex: 10,
              position: "relative",
              flexShrink: 0,
            }}
          >
            <HUD
              health={currentGameState.player.health}
              maxHealth={currentGameState.player.maxHealth}
              ammo={currentGameState.player.ammo}
              maxAmmo={currentGameState.player.maxAmmo}
              weapon={currentGameState.player.weapon}
              isAttacking={currentGameState.player.isAttacking}
            />
          </div>
        )}
      </div>

      {/* Audio Settings Modal */}
      {showAudioSettings && (
        <AudioSettings
          audioSystem={getAudioSystem()}
          onClose={() => handleMenuClick(() => setShowAudioSettings(false))}
        />
      )}
    </div>
  );
}
