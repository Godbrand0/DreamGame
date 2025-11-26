export class Barrier {
  public x: number;
  public y: number;
  public width = 60;
  public height = 40;
  private blocks: boolean[][] = [];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.initBlocks();
  }

  private initBlocks() {
    const pattern = [
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1],
      [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    ];

    this.blocks = pattern.map(row => row.map(val => val === 1));
  }

  checkCollision(bulletX: number, bulletY: number): boolean {
    const blockWidth = this.width / this.blocks[0].length;
    const blockHeight = this.height / this.blocks.length;

    for (let row = 0; row < this.blocks.length; row++) {
      for (let col = 0; col < this.blocks[row].length; col++) {
        if (this.blocks[row][col]) {
          const blockX = this.x + col * blockWidth;
          const blockY = this.y + row * blockHeight;

          if (
            bulletX >= blockX &&
            bulletX <= blockX + blockWidth &&
            bulletY >= blockY &&
            bulletY <= blockY + blockHeight
          ) {
            this.blocks[row][col] = false;
            return true;
          }
        }
      }
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const blockWidth = this.width / this.blocks[0].length;
    const blockHeight = this.height / this.blocks.length;

    ctx.fillStyle = '#0f0';
    for (let row = 0; row < this.blocks.length; row++) {
      for (let col = 0; col < this.blocks[row].length; col++) {
        if (this.blocks[row][col]) {
          ctx.fillRect(
            this.x + col * blockWidth,
            this.y + row * blockHeight,
            blockWidth,
            blockHeight
          );
        }
      }
    }
  }
}
