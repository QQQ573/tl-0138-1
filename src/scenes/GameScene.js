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

    this.timeText = this.add.text(width - 20, 30, '⏱ ' + this.timeLimit + 's', {
      fontSize: '20px',
      color: '#fff',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5).setDepth(11);

    this.graphics = this.add.graphics();
    this.lineGraphics = this.add.graphics();
    this.lineGraphics.setDepth(5);

    this.setupRound();
    this.startTimer();

    this.input.on('pointermove', function(pointer) {
      if (this.draggingItem && this.activeLine) {
        this.updateLine(pointer.x, pointer.y);
      }
    }, this);

    this.input.on('pointerup', function(pointer) {
      if (this.draggingItem) {
        this.endDrag(pointer);
      }
    }, this);

    this.backBtn = this.add.text(20, height - 25, '← 返回菜单', {
      fontSize: '14px',
      color: '#bdc3c7'
    }).setOrigin(0, 0.5).setDepth(11).setInteractive({ useHandCursor: true });

    this.backBtn.on('pointerdown', function() {
      this.scene.start('MenuScene');
    }, this);

    this.backBtn.on('pointerover', function() {
      this.backBtn.setColor('#fff');
    }, this);

    this.backBtn.on('pointerout', function() {
      this.backBtn.setColor('#bdc3c7');
    }, this);
  }

  setupRound() {
    var allPairs = Phaser.Utils.Array.Shuffle([...this.levelData.pairs]);
    this.roundPairs = allPairs.slice(0, this.pairsPerRound);

    var distractors = [];
    var usedDistractors = new Set();

    for (var i = 0; i < this.roundPairs.length; i++) {
      var pair = this.roundPairs[i];
      for (var j = 0; j < pair.distractors.length; j++) {
        var d = pair.distractors[j];
        if (!usedDistractors.has(d) && distractors.length < this.distractorsPerRound) {
          distractors.push(d);
          usedDistractors.add(d);
        }
      }
    }

    if (distractors.length < this.distractorsPerRound) {
      var otherPairs = allPairs.filter(function(p) {
        return this.roundPairs.indexOf(p) === -1;
      }, this);
      for (var k = 0; k < otherPairs.length && distractors.length < this.distractorsPerRound; k++) {
        if (!usedDistractors.has(otherPairs[k].lower)) {
          distractors.push(otherPairs[k].lower);
          usedDistractors.add(otherPairs[k].lower);
        }
      }
    }

    this.rightOptions = [];
    for (var m = 0; m < this.roundPairs.length; m++) {
      var rp = this.roundPairs[m];
      this.rightOptions.push({ text: rp.lower, isCorrect: true, pairId: rp.id, pair: rp });
    }
    for (var n = 0; n < distractors.length; n++) {
      this.rightOptions.push({ text: distractors[n], isCorrect: false, pairId: null, pair: null });
    }

    Phaser.Utils.Array.Shuffle(this.rightOptions);
    Phaser.Utils.Array.Shuffle(this.roundPairs);

    this.createItems();
    this.lastPairStartTime = this.time.now;
  }

  createItems() {
    var width = this.scale.width;
    var height = this.scale.height;
    var leftX = 180;
    var rightX = width - 180;
    var startY = 100;
    var itemHeight = 55;
    var totalItems = Math.max(this.roundPairs.length, this.rightOptions.length);
    var gap = (height - 180 - totalItems * itemHeight) / (totalItems + 1);

    for (var i = 0; i < this.roundPairs.length; i++) {
      var pair = this.roundPairs[i];
      var y = startY + gap + i * (itemHeight + gap) + itemHeight / 2;
      var item = this.createLeftItem(leftX, y, pair);
      this.leftItems.push(item);
    }

    for (var j = 0; j < this.rightOptions.length; j++) {
      var option = this.rightOptions[j];
      var y2 = startY + gap + j * (itemHeight + gap) + itemHeight / 2;
      var item2 = this.createRightItem(rightX, y2, option);
      this.rightItems.push(item2);
    }
  }

  createLeftItem(x, y, pair) {
    var self = this;
    var itemW = 280;
    var itemH = 50;

    var hitArea = new Phaser.Geom.Rectangle(x - itemW / 2, y - itemH / 2, itemW, itemH);

    var bg = this.add.rectangle(x, y, itemW, itemH, 0x3498db, 0.9)
      .setStrokeStyle(2, 0x2980b9)
      .setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    bg.input.cursor = 'grab';

    var text = this.add.text(x - itemW / 2 + 10, y, pair.upper, {
      fontSize: '18px',
      color: '#fff',
      fontStyle: 'bold',
      wordWrap: { width: itemW - 30 }
    }).setOrigin(0, 0.5);

    var dot = this.add.circle(x + itemW / 2 - 5, y, 8, 0xf39c12)
      .setStrokeStyle(2, 0xe67e22);

    var itemObj = {
      bg: bg,
      text: text,
      dot: dot,
      x: x,
      y: y,
      pair: pair,
      itemType: 'left',
      isMatched: false,
      setVisible: function(v) {
        this.bg.setVisible(v);
        this.text.setVisible(v);
        this.dot.setVisible(v);
      },
      setAlpha: function(a) {
        this.bg.setAlpha(a);
        this.text.setAlpha(a);
        this.dot.setAlpha(a);
      }
    };

    bg.on('pointerdown', function(pointer, localX, localY, event) {
      event.stopPropagation();
      if (itemObj.isMatched || self.isGameOver) return;
      self.startDrag(itemObj, pointer);
    });

    return itemObj;
  }

  createRightItem(x, y, option) {
    var itemW = 280;
    var itemH = 50;

    var hitArea = new Phaser.Geom.Rectangle(x - itemW / 2, y - itemH / 2, itemW, itemH);

    var bg = this.add.rectangle(x, y, itemW, itemH, 0x9b59b6, 0.9)
      .setStrokeStyle(2, 0x8e44ad)
      .setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    var text = this.add.text(x + itemW / 2 - 10, y, option.text, {
      fontSize: '18px',
      color: '#fff',
      wordWrap: { width: itemW - 30 }
    }).setOrigin(1, 0.5);

    var dot = this.add.circle(x - itemW / 2 + 5, y, 8, 0xecf0f1)
      .setStrokeStyle(2, 0xbdc3c7);

    var itemObj = {
      bg: bg,
      text: text,
      dot: dot,
      x: x,
      y: y,
      option: option,
      itemType: 'right',
      isMatched: false,
      setVisible: function(v) {
        this.bg.setVisible(v);
        this.text.setVisible(v);
        this.dot.setVisible(v);
      },
      setAlpha: function(a) {
        this.bg.setAlpha(a);
        this.text.setAlpha(a);
        this.dot.setAlpha(a);
      },
      getBounds: function() {
        return new Phaser.Geom.Rectangle(x - itemW / 2, y - itemH / 2, itemW, itemH);
      }
    };

    return itemObj;
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
    item.bg.setStrokeStyle(3, 0xf1c40f);
  }

  updateLine(endX, endY) {
    if (!this.activeLine) return;
    this.activeLine.endX = endX;
    this.activeLine.endY = endY;

    this.lineGraphics.clear();
    this.lineGraphics.lineStyle(4, 0xf39c12, 0.9);
    this.drawCurve(this.activeLine.startX, this.activeLine.startY, endX, endY);
  }

  drawCurve(x1, y1, x2, y2) {
    var midX = (x1 + x2) / 2;
    var steps = 20;
    var prevX = x1;
    var prevY = y1;
    for (var i = 1; i <= steps; i++) {
      var t = i / steps;
      var it = 1 - t;
      var cx = it * it * x1 + 2 * it * t * midX + t * t * x2;
      var cy = it * it * y1 + 2 * it * t * y1 + t * t * y2;
      this.lineGraphics.lineBetween(prevX, prevY, cx, cy);
      prevX = cx;
      prevY = cy;
    }
  }

  endDrag(pointer) {
    if (!this.draggingItem || !this.activeLine) return;

    var target = this.findRightTarget(pointer.x, pointer.y);

    if (target) {
      this.checkMatch(this.draggingItem, target);
    } else {
      this.resetDrag();
    }
  }

  findRightTarget(x, y) {
    for (var i = 0; i < this.rightItems.length; i++) {
      var item = this.rightItems[i];
      if (item.isMatched) continue;
      var bounds = item.getBounds();
      if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) {
        return item;
      }
    }
    return null;
  }

  checkMatch(leftItem, rightItem) {
    var pair = leftItem.pair;
    var option = rightItem.option;
    var isCorrect = option.isCorrect && option.pairId === pair.id;

    var reactionTime = (this.time.now - this.lastPairStartTime) / 1000;

    if (isCorrect) {
      this.handleCorrect(leftItem, rightItem, pair, reactionTime);
    } else {
      this.handleWrong(leftItem, rightItem, pair, reactionTime);
    }
  }

  handleCorrect(leftItem, rightItem, pair, reactionTime) {
    var self = this;
    this.correctCount++;
    this.combo++;
    this.reactionTimes.push(reactionTime);
    this.correctPairs.push({ pair: pair, reactionTime: reactionTime });

    this.playCorrectAnimation(leftItem, rightItem);

    if (this.combo === 4) {
      this.bonusScore += 10;
      this.showBonus('四连击！+10分 连线加速！');
    } else if (this.combo > 0 && this.combo % 4 === 0) {
      this.bonusScore += 5;
      this.showBonus(this.combo + '连击！+5分');
    }

    this.updateUI();
    this.lastPairStartTime = this.time.now;
    this.draggingItem = null;
    this.activeLine = null;

    this.time.delayedCall(600, function() {
      if (self.correctCount >= self.pairsPerRound) {
        self.endGame(true);
      }
    });
  }

  handleWrong(leftItem, rightItem, pair, reactionTime) {
    this.wrongCount++;
    this.combo = 0;
    this.memoryScore = Math.max(0, this.memoryScore - 5);

    var wrongPair = {
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
    leftItem.bg.disableInteractive();
    rightItem.bg.disableInteractive();

    var startX = leftItem.x + 135;
    var startY = leftItem.y;
    var endX = rightItem.x - 135;
    var endY = rightItem.y;

    var animDuration = this.combo >= 4 ? 200 : 400;
    var self = this;

    var progress = { value: 0 };
    this.tweens.add({
      targets: progress,
      value: 1,
      duration: animDuration,
      ease: 'Power2.easeOut',
      onUpdate: function() {
        self.lineGraphics.clear();
        self.lineGraphics.lineStyle(5, 0x2ecc71, 1);
        var curX = startX + (endX - startX) * progress.value;
        var curY = startY + (endY - startY) * progress.value;
        self.drawCurve(startX, startY, curX, curY);
      },
      onComplete: function() {
        self.tweens.add({
          targets: [leftItem.bg, leftItem.text, leftItem.dot,
                    rightItem.bg, rightItem.text, rightItem.dot],
          alpha: 0,
          duration: 300,
          ease: 'Power2.easeIn',
          onComplete: function() {
            leftItem.setVisible(false);
            rightItem.setVisible(false);
            self.lineGraphics.clear();
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
    var startX = leftItem.x + 135;
    var startY = leftItem.y;
    var midX = (startX + rightItem.x - 135) / 2;
    var self = this;

    var shake = { value: 0 };
    this.tweens.add({
      targets: shake,
      value: 1,
      duration: 500,
      ease: 'Elastic.easeOut',
      onUpdate: function() {
        self.lineGraphics.clear();
        self.lineGraphics.lineStyle(5, 0xe74c3c, 1);

        var offset = Math.sin(shake.value * Math.PI * 6) * 10 * (1 - shake.value);
        var endX = rightItem.x - 135 + offset;
        var endY = rightItem.y + offset;

        var steps = 20;
        var prevX = startX;
        var prevY = startY;
        for (var si = 1; si <= steps; si++) {
          var t = si / steps;
          var it = 1 - t;
          var cx = it * it * startX + 2 * it * t * (midX + offset) + t * t * endX;
          var cy = it * it * startY + 2 * it * t * startY + t * t * endY;
          self.lineGraphics.lineBetween(prevX, prevY, cx, cy);
          prevX = cx;
          prevY = cy;
        }
      },
      onComplete: function() {
        self.lineGraphics.clear();
        leftItem.dot.setFillStyle(0xf39c12);
        leftItem.bg.setStrokeStyle(2, 0x2980b9);
      }
    });

    leftItem.bg.setFillStyle(0xe74c3c);
    rightItem.bg.setFillStyle(0xe74c3c);
    leftItem.dot.setFillStyle(0xe74c3c);
    rightItem.dot.setFillStyle(0xe74c3c);

    this.time.delayedCall(500, function() {
      leftItem.bg.setFillStyle(0x3498db);
      rightItem.bg.setFillStyle(0x9b59b6);
      rightItem.dot.setFillStyle(0xecf0f1);
    });
  }

  showBonus(text) {
    var width = this.scale.width;
    var bonusText = this.add.text(width / 2, 200, text, {
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
      onComplete: function() {
        bonusText.destroy();
      }
    });
  }

  resetDrag() {
    if (this.draggingItem) {
      this.draggingItem.dot.setFillStyle(0xf39c12);
      this.draggingItem.bg.setStrokeStyle(2, 0x2980b9);
    }
    this.draggingItem = null;
    this.activeLine = null;
    this.lineGraphics.clear();
  }

  updateUI() {
    this.scoreText.setText('记忆分: ' + (this.memoryScore + this.bonusScore));
    this.comboText.setText('连击: ' + this.combo);

    if (this.memoryScore + this.bonusScore >= 80) {
      this.scoreText.setColor('#2ecc71');
    } else if (this.memoryScore + this.bonusScore >= 50) {
      this.scoreText.setColor('#f39c12');
    } else {
      this.scoreText.setColor('#e74c3c');
    }
  }

  startTimer() {
    var self = this;
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: function() {
        self.timeRemaining--;
        self.timeText.setText('⏱ ' + self.timeRemaining + 's');

        if (self.timeRemaining <= 10) {
          self.timeText.setColor('#e74c3c');
        }

        if (self.timeRemaining <= 0) {
          self.endGame(false);
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

    var avgReaction = 0;
    if (this.reactionTimes.length > 0) {
      var total = 0;
      for (var i = 0; i < this.reactionTimes.length; i++) {
        total += this.reactionTimes[i];
      }
      avgReaction = (total / this.reactionTimes.length).toFixed(2);
    }

    var wrongCounts = {};
    for (var j = 0; j < this.wrongPairs.length; j++) {
      var wp = this.wrongPairs[j];
      var key = wp.upper + ' → ' + wp.selected;
      if (wrongCounts[key]) {
        wrongCounts[key]++;
      } else {
        wrongCounts[key] = 1;
      }
    }

    var mostConfusing = [];
    var entries = [];
    for (var k in wrongCounts) {
      entries.push([k, wrongCounts[k]]);
    }
    entries.sort(function(a, b) { return b[1] - a[1]; });

    for (var m = 0; m < Math.min(5, entries.length); m++) {
      var key2 = entries[m][0];
      var count = entries[m][1];
      var found = null;
      for (var n = 0; n < this.wrongPairs.length; n++) {
        var wp2 = this.wrongPairs[n];
        if ((wp2.upper + ' → ' + wp2.selected) === key2) {
          found = wp2;
          break;
        }
      }
      if (found) {
        mostConfusing.push({
          upper: found.upper,
          selected: found.selected,
          correct: found.correct,
          source: found.source,
          count: count
        });
      }
    }

    this.scene.start('ResultScene', {
      levelIndex: this.levelIndex,
      levelData: this.levelData,
      isWin: isWin,
      correctCount: this.correctCount,
      wrongCount: this.wrongCount,
      totalPairs: this.pairsPerRound,
      memoryScore: this.memoryScore + this.bonusScore,
      avgReactionTime: parseFloat(avgReaction),
      mostConfusing: mostConfusing,
      wrongPairs: this.wrongPairs,
      timeUsed: this.timeLimit - this.timeRemaining
    });
  }
}
