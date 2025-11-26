export class Alien {
  public x: number;
  public y: number;
  public width = 40;
  public height = 30;
  public points: number;
  private type: number;
  private animationFrame = 0;

  constructor(x: number, y: number, type: number) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.points = type * 10;
  }

  move(direction: number) {
    this.x += direction * 10;
    this.animationFrame = (this.animationFrame + 1) % 2;
  }

  moveDown() {
    this.y += 20;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.type === 3 ? '#f00' : this.type === 2 ? '#ff0' : '#0ff';
    
    const offset = this.animationFrame * 2;
    
    // Draw alien body based on type
    if (this.type === 3) {
      // Top row - squid
      ctx.fillRect(this.x + 8 + offset, this.y, 24, 8);
      ctx.fillRect(this.x + 4 + offset, this.y + 8, 32, 8);
      ctx.fillRect(this.x + offset, this.y + 16, 40, 8);
      ctx.fillRect(this.x + 8 + offset, this.y + 24, 8, 6);
      ctx.fillRect(this.x + 24 + offset, this.y + 24, 8, 6);
    } else if (this.type === 2) {
      // Middle rows - crab
      ctx.fillRect(this.x + 4 + offset, this.y + 4, 32, 8);
      ctx.fillRect(this.x + 8 + offset, this.y + 12, 24, 8);
      ctx.fillRect(this.x + offset, this.y + 20, 12, 6);
      ctx.fillRect(this.x + 28 + offset, this.y + 20, 12, 6);
    } else {
      // Bottom rows - octopus
      ctx.fillRect(this.x + 12 + offset, this.y, 16, 8);
      ctx.fillRect(this.x + 4 + offset, this.y + 8, 32, 12);
      ctx.fillRect(this.x + offset, this.y + 20, 12, 6);
      ctx.fillRect(this.x + 28 + offset, this.y + 20, 12, 6);
    }
  }
}
