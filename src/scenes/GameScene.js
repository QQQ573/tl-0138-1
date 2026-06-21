class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.levelIndex = data.levelIndex;
    this.levelData = data.levelData;
    this.pairsPerRound = this.levelData.pairsPerRound || 8;
    this.timeLimit = this.levelData.timeLimit || 120;
    this.distractorsPerRound = 3;

    this.memoryScore = 100;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.combo = 0;
    this.bonusScore = 0;
    this.isGameOver = false;
    this.timeRemaining = this.timeLimit;

    this.correctPairs = [];
    this.wrongPairs = [];
    this.reactionTimes = [];
    this.lastPairStartTime = 0;

    this.leftItems = [];
    this.rightItems = [];
    this.activeLine = null;
    this.draggingItem = null;
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x2c3e50);

    this.topBar = this.add.rectangle(width / 2, 30, width, 60, 0x34495e);
    this.topBar.setDepth(10);

    this.levelText = this.add.text(20, 30, this.levelData.name, {
      fontSize: '18px',
      color: '#f39c12',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(11);

    this.scoreText = this.add.text(width / 2 - 100, 30, '记忆分: 100', {
      fontSize: '18px',
      color: '#2ecc71',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(11);

    this.comboText = this.add.text(width / 2 + 20, 30, '连击: 0', {
      fontSize: '18px',
      color: '#e67e22',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(11);

    this.timeText = this.add.text(width - 20, 30, `⏱ ${this.timeLimit}s`, {
      fontSize: '20px',
      color: '#fff',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5).setDepth(11);

    this.graphics = this.add.graphics();
    this.lineGraphics = this.add.graphics();

    this.setupRound();
    this.startTimer();

    this.input.on('pointermove', (pointer) => {
      if (this.draggingItem && this.activeLine) {
        this.updateLine(pointer.x, pointer.y);
      }
    });

    this.input.on('pointerup', (pointer) => {
      if (this.draggingItem) {
        this.endDrag(pointer);
      }
    });

    this.backBtn = this.add.text(20, height - 25, '← 返回菜单', {
      fontSize: '14px',
      color: '#bdc3c7'
    }).setOrigin(0, 0.5).setDepth(11).setInteractive({ useHandCursor: true });

    this.backBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    this.backBtn.on('pointerover', () => {
      this.backBtn.setColor('#fff');
    });

    this.backBtn.on('pointerout', () => {
      this.backBtn.setColor('#bdc3c7');
    });
  }

  setupRound() {
    const allPairs = Phaser.Utils.Array.Shuffle([...this.levelData.pairs]);
    this.roundPairs = allPairs.slice(0, this.pairsPerRound);

    const distractors = [];
    const usedDistractors = new Set();

    this.roundPairs.forEach(pair => {
      pair.distractors.forEach(d => {
        if (!usedDistractors.has(d) && distractors.length < this.distractorsPerRound) {
          distractors.push(d);
          usedDistractors.add(d);
        }
      });
    });

    if (distractors.length < this.distractorsPerRound) {
      const otherPairs = allPairs.filter(p => !this.roundPairs.includes(p));
      for (let i = 0; i < otherPairs.length && distractors.length < this.distractorsPerRound; i++) {
        if (!usedDistractors.has(otherPairs[i].lower)) {
          distractors.push(otherPairs[i].lower);
          usedDistractors.add(otherPairs[i].lower);
        }
      }
    }

    this.rightOptions = [];
    this.roundPairs.forEach(pair => {
      this.rightOptions.push({ text: pair.lower, isCorrect: true, pairId: pair.id, pair: pair });
    });
    distractors.forEach(d => {
      this.rightOptions.push({ text: d, isCorrect: false, pairId: null, pair: null });
    });

    Phaser.Utils.Array.Shuffle(this.rightOptions);
    Phaser.Utils.Array.Shuffle(this.roundPairs);

    this.createItems();
    this.lastPairStartTime = this.time.now;
  }

  createItems() {
    const { width, height } = this.scale;
    const leftX = 180;
    const rightX = width - 180;
    const startY = 100;
    const itemHeight = 55;
    const totalItems = Math.max(this.roundPairs.length, this.rightOptions.length);
    const gap = (height - 180 - totalItems * itemHeight) / (totalItems + 1);

    this.roundPairs.forEach((pair, index) => {
      const y = startY + gap + index * (itemHeight + gap) + itemHeight / 2;
      const item = this.createLeftItem(leftX, y, pair);
      this.leftItems.push(item);
    });

    this.rightOptions.forEach((option, index) => {
      const y = startY + gap + index * (itemHeight + gap) + itemHeight / 2;
      const item = this.createRightItem(rightX, y, option);
      this.rightItems.push(item);
    });
  }

  createLeftItem(x, y, pair) {
    const container = this.add.container(x, y);
    const width = 280;
    const height = 50;

    const bg = this.add.rectangle(0, 0, width, height, 0x3498db, 0.9)
      .setStrokeStyle(2, 0x2980b9);

    const text = this.add.text(10, 0, pair.upper, {
      fontSize: '18px',
      color: '#fff',
      fontStyle: 'bold',
      wordWrap: { width: width - 20 }
    }).setOrigin(0, 0.5);

    const dot = this.add.circle(width / 2 - 5, 0, 8, 0xf39c12)
      .setStrokeStyle(2, 0xe67e22);

    container.add([bg, text, dot]);
    container.setSize(width, height);
    container.setInteractive(new Phaser.Geom.Rectangle(-width/2, -height/2, width, height), Phaser.Geom.Rectangle.Contains);

    container.pair = pair;
    container.itemType = 'left';
    container.isMatched = false;
    container.bg = bg;
    container.dot = dot;

    container.on('pointerdown', (pointer) => {
      if (container.isMatched || this.isGameOver) return;
      this.startDrag(container, pointer);
    });

    return container;
  }

  createRightItem(x, y, option) {
    const container = this.add.container(x, y);
    const width = 280;
    const height = 50;

    const bg = this.add.rectangle(0, 0, width, height, 0x9b59b6, 0.9)
      .setStrokeStyle(2, 0x8e44ad);

    const text = this.add.text(-10, 0, option.text, {
      fontSize: '18px',
      color: '#fff',
      wordWrap: { width: width - 20 }
    }).setOrigin(1, 0.5);

    const dot = this.add.circle(-width / 2 + 5, 0, 8, 0xecf0f1)
      .setStrokeStyle(2, 0xbdc3c7);

    container.add([bg, text, dot]);
    container.setSize(width, height);
    container.setInteractive(new Phaser.Geom.Rectangle(-width/2, -height/2, width, height), Phaser.Geom.Rectangle.Contains);

    container.option = option;
    container.itemType = 'right';
    container.isMatched = false;
    container.bg = bg;
    container.dot = dot;

    return container;
  }

  startDrag(item, pointer) {
    this.draggingItem = item;
    this.lineGraphics.clear();
    this.activeLine = {
      startX: item.x + 135,
      startY: item.y,
      endX: pointer.x,
      endY: pointer.y
    };
    this.updateLine(pointer.x, pointer.y);
    item.dot.setFillStyle(0xf1c40f);
  }

  updateLine(endX, endY) {
    if (!this.activeLine) return;
    this.activeLine.endX = endX;
    this.activeLine.endY = endY;

    this.lineGraphics.clear();
    this.lineGraphics.lineStyle(4, 0xf39c12, 0.8);
    this.lineGraphics.beginPath();
    this.lineGraphics.moveTo(this.activeLine.startX, this.activeLine.startY);

    const midX = (this.activeLine.startX + endX) / 2;
    this.lineGraphics.bezierCurveTo(
      midX, this.activeLine.startY,
      midX, endY,
      endX, endY
    );
    this.lineGraphics.strokePath();
  }

  endDrag(pointer) {
    if (!this.draggingItem || !this.activeLine) return;

    const target = this.findRightTarget(pointer.x, pointer.y);

    if (target) {
      this.checkMatch(this.draggingItem, target);
    } else {
      this.resetDrag();
    }
  }

  findRightTarget(x, y) {
    for (const item of this.rightItems) {
      if (item.isMatched) continue;
      const bounds = item.getBounds();
      if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) {
        return item;
      }
    }
    return null;
  }

  checkMatch(leftItem, rightItem) {
    const pair = leftItem.pair;
    const option = rightItem.option;
    const isCorrect = option.isCorrect && option.pairId === pair.id;

    const reactionTime = (this.time.now - this.lastPairStartTime) / 1000;

    if (isCorrect) {
      this.handleCorrect(leftItem, rightItem, pair, reactionTime);
    } else {
      this.handleWrong(leftItem, rightItem, pair, reactionTime);
    }
  }

  handleCorrect(leftItem, rightItem, pair, reactionTime) {
    this.correctCount++;
    this.combo++;
    this.reactionTimes.push(reactionTime);
    this.correctPairs.push({ pair, reactionTime });

    this.playCorrectAnimation(leftItem, rightItem);

    if (this.combo === 4) {
      this.bonusScore += 10;
      this.showBonus('四连击！+10分 连线加速！');
    } else if (this.combo > 0 && this.combo % 4 === 0) {
      this.bonusScore += 5;
      this.showBonus(`${this.combo}连击！+5分`);
    }

    this.updateUI();
    this.lastPairStartTime = this.time.now;
    this.draggingItem = null;
    this.activeLine = null;

    this.time.delayedCall(600, () => {
      if (this.correctCount >= this.pairsPerRound) {
        this.endGame(true);
      }
    });
  }

  handleWrong(leftItem, rightItem, pair, reactionTime) {
    this.wrongCount++;
    this.combo = 0;
    this.memoryScore = Math.max(0, this.memoryScore - 5);

    const wrongPair = {
      upper: pair.upper,
      selected: rightItem.option.text,
      correct: pair.lower,
      source: pair.source
    };
    this.wrongPairs.push(wrongPair);

    this.playWrongAnimation(leftItem, rightItem);
    this.updateUI();
    this.draggingItem = null;
    this.activeLine = null;
  }

  playCorrectAnimation(leftItem, rightItem) {
    leftItem.isMatched = true;
    rightItem.isMatched = true;

    const startX = leftItem.x + 135;
    const startY = leftItem.y;
    const endX = rightItem.x - 135;
    const endY = rightItem.y;

    const animDuration = this.combo >= 4 ? 200 : 400;

    const progress = { value: 0 };
    this.tweens.add({
      targets: progress,
      value: 1,
      duration: animDuration,
      ease: 'Power2.easeOut',
      onUpdate: () => {
        this.lineGraphics.clear();
        this.lineGraphics.lineStyle(5, 0x2ecc71, 1);
        this.lineGraphics.beginPath();
        this.lineGraphics.moveTo(startX, startY);
        const midX = (startX + endX) / 2;
        const curX = startX + (endX - startX) * progress.value;
        const curY = startY + (endY - startY) * progress.value;
        this.lineGraphics.bezierCurveTo(
          midX, startY,
          midX, curY,
          curX, curY
        );
        this.lineGraphics.strokePath();
      },
      onComplete: () => {
        this.tweens.add({
          targets: [leftItem, rightItem],
          alpha: 0,
          scale: 0.8,
          duration: 300,
          ease: 'Power2.easeIn',
          onComplete: () => {
            leftItem.setVisible(false);
            rightItem.setVisible(false);
            this.lineGraphics.clear();
          }
        });
      }
    });

    leftItem.bg.setFillStyle(0x2ecc71);
    rightItem.bg.setFillStyle(0x2ecc71);
    leftItem.dot.setFillStyle(0x2ecc71);
    rightItem.dot.setFillStyle(0x2ecc71);
  }

  playWrongAnimation(leftItem, rightItem) {
    const startX = leftItem.x + 135;
    const startY = leftItem.y;
    const midX = (startX + rightItem.x - 135) / 2;

    const shake = { value: 0 };
    this.tweens.add({
      targets: shake,
      value: 1,
      duration: 500,
      ease: 'Elastic.easeOut',
      onUpdate: () => {
        this.lineGraphics.clear();
        this.lineGraphics.lineStyle(5, 0xe74c3c, 1);
        this.lineGraphics.beginPath();
        this.lineGraphics.moveTo(startX, startY);

        const offset = Math.sin(shake.value * Math.PI * 6) * 10 * (1 - shake.value);
        const endX = rightItem.x - 135 + offset;
        const endY = rightItem.y + offset;

        this.lineGraphics.bezierCurveTo(
          midX + offset, startY,
          midX - offset, endY,
          endX, endY
        );
        this.lineGraphics.strokePath();
      },
      onComplete: () => {
        this.lineGraphics.clear();
        leftItem.dot.setFillStyle(0xf39c12);
      }
    });

    leftItem.bg.setFillStyle(0xe74c3c);
    rightItem.bg.setFillStyle(0xe74c3c);
    leftItem.dot.setFillStyle(0xe74c3c);
    rightItem.dot.setFillStyle(0xe74c3c);

    this.time.delayedCall(500, () => {
      leftItem.bg.setFillStyle(0x3498db);
      rightItem.bg.setFillStyle(0x9b59b6);
      rightItem.dot.setFillStyle(0xecf0f1);
    });
  }

  showBonus(text) {
    const { width } = this.scale;
    const bonusText = this.add.text(width / 2, 200, text, {
      fontSize: '28px',
      color: '#f1c40f',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: bonusText,
      y: 150,
      alpha: 0,
      duration: 1200,
      ease: 'Power2.easeOut',
      onComplete: () => bonusText.destroy()
    });
  }

  resetDrag() {
    if (this.draggingItem) {
      this.draggingItem.dot.setFillStyle(0xf39c12);
    }
    this.draggingItem = null;
    this.activeLine = null;
    this.lineGraphics.clear();
  }

  updateUI() {
    this.scoreText.setText(`记忆分: ${this.memoryScore + this.bonusScore}`);
    this.comboText.setText(`连击: ${this.combo}`);

    if (this.memoryScore + this.bonusScore >= 80) {
      this.scoreText.setColor('#2ecc71');
    } else if (this.memoryScore + this.bonusScore >= 50) {
      this.scoreText.setColor('#f39c12');
    } else {
      this.scoreText.setColor('#e74c3c');
    }
  }

  startTimer() {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeRemaining--;
        this.timeText.setText(`⏱ ${this.timeRemaining}s`);

        if (this.timeRemaining <= 10) {
          this.timeText.setColor('#e74c3c');
        }

        if (this.timeRemaining <= 0) {
          this.endGame(false);
        }
      },
      loop: true
    });
  }

  endGame(isWin) {
    if (this.isGameOver) return;
    this.isGameOver = true;

    if (this.timerEvent) {
      this.timerEvent.remove();
    }

    const avgReaction = this.reactionTimes.length > 0
      ? (this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length).toFixed(2)
      : 0;

    const wrongCounts = {};
    this.wrongPairs.forEach(wp => {
      const key = wp.upper + ' → ' + wp.selected;
      wrongCounts[key] = (wrongCounts[key] || 0) + 1;
    });

    const mostConfusing = Object.entries(wrongCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => {
        const wp = this.wrongPairs.find(w => (w.upper + ' → ' + w.selected) === key);
        return { upper: wp.upper, selected: wp.selected, correct: wp.correct, source: wp.source, count };
      });

    this.scene.start('ResultScene', {
      levelIndex: this.levelIndex,
      levelData: this.levelData,
      isWin,
      correctCount: this.correctCount,
      wrongCount: this.wrongCount,
      totalPairs: this.pairsPerRound,
      memoryScore: this.memoryScore + this.bonusScore,
      avgReactionTime: parseFloat(avgReaction),
      mostConfusing,
      wrongPairs: this.wrongPairs,
      timeUsed: this.timeLimit - this.timeRemaining
    });
  }
}
