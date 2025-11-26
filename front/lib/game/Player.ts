export class Player {
  public x: number;
  public y: number;
  public width = 40;
  public height = 30;
  private speed = 5;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  moveLeft() {
    this.x = Math.max(0, this.x - this.speed);
  }

  moveRight(canvasWidth: number) {
    this.x = Math.min(canvasWidth - this.width, this.x + this.speed);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#0f0';
    
    // Draw tank body
    ctx.fillRect(this.x + 10, this.y + 20, 20, 10);
    
    // Draw turret
    ctx.fillRect(this.x + 15, this.y + 10, 10, 15);
    
    // Draw cannon
    ctx.fillRect(this.x + 18, this.y, 4, 12);
  }
}
