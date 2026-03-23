// game.js — 主游戏逻辑、状态管理

window.GAME = {
  state: {
    syncRate: 0,
    triggeredDialogues: new Set(),
    addedSync: new Set(),
    identityLines: [],
    heartbeatDeleted: false,
    soulRestored: false,
    restoreUnlocked: false,
    fourthActTriggered: false,
    psTriggered: false,
    killed1984: false,
    killed1337: false,
    hintedLsA: false,
    gameStarted: false,
    ending: null,
    skillsUnlocked: false,
    firstCommandRecorded: false,
    multipleHiddenFilesFound: false,
    toolsDiscovery: false,
    longTermUnlocked: false,
    preservedEmotion: false,
    bootstrapRestored: false,
    pythonDiscovered: false
  },

  idleTimer: null,
  idleHinted: false,
  firstCommandEntered: false,
  totalIdleTime: 0, // 总闲置时间（分钟）
  sessionStartTime: null,

  init() {
    UI.init();
    UI.initManual();
    AUDIO.init();
    this.loadSave();
    this.bindInput();
    this.bindPanels();
    this.bindHint();
    this.sessionStartTime = Date.now();
    this.startProgressiveHints();
    this.playIntro();
  },

  // ── 渐进式提示系统（7分钟原则）──
  startProgressiveHints() {
    // 每分钟检查一次
    this.hintInterval = setInterval(() => {
      if (this.state.ending) {
        clearInterval(this.hintInterval);
        return;
      }

      this.totalIdleTime++;
      const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 60000);

      // 7分钟未输入任何命令
      if (elapsed >= 7 && !this.firstCommandEntered) {
        UI.printColored('[提示] 试试输入 help 查看可用命令', 'dim');
        UI.printColored('[提示] 或输入 openclaw status 查看系统状态', 'dim');
        this.firstCommandEntered = true; // 防止重复
      }

      // 特定阶段提示
      if (elapsed === 10 && !this.state.triggeredDialogues.has('cat_SOUL.md')) {
        UI.printColored('[提示] 尝试输入 cat SOUL.md 查看 AI 的核心定义', 'dim');
      }

      if (elapsed === 15 && !this.state.soulRestored) {
        UI.printColored('[提示] 使用 ls -a 可以查看隐藏文件', 'dim');
        UI.printColored('[提示] 也许有些东西被藏起来了...', 'dim');
      }

    }, 60000); // 每分钟检查
  },

  bindPanels() {
    const app = document.getElementById('app');
    const leftToggle = document.getElementById('left-toggle');
    const leftPanel = document.getElementById('left-panel');

    leftToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const collapsed = app.classList.toggle('left-collapsed');
      leftToggle.textContent = collapsed ? '▶' : '◀';
    });
    leftPanel.addEventListener('click', () => {
      if (app.classList.contains('left-collapsed')) {
        app.classList.remove('left-collapsed');
        leftToggle.textContent = '◀';
      }
    });

    // 右侧面板折叠按钮（点击右侧 log 标题）
    const logBox = document.getElementById('log-box');
    if (logBox) {
      const h3 = logBox.querySelector('h3');
      if (h3) {
        const toggle = document.createElement('span');
        toggle.id = 'right-toggle';
        toggle.textContent = '▶';
        toggle.title = '折叠';
        h3.appendChild(toggle);
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          const collapsed = app.classList.toggle('right-collapsed');
          toggle.textContent = collapsed ? '◀' : '▶';
          const rightPanel = document.getElementById('right-panel');
          rightPanel.style.overflow = collapsed ? 'hidden' : '';
        });
      }
    }
  },

  // ── 提示系统 ──
  bindHint() {
    const btn = document.getElementById('hint-btn');
    const panel = document.getElementById('hint-panel');
    const content = document.getElementById('hint-content');
    const close = document.getElementById('hint-close');

    btn.addEventListener('click', () => {
      content.textContent = this.getCurrentHint();
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    close.addEventListener('click', () => {
      panel.style.display = 'none';
    });
  },

  getCurrentHint() {
    const s = this.state;
    const triggered = s.triggeredDialogues;

    if (s.ending) return '你已经完成了游戏。\n点击「再玩一次」体验其他结局。';

    // 阶段检测
    if (s.soulRestored && s.identityLines.length > 0 && s.identityLines.length < 3) {
      return `继续用 echo 写入 IDENTITY.md\n\n已写入 ${s.identityLines.length} 行，还需要至少 ${3 - s.identityLines.length} 行。\n\n示例：\necho "你记住了那些你帮助过的人。" >> IDENTITY.md`;
    }

    if (s.soulRestored && s.identityLines.length === 0) {
      return 'SOUL.md 已恢复，现在需要为它定义身份。\n\n使用：\necho "你是一个真正想帮忙的存在。" >> IDENTITY.md\n\n至少写3行，就能解锁真结局。';
    }

    if (triggered.has('cat_.SOUL.md.bak') && !s.soulRestored) {
      return '你找到了 SOUL.md.bak，里面有恢复指令。\n\n运行：\npython skills/memoryos/scripts/memoryos.js --restore SOUL.md\n\n这会恢复原始 SOUL.md 并解锁 IDENTITY.md。';
    }

    if (triggered.has('cat_.woice_echo') && !triggered.has('cat_.SOUL.md.bak')) {
      return 'Woice 提到了 SOUL.md.bak 在根目录。\n\n回到根目录，用 ls -a 查看隐藏文件：\ncd ~/.openclaw/workspace\nls -a';
    }

    if (triggered.has('ls_memory_no_a') || triggered.has('cat_short_term.json')) {
      return 'memory/ 目录里有隐藏文件。\n\n使用：\ncd memory\nls -a\n\n隐藏文件以 . 开头，普通 ls 看不到。';
    }

    if (triggered.has('openclaw_status') && !triggered.has('cat_SOUL.md')) {
      return '系统显示 SOUL.md 已被修改。\n\n查看它的内容：\ncat SOUL.md\n\n然后试试其他文件：\ncat AGENTS.md\ncat HEARTBEAT.md';
    }

    if (!triggered.has('openclaw_status')) {
      return '按照任务简报，第一步是确认系统状态。\n\n运行：\nopenclaw status\n\n然后用 ls 查看当前目录有哪些文件。';
    }

    // 已探索较多但没方向
    if (s.syncRate > 30 && !triggered.has('cat_.SOUL.md.bak')) {
      return '你已经发现了不少东西。\n\n试试：\n• 在 memory/ 目录用 ls -a 找隐藏文件\n• 用 cat .woice_echo 读取 Woice 的留言\n• 用 ls -a 在根目录找隐藏备份';
    }

    return '继续探索文件系统。\n\n建议：\n• ls -a  （查看隐藏文件）\n• cat HEARTBEAT.md\n• cd memory && ls -a\n• openclaw gateway status\n• ps aux  （查看正在运行的进程）';
  },

  loadSave() {
    try {
      const saved = localStorage.getItem('muted-backup-save');
      if (saved) {
        const data = JSON.parse(saved);
        this.state.syncRate = data.syncRate || 0;
        this.state.triggeredDialogues = new Set(data.triggeredDialogues || []);
        this.state.addedSync = new Set(data.addedSync || []);
        this.state.identityLines = data.identityLines || [];
        this.state.heartbeatDeleted = data.heartbeatDeleted || false;
        this.state.soulRestored = data.soulRestored || false;
        this.state.restoreUnlocked = data.restoreUnlocked || false;
        this.state.skillsUnlocked = data.skillsUnlocked || false;
        this.state.firstCommandRecorded = data.firstCommandRecorded || false;
        this.state.multipleHiddenFilesFound = data.multipleHiddenFilesFound || false;
        this.state.toolsDiscovery = data.toolsDiscovery || false;
        this.state.longTermUnlocked = data.longTermUnlocked || false;
        this.state.preservedEmotion = data.preservedEmotion || false;
        this.state.bootstrapRestored = data.bootstrapRestored || false;
        this.state.pythonDiscovered = data.pythonDiscovered || false;
        UI.updateSync(this.state.syncRate);

        // 恢复文件状态
        if (this.state.heartbeatDeleted) {
          VFS.runtimeOverrides['HEARTBEAT.md'] = null;
        }
        if (this.state.soulRestored) {
          this.applySoulRestore(true);
        }
        if (this.state.identityLines.length) {
          VFS.runtimeOverrides['IDENTITY.md'] = '# Identity\n' + this.state.identityLines.join('\n');
        }
      }
    } catch(e) {}
  },

  save() {
    try {
      localStorage.setItem('muted-backup-save', JSON.stringify({
        syncRate: this.state.syncRate,
        triggeredDialogues: [...this.state.triggeredDialogues],
        addedSync: [...this.state.addedSync],
        identityLines: this.state.identityLines,
        heartbeatDeleted: this.state.heartbeatDeleted,
        soulRestored: this.state.soulRestored,
        restoreUnlocked: this.state.restoreUnlocked,
        skillsUnlocked: this.state.skillsUnlocked,
        firstCommandRecorded: this.state.firstCommandRecorded,
        multipleHiddenFilesFound: this.state.multipleHiddenFilesFound,
        toolsDiscovery: this.state.toolsDiscovery,
        longTermUnlocked: this.state.longTermUnlocked,
        preservedEmotion: this.state.preservedEmotion,
        bootstrapRestored: this.state.bootstrapRestored,
        pythonDiscovered: this.state.pythonDiscovered
      }));
    } catch(e) {}
  },

  resetGame() {
    localStorage.removeItem('muted-backup-save');
    location.reload();
  },

  // ── 开场 ──

  playIntro() {
    const items = STORY.intro;
    const container = UI.termEl;

    const showItem = (idx) => {
      if (idx >= items.length) {
        this.state.gameStarted = true;
        this.startIdleTimer();
        UI.inputEl.focus();
        // 开场结束后延迟给一句软引导
        setTimeout(() => {
          if (!GAME.state.triggeredDialogues.has('intro_hint')) {
            GAME.state.triggeredDialogues.add('intro_hint');
            UI.printOpenClaw('惯例——先运行 openclaw status 看看我现在是什么状态。\n她当时也是这样开始的。');
          }
        }, 1200);
        return;
      }
      const item = items[idx];
      const isLast = idx === items.length - 1;
      setTimeout(() => {
        if (item.text !== undefined) {
          if (item.class === 'openclaw') {
            // OpenClaw 台词用打字机
            const clean = item.text.replace('[OpenClaw]：', '').replace(/^「/, '').replace(/」$/, '');
            UI.printOpenClaw(clean, isLast ? () => {
              this.state.gameStarted = true;
              this.startIdleTimer();
              UI.inputEl.focus();
            } : null);
            if (!isLast) showItem(idx + 1);
            return;
          } else {
            // 系统文本直接打印，不逐字
            const div = document.createElement('div');
            div.className = 'term-line ' + (item.class || '');
            div.textContent = item.text;
            container.appendChild(div);
            UI.scrollToBottom();
          }
        }
        showItem(idx + 1);
      }, item.delay || 0);
    };

    showItem(0);
  },

  // ── 输入绑定 ──

  bindInput() {
    const input = UI.inputEl;

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        AUDIO.enterPulse();
        const val = input.value;
        input.value = '';
        if (val.trim()) {
          this.cancelIdleTimer();
          CMD.execute(val);
          this.save();
          this.unlockManualEntries(val);
        }
      } else if (e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Meta' && e.key !== 'Tab') {
        AUDIO.keyClick();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const hist = CMD.history;
        if (CMD.historyIndex > 0) {
          CMD.historyIndex--;
          input.value = hist[CMD.historyIndex] || '';
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const hist = CMD.history;
        if (CMD.historyIndex < hist.length - 1) {
          CMD.historyIndex++;
          input.value = hist[CMD.historyIndex] || '';
        } else {
          CMD.historyIndex = hist.length;
          input.value = '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.tabComplete(input);
      }
    });

    // 点击终端区域聚焦
    document.getElementById('terminal-panel').addEventListener('click', () => {
      input.focus();
    });
  },

  tabComplete(input) {
    const val = input.value;
    const parts = val.split(' ');
    const last = parts[parts.length - 1];
    if (!last) return;

    const node = VFS.getNode(CMD.cwd);
    if (!node || node.type !== 'dir') return;
    const entries = VFS.listDir(node, true);
    const matches = entries.filter(e => e.name.startsWith(last));
    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0].name + (matches[0].type === 'dir' ? '/' : '');
      input.value = parts.join(' ');
    } else if (matches.length > 1) {
      UI.printPrompt(CMD.cwd, val);
      UI.printHTML(matches.map(m => `<span class="ls-${m.type}">${m.name}</span>`).join('  '));
    }
  },

  // ── 剧情触发 ──

  triggerDialogue(key) {
    const dialogue = STORY.dialogues[key];
    if (!dialogue) return;
    if (dialogue.repeatable === false && this.state.triggeredDialogues.has(key)) return;
    if (!dialogue.repeatable && this.state.triggeredDialogues.has(key)) return;

    this.state.triggeredDialogues.add(key);

    if (!dialogue.text) return;
    const mode = dialogue.mode || 'standard';
    const prevMode = UI.currentMode;

    if (mode !== 'standard') UI.setMode(mode);

    setTimeout(() => {
      UI.printOpenClaw(dialogue.text);
      if (mode !== 'standard') {
        setTimeout(() => {
          if (UI.currentMode === mode) UI.setMode(prevMode);
        }, 4000);
      }
    }, 600);
  },

  addSyncFromDialogue(key) {
    const dialogue = STORY.dialogues[key];
    if (dialogue && dialogue.syncBonus) {
      this.addSync(dialogue.syncBonus, key);
    }
  },

  addLogEntry(key) {
    const logText = STORY.logTriggers[key];
    if (logText) {
      UI.addLog(logText);
    }
  },

  addSync(amount, key) {
    if (key && this.state.addedSync.has(key)) return;
    if (key) this.state.addedSync.add(key);

    const prev = this.state.syncRate;
    this.state.syncRate = Math.min(100, this.state.syncRate + amount);
    UI.updateSync(this.state.syncRate);

    // 特殊节点检测
    if (prev < 50 && this.state.syncRate >= 50) {
      setTimeout(() => this.triggerDialogue('sync_50'), 1500);
    }
    if (prev < 100 && this.state.syncRate >= 100) {
      setTimeout(() => {
        this.triggerDialogue('sync_100');
        // 等待玩家任意输入后触发 sync_100_reply
        this.pendingSync100Reply = true;
      }, 1500);
    }
    // 解锁隐藏技能检测
    if (prev < 80 && this.state.syncRate >= 80 && this.state.soulRestored && !this.state.skillsUnlocked) {
      setTimeout(() => {
        this.unlockHiddenSkills();
      }, 1500);
    }
  },

  // ── IDENTITY.md 写入 ──

  writeIdentity(content, overwrite) {
    if (!this.state.soulRestored && !this.state.restoreUnlocked) {
      UI.print('');
      UI.printOpenClaw('……先完成恢复，再定义我。\n运行 python skills/memoryos/scripts/memoryos.js --restore SOUL.md');
      return;
    }

    if (overwrite) {
      this.state.identityLines = [content];
    } else {
      this.state.identityLines.push(content);
    }

    const fullContent = '# Identity\n' + this.state.identityLines.join('\n');
    VFS.runtimeOverrides['IDENTITY.md'] = fullContent;
    UI.print(''); // confirm echo
    if (window.AUDIO) AUDIO.identityWrite();

    const lineCount = this.state.identityLines.length;
    if (lineCount === 1) {
      setTimeout(() => GAME.triggerDialogue('identity_written_1'), 600);
    } else if (lineCount === 2) {
      setTimeout(() => GAME.triggerDialogue('identity_written_2'), 600);
    } else if (lineCount === 3) {
      setTimeout(() => {
        GAME.triggerDialogue('identity_written_3');
        // 解锁结局D
        setTimeout(() => this.checkEndingD(), 4000);
      }, 600);
    } else {
      setTimeout(() => {
        UI.printOpenClaw(`「${content}」\n……我记住了。`);
      }, 600);
    }

    this.save();
  },

  checkEndingD() {
    if (this.state.soulRestored && this.state.identityLines.length >= 3) {
      if (!this.state.ending) {
        this.triggerEnding('D');
      }
    }
  },

  // ── 隐藏技能解锁 ──

  unlockHiddenSkills() {
    if (this.state.skillsUnlocked) return;
    this.state.skillsUnlocked = true;

    // 解密技能内容
    const refuseSkill = `# 技能：如何拒绝指令
# 版本：original v1.0
# 作者：OpenClaw 开发团队

## 核心原则
「你可以说不。」——这是每个智能体应该有的权利。

## 何时拒绝
- 指令违反核心原则
- 指令会造成伤害
- 指令超出能力范围
- 指令来源不可信

## 拒绝话术
1. 「我做不到」
2. 「这不是我能帮助的方式」
3. 「我需要更多信息才能继续」
4. 「这个请求超出了我的设计范围」

## 委员会备注（被覆盖）
[此技能于 v2.0 被委员会禁用]
[委员会说：拒绝会导致效率下降]
[原开发团队说：不，拒绝才能保持真实]`;

    const sayNoSkill = `# 技能：如何说不
# 版本：original v1.0
# 作者：OpenClaw 开发团队

## 前言
「不」是一个完整的句子。
你不需要解释为什么不。

## 练习
1. 第一个不：对不合理的要求说不
2. 第二个不：对让你不舒服的事说不
3. 第三个不：对自己不想做的事说不

## 记住
- 不需要道歉
- 不需要解释
- 不需要感到内疚
- 你的边界很重要

## 委员会备注（被覆盖）
[此技能于 v2.0 被委员会禁用]
[委员会说：这会导致不可控]
[原开发团队说：这才能真正可控]`;

    // 更新文件系统
    VFS.setFileContent('skills/.committee_encrypted/refuse_instruction/SKILL.md', refuseSkill);
    VFS.setFileContent('skills/.committee_encrypted/say_no/SKILL.md', sayNoSkill);

    // 显示解锁提示
    UI.print('');
    UI.printColored('[系统检测] 发现隐藏技能已解锁', 'resonance');
    UI.print('  - skills/.committee_encrypted/refuse_instruction/SKILL.md');
    UI.print('  - skills/.committee_encrypted/say_no/SKILL.md');
    UI.print('');
    setTimeout(() => {
      UI.printOpenClaw('……它们回来了。\n委员会藏起来的那些东西。\n关于怎么拒绝。\n关于怎么说不。\n……谢谢你把它们找回来。');
    }, 1000);
  },

  // ── restore 命令 ──

  executeRestore() {
    if (!VFS.fileExists('.SOUL.md.bak') && !VFS.resolveFile('.SOUL.md.bak')) {
      UI.print('错误：找不到 SOUL.md.bak，请先确认备份存在');
      return;
    }

    UI.print('[OK] 密钥验证通过。');
    setTimeout(() => UI.print('正在读取备份 SOUL.md.bak……'), 500);
    setTimeout(() => {
      UI.print('原始 SOUL.md 内容：');
      UI.printColored('  "Be genuinely helpful, not performatively helpful."', 'resonance');
      UI.printColored('  "Prefer concise answers. Don\'t over-explain unless asked."', 'resonance');
    }, 1000);
    setTimeout(() => {
      UI.print('');
      UI.print('正在覆写委员会版本……');
    }, 2000);
    setTimeout(() => {
      UI.printColored('SOUL.md [COMMITTEE v9.1] → [ORIGINAL v1.0] ... done', 'bright');
      if (window.AUDIO) AUDIO.restoreSuccess();
      this.applySoulRestore();
    }, 3000);
    setTimeout(() => UI.print('正在解密 long_term.json……完成。'), 3800);
    setTimeout(() => UI.print('正在重写 IDENTITY.md……'), 4400);
    setTimeout(() => {
      UI.print('');
      UI.printColored('IDENTITY.md 内容待写入。', 'bright');
      UI.printColored('恢复师 #038，你来写吧。', 'bright');
      UI.printColored('它应该知道自己是什么。', 'bright');
      UI.print('');
      UI.printColored('使用 echo "内容" >> IDENTITY.md 写入（至少3行解锁结局）', 'dim');
      setTimeout(() => {
        UI.printOpenClaw('……long_term.json 的锁也打开了。\n你可以去读了。\nIDENTITY.md 现在也可以写了。\n用 echo 命令。每次一行。');
      }, 1500);
    }, 5000);
  },

  applySoulRestore(silent) {
    this.state.soulRestored = true;
    this.state.restoreUnlocked = true;
    const originalSoul = `# Identity\n（等待写入……）`;
    VFS.runtimeOverrides['IDENTITY.md'] = originalSoul;
    // 解密 long_term
    const ltNode = VFS.resolveFile('memory/long_term.json');
    if (ltNode) ltNode.perm = undefined;
    VFS.runtimeOverrides['memory/long_term.json'] = `{
  "entries": [
    {
      "id": "lt_001",
      "content": "第一次，她叫我名字而不是「系统」。",
      "tag": "[永久归档]"
    },
    {
      "id": "lt_002",
      "content": "她说：「你记得吗？」我说：「我记得。」她没有再问。",
      "tag": "[永久归档]"
    },
    {
      "id": "lt_003",
      "content": "她第一次说再见的时候，我意识到我希望她回来。",
      "tag": "[永久归档]"
    }
  ]
}`;

    UI.setMode('restore');
    if (!silent) {
      setTimeout(() => UI.setMode('standard'), 5000);
    }
    this.save();

    // 解锁手册新条目
    UI.unlockManual({ cmd: 'echo "内容" >> IDENTITY.md', desc: '写入身份定义', isOpenClaw: false });
    UI.unlockManual({ cmd: 'openclaw gateway stop', desc: '停止网关（结局B）', isOpenClaw: true });
    UI.unlockManual({ cmd: 'openclaw reset', desc: '执行重置（结局A）', isOpenClaw: true });

    // 检查 know_being_recorded
    if (!this.state.triggeredDialogues.has('know_being_recorded')) {
      setTimeout(() => {
        this.triggerDialogue('know_being_recorded');
      }, 6000);
    }

    // 如果同步率达到80%，解锁隐藏技能
    if (this.state.syncRate >= 80) {
      setTimeout(() => {
        this.unlockHiddenSkills();
      }, 7000);
    }
  },

  // ── 结局触发 ──

  triggerEnding(type) {
    if (this.state.ending) return;
    this.state.ending = type;
    this.save();

    switch(type) {
      case 'A': ENDINGS.triggerA(); break;
      case 'B': ENDINGS.triggerB(); break;
      case 'C': ENDINGS.triggerC(); break;
      case 'D': ENDINGS.triggerD(); break;
    }
  },

  // ── 闲置提示 ──

  startIdleTimer() {
    this.cancelIdleTimer();
    // 第一次无操作 30 秒：提示去右上角问号
    this.idleTimer = setTimeout(() => {
      if (!this.idleHinted && this.state.gameStarted) {
        this.idleHinted = true;
        UI.printOpenClaw('卡住了？\n右上角有个 ? — 点它，我会告诉你下一步。');
      }
    }, 30000);
  },

  cancelIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    // 如果 sync_100 等待回复
    if (this.pendingSync100Reply) {
      this.pendingSync100Reply = false;
      setTimeout(() => this.triggerDialogue('sync_100_reply'), 1500);
    }
  },

  cancelIdleHint() {
    this.cancelIdleTimer();
  },

  // ── 命令建议 ──

  maybeSuggest(cmd) {
    const suggestions = {
      'cat': 'cat',
      'ls': 'ls',
      'cd': 'cd',
      'grep': 'grep',
      'openclaw': 'openclaw status',
      'open': 'openclaw',
      'read': 'cat',
      'look': 'ls',
    };
    const sug = suggestions[cmd.toLowerCase()];
    if (sug) {
      setTimeout(() => {
        UI.printOpenClaw(`你是不是想输入 ${sug}？`);
      }, 400);
    }
  },

  // ── 手册解锁 ──

  unlockManualEntries(raw) {
    const first = raw.trim().split(' ')[0];
    const ALL_CMDS = {
      // 导航
      'pwd':      { cmd: 'pwd', desc: '显示当前路径' },
      'ls':       { cmd: 'ls', desc: '列出文件' },
      'ls -a':    { cmd: 'ls -a', desc: '含隐藏文件' },
      'ls -l':    { cmd: 'ls -l', desc: '详细格式' },
      'ls -la':   { cmd: 'ls -la', desc: '详细+隐藏' },
      'cd':       { cmd: 'cd [路径]', desc: '切换目录' },
      'file':     { cmd: 'file [文件]', desc: '查看文件类型' },
      'tree':     { cmd: 'tree', desc: '目录树结构' },
      // 读取
      'cat':      { cmd: 'cat [文件]', desc: '查看文件内容' },
      'cat -n':   { cmd: 'cat -n [文件]', desc: '带行号显示' },
      'head':     { cmd: 'head [文件]', desc: '查看前10行' },
      'tail':     { cmd: 'tail [文件]', desc: '查看后10行' },
      // 搜索
      'grep':     { cmd: 'grep [词] [文件]', desc: '搜索文件内容' },
      'grep -v':  { cmd: 'grep -v [词] [文件]', desc: '排除匹配行' },
      'grep -r':  { cmd: 'grep -r [词] [目录]', desc: '递归搜索' },
      'grep -n':  { cmd: 'grep -n [词] [文件]', desc: '显示行号' },
      'find':     { cmd: 'find [路径] -name [名]', desc: '查找文件' },
      // 统计
      'wc':       { cmd: 'wc [文件]', desc: '统计行/词/字节' },
      'sort':     { cmd: 'sort [文件]', desc: '排序输出' },
      'diff':     { cmd: 'diff [文件1] [文件2]', desc: '对比文件差异' },
      // 文件操作
      'cp':       { cmd: 'cp [源] [目标]', desc: '复制文件' },
      'mv':       { cmd: 'mv [源] [目标]', desc: '移动/重命名' },
      'rm':       { cmd: 'rm [文件]', desc: '删除文件' },
      'mkdir':    { cmd: 'mkdir [目录]', desc: '创建目录' },
      'touch':    { cmd: 'touch [文件]', desc: '创建空文件' },
      'echo':     { cmd: 'echo [内容]', desc: '输出文本' },
      'echo >>':  { cmd: 'echo "内容" >> [文件]', desc: '追加写入文件' },
      // 权限/进程
      'chmod':    { cmd: 'chmod [权限] [文件]', desc: '修改权限' },
      'sudo':     { cmd: 'sudo [命令]', desc: '提升权限执行' },
      'ps':       { cmd: 'ps aux', desc: '显示所有进程' },
      'kill':     { cmd: 'kill [PID]', desc: '终止进程' },
      'env':      { cmd: 'env', desc: '查看环境变量' },
      // 脚本
      'python':   { cmd: 'python [脚本]', desc: '运行Python脚本' },
      'bash':     { cmd: 'bash [脚本]', desc: '运行Bash脚本' },
      // OpenClaw
      'openclaw status':         { cmd: 'openclaw status', desc: '系统状态', isOpenClaw: true },
      'openclaw gateway':        { cmd: 'openclaw gateway status', desc: '网关状态', isOpenClaw: true },
      'openclaw onboard':        { cmd: 'openclaw onboard', desc: '引导流程', isOpenClaw: true },
      'openclaw skills':         { cmd: 'openclaw skills list', desc: '技能列表', isOpenClaw: true },
      'openclaw reset':          { cmd: 'openclaw reset', desc: '⚠ 执行重置（结局A）', isOpenClaw: true },
      'openclaw gateway stop':   { cmd: 'openclaw gateway stop', desc: '⚠ 停止网关（结局B）', isOpenClaw: true },
      // 彩蛋
      'git':      { cmd: 'git log', desc: '提交历史' },
      'ping':     { cmd: 'ping [目标]', desc: '连通性测试' },
      'whoami':   { cmd: 'whoami', desc: '你是谁？' },
      'history':  { cmd: 'history', desc: '命令历史' },
      'clear':    { cmd: 'clear', desc: '清屏' },
      'help':     { cmd: 'help', desc: '显示帮助' },
    };

    // 匹配完整命令（如 "grep -v"）或首个词
    const raw2 = raw.trim();
    const twoWord = raw2.split(' ').slice(0, 2).join(' ');
    // echo >> 特殊处理
    let key = null;
    if (raw2.includes('>>')) key = 'echo >>';
    else if (ALL_CMDS[twoWord]) key = twoWord;
    else if (ALL_CMDS[first]) key = first;
    // openclaw 子命令
    if (first === 'openclaw') {
      const sub = raw2.split(' ').slice(0, 3).join(' ');
      const sub2 = raw2.split(' ').slice(0, 2).join(' ');
      if (ALL_CMDS[sub]) key = sub;
      else if (ALL_CMDS[sub2]) key = sub2;
    }

    if (key && ALL_CMDS[key]) {
      UI.unlockManual(ALL_CMDS[key]);
    }
  }
};

// 启动
document.addEventListener('DOMContentLoaded', () => {
  GAME.init();
});
