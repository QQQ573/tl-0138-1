# 语文背诵打卡 · 诗句接龙连线游戏

基于 Phaser 3 开发的古诗词背诵打卡游戏，通过拖拽连线的方式强化诗句上下句记忆。

## 🎮 游戏玩法

- **左侧列**：上句（8 组）
- **右侧列**：下句 + 2-3 条干扰下句
- **操作**：从左侧上句拖拽连线到右侧下句
- **正确反馈**：连线变绿，诗句消失，得分
- **错误反馈**：红线闪回，扣除记忆分
- **连击奖励**：连对 4 组缩短连线动画并加分

## 🚀 快速开始

### 方式一：Docker 一键启动（推荐）

```bash
docker-compose up -d
```

访问 `http://localhost:8080` 即可开始游戏。

停止服务：
```bash
docker-compose down
```

### 方式二：本地 Node.js 运行

```bash
npm install
npm start
```

访问 `http://localhost:8080`

### 方式三：直接打开

直接用浏览器打开 `index.html` 即可（部分浏览器可能因 CORS 策略无法加载 JSON，建议使用前两种方式）。

## 🗺️ 关卡设置

| 关卡 | 名称 | 篇目数 | 时限 | 干扰项 | 难度 |
|------|------|--------|------|--------|------|
| 第一关 | 课标必背 60 篇 | 20+ | 120s | 2/组 | ⭐⭐ |
| 第二关 | 地方补充 20 篇 | 20 | 100s | 3/组 | ⭐⭐⭐ |
| 第三关 | 易混篇目大挑战 | 15 | 90s | 3/组 | ⭐⭐⭐⭐⭐ |

## 📊 结算统计

每关结束后展示：
- **正确配对数** / 总数
- **记忆得分**（初始 100 分，错误扣 5 分，连击奖励加分）
- **平均反应秒数**
- **用时**
- **最易混句对排行**（Top 5）

## 📝 句对 Schema

题库配置位于 `data/poetry_levels.json`，结构如下：

```json
{
  "levels": [
    {
      "id": "level1",
      "name": "关卡名称",
      "description": "关卡描述",
      "timeLimit": 120,
      "pairsPerRound": 8,
      "distractorsPerPair": 2,
      "pairs": [
        {
          "id": "唯一标识",
          "upper": "上句文本",
          "lower": "下句文本（正确答案）",
          "source": "出处，如：作者《篇名》",
          "distractors": ["干扰项1", "干扰项2", "干扰项3"]
        }
      ]
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 关卡唯一标识 |
| `name` | string | ✅ | 关卡显示名称 |
| `description` | string | - | 关卡描述文字 |
| `timeLimit` | number | ✅ | 时间上限（秒） |
| `pairsPerRound` | number | ✅ | 每轮题组数 |
| `distractorsPerPair` | number | ✅ | 每组干扰项数量建议 |
| `pairs` | array | ✅ | 诗句对数组 |
| `pairs[].id` | string | ✅ | 句对唯一 ID |
| `pairs[].upper` | string | ✅ | 上句 |
| `pairs[].lower` | string | ✅ | 正确下句 |
| `pairs[].source` | string | - | 出处/作者/篇名 |
| `pairs[].distractors` | array | ✅ | 干扰下句，建议 2-3 条 |

### 设计建议

1. **干扰项选择原则**：
   - 同作者、同体裁、同主题的诗句
   - 字数、结构相近的诗句
   - 学生常见混淆的诗句
   - 避免完全不相关的选项

2. **难度曲线建议**：

| 难度等级 | 干扰项数 | 时间/组 | 适用场景 |
|----------|----------|---------|----------|
| 入门 | 1-2 | 20-25s | 新课预习、低年级 |
| 进阶 | 2-3 | 12-15s | 复习巩固、中年级 |
| 挑战 | 3-4 | 8-10s | 竞赛训练、高年级 |
| 地狱 | 4-5 | 5-7s | 学霸专属、易混专项 |

3. **记忆分算法（可扩展）**：
   ```
   初始分: 100
   错误扣分: -5 分/次
   首次四连击: +10 分
   后续每四连击: +5 分
   快速作答加成: 反应时间 < 平均时间的 50% 额外 +2 分
   ```

## 📁 项目结构

```
.
├── index.html              # 入口页面
├── package.json            # 项目配置
├── Dockerfile              # Docker 镜像配置
├── docker-compose.yml      # Docker Compose 配置
├── data/
│   └── poetry_levels.json  # 题库数据
├── src/
│   ├── main.js             # 游戏入口
│   └── scenes/
│       ├── MenuScene.js    # 主菜单场景
│       ├── GameScene.js    # 游戏核心场景
│       └── ResultScene.js  # 结算场景
└── assets/                 # 静态资源目录
```

## 🎨 技术栈

- **Phaser 3** - 2D 游戏框架
- **Vanilla JavaScript** - 原生 JS 实现
- **Nginx** - Docker 环境静态文件服务

## 🔧 扩展开发

### 添加新关卡

编辑 `data/poetry_levels.json`，在 `levels` 数组中添加新关卡对象即可。

### 修改游戏参数

在 `GameScene.js` 中可调整：
- 记忆分初始值、扣分规则
- 连击奖励机制
- 动画时长
- 界面布局

## 📜 License

MIT
