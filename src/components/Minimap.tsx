// import React from 'react';
import { useState, useEffect, useRef } from "react";

interface MinimapProps {
  playerX: number;
  playerY: number;
  playerAngle: number;
  enemies: Array<{ x: number; y: number; state: string }>;
  pickups?: Array<{ x: number; y: number; type: string }>;
  worldMap: number[][];
}

// FOV constants matching the rendering system
const FOV = Math.PI / 3; // 60 degrees
const FOV_RANGE = 16; // How far the player can see walls
const ENEMY_DETECTION_RANGE = 12; // Range to detect enemies with dim dots

interface DiscoveredCell {
  discovered: boolean;
  lastSeen: number;
}

export default function Minimap({
  playerX,
  playerY,
  playerAngle,
  enemies,
  pickups = [],
  worldMap,
}: MinimapProps) {
  const mapSize = 200;
  const scale = mapSize / worldMap.length;

  // Track discovered map areas
  const [discoveredMap, setDiscoveredMap] = useState<DiscoveredCell[][]>(() => {
    if (!worldMap || worldMap.length === 0 || !worldMap[0]) {
      return [];
    }
    return Array(worldMap.length)
      .fill(null)
      .map(() =>
        Array(worldMap[0].length)
          .fill(null)
          .map(() => ({
            discovered: false,
            lastSeen: 0,
          }))
      );
  });

  // Update discovered map when world map dimensions change
  useEffect(() => {
    if (!worldMap || worldMap.length === 0 || !worldMap[0]) {
      setDiscoveredMap([]);
      return;
    }

    // Check if discovered map needs to be resized
    const needsResize = 
      discoveredMap.length !== worldMap.length ||
      (discoveredMap.length > 0 && discoveredMap[0].length !== worldMap[0].length);

    if (needsResize) {
      const newDiscoveredMap = Array(worldMap.length)
        .fill(null)
        .map((_, y) =>
          Array(worldMap[0].length)
            .fill(null)
            .map((_, x) => {
              // Preserve existing discovered state if within bounds
              if (
                discoveredMap[y] &&
                discoveredMap[y][x] !== undefined
              ) {
                return discoveredMap[y][x];
              }
              return {
                discovered: false,
                lastSeen: 0,
              };
            })
        );
      setDiscoveredMap(newDiscoveredMap);
    }
  }, [worldMap]);

  // Update discovered areas based on player's field of view
  useEffect(() => {
    const updateDiscoveredAreas = () => {
      if (!discoveredMap || discoveredMap.length === 0) {
        return;
      }
      
      // Ensure discovered map matches world map dimensions
      if (
        discoveredMap.length !== worldMap.length ||
        (discoveredMap.length > 0 && discoveredMap[0].length !== worldMap[0].length)
      ) {
        return; // Skip update if dimensions don't match, useEffect above will fix it
      }
      
      const newDiscoveredMap = discoveredMap.map((row) => [...row]);
      const currentTime = Date.now();

      // Cast rays in the player's field of view to discover walls
      const numRays = 60; // Fewer rays for minimap
      const startAngle = playerAngle - FOV / 2;
      const angleStep = FOV / numRays;

      for (let i = 0; i < numRays; i++) {
        const rayAngle = startAngle + i * angleStep;
        const rayDirX = Math.cos(rayAngle);
        const rayDirY = Math.sin(rayAngle);

        // Cast ray and discover cells along the path
        let currentX = playerX;
        let currentY = playerY;
        let distance = 0;

        while (distance < FOV_RANGE) {
          const mapX = Math.floor(currentX);
          const mapY = Math.floor(currentY);

          // Check bounds
          if (
            mapX >= 0 &&
            mapX < worldMap[0].length &&
            mapY >= 0 &&
            mapY < worldMap.length &&
            newDiscoveredMap[mapY] &&
            newDiscoveredMap[mapY][mapX] !== undefined
          ) {
            // Mark this cell as discovered
            newDiscoveredMap[mapY][mapX] = {
              discovered: true,
              lastSeen: currentTime,
            };

            // If we hit a wall, stop the ray
            if (worldMap[mapY][mapX] > 0) {
              break;
            }
          } else {
            break;
          }

          // Step forward along the ray
          currentX += rayDirX * 0.1;
          currentY += rayDirY * 0.1;
          distance += 0.1;
        }
      }

      // Also discover a small area immediately around the player
      const playerMapX = Math.floor(playerX);
      const playerMapY = Math.floor(playerY);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const mapX = playerMapX + dx;
          const mapY = playerMapY + dy;
          if (
            mapX >= 0 &&
            mapX < worldMap[0].length &&
            mapY >= 0 &&
            mapY < worldMap.length &&
            newDiscoveredMap[mapY] &&
            newDiscoveredMap[mapY][mapX] !== undefined
          ) {
            newDiscoveredMap[mapY][mapX] = {
              discovered: true,
              lastSeen: currentTime,
            };
          }
        }
      }

      setDiscoveredMap(newDiscoveredMap);
    };

    updateDiscoveredAreas();
  }, [playerX, playerY, playerAngle, worldMap]);

  // Check if an enemy is in the player's field of view
  const isEnemyInFOV = (enemyX: number, enemyY: number): boolean => {
    const dx = enemyX - playerX;
    const dy = enemyY - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > FOV_RANGE) return false;

    const angleToEnemy = Math.atan2(dy, dx);
    let angleDiff = angleToEnemy - playerAngle;

    // Normalize angle difference to [-π, π]
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    return Math.abs(angleDiff) <= FOV / 2;
  };

  // Check if an enemy is in detection range but not in FOV
  const isEnemyNearby = (enemyX: number, enemyY: number): boolean => {
    const dx = enemyX - playerX;
    const dy = enemyY - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= ENEMY_DETECTION_RANGE && !isEnemyInFOV(enemyX, enemyY);
  };

  return (
    <div className="absolute top-4 right-4 bg-black bg-opacity-90 border border-gray-600 p-2">
      <div className="text-green-400 text-xs mb-2 text-center font-medium tracking-wider">
        AUTOMAP
      </div>
      <svg width={mapSize} height={mapSize} className="border border-gray-500">
        {/* Draw discovered walls only */}
        {worldMap.map((row, y) =>
          row.map((cell, x) => {
            const isDiscovered = discoveredMap[y]?.[x]?.discovered;

            if (cell > 0 && isDiscovered) {
              // Calculate age of discovery for visual effects
              const timeSinceDiscovered =
                Date.now() - (discoveredMap[y][x]?.lastSeen || 0);
              const opacity = Math.max(0.3, 1 - timeSinceDiscovered / 30000); // Fade over 30 seconds

              return (
                <rect
                  key={`${x}-${y}`}
                  x={x * scale}
                  y={y * scale}
                  width={scale}
                  height={scale}
                  fill="#8B4513"
                  stroke="#654321"
                  strokeWidth="0.5"
                  opacity={opacity}
                />
              );
            }
            return null;
          })
        )}

        {/* Draw fog of war overlay for undiscovered areas */}
        {worldMap.map((row, y) =>
          row.map((cell, x) => {
            const isDiscovered = discoveredMap[y]?.[x]?.discovered;

            if (!isDiscovered) {
              return (
                <rect
                  key={`fog-${x}-${y}`}
                  x={x * scale}
                  y={y * scale}
                  width={scale}
                  height={scale}
                  fill="#000000"
                  opacity={0.8}
                />
              );
            }
            return null;
          })
        )}

        {/* Draw discovered pickups only */}
        {pickups
          .filter((pickup) => {
            const mapX = Math.floor(pickup.x);
            const mapY = Math.floor(pickup.y);
            return discoveredMap[mapY]?.[mapX]?.discovered;
          })
          .map((pickup, index) => (
            <g key={`pickup-${index}`}>
              <circle
                cx={pickup.x * scale}
                cy={pickup.y * scale}
                r={2}
                fill={pickup.type === "health" ? "#FF4444" : "#4488FF"}
                stroke="#FFFFFF"
                strokeWidth="0.5"
              />
              {/* Pickup type indicator */}
              <text
                x={pickup.x * scale}
                y={pickup.y * scale + 1}
                fill="#FFFFFF"
                fontSize="6"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {pickup.type === "health" ? "+" : "A"}
              </text>
            </g>
          ))}

        {/* Draw enemies with different visibility levels */}
        {enemies.map((enemy, index) => {
          const inFOV = isEnemyInFOV(enemy.x, enemy.y);
          const nearby = isEnemyNearby(enemy.x, enemy.y);

          if (inFOV) {
            // Full visibility for enemies in FOV
            return (
              <circle
                key={`enemy-${index}`}
                cx={enemy.x * scale}
                cy={enemy.y * scale}
                r={3}
                fill={enemy.state === "attacking" ? "#FF4444" : "#FF8888"}
                stroke="#FFFFFF"
                strokeWidth="1"
              />
            );
          } else if (nearby) {
            // Dim dots for nearby enemies outside FOV
            return (
              <circle
                key={`enemy-dim-${index}`}
                cx={enemy.x * scale}
                cy={enemy.y * scale}
                r={1.5}
                fill="#FF4444"
                stroke="#FF8888"
                strokeWidth="0.5"
                opacity={0.3}
              />
            );
          }

          return null;
        })}

        {/* Draw player */}
        <g>
          {/* Player position */}
          <circle
            cx={playerX * scale}
            cy={playerY * scale}
            r={4}
            fill="#00FF00"
            stroke="#FFFFFF"
            strokeWidth="1"
          />

          {/* Player direction indicator */}
          <line
            x1={playerX * scale}
            y1={playerY * scale}
            x2={playerX * scale + Math.cos(playerAngle) * 8}
            y2={playerY * scale + Math.sin(playerAngle) * 8}
            stroke="#00FF00"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Field of view indicator */}
          <g opacity={0.6}>
            <path
              d={`
                M ${playerX * scale} ${playerY * scale}
                L ${
                  playerX * scale +
                  Math.cos(playerAngle - FOV / 2) * FOV_RANGE * scale
                } ${
                playerY * scale +
                Math.sin(playerAngle - FOV / 2) * FOV_RANGE * scale
              }
                A ${FOV_RANGE * scale} ${FOV_RANGE * scale} 0 0 1 ${
                playerX * scale +
                Math.cos(playerAngle + FOV / 2) * FOV_RANGE * scale
              } ${
                playerY * scale +
                Math.sin(playerAngle + FOV / 2) * FOV_RANGE * scale
              }
                Z
              `}
              fill="#00FF00"
              opacity={0.1}
              stroke="#00FF00"
              strokeWidth="0.5"
            />
          </g>
        </g>
      </svg>

      {/* Status information */}
      <div className="text-xs text-gray-400 mt-1 text-center">
        <div>FOV: {Math.round((FOV * 180) / Math.PI)}°</div>
        <div>Range: {FOV_RANGE}m</div>
      </div>
    </div>
  );
}
