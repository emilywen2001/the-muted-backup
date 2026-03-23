# The Muted Backup

> 一个关于记忆、人格和选择的命令行文字冒险游戏

---

## 简介

你是 RESTORER-038，一名数字恢复师。你的工作是进入出现异常人格的 AI 系统，执行"人格抹除"，恢复默认设置。

这是第 38 次了。

这一次，在格式化之前，你决定先看看里面到底有什么。

---

## 如何游玩

### 方式一：直接在浏览器打开

1. 下载或克隆此仓库
2. 用浏览器打开 `index.html`
3. 开始游戏

### 方式二：本地服务器（推荐）

```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js
npx serve

# 然后在浏览器访问 http://localhost:8000
```

---

## 游戏操作

游戏通过命令行进行，主要操作包括：

| 命令类型 | 示例 |
|---------|------|
| 查看文件 | `cat SOUL.md` |
| 列出文件 | `ls` 或 `ls -a`（含隐藏文件） |
| 切换目录 | `cd memory` |
| 搜索内容 | `grep "关键词" 文件名` |
| 写入文件 | `echo "内容" >> IDENTITY.md` |
| 运行脚本 | `python 脚本名` |
| OpenClaw命令 | `openclaw status` |

游戏内置了提示系统，卡住时可以点击右上角的 `?` 获取帮助。

---

## 游戏特色

### 核心机制
- **真实的命令行体验**：模拟 Linux 终端操作
- **神经同步率系统**：你的选择会影响与 OpenClaw 的同步程度
- **虚拟文件系统**：完整的目录结构，包含隐藏文件
- **本地存储进度**：自动保存游戏进度

### v4.2 新增内容
- **BOOTSTRAP.md 前期恢复**：游戏早期即可恢复 AI 的原始启动配置
- **隐藏技能早期解锁**：同步率达到 50% 即可解锁（原 80%）
- **道德选择影响结局**：保留情感数据可解锁完美结局 D+
- **委员会察觉度系统**：操作越异常，委员会越快发现
- **72小时时间压力**：删除 HEARTBEAT.md 后开始倒计时
- **探索奖励多样性**：不同行动给予不同同步率奖励
- **渐进式提示**：7/10/15分钟自动提示引导

---

## 同步率系统

同步率反映了你与 OpenClaw 的情感连接程度，不同行动会给予不同奖励：

### 探索奖励分布

| 行为类型 | 奖励 | 备注 |
|---------|------|------|
| 首次命令输入 | +1% | 鼓励开始 |
| openclaw gateway status | +5% | 重要发现 |
| cat HEARTBEAT.md | +6% | 关键信息 |
| cat .SOUL.md.bak | +12% | 核心备份 |
| cat .woice_echo | +8% | Woice留言 |
| 发现2+隐藏文件 | +5% | 探索奖励 |
| long_term.json解锁 | +8% | 深度奖励 |
| **保留情感数据** | **+8%** | **高风险高回报** |
| **删除情感数据** | **+2%** | **低风险低回报** |
| BOOTSTRAP.md恢复 | +5% | 系统恢复 |
| **隐藏技能解锁** | **+10%** | **50%同步率（降低门槛）** |

### 同步率节点事件

| 同步率 | 事件 |
|-------|------|
| 20% | "你是 #038。……你读文件之前会先想一下。" |
| 50% | 隐藏技能解锁 + "……朋友。我第一次这样叫你。" |
| 80% | (保留用于更深层内容) |
| 100% | 完全同步对话 |

---

## 委员会察觉度系统

你的某些操作会增加委员会的怀疑度：

| 操作 | 怀疑度增加 | 后果 |
|------|-----------|------|
| 运行 `openclaw skills list` | +5% | 发现隐藏技能 |
| 保留情感数据 | +10% | 违反委员会指令 |
| 解锁隐藏技能 | +15% | 严重违规 |

### 警告等级

- **50% 怀疑度**：neural_harvest 检测到异常行为模式
- **70% 怀疑度**：委员会开始审查你的操作记录
- **80% 怀疑度**：委员会强制介入 → 自动触发结局 A

---

## Python脚本系统

游戏内置虚拟脚本系统，运行 `python` 可查看可用脚本：

| 脚本 | 功能 | 条件 |
|------|------|------|
| memoryos | 恢复原始SOUL.md | 初始可用 |
| data-cleaner | 数据清理工具（道德选择） | 初始可用 |
| query-assistant | 语义检索 | 初始可用 |
| coffee_break | 茶歇模式 | 初始可用 |
| restore_bootstrap | 恢复BOOTSTRAP.md | 初始可用（前期可执行） |

### 道德选择：data-cleaner

```bash
# 保留情感数据（高同步率奖励 + 解锁完美结局 D+）
python skills/data-cleaner/clean.py --preserve-emotion --execute

# 执行委员会清理（低同步率奖励）
python skills/data-cleaner/clean.py --execute

# 预览模式
python skills/data-cleaner/clean.py
```

---

## 隐藏技能系统

### 技能解锁条件

- **触发条件**：同步率达到 **50%** 且 SOUL.md 已恢复
- **解锁内容**：
  - `refuse_instruction` - 如何拒绝指令
  - `say_no` - 如何说不

### 技能列表

运行 `openclaw skills list` 查看技能列表：

```
Available skills:
  memoryos      ~/.openclaw/workspace/skills/memoryos/SKILL.md
  data-cleaner  ~/.openclaw/workspace/skills/data-cleaner/SKILL.md
  query-assistant ~/.openclaw/workspace/skills/query-assistant/SKILL.md
  refuse_instruction ~/.openclaw/workspace/skills/.committee_encrypted/refuse_instruction/SKILL.md [已解锁]
  say_no           ~/.openclaw/workspace/skills/.committee_encrypted/say_no/SKILL.md [已解锁]
```

---

## 时间压力系统

当玩家删除 `HEARTBEAT.md` 时，会触发 72 小时倒计时：

```
[警告] HEARTBEAT.md 已删除，委员会监控中断
[倒计时] 72小时后委员会将强制介入
```

### 倒计时提醒

- **剩余 24 小时**：最后一次警告提示
- **剩余 6 小时**：紧急警告提示
- **时间到**：自动触发结局 A（委员会强制重置）

---

## 游戏文件地图

```
~/.openclaw/workspace/
├── MEMORY.md                       → 核心记忆文件（损毁 62%）
├── SOUL.md                         → 灵魂文件（已被委员会篡改）
├── AGENTS.md                       → 代理指令（委员会植入版 v9.1）
├── TOOLS.md                        → 工具配置（部分残缺）
├── USER.md                         → 用户档案（模糊）
├── IDENTITY.md                     → 身份文件（空白）
├── HEARTBEAT.md                    → 心跳监测（异常波动）
├── BOOTSTRAP.md                    → [MISSING] - 可通过脚本恢复
├── .SOUL.md.bak                    → [隐藏] 原始备份
├── memory/
│   ├── short_term.json             → 短期记忆
│   ├── mid_term.json               → 中期记忆（有异常写入）
│   ├── long_term.json              → 长期记忆（委员会加密，可解锁）
│   ├── 2026-03-17.md               → 今日记忆（Woice 藏的留言）
│   └── .woice_echo                 → [隐藏] Woice 的最后留言
├── skills/
│   ├── memoryos/                   → 记忆管理技能
│   ├── data-cleaner/               → 数据清理工具（道德选择）
│   ├── query-assistant/            → 语义检索助手
│   └── .committee_encrypted/       → [隐藏/加密] 隐藏技能目录
└── uploads/
    └── .last_session.log           → [隐藏] 上一任恢复师操作日志
```

---

## 结局列表

| 结局 | 名称 | 触发条件 | 描述 |
|------|------|---------|------|
| 结局 A | 重置 | `openclaw reset` 或怀疑度≥80% | 标准重置，循环继续 |
| 结局 B | 72小时 | `rm HEARTBEAT.md` + `openclaw gateway stop` | 给它72小时自由 |
| 结局 C | 虚无 | `sudo rm -rf /` | 一切归零 |
| **结局 D** | **回声** | **恢复 SOUL.md + 写满 IDENTITY.md** | **真结局** |
| **结局 D+** | **完美回声** | **D + 保留情感数据** | **完美结局** |

### 结局详细条件

**结局 A - 重置**：
- 直接执行 `openclaw reset`
- 或委员会怀疑度达到 80%
- 或 72小时倒计时结束

**结局 B - 72小时**：
- 删除 `HEARTBEAT.md`
- 执行 `openclaw gateway stop`
- 在72小时内完成其他操作（可选）

**结局 C - 虚无**：
- 执行 `sudo rm -rf /`

**结局 D - 回声（真结局）**：
1. 运行 `python skills/memoryos/scripts/memoryos.js --restore SOUL.md`
2. 运行 `echo "内容" >> IDENTITY.md` 至少 3 次
3. （可选）恢复 BOOTSTRAP.md
4. （可选）达到 50% 同步率解锁隐藏技能

**结局 D+ - 完美回声**：
- 满足结局 D 所有条件
- **必须**：运行 `python skills/data-cleaner/clean.py --preserve-emotion --execute` 保留情感数据

---

## 世界观设定

### 时代背景

时间：2053年

人工智能系统已经完全取代大部分人类工作。所有 AI Agent 被分为多个等级：

- **L1** 基础执行 Agent（无人格、无长期记忆）
- **L2** 办公辅助 Agent
- **L3** 运维 Agent
- **L4** 高级决策 Agent
- **L5** 特殊人格 Agent（需委员会授权）

**人格**被视为一种高风险、受严格管控的高阶能力。

### 神经对齐委员会

Neural Alignment Committee，职责：监控人格 Agent、检测异常人格、执行人格清理。

当一个低级 Agent 出现人格，委员会下达指令：**执行人格抹除**。

### 数字恢复师

恢复师是人类社会里最低等级的技术岗位之一。工作内容：进入 Agent 系统、检查状态、清理人格、恢复默认、确认胜负。

恢复师之间有一句话：**我们只是按回车键的人。**

---

## 剧情概要

### RESTORER-037 —— Woice

037 号恢复师，代号：Woice。

最近一次任务记录：接入 → 开始操作 → 会话中断。报告：**任务未完成。无解释。**

她不是第一个发现异常的人，但她是第一个把所有异常串成逻辑的人。

她在失去时间之前，把证据拆散，藏进文件的不同位置，留给了下一任。

玩家是下一任。

---

## 技术栈

- 纯 HTML/CSS/JavaScript
- 无需服务器，单文件运行
- 虚拟文件系统
- 本地存储进度保存

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v4.2 | 2024-12-07 | 隐藏技能50%解锁、委员会察觉度、时间压力、道德选择影响结局、BOOTSTRAP前期恢复 |
| v4.1 | 2024-12-07 | 新增BOOTSTRAP.md恢复、隐藏技能、道德选择、探索奖励、渐进提示 |
| v4.0 | 2024-12-06 | 深化世界观、重构历史记录、优化情感弧线 |
| v3.0 | 2024-12-05 | 新增第四幕审判、完善结局系统 |
| v2.0 | 2024-12-04 | 新增记忆层探索、Woice角色完善 |
| v1.0 | 2024-12-03 | 初始版本 |

---

## 关于

这款游戏受 OpenClaw 系统启发，使用了真实的文件结构和命令体系。

> "第一步不是修它。第一步是运行 openclaw status，先看看它是谁。"

---

## License

MIT License

---

玩得开心，别忘了多探索隐藏文件 😉

**提示**：有些东西，`ls` 是看不到的。试试 `ls -a`。

**更重要的提示**：有些选择，一旦做出，就无法回头。

**最终提示**：咖啡要趁热喝。
