import {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { GameEngine } from "@/game/core/GameEngine";
import { GameState } from "@/game/core/GameStateManager";
import { AudioSystem } from "@/game/systems/AudioSystem";
import PauseOverlay from "./PauseOverlay";

interface GameEngineProps {
  onGameStateChange?: (state: GameState) => void;
  onExitToMenu?: () => void;
  sharedAudioSystem?: AudioSystem | null;
}

export interface GameEngineRef {
  getAudioSystem: () => AudioSystem | null;
}

const GameEngineComponent = forwardRef<GameEngineRef, GameEngineProps>(
  ({ onGameStateChange, onExitToMenu, sharedAudioSystem }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const gameEngineRef = useRef<GameEngine | null>(null);
    const [gameState, setGameState] = useState<
      "playing" | "paused" | "victory" | "defeat"
    >("playing");
    const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });

    // Expose the audio system through the ref
    useImperativeHandle(ref, () => ({
      getAudioSystem: () => {
        return sharedAudioSystem || null;
      },
    }));

    // Calculate responsive canvas size - use full available space
    const updateCanvasSize = useCallback(() => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      // Use full available space with minimal padding
      const availableWidth = rect.width - 4; // Minimal padding
      const availableHeight = rect.height - 4; // Minimal padding

      // Use full available space without strict minimums
      let newWidth = Math.floor(availableWidth);
      let newHeight = Math.floor(availableHeight);

      // Only apply minimum constraints if the available space is reasonable
      const minWidth = 640; // More reasonable minimum
      const minHeight = 480; // More reasonable minimum

      // If available space is very small, apply minimums
      if (availableWidth < 640 || availableHeight < 480) {
        const aspectRatio = 4 / 3; // Classic aspect ratio
        if (newWidth / newHeight > aspectRatio) {
          newWidth = newHeight * aspectRatio;
        } else {
          newHeight = newWidth / aspectRatio;
        }
        newWidth = Math.max(minWidth, newWidth);
        newHeight = Math.max(minHeight, newHeight);
      }

      // Ensure even numbers for better rendering
      newWidth = newWidth % 2 === 0 ? newWidth : newWidth - 1;
      newHeight = newHeight % 2 === 0 ? newHeight : newHeight - 1;

      console.log("Canvas size update:", {
        newWidth,
        newHeight,
        availableWidth,
        availableHeight,
        containerWidth: rect.width,
        containerHeight: rect.height,
        timestamp: Date.now(),
      });

      setCanvasSize({ width: newWidth, height: newHeight });

      // Update game engine canvas size
      if (gameEngineRef.current) {
        gameEngineRef.current.resize(newWidth, newHeight);
      }
    }, []);

    // Handle window resize
    useEffect(() => {
      updateCanvasSize();

      const handleResize = () => {
        updateCanvasSize();
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [updateCanvasSize]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !sharedAudioSystem) return;

      // Set initial canvas size
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;

      // Initialize game engine with shared audio system
      const gameEngine = new GameEngine(canvas, sharedAudioSystem);
      gameEngineRef.current = gameEngine;

      // Subscribe to game state changes
      const unsubscribe = gameEngine.subscribeToGameState((state) => {
        setGameState(state.gameStatus);
        onGameStateChange?.(state);
      });

      // Start the game
      gameEngine.start();

      return () => {
        unsubscribe();
        gameEngine.cleanup();
        gameEngineRef.current = null;
      };
    }, [onGameStateChange, canvasSize, sharedAudioSystem]);

    const handleRestart = () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.reset();
        gameEngineRef.current.start();
      }
    };

    const handleNextLevel = () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.progressToNextLevel();
        gameEngineRef.current.start();
      }
    };

    const handleResume = () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.resume();
      }
    };

    // const handlePause = () => {
    //   if (gameEngineRef.current) {
    //     gameEngineRef.current.pause();
    //   }
    // };

    const handleExitToMenu = () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
      }
      onExitToMenu?.();
    };

    const playMenuSound = () => {
      if (sharedAudioSystem) {
        try {
          sharedAudioSystem.playSound("menu_click", 0.8);
        } catch (error) {
          console.warn("Failed to play menu sound:", error);
        }
      }
    };

    return (
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center canvas-container"
        style={{ padding: "2px", minWidth: 0, minHeight: 0, flexShrink: 0 }}
      >
        <div
          className="relative w-full h-full"
          style={{ minHeight: 0, minWidth: 0 }}
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="border border-gray-800 cursor-crosshair"
            style={{
              imageRendering: "pixelated",
              display: "block",
              flexShrink: 0,
            }}
          />

          {/* Pause Overlay */}
          {gameState === "paused" && (
            <PauseOverlay
              onResume={handleResume}
              onRestart={handleRestart}
              onExit={handleExitToMenu}
            />
          )}

          {/* Victory Overlay */}
          {gameState === "victory" && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="text-center text-green-400 max-w-md p-8">
                <h2 className="text-5xl font-bold mb-6 font-mono tracking-wider">
                  VICTORY!
                </h2>
                <p className="text-2xl mb-6 font-medium">
                  Level cleared! All enemies defeated!
                </p>
                <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded">
                  <p className="text-lg text-green-300 font-medium">
                    🎵 The E minor symphony of destruction has concluded! 🎵
                  </p>
                </div>
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      playMenuSound();
                      handleNextLevel();
                    }}
                    className="block mx-auto px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-mono font-bold border-2 border-green-500 transition-colors text-xl retro-button"
                  >
                    NEXT LEVEL
                  </button>
                  <button
                    onClick={() => {
                      playMenuSound();
                      handleRestart();
                    }}
                    className="block mx-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-mono font-medium border-2 border-blue-500 transition-colors text-lg retro-button"
                  >
                    REPLAY LEVEL
                  </button>
                  <button
                    onClick={() => {
                      playMenuSound();
                      handleExitToMenu();
                    }}
                    className="block mx-auto px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-mono font-medium border-2 border-gray-500 transition-colors text-lg retro-button"
                  >
                    MAIN MENU
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Defeat Overlay */}
          {gameState === "defeat" && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="text-center text-red-400 max-w-md p-8">
                <h2 className="text-5xl font-bold mb-6 font-mono tracking-wider">
                  GAME OVER
                </h2>
                <p className="text-2xl mb-6 font-medium">
                  You have been defeated!
                </p>
                <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded">
                  <p className="text-lg text-red-300 font-medium">
                    🎵 The tritones have claimed another soul... 🎵
                  </p>
                </div>
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      playMenuSound();
                      handleRestart();
                    }}
                    className="block mx-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-mono font-bold border-2 border-red-500 transition-colors text-xl retro-button"
                  >
                    TRY AGAIN
                  </button>
                  <button
                    onClick={() => {
                      playMenuSound();
                      handleExitToMenu();
                    }}
                    className="block mx-auto px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white font-mono font-medium border-2 border-gray-500 transition-colors text-xl retro-button"
                  >
                    MAIN MENU
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

GameEngineComponent.displayName = "GameEngine";

export default GameEngineComponent;
