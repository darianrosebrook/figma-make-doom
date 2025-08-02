export interface Player {
  x: number;
  y: number;
  angle: number;
  health: number;
  ammo: {
    pistol: number;
    shotgun: number;
    chaingun: number;
  };
  maxHealth: number;
  maxAmmo: {
    pistol: number;
    shotgun: number;
    chaingun: number;
  };
  weapon: "pistol" | "shotgun" | "chaingun";
  availableWeapons: Set<"pistol" | "shotgun" | "chaingun">;
  isAttacking: boolean;
  attackTimer: number;
  muzzleFlash: boolean;
  muzzleFlashTimer: number;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  state: "idle" | "patrolling" | "chasing" | "attacking" | "spawning";
  lastPlayerX: number;
  lastPlayerY: number;
  attackCooldown: number;
  patrolTarget: { x: number; y: number } | null;
  enemyType:
    | "grunt"
    | "soldier"
    | "captain"
    | "boss_demon"
    | "boss_cyberdemon"
    | "boss_spider_mastermind";
  explorationCooldown: number; // New: cooldown for exploration moves
  explorationDirection: { dx: number; dy: number } | null; // New: current exploration direction
  isBoss: boolean;
  spawnCooldown: number; // For boss enemy spawning
  spawnsRemaining: number; // How many minions this boss can spawn
  phaseTransitions: number[]; // Health thresholds for boss phase changes
  currentPhase: number;
  isHurt: boolean; // Whether enemy is currently showing hurt flash
  hurtTimer: number; // Frames remaining for hurt flash effect
}

export interface Pickup {
  id: number;
  x: number;
  y: number;
  type: "health" | "ammo" | "weapon";
  value: number;
  spawnTime: number;
  animationOffset: number;
  weaponType?: "shotgun" | "chaingun";
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  pickups: Pickup[];
  gameStatus: "playing" | "paused" | "victory" | "defeat";
  worldMap: number[][];
  lastUpdateTime: number;
  accumulator: number;
  isPaused: boolean;
  nextPickupId: number;
  nextEnemyId: number;
  worldSize: number;
  currentFloor: number;
  floorTheme: string;
  isBossFloor: boolean;
  bossDefeated: boolean;
}

export class GameStateManager {
  private state: GameState;
  private listeners: Array<(state: GameState) => void> = [];
  private readonly FIXED_TIMESTEP = 1000 / 60; // 60 FPS in milliseconds

  // Weapon statistics including range - REDUCED DAMAGE BY HALF
  private readonly WEAPON_STATS = {
    pistol: {
      damage: 12, // Reduced from 25
      ammoUse: 1,
      attackDuration: 15,
      muzzleDuration: 8,
      range: 15, // Medium range
      accuracy: 0.2, // Hit tolerance in radians
    },
    shotgun: {
      damage: 22, // Reduced from 45
      ammoUse: 1,
      attackDuration: 25,
      muzzleDuration: 12,
      range: 8, // Close range
      accuracy: 0.3, // More generous hit area
    },
    chaingun: {
      damage: 7, // Reduced from 15
      ammoUse: 1,
      attackDuration: 8,
      muzzleDuration: 5,
      range: 12, // Medium range
      accuracy: 0.2, // Standard accuracy
    },
  };

  constructor() {
    this.state = this.createInitialState();
  }

  private generateWorldMap(size: number): number[][] {
    const map: number[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(0));

    // Fill borders with walls
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (x === 0 || x === size - 1 || y === 0 || y === size - 1) {
          map[y][x] = 1;
        }
      }
    }

    // Generate rooms and structures
    this.generateRooms(map, size);
    this.generateMaze(map, size);
    this.generatePillars(map, size);
    this.generateSpecialRooms(map, size);

    // Ensure map connectivity
    this.ensureMapConnectivity(map, size);

    return map;
  }

  private generateRooms(map: number[][], size: number): void {
    // Create themed zones for better organization
    const zones = this.createThemedZones(size);
    const rooms: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      wallType: number;
      theme: string;
    }> = [];

    // Generate more rooms with better size distribution
    const roomCount = 15 + Math.floor(Math.random() * 10); // 15-24 rooms for better coverage
    const attempts = roomCount * 10; // More attempts for better placement

    for (
      let attempt = 0;
      attempt < attempts && rooms.length < roomCount;
      attempt++
    ) {
      // Better size distribution: mix of small, medium, and large rooms
      let roomWidth, roomHeight;
      const sizeCategory = Math.random();

      if (sizeCategory < 0.4) {
        // Small rooms (40% chance)
        roomWidth = 3 + Math.floor(Math.random() * 4); // 3-6
        roomHeight = 3 + Math.floor(Math.random() * 4); // 3-6
      } else if (sizeCategory < 0.8) {
        // Medium rooms (40% chance)
        roomWidth = 6 + Math.floor(Math.random() * 6); // 6-11
        roomHeight = 6 + Math.floor(Math.random() * 6); // 6-11
      } else {
        // Large rooms (20% chance)
        roomWidth = 10 + Math.floor(Math.random() * 8); // 10-17
        roomHeight = 10 + Math.floor(Math.random() * 8); // 10-17
      }

      const startX = 2 + Math.floor(Math.random() * (size - roomWidth - 4));
      const startY = 2 + Math.floor(Math.random() * (size - roomHeight - 4));

      // Check for overlaps with existing rooms (with small buffer)
      const hasOverlap = rooms.some((existingRoom) => {
        return !(
          startX + roomWidth + 1 < existingRoom.x ||
          startX > existingRoom.x + existingRoom.width + 1 ||
          startY + roomHeight + 1 < existingRoom.y ||
          startY > existingRoom.y + existingRoom.height + 1
        );
      });

      if (hasOverlap) continue;

      // Determine theme and wall type based on zone
      const zone = this.getZoneAt(
        startX + roomWidth / 2,
        startY + roomHeight / 2,
        zones
      );
      const wallType = this.getThemeWallType(zone.theme, zone.colorIndex);

      const roomInfo = {
        x: startX,
        y: startY,
        width: roomWidth,
        height: roomHeight,
        wallType,
        theme: zone.theme,
      };
      rooms.push(roomInfo);

      // Create room with enhanced structure
      this.createEnhancedRoom(map, roomInfo);
    }

    // Generate better connectivity
    this.generateEnhancedConnectivity(map, rooms, size);
  }

  private generateRoomDoors(
    map: number[][],
    room: {
      x: number;
      y: number;
      width: number;
      height: number;
      wallType: number;
    },
    mapSize: number
  ): void {
    const { x: startX, y: startY, width: roomWidth, height: roomHeight } = room;
    const doorPositions: Array<{ x: number; y: number; side: string }> = [];

    // Define possible door positions for each side
    const possibleDoors = [
      // Top side
      ...Array.from({ length: roomWidth - 2 }, (_, i) => ({
        x: startX + 1 + i,
        y: startY,
        side: "top",
      })),
      // Right side
      ...Array.from({ length: roomHeight - 2 }, (_, i) => ({
        x: startX + roomWidth - 1,
        y: startY + 1 + i,
        side: "right",
      })),
      // Bottom side
      ...Array.from({ length: roomWidth - 2 }, (_, i) => ({
        x: startX + 1 + i,
        y: startY + roomHeight - 1,
        side: "bottom",
      })),
      // Left side
      ...Array.from({ length: roomHeight - 2 }, (_, i) => ({
        x: startX,
        y: startY + 1 + i,
        side: "left",
      })),
    ];

    // Filter out invalid door positions (that would create doors outside map bounds)
    const validDoors = possibleDoors.filter((door) => {
      const { x, y } = door;
      return x > 0 && x < mapSize - 1 && y > 0 && y < mapSize - 1;
    });

    if (validDoors.length === 0) return;

    // Guarantee at least one door
    const guaranteedDoor =
      validDoors[Math.floor(Math.random() * validDoors.length)];
    doorPositions.push(guaranteedDoor);

    // Add additional doors randomly (1-3 total doors per room)
    const additionalDoors = Math.floor(Math.random() * 3); // 0-2 additional doors
    for (
      let i = 0;
      i < additionalDoors && doorPositions.length < validDoors.length;
      i++
    ) {
      const availableDoors = validDoors.filter(
        (door) =>
          !doorPositions.some(
            (existing) => existing.x === door.x && existing.y === door.y
          )
      );

      if (availableDoors.length > 0) {
        const additionalDoor =
          availableDoors[Math.floor(Math.random() * availableDoors.length)];
        doorPositions.push(additionalDoor);
      }
    }

    // Create the doors
    doorPositions.forEach((door) => {
      map[door.y][door.x] = 0;
    });
  }

  /**
   * Create themed zones across the map for visual organization
   */
  private createThemedZones(size: number): Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    theme: string;
    colorIndex: number;
  }> {
    const zones = [];
    const themes = [
      "tech",
      "industrial",
      "energy",
      "warning",
      "danger",
      "alien",
    ];

    // Create 4-6 zones across the map
    const zoneCount = 4 + Math.floor(Math.random() * 3);
    const zonesPerRow = Math.ceil(Math.sqrt(zoneCount));
    const zoneWidth = Math.floor(size / zonesPerRow);
    const zoneHeight = Math.floor(size / zonesPerRow);

    for (let i = 0; i < zoneCount; i++) {
      const row = Math.floor(i / zonesPerRow);
      const col = i % zonesPerRow;
      const theme = themes[Math.floor(Math.random() * themes.length)];

      zones.push({
        x: col * zoneWidth,
        y: row * zoneHeight,
        width: zoneWidth,
        height: zoneHeight,
        theme,
        colorIndex: Math.floor(Math.random() * 4), // 4 colors per theme
      });
    }

    return zones;
  }

  /**
   * Get the zone at a specific coordinate
   */
  private getZoneAt(
    x: number,
    y: number,
    zones: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      theme: string;
      colorIndex: number;
    }>
  ): { theme: string; colorIndex: number } {
    for (const zone of zones) {
      if (
        x >= zone.x &&
        x < zone.x + zone.width &&
        y >= zone.y &&
        y < zone.y + zone.height
      ) {
        return { theme: zone.theme, colorIndex: zone.colorIndex };
      }
    }
    return { theme: "tech", colorIndex: 0 }; // Default
  }

  /**
   * Get wall type based on theme and color index
   */
  private getThemeWallType(theme: string, colorIndex: number): number {
    const themeRanges: Record<string, number[]> = {
      tech: [2, 3, 4, 5], // Blues and grays (2-5)
      industrial: [6, 7, 8, 9], // Metals (6-9)
      energy: [10, 11, 12, 13], // Greens and teals (10-13)
      warning: [14, 15, 16, 17], // Oranges and yellows (14-17)
      danger: [18, 19, 20, 21], // Reds and purples (18-21)
      alien: [22, 23, 24, 25], // Exotic colors (22-25)
    };

    const themeColors = themeRanges[theme];
    if (themeColors && colorIndex >= 0 && colorIndex < themeColors.length) {
      return themeColors[colorIndex];
    }
    return 2; // Default to tech blue
  }

  /**
   * Create enhanced room with internal structure
   */
  private createEnhancedRoom(
    map: number[][],
    room: {
      x: number;
      y: number;
      width: number;
      height: number;
      wallType: number;
      theme: string;
    }
  ): void {
    // Create basic room outline
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (
          x === room.x ||
          x === room.x + room.width - 1 ||
          y === room.y ||
          y === room.y + room.height - 1
        ) {
          map[y][x] = room.wallType;
        } else {
          map[y][x] = 0; // Clear interior
        }
      }
    }

    // Add internal structure for larger rooms
    if (room.width > 8 && room.height > 8) {
      // Add internal pillars or divisions
      const centerX = room.x + Math.floor(room.width / 2);
      const centerY = room.y + Math.floor(room.height / 2);

      // Maybe add a central pillar
      if (Math.random() < 0.3) {
        map[centerY][centerX] = room.wallType;
      }

      // Maybe add internal walls for complex structure
      if (Math.random() < 0.2) {
        for (let x = room.x + 2; x < room.x + room.width - 2; x++) {
          if (Math.random() < 0.6) {
            map[centerY][x] = room.wallType;
          }
        }
        // Add doorways in internal walls
        map[centerY][room.x + Math.floor(room.width / 3)] = 0;
        map[centerY][room.x + Math.floor((2 * room.width) / 3)] = 0;
      }
    }
  }

  /**
   * Generate enhanced connectivity between rooms
   */
  private generateEnhancedConnectivity(
    map: number[][],
    rooms: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      wallType: number;
    }>,
    size: number
  ): void {
    // Create doors for each room
    rooms.forEach((room) => {
      this.generateRoomDoors(map, room, size);
    });

    // Add extra corridors to reduce empty space
    this.generateDenseCorridors(map, size);
  }

  /**
   * Generate dense corridor network to fill empty areas
   */
  private generateDenseCorridors(map: number[][], size: number): void {
    // Create a denser network of corridors
    const corridorCount = 12 + Math.floor(Math.random() * 8); // 12-19 corridors

    for (let i = 0; i < corridorCount; i++) {
      const startX = 2 + Math.floor(Math.random() * (size - 4));
      const startY = 2 + Math.floor(Math.random() * (size - 4));
      const length = 15 + Math.floor(Math.random() * 20); // Longer corridors

      // More varied directions including diagonals
      const direction = Math.floor(Math.random() * 8);
      const directions = [
        { dx: 1, dy: 0 }, // right
        { dx: 0, dy: 1 }, // down
        { dx: -1, dy: 0 }, // left
        { dx: 0, dy: -1 }, // up
        { dx: 1, dy: 1 }, // down-right
        { dx: -1, dy: 1 }, // down-left
        { dx: 1, dy: -1 }, // up-right
        { dx: -1, dy: -1 }, // up-left
      ];

      let x = startX,
        y = startY;
      const dir = directions[direction];

      for (let j = 0; j < length; j++) {
        if (x >= 2 && x < size - 2 && y >= 2 && y < size - 2) {
          // Create wider corridors (3-wide)
          map[y][x] = 0;
          if (x + 1 < size - 1) map[y][x + 1] = 0;
          if (y + 1 < size - 1) map[y + 1][x] = 0;
        }

        x += dir.dx;
        y += dir.dy;

        // Change direction occasionally for more interesting paths
        if (Math.random() < 0.1) {
          const newDir = directions[Math.floor(Math.random() * 8)];
          dir.dx = newDir.dx;
          dir.dy = newDir.dy;
        }

        if (x <= 2 || x >= size - 3 || y <= 2 || y >= size - 3) break;
      }
    }
  }

  private generateMaze(map: number[][], size: number): void {
    // This function is now replaced by generateDenseCorridors in the enhanced system
    // Keep for compatibility but make it more dense
    this.generateDenseCorridors(map, size);
  }

  private generatePillars(map: number[][], size: number): void {
    // Create themed zones for pillar placement
    const zones = this.createThemedZones(size);

    // More pillars for better space utilization
    const pillarCount = 20 + Math.floor(Math.random() * 15); // 20-34 pillars

    for (let i = 0; i < pillarCount; i++) {
      const x = 3 + Math.floor(Math.random() * (size - 6));
      const y = 3 + Math.floor(Math.random() * (size - 6));

      // Get themed pillar type
      const zone = this.getZoneAt(x, y, zones);
      const pillarType = this.getThemeWallType(zone.theme, zone.colorIndex);

      // Don't place pillar if area is already occupied
      if (map[y][x] === 0) {
        // Create pillar clusters for more interesting layouts
        map[y][x] = pillarType;

        // Maybe create a small cluster
        if (Math.random() < 0.3) {
          const clusterOffsets = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
            { dx: 1, dy: 1 },
            { dx: -1, dy: -1 },
            { dx: 1, dy: -1 },
            { dx: -1, dy: 1 },
          ];

          for (let j = 0; j < 2 + Math.floor(Math.random() * 3); j++) {
            const offset =
              clusterOffsets[Math.floor(Math.random() * clusterOffsets.length)];
            const newX = x + offset.dx;
            const newY = y + offset.dy;

            if (
              newX >= 2 &&
              newX < size - 2 &&
              newY >= 2 &&
              newY < size - 2 &&
              map[newY][newX] === 0 &&
              Math.random() < 0.6
            ) {
              map[newY][newX] = pillarType;
            }
          }
        }
      }
    }
  }

  private generateSpecialRooms(map: number[][], size: number): void {
    // Create themed zones for special room placement
    const zones = this.createThemedZones(size);

    // More varied special room patterns
    const specialRoomTemplates = [
      // Cross-shaped room
      {
        pattern: [
          [0, 0, 1, 1, 1, 0, 0],
          [0, 0, 1, 0, 1, 0, 0],
          [1, 1, 1, 0, 1, 1, 1],
          [1, 0, 0, 0, 0, 0, 1],
          [1, 1, 1, 0, 1, 1, 1],
          [0, 0, 1, 0, 1, 0, 0],
          [0, 0, 1, 1, 1, 0, 0],
        ],
      },
      // L-shaped room
      {
        pattern: [
          [1, 1, 1, 1, 1],
          [1, 0, 0, 0, 1],
          [1, 0, 0, 0, 1],
          [1, 0, 0, 0, 0],
          [1, 1, 1, 0, 0],
        ],
      },
      // Circular room
      {
        pattern: [
          [0, 1, 1, 1, 0],
          [1, 0, 0, 0, 1],
          [1, 0, 0, 0, 1],
          [1, 0, 0, 0, 1],
          [0, 1, 1, 1, 0],
        ],
      },
      // H-shaped room
      {
        pattern: [
          [1, 0, 0, 0, 1],
          [1, 0, 0, 0, 1],
          [1, 1, 1, 1, 1],
          [1, 0, 0, 0, 1],
          [1, 0, 0, 0, 1],
        ],
      },
      // Diamond room
      {
        pattern: [
          [0, 0, 1, 0, 0],
          [0, 1, 0, 1, 0],
          [1, 0, 0, 0, 1],
          [0, 1, 0, 1, 0],
          [0, 0, 1, 0, 0],
        ],
      },
      // Complex structure
      {
        pattern: [
          [1, 1, 1, 1, 1, 1, 1],
          [1, 0, 0, 1, 0, 0, 1],
          [1, 0, 0, 1, 0, 0, 1],
          [1, 1, 1, 0, 1, 1, 1],
          [1, 0, 0, 1, 0, 0, 1],
          [1, 0, 0, 1, 0, 0, 1],
          [1, 1, 1, 1, 1, 1, 1],
        ],
      },
    ];

    // Generate more special rooms for better coverage
    const roomCount = 6 + Math.floor(Math.random() * 6); // 6-11 special rooms

    for (let i = 0; i < roomCount; i++) {
      const template =
        specialRoomTemplates[
          Math.floor(Math.random() * specialRoomTemplates.length)
        ];
      const startX =
        3 + Math.floor(Math.random() * (size - template.pattern[0].length - 6));
      const startY =
        3 + Math.floor(Math.random() * (size - template.pattern.length - 6));

      // Get theme for this location
      const centerX = startX + Math.floor(template.pattern[0].length / 2);
      const centerY = startY + Math.floor(template.pattern.length / 2);
      const zone = this.getZoneAt(centerX, centerY, zones);
      const wallType = this.getThemeWallType(zone.theme, zone.colorIndex);

      // Check if there's space for this room (avoid major overlaps)
      let canPlace = true;
      let wallCells = 0;
      let totalCells = 0;

      for (let y = 0; y < template.pattern.length; y++) {
        for (let x = 0; x < template.pattern[y].length; x++) {
          const mapX = startX + x;
          const mapY = startY + y;

          if (mapX >= 0 && mapX < size && mapY >= 0 && mapY < size) {
            totalCells++;
            if (map[mapY][mapX] !== 0) {
              wallCells++;
            }
          }
        }
      }

      // Only place if less than 30% overlap with existing walls
      if (wallCells / totalCells > 0.3) {
        canPlace = false;
      }

      if (canPlace) {
        // Place the special room with themed colors
        for (let y = 0; y < template.pattern.length; y++) {
          for (let x = 0; x < template.pattern[y].length; x++) {
            const mapX = startX + x;
            const mapY = startY + y;

            if (mapX >= 0 && mapX < size && mapY >= 0 && mapY < size) {
              if (template.pattern[y][x] === 1) {
                map[mapY][mapX] = wallType;
              } else if (template.pattern[y][x] === 0) {
                map[mapY][mapX] = 0;
              }
            }
          }
        }

        // Ensure connectivity
        this.ensureSpecialRoomConnectivity(
          map,
          startX,
          startY,
          template.pattern,
          size
        );
      }
    }
  }

  private ensureSpecialRoomConnectivity(
    map: number[][],
    startX: number,
    startY: number,
    pattern: number[][],
    mapSize: number
  ): void {
    // Find perimeter cells of the special room and create at least one opening
    const perimeterCells: Array<{ x: number; y: number }> = [];

    for (let y = 0; y < pattern.length; y++) {
      for (let x = 0; x < pattern[y].length; x++) {
        if (pattern[y][x] > 0) {
          const worldX = startX + x;
          const worldY = startY + y;

          // Check if this is a perimeter wall
          const isPerimeter =
            x === 0 ||
            x === pattern[y].length - 1 ||
            y === 0 ||
            y === pattern.length - 1 ||
            (x > 0 && pattern[y][x - 1] === 0) ||
            (x < pattern[y].length - 1 && pattern[y][x + 1] === 0) ||
            (y > 0 && pattern[y - 1][x] === 0) ||
            (y < pattern.length - 1 && pattern[y + 1][x] === 0);

          if (
            isPerimeter &&
            worldX > 0 &&
            worldX < mapSize - 1 &&
            worldY > 0 &&
            worldY < mapSize - 1
          ) {
            perimeterCells.push({ x: worldX, y: worldY });
          }
        }
      }
    }

    // Create at least one opening
    if (perimeterCells.length > 0) {
      const doorCount =
        1 + Math.floor(Math.random() * Math.min(3, perimeterCells.length));
      for (let i = 0; i < doorCount; i++) {
        const doorIndex = Math.floor(Math.random() * perimeterCells.length);
        const door = perimeterCells[doorIndex];
        map[door.y][door.x] = 0;
        // Remove this position to avoid duplicate doors
        perimeterCells.splice(doorIndex, 1);
        if (perimeterCells.length === 0) break;
      }
    }
  }

  private ensureMapConnectivity(map: number[][], size: number): void {
    const playerStartX = Math.floor(size / 2);
    const playerStartY = Math.floor(size / 2);

    // Use flood fill to find all reachable areas from player start
    const reachable = this.floodFill(map, playerStartX, playerStartY, size);

    // Find unreachable areas and create connections
    this.connectUnreachableAreas(map, reachable, size);

    // Double-check connectivity and create emergency exits if needed
    this.createEmergencyConnections(map, size);
  }

  private floodFill(
    map: number[][],
    startX: number,
    startY: number,
    size: number
  ): boolean[][] {
    const visited: boolean[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(false));
    const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

    visited[startY][startX] = true;

    const directions = [
      { dx: 0, dy: -1 }, // Up
      { dx: 1, dy: 0 }, // Right
      { dx: 0, dy: 1 }, // Down
      { dx: -1, dy: 0 }, // Left
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;

      for (const dir of directions) {
        const newX = current.x + dir.dx;
        const newY = current.y + dir.dy;

        if (
          newX >= 0 &&
          newX < size &&
          newY >= 0 &&
          newY < size &&
          !visited[newY][newX] &&
          map[newY][newX] === 0
        ) {
          visited[newY][newX] = true;
          queue.push({ x: newX, y: newY });
        }
      }
    }

    return visited;
  }

  private connectUnreachableAreas(
    map: number[][],
    reachable: boolean[][],
    size: number
  ): void {
    // Find unreachable floor spaces
    const unreachableAreas: Array<{ x: number; y: number }> = [];

    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        if (map[y][x] === 0 && !reachable[y][x]) {
          unreachableAreas.push({ x, y });
        }
      }
    }

    // For each unreachable area, find the closest reachable area and create a path
    unreachableAreas.forEach((area) => {
      let closestReachableDistance = Infinity;
      let closestReachable: { x: number; y: number } | null = null;

      // Find closest reachable point
      for (let y = 1; y < size - 1; y++) {
        for (let x = 1; x < size - 1; x++) {
          if (reachable[y][x]) {
            const distance = Math.abs(x - area.x) + Math.abs(y - area.y);
            if (distance < closestReachableDistance) {
              closestReachableDistance = distance;
              closestReachable = { x, y };
            }
          }
        }
      }

      // Create a path to the closest reachable area
      if (closestReachable) {
        this.createPath(map, area, closestReachable, size);
      }
    });
  }

  private createPath(
    map: number[][],
    from: { x: number; y: number },
    to: { x: number; y: number },
    size: number
  ): void {
    let currentX = from.x;
    let currentY = from.y;

    // Simple path creation: move horizontally first, then vertically
    while (currentX !== to.x) {
      if (
        currentX > 0 &&
        currentX < size - 1 &&
        currentY > 0 &&
        currentY < size - 1
      ) {
        map[currentY][currentX] = 0;
      }
      currentX += currentX < to.x ? 1 : -1;
    }

    while (currentY !== to.y) {
      if (
        currentX > 0 &&
        currentX < size - 1 &&
        currentY > 0 &&
        currentY < size - 1
      ) {
        map[currentY][currentX] = 0;
      }
      currentY += currentY < to.y ? 1 : -1;
    }
  }

  private createEmergencyConnections(map: number[][], size: number): void {
    // Scan for any remaining isolated rooms and create emergency exits
    const midPoint = Math.floor(size / 2);

    // Create guaranteed horizontal and vertical corridors through the center
    for (let x = 1; x < size - 1; x++) {
      if (Math.random() < 0.3) {
        // 30% chance for each cell to be cleared
        map[midPoint][x] = 0;
      }
    }

    for (let y = 1; y < size - 1; y++) {
      if (Math.random() < 0.3) {
        // 30% chance for each cell to be cleared
        map[y][midPoint] = 0;
      }
    }

    // Ensure player start area is definitely clear
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = midPoint + dx;
        const y = midPoint + dy;
        if (x > 0 && x < size - 1 && y > 0 && y < size - 1) {
          map[y][x] = 0;
        }
      }
    }
  }

  /**
   * Get floor theme based on floor number
   */
  private getFloorTheme(floor: number): string {
    const themes = [
      "tech_base", // Floors 1-5: Tech base (grey/blue walls)
      "hell_fortress", // Floors 6-10: Hell fortress (red/orange walls)
      "ancient_ruins", // Floors 11-15: Ancient ruins (brown/gold walls)
      "cyber_facility", // Floors 16-20: Cyber facility (green/teal walls)
      "void_realm", // Floors 21+: Void realm (purple/black walls)
    ];

    const themeIndex = Math.floor((floor - 1) / 5) % themes.length;
    return themes[themeIndex];
  }

  /**
   * Generate world map with themed wall colors
   */
  private generateWorldMapWithTheme(size: number, theme: string): number[][] {
    const map: number[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(0));

    // Get wall types for this theme
    const wallTypes = this.getThemeWallTypes(theme);

    // Fill borders with walls
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (x === 0 || x === size - 1 || y === 0 || y === size - 1) {
          map[y][x] = wallTypes.border;
        }
      }
    }

    // Use enhanced generation system for better density and variety
    this.generateRooms(map, size); // This now uses the enhanced system with themed zones
    this.generateMaze(map, size); // This now uses dense corridors
    this.generatePillars(map, size); // This now creates themed clusters
    this.generateSpecialRooms(map, size); // This now has more varied patterns

    // Ensure map connectivity
    this.ensureMapConnectivity(map, size);

    return map;
  }

  /**
   * Get wall type mapping for each theme
   */
  private getThemeWallTypes(theme: string): {
    border: number;
    primary: number;
    secondary: number;
    accent: number;
  } {
    switch (theme) {
      case "tech_base":
        return { border: 1, primary: 2, secondary: 3, accent: 4 }; // Dark slate, bright blue, light blue, pale blue
      case "hell_fortress":
        return { border: 1, primary: 18, secondary: 19, accent: 20 }; // Dark slate, red, light red, purple
      case "ancient_ruins":
        return { border: 1, primary: 14, secondary: 15, accent: 16 }; // Dark slate, orange, yellow, light orange
      case "cyber_facility":
        return { border: 1, primary: 10, secondary: 11, accent: 13 }; // Dark slate, emerald, light green, teal
      case "void_realm":
        return { border: 1, primary: 22, secondary: 23, accent: 24 }; // Dark slate, lavender, blue gray, turquoise
      case "industrial_complex":
        return { border: 1, primary: 6, secondary: 7, accent: 8 }; // Dark slate, light steel, bright steel, chrome
      default:
        return { border: 1, primary: 2, secondary: 3, accent: 4 };
    }
  }

  /**
   * Generate rooms with themed wall types
   */
  private generateThemedRooms(
    map: number[][],
    size: number,
    wallTypes: {
      border: number;
      primary: number;
      secondary: number;
      accent: number;
    }
  ): void {
    const roomCount = 10 + Math.floor(Math.random() * 8); // 10-17 rooms for bigger maps
    const rooms: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      wallType: number;
    }> = [];

    for (let i = 0; i < roomCount; i++) {
      const roomWidth = 5 + Math.floor(Math.random() * 10); // 5-14 width
      const roomHeight = 5 + Math.floor(Math.random() * 10); // 5-14 height
      const startX = 2 + Math.floor(Math.random() * (size - roomWidth - 4));
      const startY = 2 + Math.floor(Math.random() * (size - roomHeight - 4));

      // Choose wall type based on room importance
      let wallType;
      if (i === 0) wallType = wallTypes.accent; // First room is special
      else if (i < 3) wallType = wallTypes.primary; // Important rooms
      else if (Math.random() < 0.3)
        wallType = wallTypes.secondary; // Some variety
      else wallType = wallTypes.primary; // Most rooms

      // Store room info for door generation
      const roomInfo = {
        x: startX,
        y: startY,
        width: roomWidth,
        height: roomHeight,
        wallType,
      };
      rooms.push(roomInfo);

      // Create room outline
      for (let y = startY; y < startY + roomHeight; y++) {
        for (let x = startX; x < startX + roomWidth; x++) {
          if (
            x === startX ||
            x === startX + roomWidth - 1 ||
            y === startY ||
            y === startY + roomHeight - 1
          ) {
            map[y][x] = wallType;
          } else {
            map[y][x] = 0; // Clear interior
          }
        }
      }
    }

    // Generate doors for each room with guaranteed connectivity
    rooms.forEach((room) => {
      this.generateRoomDoors(map, room, size);
    });
  }

  private generateRandomEnemies(worldMap: number[][], size: number): Enemy[] {
    const enemies: Enemy[] = [];
    const enemyCount = 8 + Math.floor(Math.random() * 9); // 8-16 enemies
    const enemyTypes: ("grunt" | "soldier" | "captain")[] = [
      "grunt",
      "soldier",
      "captain",
    ];

    let attempts = 0;
    while (enemies.length < enemyCount && attempts < 200) {
      // Increased attempts for better placement
      const x = 2 + Math.random() * (size - 4);
      const y = 2 + Math.random() * (size - 4);

      // Check if position is valid (not in walls, not too close to player spawn, reachable)
      if (worldMap[Math.floor(y)][Math.floor(x)] === 0) {
        const distanceFromPlayer = Math.sqrt(
          (x - size / 2) ** 2 + (y - size / 2) ** 2
        );
        if (distanceFromPlayer > 5) {
          // Verify the position is reachable from player spawn
          const reachable = this.floodFill(
            worldMap,
            Math.floor(size / 2),
            Math.floor(size / 2),
            size
          );
          if (reachable[Math.floor(y)][Math.floor(x)]) {
            const enemyType =
              enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            let maxHealth;

            switch (enemyType) {
              case "grunt":
                maxHealth = 20 + Math.floor(Math.random() * 16); // 20-35 HP
                break;
              case "soldier":
                maxHealth = 30 + Math.floor(Math.random() * 21); // 30-50 HP
                break;
              case "captain":
                maxHealth = 45 + Math.floor(Math.random() * 26); // 45-70 HP
                break;
            }

            enemies.push({
              id: this.state?.nextEnemyId || enemies.length + 1,
              x,
              y,
              health: maxHealth,
              maxHealth,
              state: "idle",
              lastPlayerX: 0,
              lastPlayerY: 0,
              attackCooldown: 0,
              patrolTarget: null,
              enemyType,
              explorationCooldown: Math.floor(Math.random() * 300) + 60,
              explorationDirection: null,
              isBoss: false,
              spawnCooldown: 0,
              spawnsRemaining: 0,
              phaseTransitions: [],
              currentPhase: 0,
              isHurt: false,
              hurtTimer: 0,
            });

            if (this.state) {
              this.state.nextEnemyId++;
            }
          }
        }
      }
      attempts++;
    }

    return enemies;
  }

  /**
   * Generate boss enemy for boss floors
   */
  private generateBossEnemy(
    worldMap: number[][],
    size: number,
    floorNumber: number
  ): Enemy | null {
    const bossTypes: (
      | "boss_demon"
      | "boss_cyberdemon"
      | "boss_spider_mastermind"
    )[] = ["boss_demon", "boss_cyberdemon", "boss_spider_mastermind"];

    // Find a suitable spawn location for the boss
    let attempts = 0;
    while (attempts < 100) {
      const x = 5 + Math.random() * (size - 10);
      const y = 5 + Math.random() * (size - 10);

      if (worldMap[Math.floor(y)][Math.floor(x)] === 0) {
        const distanceFromPlayer = Math.sqrt(
          (x - size / 2) ** 2 + (y - size / 2) ** 2
        );
        if (distanceFromPlayer > 15) {
          // Bosses spawn farther from player
          const bossType =
            bossTypes[Math.floor(floorNumber / 5) % bossTypes.length];
          let maxHealth: number;
          let spawnsRemaining: number;
          let phaseTransitions: number[];

          switch (bossType) {
            case "boss_demon":
              maxHealth = 150 + floorNumber * 20; // Scales with floor
              spawnsRemaining = 3 + Math.floor(floorNumber / 5);
              phaseTransitions = [
                maxHealth * 0.75,
                maxHealth * 0.5,
                maxHealth * 0.25,
              ];
              break;
            case "boss_cyberdemon":
              maxHealth = 200 + floorNumber * 25;
              spawnsRemaining = 4 + Math.floor(floorNumber / 5);
              phaseTransitions = [
                maxHealth * 0.8,
                maxHealth * 0.6,
                maxHealth * 0.4,
                maxHealth * 0.2,
              ];
              break;
            case "boss_spider_mastermind":
              maxHealth = 250 + floorNumber * 30;
              spawnsRemaining = 5 + Math.floor(floorNumber / 5);
              phaseTransitions = [
                maxHealth * 0.85,
                maxHealth * 0.7,
                maxHealth * 0.55,
                maxHealth * 0.4,
                maxHealth * 0.25,
              ];
              break;
          }

          return {
            id: this.state?.nextEnemyId || 1000 + floorNumber,
            x,
            y,
            health: maxHealth,
            maxHealth,
            state: "idle",
            lastPlayerX: 0,
            lastPlayerY: 0,
            attackCooldown: 0,
            patrolTarget: null,
            enemyType: bossType,
            explorationCooldown: 0,
            explorationDirection: null,
            isBoss: true,
            spawnCooldown: 0,
            spawnsRemaining,
            phaseTransitions,
            currentPhase: 0,
            isHurt: false,
            hurtTimer: 0,
          };
        }
      }
      attempts++;
    }

    return null; // Couldn't find suitable location
  }

  /**
   * Progress to next floor when current floor is cleared
   */
  public progressToNextFloor(): void {
    if (
      this.state.enemies.length === 0 ||
      (this.state.isBossFloor && this.state.bossDefeated)
    ) {
      const nextFloor = this.state.currentFloor + 1;
      const isBossFloor = nextFloor % 5 === 0;
      const floorTheme = this.getFloorTheme(nextFloor);
      const worldSize = Math.min(64 + Math.floor(nextFloor / 5) * 8, 96); // Gradually increase size
      const worldMap = this.generateWorldMapWithTheme(worldSize, floorTheme);

      // Reset player position to center of new map
      this.state.player.x = worldSize / 2;
      this.state.player.y = worldSize / 2;
      this.state.player.angle = 0;

      // Heal player partially between floors
      this.state.player.health = Math.min(
        this.state.player.maxHealth,
        this.state.player.health + 25
      );

      // Give some ammo to all weapons
      this.state.player.ammo.pistol = Math.min(
        this.state.player.maxAmmo.pistol,
        this.state.player.ammo.pistol + 20
      );
      this.state.player.ammo.shotgun = Math.min(
        this.state.player.maxAmmo.shotgun,
        this.state.player.ammo.shotgun + 10
      );
      this.state.player.ammo.chaingun = Math.min(
        this.state.player.maxAmmo.chaingun,
        this.state.player.ammo.chaingun + 30
      );

      // Update floor properties
      this.state.currentFloor = nextFloor;
      this.state.floorTheme = floorTheme;
      this.state.isBossFloor = isBossFloor;
      this.state.bossDefeated = false;
      this.state.worldMap = worldMap;
      this.state.worldSize = worldSize;

      // Generate new enemies
      if (isBossFloor) {
        // Boss floor: fewer regular enemies + 1 boss
        const regularEnemies = this.generateRandomEnemies(worldMap, worldSize);
        const bossEnemy = this.generateBossEnemy(
          worldMap,
          worldSize,
          nextFloor
        );

        this.state.enemies = regularEnemies.slice(
          0,
          3 + Math.floor(nextFloor / 10)
        ); // Fewer regular enemies
        if (bossEnemy) {
          this.state.enemies.push(bossEnemy);
        }
      } else {
        // Regular floor: normal enemy generation
        this.state.enemies = this.generateRandomEnemies(worldMap, worldSize);
      }

      // Clear pickups and generate new ones
      this.state.pickups = [];
      this.generateRandomPickups();

      // Reset game status to playing for the new level
      this.state.gameStatus = "playing";

      this.notifyListeners();
    }
  }

  /**
   * Check if floor should progress and handle it
   */
  public checkFloorProgression(): void {
    const aliveBosses = this.state.enemies.filter(
      (enemy) => enemy.isBoss && enemy.health > 0
    );
    const aliveEnemies = this.state.enemies.filter((enemy) => enemy.health > 0);

    if (this.state.isBossFloor) {
      // Boss floor: all enemies dead AND boss defeated
      if (aliveEnemies.length === 0 && aliveBosses.length === 0) {
        this.state.bossDefeated = true;
        setTimeout(() => this.progressToNextFloor(), 2000); // 2 second delay
      }
    } else {
      // Regular floor: all enemies dead
      if (aliveEnemies.length === 0) {
        setTimeout(() => this.progressToNextFloor(), 1500); // 1.5 second delay
      }
    }
  }

  private createInitialState(): GameState {
    const worldSize = 64; // Even bigger for more exploration
    const currentFloor = 1;
    const isBossFloor = currentFloor % 5 === 0;
    const floorTheme = this.getFloorTheme(currentFloor);
    const worldMap = this.generateWorldMapWithTheme(worldSize, floorTheme);

    return {
      player: {
        x: worldSize / 2,
        y: worldSize / 2,
        angle: 0,
        health: 100,
        ammo: {
          pistol: 50,
          shotgun: 0,
          chaingun: 0,
        },
        maxHealth: 100,
        maxAmmo: {
          pistol: 200,
          shotgun: 50,
          chaingun: 200,
        },
        weapon: "pistol",
        availableWeapons: new Set(["pistol"]), // Start with only pistol
        isAttacking: false,
        attackTimer: 0,
        muzzleFlash: false,
        muzzleFlashTimer: 0,
      },
      enemies: [],
      pickups: [],
      gameStatus: "playing",
      worldMap,
      lastUpdateTime: 0,
      accumulator: 0,
      isPaused: false,
      nextPickupId: 1,
      nextEnemyId: 1,
      worldSize,
      currentFloor,
      floorTheme,
      isBossFloor,
      bossDefeated: false,
    };
  }

  private initializeEnemiesAfterState(): void {
    // Generate enemies after state is created
    this.state.enemies = this.generateRandomEnemies(
      this.state.worldMap,
      this.state.worldSize
    );
  }

  public getState(): Readonly<GameState> {
    return { ...this.state };
  }

  public subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  public pause(): void {
    if (this.state.gameStatus === "playing") {
      this.state.isPaused = true;
      this.state.gameStatus = "paused";
      this.notifyListeners();
    }
  }

  public resume(): void {
    if (this.state.gameStatus === "paused") {
      this.state.isPaused = false;
      this.state.gameStatus = "playing";
      // Reset accumulator to avoid time jump
      this.state.accumulator = 0;
      this.notifyListeners();
    }
  }

  public togglePause(): void {
    if (this.state.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  public switchWeapon(weapon: "pistol" | "shotgun" | "chaingun"): boolean {
    // Only switch if weapon is available
    if (this.state.player.availableWeapons.has(weapon)) {
      this.state.player.weapon = weapon;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  public updateWithDeltaTime(currentTime: number): void {
    // Don't update game state if paused
    if (this.state.isPaused) {
      this.state.lastUpdateTime = currentTime;
      return;
    }

    if (this.state.lastUpdateTime === 0) {
      this.state.lastUpdateTime = currentTime;
      // Initialize enemies on first update
      if (this.state.enemies.length === 0) {
        this.initializeEnemiesAfterState();
      }
      return;
    }

    const deltaTime = currentTime - this.state.lastUpdateTime;
    this.state.lastUpdateTime = currentTime;
    this.state.accumulator += deltaTime;

    // Fixed timestep updates for deterministic physics
    while (this.state.accumulator >= this.FIXED_TIMESTEP) {
      this.fixedUpdate();
      this.state.accumulator -= this.FIXED_TIMESTEP;
    }

    this.notifyListeners();
  }

  private fixedUpdate(): void {
    if (this.state.gameStatus !== "playing") return;

    // Update game logic with fixed timestep
    this.updatePlayerAttackState();
    this.updatePickupCollection();
    this.updateGameStatus();
  }

  private updatePlayerAttackState(): void {
    // Update attack timer
    if (this.state.player.attackTimer > 0) {
      this.state.player.attackTimer--;
      if (this.state.player.attackTimer === 0) {
        this.state.player.isAttacking = false;
      }
    }

    // Update muzzle flash
    if (this.state.player.muzzleFlashTimer > 0) {
      this.state.player.muzzleFlashTimer--;
      if (this.state.player.muzzleFlashTimer === 0) {
        this.state.player.muzzleFlash = false;
      }
    }
  }

  private updateGameStatus(): void {
    if (this.state.player.health <= 0) {
      this.state.gameStatus = "defeat";
      this.state.isPaused = false;
    } else if (this.state.enemies.length === 0) {
      this.state.gameStatus = "victory";
      this.state.isPaused = false;
    }
  }

  private updatePickupCollection(): void {
    const PICKUP_RANGE = 0.8; // Distance required to collect pickup

    // Check for pickup collection
    for (let i = this.state.pickups.length - 1; i >= 0; i--) {
      const pickup = this.state.pickups[i];
      const distance = Math.sqrt(
        (pickup.x - this.state.player.x) ** 2 +
          (pickup.y - this.state.player.y) ** 2
      );

      if (distance < PICKUP_RANGE) {
        // Collect the pickup
        this.collectPickup(pickup);
        // Remove pickup from array
        this.state.pickups.splice(i, 1);
      }
    }
  }

  private collectPickup(pickup: Pickup): void {
    switch (pickup.type) {
      case "health":
        this.state.player.health = Math.min(
          this.state.player.health + pickup.value,
          this.state.player.maxHealth
        );
        break;
      case "ammo":
        // Add ammo to current weapon
        const currentWeapon = this.state.player.weapon;
        this.state.player.ammo[currentWeapon] = Math.min(
          this.state.player.ammo[currentWeapon] + pickup.value,
          this.state.player.maxAmmo[currentWeapon]
        );
        break;
      case "weapon":
        if (pickup.weaponType) {
          // Add weapon to available weapons
          this.state.player.availableWeapons.add(pickup.weaponType);
          // Switch to new weapon immediately
          this.state.player.weapon = pickup.weaponType;
          // Give some ammo with weapon
          this.state.player.ammo[pickup.weaponType] = Math.min(
            this.state.player.ammo[pickup.weaponType] + pickup.value,
            this.state.player.maxAmmo[pickup.weaponType]
          );
        }
        break;
    }
  }

  private spawnPickup(
    x: number,
    y: number,
    type: "health" | "ammo" | "weapon",
    value: number,
    weaponType?: "shotgun" | "chaingun"
  ): void {
    // Add some randomness to pickup position to avoid exact overlap
    const offsetX = (Math.random() - 0.5) * 0.4;
    const offsetY = (Math.random() - 0.5) * 0.4;

    const pickup: Pickup = {
      id: this.state.nextPickupId++,
      x: x + offsetX,
      y: y + offsetY,
      type,
      value,
      spawnTime: this.state.lastUpdateTime,
      animationOffset: Math.random() * Math.PI * 2,
      weaponType,
    };

    this.state.pickups.push(pickup);
  }

  public updatePlayer(input: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    rotateLeft: boolean;
    rotateRight: boolean;
  }): void {
    if (this.state.gameStatus !== "playing" || this.state.isPaused) return;

    const moveSpeed = 0.15; // Increased from 0.05 for faster movement
    const rotationSpeed = 0.03; // Increased from 0.03 for faster rotation

    let newX = this.state.player.x;
    let newY = this.state.player.y;

    // Rotation
    if (input.rotateLeft) {
      this.state.player.angle -= rotationSpeed;
    }
    if (input.rotateRight) {
      this.state.player.angle += rotationSpeed;
    }

    // Movement
    if (input.forward) {
      newX += Math.cos(this.state.player.angle) * moveSpeed;
      newY += Math.sin(this.state.player.angle) * moveSpeed;
    }
    if (input.backward) {
      newX -= Math.cos(this.state.player.angle) * moveSpeed;
      newY -= Math.sin(this.state.player.angle) * moveSpeed;
    }

    // Strafing
    if (input.left) {
      newX += Math.cos(this.state.player.angle - Math.PI / 2) * moveSpeed;
      newY += Math.sin(this.state.player.angle - Math.PI / 2) * moveSpeed;
    }
    if (input.right) {
      newX -= Math.cos(this.state.player.angle - Math.PI / 2) * moveSpeed;
      newY -= Math.sin(this.state.player.angle - Math.PI / 2) * moveSpeed;
    }

    // Collision detection
    if (this.state.worldMap[Math.floor(newY)][Math.floor(newX)] === 0) {
      this.state.player.x = newX;
    }
    if (
      this.state.worldMap[Math.floor(newY)][Math.floor(this.state.player.x)] ===
      0
    ) {
      this.state.player.y = newY;
    }

    this.notifyListeners();
  }

  public updateMouseLook(deltaX: number): void {
    if (this.state.gameStatus !== "playing" || this.state.isPaused) return;

    const rotationSpeed = 0.005; // Increased from 0.002 for better mouse sensitivity
    this.state.player.angle += deltaX * rotationSpeed;
    this.notifyListeners();
  }

  public shoot(): boolean {
    if (
      this.state.gameStatus !== "playing" ||
      this.state.isPaused ||
      this.state.player.ammo[this.state.player.weapon] <= 0
    )
      return false;

    const stats = this.WEAPON_STATS[this.state.player.weapon];

    this.state.player.ammo[this.state.player.weapon] -= stats.ammoUse;
    this.state.player.isAttacking = true;
    this.state.player.attackTimer = stats.attackDuration;
    this.state.player.muzzleFlash = true;
    this.state.player.muzzleFlashTimer = stats.muzzleDuration;

    this.notifyListeners();
    return true;
  }

  public getWeaponDamage(): number {
    return this.WEAPON_STATS[this.state.player.weapon].damage;
  }

  public getWeaponRange(): number {
    return this.WEAPON_STATS[this.state.player.weapon].range;
  }

  public getWeaponAccuracy(): number {
    return this.WEAPON_STATS[this.state.player.weapon].accuracy;
  }

  // NEW: Check if path is clear for exploration movement
  private isPathClear(
    startX: number,
    startY: number,
    directionX: number,
    directionY: number,
    distance: number
  ): boolean {
    for (let i = 1; i <= distance; i++) {
      const checkX = Math.floor(startX + directionX * i);
      const checkY = Math.floor(startY + directionY * i);

      // Check bounds
      if (
        checkX < 1 ||
        checkX >= this.state.worldSize - 1 ||
        checkY < 1 ||
        checkY >= this.state.worldSize - 1
      ) {
        return false;
      }

      // Check for walls
      if (this.state.worldMap[checkY][checkX] !== 0) {
        return false;
      }
    }
    return true;
  }

  public updateEnemies(
    castRayFunction: (
      startX: number,
      startY: number,
      angle: number
    ) => { distance: number }
  ): void {
    if (this.state.gameStatus !== "playing" || this.state.isPaused) return;

    this.state.enemies.forEach((enemy) => {
      const distanceToPlayer = Math.sqrt(
        (enemy.x - this.state.player.x) ** 2 +
          (enemy.y - this.state.player.y) ** 2
      );

      // Update attack cooldown
      if (enemy.attackCooldown > 0) {
        enemy.attackCooldown--;
      }

      // Update exploration cooldown
      if (enemy.explorationCooldown > 0) {
        enemy.explorationCooldown--;
      }

      // Update hurt flash timer
      if (enemy.hurtTimer > 0) {
        enemy.hurtTimer--;
        if (enemy.hurtTimer === 0) {
          enemy.isHurt = false;
        }
      }

      // Update boss-specific properties
      if (enemy.isBoss) {
        // Update spawn cooldown
        if (enemy.spawnCooldown > 0) {
          enemy.spawnCooldown--;
        }

        // Check for phase transitions
        this.checkBossPhaseTransition(enemy);

        // Handle boss spawning behavior
        if (
          enemy.spawnsRemaining > 0 &&
          enemy.spawnCooldown <= 0 &&
          distanceToPlayer < 20 &&
          distanceToPlayer > 8
        ) {
          this.spawnBossMinion(enemy);
        }
      }

      // Line of sight check
      const angleToPlayer = Math.atan2(
        this.state.player.y - enemy.y,
        this.state.player.x - enemy.x
      );
      const hit = castRayFunction(enemy.x, enemy.y, angleToPlayer);
      const canSeePlayer = hit.distance > distanceToPlayer;

      // Different AI behavior based on enemy type
      const detectionRange = enemy.isBoss
        ? 25
        : enemy.enemyType === "captain"
        ? 12
        : enemy.enemyType === "soldier"
        ? 10
        : 8;
      const moveSpeed = enemy.isBoss
        ? 0.045
        : enemy.enemyType === "captain"
        ? 0.035
        : enemy.enemyType === "soldier"
        ? 0.03
        : 0.025;

      switch (enemy.state) {
        case "idle":
          if (canSeePlayer && distanceToPlayer < detectionRange) {
            enemy.state = "chasing";
            enemy.lastPlayerX = this.state.player.x;
            enemy.lastPlayerY = this.state.player.y;
          } else if (enemy.explorationCooldown <= 0) {
            // NEW: Start exploration movement
            this.startEnemyExploration(enemy);
          } else if (Math.random() < 0.001) {
            enemy.state = "patrolling";
            enemy.patrolTarget = {
              x: enemy.x + (Math.random() - 0.5) * 6,
              y: enemy.y + (Math.random() - 0.5) * 6,
            };
          }
          break;

        case "patrolling":
          if (canSeePlayer && distanceToPlayer < detectionRange) {
            enemy.state = "chasing";
            enemy.lastPlayerX = this.state.player.x;
            enemy.lastPlayerY = this.state.player.y;
          } else if (enemy.explorationCooldown <= 0) {
            // NEW: Start exploration movement even while patrolling
            this.startEnemyExploration(enemy);
          } else if (enemy.patrolTarget) {
            const dx = enemy.patrolTarget.x - enemy.x;
            const dy = enemy.patrolTarget.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0.1) {
              const newX = enemy.x + (dx / distance) * moveSpeed;
              const newY = enemy.y + (dy / distance) * moveSpeed;

              if (
                this.state.worldMap[Math.floor(newY)][Math.floor(newX)] === 0
              ) {
                enemy.x = newX;
                enemy.y = newY;
              }
            } else {
              enemy.state = "idle";
              enemy.patrolTarget = null;
            }
          }
          break;

        case "chasing":
          if (canSeePlayer) {
            enemy.lastPlayerX = this.state.player.x;
            enemy.lastPlayerY = this.state.player.y;
          }

          if (distanceToPlayer < 1.5) {
            enemy.state = "attacking";
          } else {
            const dx = enemy.lastPlayerX - enemy.x;
            const dy = enemy.lastPlayerY - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0.1) {
              const newX = enemy.x + (dx / distance) * moveSpeed * 1.5; // Faster when chasing
              const newY = enemy.y + (dy / distance) * moveSpeed * 1.5;

              if (
                this.state.worldMap[Math.floor(newY)][Math.floor(newX)] === 0
              ) {
                enemy.x = newX;
                enemy.y = newY;
              }
            }

            if (!canSeePlayer && distanceToPlayer > 10) {
              enemy.state = "idle";
            }
          }
          break;

        case "attacking":
          if (distanceToPlayer > 2.5) {
            enemy.state = "chasing";
          } else if (enemy.attackCooldown === 0) {
            const damage =
              enemy.enemyType === "captain"
                ? 15
                : enemy.enemyType === "soldier"
                ? 12
                : 10;
            this.state.player.health -= damage;
            enemy.attackCooldown = enemy.enemyType === "captain" ? 45 : 60; // Captains attack faster
          }
          break;
      }

      // NEW: Handle exploration movement
      if (
        enemy.explorationDirection &&
        (enemy.state === "idle" || enemy.state === "patrolling")
      ) {
        this.continueEnemyExploration(enemy, moveSpeed);
      }
    });

    this.notifyListeners();
  }

  // NEW: Start exploration movement for an enemy
  private startEnemyExploration(enemy: Enemy): void {
    // Pick a random direction
    const directions = [
      { dx: 1, dy: 0 }, // Right
      { dx: -1, dy: 0 }, // Left
      { dx: 0, dy: 1 }, // Down
      { dx: 0, dy: -1 }, // Up
      { dx: 1, dy: 1 }, // Diagonal: Down-Right
      { dx: -1, dy: 1 }, // Diagonal: Down-Left
      { dx: 1, dy: -1 }, // Diagonal: Up-Right
      { dx: -1, dy: -1 }, // Diagonal: Up-Left
    ];

    const direction = directions[Math.floor(Math.random() * directions.length)];
    const explorationDistance = 3 + Math.floor(Math.random() * 4); // 3-6 spaces

    // Check if the path is clear
    if (
      this.isPathClear(
        enemy.x,
        enemy.y,
        direction.dx,
        direction.dy,
        explorationDistance
      )
    ) {
      enemy.explorationDirection = direction;
      enemy.explorationCooldown = explorationDistance * 30; // Time to complete movement
    } else {
      // Path blocked, wait before trying again
      enemy.explorationCooldown = 120 + Math.floor(Math.random() * 180); // 2-5 seconds
    }
  }

  // NEW: Continue exploration movement
  private continueEnemyExploration(enemy: Enemy, baseSpeed: number): void {
    if (!enemy.explorationDirection) return;

    const explorationSpeed = baseSpeed * 0.7; // Slightly slower for exploration
    const newX = enemy.x + enemy.explorationDirection.dx * explorationSpeed;
    const newY = enemy.y + enemy.explorationDirection.dy * explorationSpeed;

    // Check if the new position is valid
    if (this.state.worldMap[Math.floor(newY)][Math.floor(newX)] === 0) {
      enemy.x = newX;
      enemy.y = newY;
    } else {
      // Hit a wall, stop exploration
      enemy.explorationDirection = null;
      enemy.explorationCooldown = 180 + Math.floor(Math.random() * 240); // 3-7 seconds before next exploration
    }

    // If exploration time is up, stop and reset
    if (enemy.explorationCooldown <= 0) {
      enemy.explorationDirection = null;
      enemy.explorationCooldown = 240 + Math.floor(Math.random() * 360); // 4-10 seconds before next exploration
    }
  }

  public damageEnemy(enemyId: number, damage: number): boolean {
    const enemy = this.state.enemies.find((e) => e.id === enemyId);
    if (!enemy) return false;

    enemy.health -= damage;

    // Set hurt flash effect for 5 frames (about 1/12 second at 60fps)
    enemy.isHurt = true;
    enemy.hurtTimer = 5;

    if (enemy.health <= 0) {
      // Spawn pickups when enemy dies
      this.spawnEnemyDrops(enemy.x, enemy.y, enemy.enemyType);

      const index = this.state.enemies.findIndex((e) => e.id === enemyId);
      if (index > -1) {
        this.state.enemies.splice(index, 1);
      }

      // Check if floor should progress after enemy death
      setTimeout(() => this.checkFloorProgression(), 100); // Small delay to ensure state is updated
    }

    this.notifyListeners();
    return true;
  }

  private spawnEnemyDrops(
    x: number,
    y: number,
    enemyType:
      | "grunt"
      | "soldier"
      | "captain"
      | "boss_demon"
      | "boss_cyberdemon"
      | "boss_spider_mastermind"
  ): void {
    // Different drop rates based on enemy type
    let healthDropChance, ammoDropChance, weaponDropChance;

    switch (enemyType) {
      case "grunt":
        healthDropChance = 0.5;
        ammoDropChance = 0.7;
        weaponDropChance = 0.05;
        break;
      case "soldier":
        healthDropChance = 0.7;
        ammoDropChance = 0.8;
        weaponDropChance = 0.15;
        break;
      case "captain":
        healthDropChance = 0.8;
        ammoDropChance = 0.9;
        weaponDropChance = 0.25;
        break;
      case "boss_demon":
        healthDropChance = 1.0; // Always drop health
        ammoDropChance = 1.0; // Always drop ammo
        weaponDropChance = 0.8; // High chance of weapon
        break;
      case "boss_cyberdemon":
        healthDropChance = 1.0;
        ammoDropChance = 1.0;
        weaponDropChance = 0.9;
        break;
      case "boss_spider_mastermind":
        healthDropChance = 1.0;
        ammoDropChance = 1.0;
        weaponDropChance = 1.0; // Always drop weapon
        break;
    }

    if (Math.random() < healthDropChance) {
      const healthValue = 15 + Math.floor(Math.random() * 26); // 15-40 health
      this.spawnPickup(x, y, "health", healthValue);
    }

    if (Math.random() < ammoDropChance) {
      const ammoValue = 8 + Math.floor(Math.random() * 18); // 8-25 ammo
      this.spawnPickup(x, y, "ammo", ammoValue);
    }

    if (Math.random() < weaponDropChance) {
      const weaponType = Math.random() < 0.7 ? "shotgun" : "chaingun";
      const ammoValue = weaponType === "shotgun" ? 12 : 30;
      this.spawnPickup(x, y, "weapon", ammoValue, weaponType);
    }
  }

  /**
   * Check if boss should transition to next phase and handle phase changes
   */
  private checkBossPhaseTransition(boss: Enemy): void {
    if (!boss.isBoss || boss.phaseTransitions.length === 0) return;

    const healthPercentage = boss.health / boss.maxHealth;
    const nextThreshold = boss.phaseTransitions[boss.currentPhase];

    if (nextThreshold && boss.health <= nextThreshold) {
      boss.currentPhase++;

      // Phase transition effects
      switch (boss.enemyType) {
        case "boss_demon":
          // Become more aggressive, spawn minions
          boss.spawnCooldown = 60; // Spawn minions soon
          break;
        case "boss_cyberdemon":
          // Increase movement speed, more frequent attacks
          boss.attackCooldown = Math.max(10, boss.attackCooldown - 20);
          break;
        case "boss_spider_mastermind":
          // Become erratic, multiple spawn waves
          boss.spawnCooldown = 30;
          boss.spawnsRemaining += 2; // Extra spawns in later phases
          break;
      }
    }
  }

  /**
   * Generate random pickups for the current floor
   */
  private generateRandomPickups(): void {
    const pickupCount = 5 + Math.floor(Math.random() * 6); // 5-10 pickups
    let attempts = 0;

    while (this.state.pickups.length < pickupCount && attempts < 200) {
      const x = 2 + Math.random() * (this.state.worldSize - 4);
      const y = 2 + Math.random() * (this.state.worldSize - 4);

      // Check if position is valid (not in walls, not too close to player spawn)
      if (this.state.worldMap[Math.floor(y)][Math.floor(x)] === 0) {
        const distanceFromPlayer = Math.sqrt(
          (x - this.state.worldSize / 2) ** 2 +
            (y - this.state.worldSize / 2) ** 2
        );
        if (distanceFromPlayer > 3) {
          // Determine pickup type based on floor and randomness
          const pickupTypes: ("health" | "ammo" | "weapon")[] = [
            "health",
            "ammo",
            "weapon",
          ];
          const type =
            pickupTypes[Math.floor(Math.random() * pickupTypes.length)];

          let value: number;
          let weaponType: "shotgun" | "chaingun" | undefined;

          switch (type) {
            case "health":
              value = 25 + Math.floor(Math.random() * 26); // 25-50 health
              break;
            case "ammo":
              value = 15 + Math.floor(Math.random() * 21); // 15-35 ammo
              break;
            case "weapon":
              weaponType = Math.random() < 0.7 ? "shotgun" : "chaingun";
              value = weaponType === "shotgun" ? 12 : 30;
              break;
          }

          this.spawnPickup(x, y, type, value, weaponType);
        }
      }
      attempts++;
    }
  }

  /**
   * Spawn a minion enemy near the boss
   */
  private spawnBossMinion(boss: Enemy): void {
    if (boss.spawnsRemaining <= 0) return;

    // Find spawn location near boss but not too close to player
    for (let attempts = 0; attempts < 20; attempts++) {
      const spawnRadius = 3 + Math.random() * 4; // 3-7 units from boss
      const spawnAngle = Math.random() * Math.PI * 2;
      const spawnX = boss.x + Math.cos(spawnAngle) * spawnRadius;
      const spawnY = boss.y + Math.sin(spawnAngle) * spawnRadius;

      // Check if spawn location is valid
      const mapX = Math.floor(spawnX);
      const mapY = Math.floor(spawnY);

      if (
        mapX >= 0 &&
        mapX < this.state.worldSize &&
        mapY >= 0 &&
        mapY < this.state.worldSize &&
        this.state.worldMap[mapY][mapX] === 0
      ) {
        const distanceToPlayer = Math.sqrt(
          (spawnX - this.state.player.x) ** 2 +
            (spawnY - this.state.player.y) ** 2
        );

        if (distanceToPlayer > 4) {
          // Don't spawn too close to player
          // Determine minion type based on boss type and floor
          let minionType: "grunt" | "soldier" | "captain";
          let minionHealth: number;

          switch (boss.enemyType) {
            case "boss_demon":
              minionType = Math.random() < 0.7 ? "grunt" : "soldier";
              minionHealth = minionType === "grunt" ? 25 : 35;
              break;
            case "boss_cyberdemon":
              minionType = Math.random() < 0.5 ? "soldier" : "captain";
              minionHealth = minionType === "soldier" ? 40 : 55;
              break;
            case "boss_spider_mastermind":
              minionType =
                Math.random() < 0.3
                  ? "grunt"
                  : Math.random() < 0.6
                  ? "soldier"
                  : "captain";
              minionHealth =
                minionType === "grunt"
                  ? 30
                  : minionType === "soldier"
                  ? 45
                  : 60;
              break;
            default:
              minionType = "grunt";
              minionHealth = 25;
          }

          // Create the minion
          const minion: Enemy = {
            id: this.state.nextEnemyId++,
            x: spawnX,
            y: spawnY,
            health: minionHealth,
            maxHealth: minionHealth,
            state: "chasing", // Spawned minions are immediately aggressive
            lastPlayerX: this.state.player.x,
            lastPlayerY: this.state.player.y,
            attackCooldown: 0,
            patrolTarget: null,
            enemyType: minionType,
            explorationCooldown: 0,
            explorationDirection: null,
            isBoss: false,
            spawnCooldown: 0,
            spawnsRemaining: 0,
            phaseTransitions: [],
            currentPhase: 0,
            isHurt: false,
            hurtTimer: 0,
          };

          this.state.enemies.push(minion);
          boss.spawnsRemaining--;
          boss.spawnCooldown = 120 + Math.random() * 180; // 2-5 seconds before next spawn
          break;
        }
      }
    }
  }

  /**
   * Extract game state data for adaptive music generation
   * @author @darianrosebrook
   */
  public getGameStateForMusic(): import("@/game/systems/AudioSystem").GameStateForMusic {
    // Calculate nearby enemies (within 10 units)
    const nearbyEnemies = this.state.enemies.filter((enemy) => {
      const distance = Math.sqrt(
        (enemy.x - this.state.player.x) ** 2 +
          (enemy.y - this.state.player.y) ** 2
      );
      return distance <= 10;
    });

    // Find closest enemy distance
    let closestEnemyDistance = Infinity;
    this.state.enemies.forEach((enemy) => {
      const distance = Math.sqrt(
        (enemy.x - this.state.player.x) ** 2 +
          (enemy.y - this.state.player.y) ** 2
      );
      if (distance < closestEnemyDistance) {
        closestEnemyDistance = distance;
      }
    });

    // Determine if player is in combat (has attacked recently or is being attacked)
    const isInCombat =
      this.state.player.isAttacking ||
      this.state.player.attackTimer > 0 ||
      this.state.enemies.some(
        (enemy) => enemy.state === "attacking" || enemy.state === "chasing"
      );

    return {
      playerHealth: this.state.player.health,
      playerMaxHealth: this.state.player.maxHealth,
      enemyCount: this.state.enemies.length,
      nearbyEnemyCount: nearbyEnemies.length,
      closestEnemyDistance:
        closestEnemyDistance === Infinity ? 100 : closestEnemyDistance,
      isInCombat,
      isBossLevel: this.state.isBossFloor,
      currentFloor: this.state.currentFloor,
      gameStatus: this.state.gameStatus,
    };
  }

  public reset(): void {
    this.state = this.createInitialState();
    this.notifyListeners();
  }
}
