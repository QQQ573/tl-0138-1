class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    this.load.json('poetryLevels', 'data/poetry_levels.json');
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    const title = this.add.text(width / 2, 80, '📜 诗句接龙连线', {
      fontSize: '42px',
      fontStyle: 'bold',
      color: '#f39c12',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, 140, '语文背诵打卡 · 海内存知己，天涯若比邻', {
      fontSize: '18px',
      color: '#bdc3c7'
    }).setOrigin(0.5);

    const levelsData = this.cache.json.get('poetryLevels');
    this.levels = levelsData.levels;

    const startY = 200;
    const cardHeight = 110;
    const gap = 20;

    this.levels.forEach((level, index) => {
      const y = startY + index * (cardHeight + gap);
      const colors = [0x27ae60, 0x3498db, 0xe74c3c];
      const color = colors[index] || 0x9b59b6;

      const card = this.add.rectangle(width / 2, y, 600, cardHeight, color, 0.8)
        .setStrokeStyle(3, 0xffffff, 0.3)
        .setInteractive({ useHandCursor: true });

      const levelNum = this.add.text(width / 2 - 260, y - 25, `第${index + 1}关`, {
        fontSize: '16px',
        color: '#fff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      const name = this.add.text(width / 2 - 180, y - 20, level.name, {
        fontSize: '22px',
        color: '#fff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      const desc = this.add.text(width / 2 - 180, y + 15, level.description, {
        fontSize: '14px',
        color: '#ecf0f1'
      }).setOrigin(0, 0.5);

      const info = this.add.text(width / 2 + 200, y, `${level.timeLimit}秒 · ${level.pairs.length}篇`, {
        fontSize: '14px',
        color: '#fff'
      }).setOrigin(1, 0.5);

      card.on('pointerover', () => {
        card.setFillStyle(color, 1);
        card.setStrokeStyle(3, 0xffffff, 0.8);
      });

      card.on('pointerout', () => {
        card.setFillStyle(color, 0.8);
        card.setStrokeStyle(3, 0xffffff, 0.3);
      });

      card.on('pointerdown', () => {
        this.scene.start('GameScene', { levelIndex: index, levelData: level });
      });
    });

    const hint = this.add.text(width / 2, height - 50, '💡 拖拽左侧上句到右侧下句进行连线，正确则变绿消失，错误则扣记忆分', {
      fontSize: '14px',
      color: '#95a5a6'
    }).setOrigin(0.5);
  }
}
