export interface InputState {
  mouseLocked: boolean;
  pausePressed: boolean;
  weaponSwitchPressed: { weapon: "pistol" | "shotgun" | "chaingun" } | null;
}

export interface MovementInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  rotateLeft: boolean;
  rotateRight: boolean;
}

export class InputSystem {
  private keys: Set<string> = new Set();
  private mouseDelta = { x: 0, y: 0 };
  // private lastMouseUpdate = 0;
  private listeners: Array<(input: InputState) => void> = [];
  private inputState: InputState = {
    mouseLocked: false,
    pausePressed: false,
    weaponSwitchPressed: null,
  };

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));

    // Mouse events
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));
    document.addEventListener(
      "pointerlockchange",
      this.handlePointerLockChange.bind(this)
    );
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.code.toLowerCase();

    // Prevent browser shortcuts during gameplay
    if (
      this.inputState.mouseLocked &&
      (event.code === "Space" ||
        event.code === "ArrowUp" ||
        event.code === "ArrowDown" ||
        event.code === "ArrowLeft" ||
        event.code === "ArrowRight")
    ) {
      event.preventDefault();
    }

    this.keys.add(key);

    // Handle special input events
    if (event.code === "Escape") {
      this.inputState.pausePressed = true;
      this.notifyListeners();
      // Reset pause state immediately
      setTimeout(() => {
        this.inputState.pausePressed = false;
      }, 50);
    }

    // Handle weapon switching
    if (event.code === "Digit1" || event.code === "Numpad1") {
      this.inputState.weaponSwitchPressed = { weapon: "pistol" };
      this.notifyListeners();
      setTimeout(() => {
        this.inputState.weaponSwitchPressed = null;
      }, 50);
    } else if (event.code === "Digit2" || event.code === "Numpad2") {
      this.inputState.weaponSwitchPressed = { weapon: "shotgun" };
      this.notifyListeners();
      setTimeout(() => {
        this.inputState.weaponSwitchPressed = null;
      }, 50);
    } else if (event.code === "Digit3" || event.code === "Numpad3") {
      this.inputState.weaponSwitchPressed = { weapon: "chaingun" };
      this.notifyListeners();
      setTimeout(() => {
        this.inputState.weaponSwitchPressed = null;
      }, 50);
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.code.toLowerCase();
    this.keys.delete(key);
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.inputState.mouseLocked) {
      this.mouseDelta.x += event.movementX;
      this.mouseDelta.y += event.movementY;
      // this.lastMouseUpdate = performance.now();
    }
  }

  private handlePointerLockChange(): void {
    this.inputState.mouseLocked = document.pointerLockElement !== null;
    this.notifyListeners();
  }

  public getMovementInput(): MovementInput {
    return {
      forward: this.keys.has("keyw") || this.keys.has("arrowup"),
      backward: this.keys.has("keys") || this.keys.has("arrowdown"),
      left: this.keys.has("keya") || this.keys.has("arrowleft"),
      right: this.keys.has("keyd") || this.keys.has("arrowright"),
      rotateLeft: this.keys.has("keyq"),
      rotateRight: this.keys.has("keye"),
    };
  }

  public consumeMouseMovement(): { deltaX: number; deltaY: number } {
    const result = { deltaX: this.mouseDelta.x, deltaY: this.mouseDelta.y };
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return result;
  }

  public getInputState(): InputState {
    return { ...this.inputState };
  }

  public subscribe(listener: (input: InputState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getInputState()));
  }

  public requestPointerLock(element: HTMLElement): void {
    element.requestPointerLock();
  }

  public exitPointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  public cleanup(): void {
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));
    document.removeEventListener("keyup", this.handleKeyUp.bind(this));
    document.removeEventListener("mousemove", this.handleMouseMove.bind(this));
    document.removeEventListener(
      "pointerlockchange",
      this.handlePointerLockChange.bind(this)
    );
    this.keys.clear();
    this.listeners = [];
  }
}
