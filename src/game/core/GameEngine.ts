import { GameStateManager, type GameState } from "./GameStateManager";
import { InputSystem } from "../systems/InputSystem";
import { AudioSystem, type SoundType } from "../systems/AudioSystem";
import { RenderingSystem } from "../rendering/RenderingSystem";

export class GameEngine {
  private gameStateManager: GameStateManager;
  private inputSystem: InputSystem;
  private audioSystem: AudioSystem;
  private renderingSystem: RenderingSystem;
  private animationFrameId: number | null = null;
  private isRunning = false;
  // private lastFrameTime = 0;
  private canvas: HTMLCanvasElement;
  private lastPlayerHealth = 100;
  // private lastAmmoCount = 50;
  private lastEnemyCount = 0;
  private lastPickupCount = 0;
  // private currentWeapon: string = 'pistol';
  private victoryPlayed = false;
  private defeatPlayed = false;
  private footstepTimer = 0;
  // private lastPlayerPosition = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement, sharedAudioSystem?: AudioSystem) {
    this.canvas = canvas;
    this.gameStateManager = new GameStateManager();
    this.inputSystem = new InputSystem();

    // Use shared audio system if provided, otherwise create new one
    this.audioSystem = sharedAudioSystem || new AudioSystem();

    this.renderingSystem = new RenderingSystem(canvas);

    // Bind canvas events
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Mouse click events
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));

    // Subscribe to input changes for pause and weapon switching
    this.inputSystem.subscribe((inputState) => {
      if (inputState.pausePressed) {
        this.handlePauseToggle();
      }

      if (inputState.weaponSwitchPressed) {
        this.handleWeaponSwitch(inputState.weaponSwitchPressed.weapon);
      }
    });
  }

  private handleMouseDown(event: MouseEvent): void {
    // Only handle left mouse button
    if (event.button !== 0) return;

    event.preventDefault();

    const inputState = this.inputSystem.getInputState();
    const gameState = this.gameStateManager.getState();

    // If game is paused, don't handle shooting
    if (gameState.isPaused) return;

    if (!inputState.mouseLocked) {
      // Request pointer lock first
      this.inputSystem.requestPointerLock(this.canvas);
    } else {
      // Mouse is locked, handle shooting
      this.handleShooting();
    }
  }

  private handlePauseToggle(): void {
    const gameState = this.gameStateManager.getState();

    // Only allow pause/resume if game is playing or paused
    if (
      gameState.gameStatus === "playing" ||
      gameState.gameStatus === "paused"
    ) {
      this.gameStateManager.togglePause();

      // Exit pointer lock when pausing
      if (gameState.gameStatus === "playing") {
        this.inputSystem.exitPointerLock();
        this.audioSystem.stopAmbientMusic();
      } else {
        // Resuming - start ambient music again
        this.audioSystem.playAmbientMusic();
      }
    }
  }

  private handleWeaponSwitch(weapon: "pistol" | "shotgun" | "chaingun"): void {
    const gameState = this.gameStateManager.getState();

    // Don't switch weapons if game is paused
    if (gameState.isPaused) return;

    // Attempt to switch weapon
    const switched = this.gameStateManager.switchWeapon(weapon);

    if (switched) {
      this.audioSystem.playSound("weapon_switch", 0.7);
      // this.currentWeapon = weapon;
    }
  }

  private handleShooting(): void {
    const didShoot = this.gameStateManager.shoot();
    if (didShoot) {
      const gameState = this.gameStateManager.getState();

      // Play weapon sound based on current weapon
      const weaponSounds: Record<string, SoundType> = {
        pistol: "pistol_fire",
        shotgun: "shotgun_fire",
        chaingun: "chaingun_fire",
      };

      const soundType = weaponSounds[gameState.player.weapon] || "pistol_fire";
      this.audioSystem.playSound(soundType, 0.8);

      const hit = this.renderingSystem.castRay(
        gameState.player.x,
        gameState.player.y,
        gameState.player.angle,
        gameState.worldMap
      );

      // Get weapon stats for range and accuracy
      const weaponRange = this.gameStateManager.getWeaponRange();
      const weaponAccuracy = this.gameStateManager.getWeaponAccuracy();
      const weaponDamage = this.gameStateManager.getWeaponDamage();

      // Check if ray hit an enemy within range
      // let hitEnemy = false;
      for (const enemy of gameState.enemies) {
        const enemyDistance = Math.sqrt(
          (enemy.x - gameState.player.x) ** 2 +
            (enemy.y - gameState.player.y) ** 2
        );

        // First check if enemy is within weapon range
        if (enemyDistance > weaponRange) {
          continue; // Enemy is too far away for this weapon
        }

        // Check if there's a wall between player and enemy
        if (enemyDistance > hit.distance) {
          continue; // Wall is blocking the shot
        }

        // Check if player is aiming at the enemy
        const enemyAngle = Math.atan2(
          enemy.y - gameState.player.y,
          enemy.x - gameState.player.x
        );
        let angleDiff = Math.abs(gameState.player.angle - enemyAngle);

        // Normalize angle difference to [0, π]
        if (angleDiff > Math.PI) {
          angleDiff = 2 * Math.PI - angleDiff;
        }

        // Check if within weapon accuracy cone
        if (angleDiff < weaponAccuracy) {
          // Apply damage falloff for longer range shots
          let actualDamage = weaponDamage;

          // For shotgun, apply significant damage falloff with distance
          if (gameState.player.weapon === "shotgun") {
            const rangeFactor = Math.max(
              0.3,
              1 - (enemyDistance / weaponRange) * 0.7
            );
            actualDamage = Math.floor(weaponDamage * rangeFactor);
          }
          // For other weapons, minimal damage falloff
          else {
            const rangeFactor = Math.max(
              0.8,
              1 - (enemyDistance / weaponRange) * 0.2
            );
            actualDamage = Math.floor(weaponDamage * rangeFactor);
          }

          // Play enemy hit sound
          this.audioSystem.playSound("enemy_hit", 0.6);

          // const enemyKilled = this.gameStateManager.damageEnemy(enemy.id, actualDamage);
          this.gameStateManager.damageEnemy(enemy.id, actualDamage);
          // hitEnemy = true;
          break; // Only hit the first enemy in line
        }
      }
    }
  }

  private detectGameEvents(currentState: GameState): void {
    // Detect health changes
    if (currentState.player.health < this.lastPlayerHealth) {
      this.audioSystem.playSound("player_hurt", 0.7);
    }
    this.lastPlayerHealth = currentState.player.health;

    // Detect enemy count changes (enemy deaths)
    if (currentState.enemies.length < this.lastEnemyCount) {
      const enemiesKilled = this.lastEnemyCount - currentState.enemies.length;
      for (let i = 0; i < enemiesKilled; i++) {
        this.audioSystem.playSound("enemy_death", 0.8);
      }
    }
    this.lastEnemyCount = currentState.enemies.length;

    // Enhanced pickup collection detection with proper sound mapping
    if (currentState.pickups.length < this.lastPickupCount) {
      // Since we can't directly track which pickup was collected,
      // we'll play a variety of pickup sounds based on the reduction in pickup count
      const pickupsCollected =
        this.lastPickupCount - currentState.pickups.length;
      for (let i = 0; i < pickupsCollected; i++) {
        // Randomize pickup sounds for variety since we can't determine exact type
        const pickupSounds = ["pickup_health", "pickup_ammo", "pickup_weapon"];
        const randomSound =
          pickupSounds[Math.floor(Math.random() * pickupSounds.length)];
        this.audioSystem.playSound(randomSound as any, 0.6);
      }
    }
    this.lastPickupCount = currentState.pickups.length;

    // Play victory/defeat sounds with enhanced feedback
    if (currentState.gameStatus === "victory" && !this.victoryPlayed) {
      this.audioSystem.stopAmbientMusic();
      // Play triumphant victory sequence
      setTimeout(() => {
        this.audioSystem.playSound("pickup_weapon", 1.0);
      }, 200);
      setTimeout(() => {
        this.audioSystem.playSound("pickup_health", 0.8);
      }, 600);
      this.victoryPlayed = true;
    } else if (currentState.gameStatus === "defeat" && !this.defeatPlayed) {
      this.audioSystem.stopAmbientMusic();
      // Play dramatic defeat sequence
      setTimeout(() => {
        this.audioSystem.playSound("player_hurt", 1.0);
      }, 100);
      setTimeout(() => {
        this.audioSystem.playSound("enemy_death", 0.6);
      }, 800);
      this.defeatPlayed = true;
    }

    // Reset audio state flags when returning to playing
    if (currentState.gameStatus === "playing") {
      this.victoryPlayed = false;
      this.defeatPlayed = false;
    }
  }

  private handleFootsteps(
    prevX: number,
    prevY: number,
    currentX: number,
    currentY: number,
    movementInput: {
      forward: boolean;
      backward: boolean;
      left: boolean;
      right: boolean;
      rotateLeft: boolean;
      rotateRight: boolean;
    }
  ): void {
    // Check if player is actually moving
    const isMoving =
      movementInput.forward ||
      movementInput.backward ||
      movementInput.left ||
      movementInput.right;
    const distanceMoved = Math.sqrt(
      (currentX - prevX) ** 2 + (currentY - prevY) ** 2
    );

    if (isMoving && distanceMoved > 0.001) {
      // Only if actually moving
      this.footstepTimer += distanceMoved * 100; // Scale factor for footstep timing

      // Play footstep sound every certain distance interval
      if (this.footstepTimer > 8) {
        // Adjust this value to change footstep frequency
        this.audioSystem.playSound("footstep", 0.2); // Low volume for subtle effect
        this.footstepTimer = 0;
      }
    } else {
      // Reset timer when not moving to ensure consistent timing when movement resumes
      this.footstepTimer = Math.max(0, this.footstepTimer - 1);
    }
  }

  private gameLoop = (currentTime: number): void => {
    if (!this.isRunning) return;

    // Delta time calculation for frame-rate independent updates
    // const deltaTime = currentTime - this.lastFrameTime;
    // this.lastFrameTime = currentTime;

    // Update game state with fixed timestep (handles pause internally)
    this.gameStateManager.updateWithDeltaTime(currentTime);

    const gameState = this.gameStateManager.getState();

    // Detect and play sounds for game events
    this.detectGameEvents(gameState);

    // Update adaptive music based on game state
    if (!gameState.isPaused) {
      const musicGameState = this.gameStateManager.getGameStateForMusic();
      this.audioSystem.updateGameStateForMusic(musicGameState);
    }

    // Only process input if not paused
    if (!gameState.isPaused) {
      // Handle movement input
      const movementInput = this.inputSystem.getMovementInput();

      // Store previous position for footstep calculation
      const prevX = gameState.player.x;
      const prevY = gameState.player.y;

      this.gameStateManager.updatePlayer(movementInput);

      // Play footstep sounds during movement
      this.handleFootsteps(
        prevX,
        prevY,
        gameState.player.x,
        gameState.player.y,
        movementInput
      );

      // Handle mouse look
      const mouseDelta = this.inputSystem.consumeMouseMovement();
      if (mouseDelta.deltaX !== 0) {
        this.gameStateManager.updateMouseLook(mouseDelta.deltaX);
      }

      // Update enemies with raycasting function
      this.gameStateManager.updateEnemies((startX, startY, angle) =>
        this.renderingSystem.castRay(startX, startY, angle, gameState.worldMap)
      );
    }

    // Always render (even when paused)
    const finalState = this.gameStateManager.getState();
    this.renderingSystem.render(
      finalState.player.x,
      finalState.player.y,
      finalState.player.angle,
      finalState.enemies.map((enemy) => ({
        x: enemy.x,
        y: enemy.y,
        state: enemy.state,
        health: enemy.health,
        maxHealth: enemy.maxHealth,
        enemyType: enemy.enemyType,
        isHurt: enemy.isHurt,
      })),
      finalState.pickups.map((pickup) => ({
        x: pickup.x,
        y: pickup.y,
        type: pickup.type,
        value: pickup.value,
        spawnTime: pickup.spawnTime,
        animationOffset: pickup.animationOffset,
        weaponType: pickup.weaponType,
      })),
      finalState.worldMap,
      currentTime,
      finalState.player.weapon,
      finalState.player.isAttacking,
      finalState.player.muzzleFlash,
      this.gameStateManager.getWeaponRange()
    );

    // Continue the game loop
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    // this.lastFrameTime = performance.now();

    // Initialize audio state tracking
    const initialState = this.gameStateManager.getState();
    this.lastPlayerHealth = initialState.player.health;
    // this.lastAmmoCount = initialState.player.ammo;
    this.lastEnemyCount = initialState.enemies.length;
    this.lastPickupCount = initialState.pickups.length;
    // this.currentWeapon = initialState.player.weapon;
    // this.lastPlayerPosition = { x: initialState.player.x, y: initialState.player.y };
    this.footstepTimer = 0;
    this.victoryPlayed = false;
    this.defeatPlayed = false;

    // Start ambient music
    this.audioSystem.playAmbientMusic();

    // Add a subtle audio cue that the game has started
    setTimeout(() => {
      this.audioSystem.playSound("menu_click", 0.3);
    }, 500);

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Stop all audio
    this.audioSystem.stopAmbientMusic();
  }

  public pause(): void {
    this.gameStateManager.pause();
    this.inputSystem.exitPointerLock();
    this.audioSystem.stopAmbientMusic();
  }

  public resume(): void {
    this.gameStateManager.resume();
    this.audioSystem.playAmbientMusic();
  }

  public reset(): void {
    this.gameStateManager.reset();
    this.inputSystem.exitPointerLock();
    this.audioSystem.stopAmbientMusic();

    // Reset audio state tracking
    const newState = this.gameStateManager.getState();
    this.lastPlayerHealth = newState.player.health;
    // this.lastAmmoCount = newState.player.ammo;
    this.lastEnemyCount = newState.enemies.length;
    this.lastPickupCount = newState.pickups.length;
    // this.currentWeapon = newState.player.weapon;
    // this.lastPlayerPosition = { x: newState.player.x, y: newState.player.y };
    this.footstepTimer = 0;
    this.victoryPlayed = false;
    this.defeatPlayed = false;

    // Start ambient music for new game
    this.audioSystem.playAmbientMusic();
  }

  /**
   * Progress to the next level without resetting to level 1
   */
  public progressToNextLevel(): void {
    this.gameStateManager.progressToNextFloor();
    this.inputSystem.exitPointerLock();
    this.audioSystem.stopAmbientMusic();

    // Reset audio state tracking for new level
    const newState = this.gameStateManager.getState();
    this.lastPlayerHealth = newState.player.health;
    this.lastEnemyCount = newState.enemies.length;
    this.lastPickupCount = newState.pickups.length;
    this.footstepTimer = 0;
    this.victoryPlayed = false;
    this.defeatPlayed = false;

    // Start ambient music for new level
    this.audioSystem.playAmbientMusic();
  }

  public subscribeToGameState(
    listener: (state: GameState) => void
  ): () => void {
    return this.gameStateManager.subscribe(listener);
  }

  public resize(width: number, height: number): void {
    this.renderingSystem.resize(width, height);
  }

  public getAudioSystem(): AudioSystem {
    return this.audioSystem;
  }

  public cleanup(): void {
    this.stop();
    this.inputSystem.cleanup();
    // Don't cleanup shared audio system as it's managed externally
    this.canvas.removeEventListener(
      "mousedown",
      this.handleMouseDown.bind(this)
    );
  }
}
