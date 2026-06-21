class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  init(data) {
    this.resultData = data;
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    const isWin = this.resultData.isWin;
    const titleText = isWin ? '🎉 过关成功！' : '⏰ 时间到！';
    const titleColor = isWin ? '#2ecc71' : '#e74c3c';

    const title = this.add.text(width / 2, 60, titleText, {
      fontSize: '40px',
      fontStyle: 'bold',
      color: titleColor,
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const levelName = this.add.text(width / 2, 100, this.resultData.levelData.name, {
      fontSize: '18px',
      color: '#bdc3c7'
    }).setOrigin(0.5);

    const statsY = 160;
    const statWidth = 180;
    const stats = [
      { label: '正确配对', value: `${this.resultData.correctCount}/${this.resultData.totalPairs}`, color: '#2ecc71' },
      { label: '记忆得分', value: this.resultData.memoryScore, color: '#f39c12' },
      { label: '平均反应', value: `${this.resultData.avgReactionTime}s`, color: '#3498db' },
      { label: '用时', value: `${this.resultData.timeUsed}s`, color: '#9b59b6' }
    ];

    stats.forEach((stat, index) => {
      const x = width / 2 - (stats.length - 1) * statWidth / 2 + index * statWidth;
      const card = this.add.rectangle(x, statsY, statWidth - 10, 80, 0x2c3e50)
        .setStrokeStyle(2, 0x34495e);

      const valueText = this.add.text(x, statsY - 10, stat.value, {
        fontSize: '28px',
        fontStyle: 'bold',
        color: stat.color
      }).setOrigin(0.5);

      const labelText = this.add.text(x, statsY + 20, stat.label, {
        fontSize: '14px',
        color: '#bdc3c7'
      }).setOrigin(0.5);
    });

    const wrongTitle = this.add.text(width / 2, 260, '🔴 最易混句对排行', {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#e74c3c'
    }).setOrigin(0.5);

    const confusing = this.resultData.mostConfusing || [];
    if (confusing.length === 0 && this.resultData.wrongPairs && this.resultData.wrongPairs.length > 0) {
      const wrongSet = {};
      this.resultData.wrongPairs.forEach(wp => {
        const key = wp.upper + '||' + wp.selected;
        if (!wrongSet[key]) {
          wrongSet[key] = { ...wp, count: 1 };
        } else {
          wrongSet[key].count++;
        }
      });
      confusing.push(...Object.values(wrongSet).slice(0, 5));
    }

    var allCorrect = this.resultData.correctCount === this.resultData.totalPairs
      && this.resultData.wrongCount === 0;

    if (confusing.length > 0) {
      var itemY = 300;
      var itemHeight = 50;

      for (var idx = 0; idx < Math.min(5, confusing.length); idx++) {
        var item = confusing[idx];
        var y = itemY + idx * (itemHeight + 8);
        var rank = idx + 1;

        this.add.rectangle(width / 2, y, 700, itemHeight, 0x2c3e50, 0.8)
          .setStrokeStyle(1, 0x34495e);

        var rankColor = rank === 1 ? '#e74c3c' : rank === 2 ? '#e67e22' : rank === 3 ? '#f1c40f' : '#7f8c8d';
        this.add.text(width / 2 - 330, y, '#' + rank, {
          fontSize: '18px',
          fontStyle: 'bold',
          color: rankColor
        }).setOrigin(0, 0.5);

        this.add.text(width / 2 - 280, y, item.upper, {
          fontSize: '15px',
          color: '#ecf0f1'
        }).setOrigin(0, 0.5);

        this.add.text(width / 2 - 30, y, '→', {
          fontSize: '16px',
          color: '#e74c3c',
          fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        this.add.text(width / 2, y, item.selected, {
          fontSize: '15px',
          color: '#e74c3c'
        }).setOrigin(0, 0.5);

        this.add.text(width / 2 + 320, y, '正确: ' + item.correct, {
          fontSize: '12px',
          color: '#2ecc71'
        }).setOrigin(1, 0.5);
      }
    } else if (allCorrect) {
      this.add.text(width / 2, 320, '✨ 全部正确！完美通关！', {
        fontSize: '24px',
        color: '#2ecc71',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    } else if (!isWin) {
      var remain = this.resultData.totalPairs - this.resultData.correctCount;
      this.add.text(width / 2, 320, '⚠️ 时间到！还剩 ' + remain + ' 组未完成', {
        fontSize: '24px',
        color: '#e67e22',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    } else {
      this.add.text(width / 2, 320, '✅ 完成！有错误配对，继续加油', {
        fontSize: '22px',
        color: '#f39c12',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }

    const tipY = 500;
    const tipText = this.add.text(width / 2, tipY, '💡 提示：易错句对建议重点复习，加深记忆', {
      fontSize: '14px',
      color: '#95a5a6'
    }).setOrigin(0.5);

    const btnY = 560;
    const btnWidth = 200;
    const btnHeight = 50;

    const retryBtn = this.add.rectangle(width / 2 - 120, btnY, btnWidth, btnHeight, 0x3498db, 0.9)
      .setStrokeStyle(2, 0x2980b9)
      .setInteractive({ useHandCursor: true });

    const retryText = this.add.text(width / 2 - 120, btnY, '🔄 再来一次', {
      fontSize: '18px',
      color: '#fff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const menuBtn = this.add.rectangle(width / 2 + 120, btnY, btnWidth, btnHeight, 0x95a5a6, 0.9)
      .setStrokeStyle(2, 0x7f8c8d)
      .setInteractive({ useHandCursor: true });

    const menuText = this.add.text(width / 2 + 120, btnY, '🏠 返回菜单', {
      fontSize: '18px',
      color: '#fff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    retryBtn.on('pointerover', () => {
      retryBtn.setFillStyle(0x3498db, 1);
    });
    retryBtn.on('pointerout', () => {
      retryBtn.setFillStyle(0x3498db, 0.9);
    });
    retryBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { levelIndex: this.resultData.levelIndex, levelData: this.resultData.levelData });
    });

    menuBtn.on('pointerover', () => {
      menuBtn.setFillStyle(0x95a5a6, 1);
    });
    menuBtn.on('pointerout', () => {
      menuBtn.setFillStyle(0x95a5a6, 0.9);
    });
    menuBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    if (isWin && this.resultData.levelIndex < 2) {
      var nextBtn = this.add.rectangle(width / 2, btnY - 70, btnWidth + 40, btnHeight, 0x2ecc71, 0.9)
        .setStrokeStyle(2, 0x27ae60)
        .setInteractive({ useHandCursor: true });

      var nextText = this.add.text(width / 2, btnY - 70, '➡️ 下一关', {
        fontSize: '18px',
        color: '#fff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      nextBtn.on('pointerover', function() { nextBtn.setFillStyle(0x2ecc71, 1); });
      nextBtn.on('pointerout', function() { nextBtn.setFillStyle(0x2ecc71, 0.9); });
      var self = this;
      nextBtn.on('pointerdown', function() {
        self.scene.start('GameScene', {
          levelIndex: self.resultData.levelIndex + 1,
          levelData: self.cache.json.get('poetryLevels').levels[self.resultData.levelIndex + 1]
        });
      });

      retryBtn.x = width / 2 - 180;
      retryText.x = width / 2 - 180;
      menuBtn.x = width / 2 + 180;
      menuText.x = width / 2 + 180;
    }
  }
}
