import { Player } from './Player';
import { Alien } from './Alien';
import { Bullet } from './Bullet';
import { Barrier } from './Barrier';

interface GameCallbacks {
  onLevelComplete: (level: number) => void;
  onGameOver: (levelsCompleted: number) => void;
  onTimeUpdate: (timeRemaining: number) => void;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private player: Player;
  private aliens: Alien[] = [];
  private bullets: Bullet[] = [];
  private alienBullets: Bullet[] = [];
  private barriers: Barrier[] = [];
  private animationId: number | null = null;
  private keys: { [key: string]: boolean } = {};
  private callbacks: GameCallbacks;
  private alienDirection = 1;
  private alienMoveTimer = 0;
  private alienMoveInterval = 30;
  private alienShootTimer = 0;
  
  // Level system
  private currentLevel = 1;
  private maxLevels = 5;
  private levelStartTime = 0;
  private levelTimeLimit = 60; // 60 seconds per level
  private timeRemaining = 60;
  private timerInterval: NodeJS.Timeout | null = null;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks, startLevel: number = 1) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.callbacks = callbacks;
    this.currentLevel = startLevel;
    this.player = new Player(canvas.width / 2, canvas.height - 60);
    
    this.initLevel();
    this.initBarriers();
    this.setupEventListeners();
    this.startLevelTimer();
  }

  private initLevel() {
    this.aliens = [];
    const aliensPerRow = 11;
    const rows = this.currentLevel; // Level 1 = 1 row (11 aliens), Level 5 = 5 rows (55 aliens)
    const spacing = 60;
    const offsetX = 100;
    const offsetY = 80;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < aliensPerRow; col++) {
        const type = row === 0 ? 3 : row <= 2 ? 2 : 1;
        this.aliens.push(
          new Alien(
            offsetX + col * spacing,
            offsetY + row * spacing,
            type
          )
        );
      }
    }
  }

  private initBarriers() {
    this.barriers = [];
    const positions = [150, 300, 450, 600];
    positions.forEach(x => {
      this.barriers.push(new Barrier(x, this.canvas.height - 150));
    });
  }

  private setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      if (e.key === ' ') {
        e.preventDefault();
        this.shoot();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
  }

  private startLevelTimer() {
    this.levelStartTime = Date.now();
    this.timeRemaining = this.levelTimeLimit;
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.levelStartTime) / 1000);
      this.timeRemaining = Math.max(0, this.levelTimeLimit - elapsed);
      this.callbacks.onTimeUpdate(this.timeRemaining);
      
      if (this.timeRemaining <= 0) {
        this.handleTimeUp();
      }
    }, 1000);
  }

  private handleTimeUp() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.stop();
    this.callbacks.onGameOver(this.currentLevel - 1);
  }

  private shoot() {
    if (this.bullets.length < 3) {
      this.bullets.push(
        new Bullet(this.player.x + this.player.width / 2, this.player.y, -1)
      );
    }
  }

  private alienShoot() {
    if (this.aliens.length === 0) return;
    
    const bottomAliens = this.getBottomAliens();
    if (bottomAliens.length > 0) {
      const shooter = bottomAliens[Math.floor(Math.random() * bottomAliens.length)];
      this.alienBullets.push(
        new Bullet(shooter.x + shooter.width / 2, shooter.y + shooter.height, 1)
      );
    }
  }

  private getBottomAliens(): Alien[] {
    const columns: { [key: number]: Alien } = {};
    
    this.aliens.forEach(alien => {
      const col = Math.floor(alien.x / 60);
      if (!columns[col] || alien.y > columns[col].y) {
        columns[col] = alien;
      }
    });
    
    return Object.values(columns);
  }

  private update() {
    // Move player
    if (this.keys['ArrowLeft']) {
      this.player.moveLeft();
    }
    if (this.keys['ArrowRight']) {
      this.player.moveRight(this.canvas.width);
    }

    // Move aliens
    this.alienMoveTimer++;
    if (this.alienMoveTimer >= this.alienMoveInterval) {
      this.alienMoveTimer = 0;
      
      let shouldMoveDown = false;
      this.aliens.forEach(alien => {
        if (
          (alien.x <= 0 && this.alienDirection === -1) ||
          (alien.x + alien.width >= this.canvas.width && this.alienDirection === 1)
        ) {
          shouldMoveDown = true;
        }
      });

      if (shouldMoveDown) {
        this.alienDirection *= -1;
        this.aliens.forEach(alien => alien.moveDown());
      } else {
        this.aliens.forEach(alien => alien.move(this.alienDirection));
      }

      // Speed up aliens as fewer remain
      this.alienMoveInterval = Math.max(10, 30 - (this.currentLevel * 11 - this.aliens.length));
    }

    // Alien shooting
    this.alienShootTimer++;
    if (this.alienShootTimer >= 60) {
      this.alienShootTimer = 0;
      if (Math.random() < 0.5) {
        this.alienShoot();
      }
    }

    // Update bullets
    this.bullets = this.bullets.filter(bullet => {
      bullet.update();
      return bullet.y > 0;
    });

    this.alienBullets = this.alienBullets.filter(bullet => {
      bullet.update();
      return bullet.y < this.canvas.height;
    });

    // Check collisions
    this.checkCollisions();

    // Check level complete
    if (this.aliens.length === 0) {
      this.handleLevelComplete();
    }

    // Check if aliens reached bottom
    this.aliens.forEach(alien => {
      if (alien.y + alien.height >= this.player.y) {
        this.handleGameOver();
      }
    });
  }

  private handleLevelComplete() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    this.stop();
    this.callbacks.onLevelComplete(this.currentLevel);
  }

  private handleGameOver() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    this.stop();
    this.callbacks.onGameOver(this.currentLevel - 1);
  }

  private checkCollisions() {
    // Player bullets vs aliens
    this.bullets.forEach((bullet, bulletIndex) => {
      this.aliens.forEach((alien, alienIndex) => {
        if (this.checkCollision(bullet, alien)) {
          this.bullets.splice(bulletIndex, 1);
          this.aliens.splice(alienIndex, 1);
        }
      });

      // Bullets vs barriers
      this.barriers.forEach(barrier => {
        if (barrier.checkCollision(bullet.x, bullet.y)) {
          this.bullets.splice(bulletIndex, 1);
        }
      });
    });

    // Alien bullets vs player
    this.alienBullets.forEach((bullet, bulletIndex) => {
      if (this.checkCollision(bullet, this.player)) {
        this.alienBullets.splice(bulletIndex, 1);
        this.handleGameOver();
      }

      // Alien bullets vs barriers
      this.barriers.forEach(barrier => {
        if (barrier.checkCollision(bullet.x, bullet.y)) {
          this.alienBullets.splice(bulletIndex, 1);
        }
      });
    });
  }

  private checkCollision(obj1: any, obj2: any): boolean {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  }

  private draw() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.player.draw(this.ctx);
    this.aliens.forEach(alien => alien.draw(this.ctx));
    this.bullets.forEach(bullet => bullet.draw(this.ctx));
    this.alienBullets.forEach(bullet => bullet.draw(this.ctx));
    this.barriers.forEach(barrier => barrier.draw(this.ctx));

    // Draw level info
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px monospace';
    this.ctx.fillText(`Level ${this.currentLevel}/${this.maxLevels}`, 20, 30);
    this.ctx.fillText(`Aliens: ${this.aliens.length}`, 20, 55);
    this.ctx.fillText(`Time: ${this.timeRemaining}s`, this.canvas.width - 150, 30);
  }

  private gameLoop = () => {
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  public start() {
    this.gameLoop();
  }

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public nextLevel() {
    if (this.currentLevel < this.maxLevels) {
      this.currentLevel++;
      this.initLevel();
      this.initBarriers();
      this.bullets = [];
      this.alienBullets = [];
      this.alienDirection = 1;
      this.alienMoveTimer = 0;
      this.alienShootTimer = 0;
      this.startLevelTimer();
      this.start();
    }
  }

  public getCurrentLevel(): number {
    return this.currentLevel;
  }
}
