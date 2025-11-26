export class Bullet {
  public x: number;
  public y: number;
  public width = 3;
  public height = 10;
  private speed = 8;
  private direction: number;

  constructor(x: number, y: number, direction: number) {
    this.x = x;
    this.y = y;
    this.direction = direction;
  }

  update() {
    this.y += this.speed * this.direction;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.direction === -1 ? '#fff' : '#f00';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}
