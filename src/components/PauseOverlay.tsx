// import React from 'react';

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export default function PauseOverlay({
  onResume,
  onRestart,
  onExit,
}: PauseOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center space-y-6 max-w-md p-8">
        {/* Pause Title */}
        <div className="space-y-2">
          <h2 className="text-5xl font-mono text-yellow-400 font-bold tracking-wider">
            PAUSED
          </h2>
          <div className="w-32 h-1 bg-yellow-400 mx-auto"></div>
        </div>

        {/* Game paused message */}
        <p className="text-lg text-gray-300 font-medium">
          Game is paused. Choose an option below.
        </p>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-mono text-lg font-bold border-2 border-green-500 transition-colors"
          >
            RESUME GAME
          </button>

          <button
            onClick={onRestart}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-mono text-lg font-medium border-2 border-blue-500 transition-colors"
          >
            RESTART LEVEL
          </button>

          <button
            onClick={onExit}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-mono text-lg font-medium border-2 border-red-500 transition-colors"
          >
            EXIT TO MENU
          </button>
        </div>

        {/* Controls reminder */}
        <div className="mt-8 p-4 bg-gray-900 border border-gray-700 rounded">
          <h3 className="text-lg font-mono text-green-400 mb-3 font-bold">
            CONTROLS
          </h3>
          <div className="space-y-2 text-lg text-gray-300">
            <div className="flex justify-between">
              <span className="font-medium">ESC</span>
              <span>Pause/Resume</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">WASD</span>
              <span>Move</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Mouse</span>
              <span>Look around</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Left Click</span>
              <span>Fire weapon</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">1/2/3</span>
              <span>Switch weapons</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">🔊</span>
              <span>E♭ Minor + Tritones</span>
            </div>
          </div>
        </div>

        {/* Resume hint */}
        <div className="text-lg text-yellow-400 font-medium">
          Press ESC to resume quickly
        </div>
      </div>
    </div>
  );
}
