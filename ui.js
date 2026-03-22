// ui.js — UI 组件：终端输出、面板、同步率波形

window.UI = {
  termEl: null,
  inputEl: null,
  promptEl: null,
  syncEl: null,
  logEl: null,
  manualEl: null,
  currentMode: 'standard',
  typewriterQueue: [],
  typewriterBusy: false,
  manualEntries: [],
  logEntries: [],

  init() {
    this.termEl = document.getElementById('terminal-output');
    this.inputEl = document.getElementById('terminal-input');
    this.promptEl = document.getElementById('prompt-cwd');
    this.syncEl = document.getElementById('sync-value');
    this.logEl = document.getElementById('log-entries');
    this.manualEl = document.getElementById('manual-entries');
    this.waveCanvas = document.getElementById('wave-canvas');
    this.initWave();
    this.startWaveAnimation();
  },

  // ── 终端输出 ──

  print(text, cssClass) {
    const line = document.createElement('div');
    line.className = 'term-line' + (cssClass ? ' ' + cssClass : '');
    line.textContent = text;
    this.termEl.appendChild(line);
    this.scrollToBottom();
  },

  printHTML(html, cssClass) {
    const line = document.createElement('div');
    line.className = 'term-line' + (cssClass ? ' ' + cssClass : '');
    line.innerHTML = html;
    this.termEl.appendChild(line);
    this.scrollToBottom();
  },

  printColored(text, colorClass) {
    this.print(text, colorClass);
  },

  printPrompt(cwd, input) {
    const line = document.createElement('div');
    line.className = 'term-line prompt-echo';
    const cwdShort = cwd.replace('~/.openclaw/workspace', '~');
    line.innerHTML = `<span class="prompt-user">restorer@openclaw</span><span class="prompt-sep">:</span><span class="prompt-dir">${cwdShort}</span><span class="prompt-dollar">$</span> <span class="prompt-input">${this.escHtml(input)}</span>`;
    this.termEl.appendChild(line);
    this.scrollToBottom();
  },

  // OpenClaw 台词打字机效果
  printOpenClaw(text, onDone) {
    if (window.AUDIO) AUDIO.openclawStart();
    // 去掉 [OpenClaw]：前缀（如果有）
    const cleanText = text.replace(/^\[OpenClaw\]：?/, '').trim();
    const container = document.createElement('div');
    container.className = 'term-line openclaw-block';

    const label = document.createElement('span');
    label.className = 'openclaw-label';
    label.textContent = '[OpenClaw]：';
    container.appendChild(label);

    const textSpan = document.createElement('span');
    textSpan.className = 'openclaw-text ' + this.currentMode;
    container.appendChild(textSpan);
    this.termEl.appendChild(container);
    this.scrollToBottom();

    this.typewriterQueue.push({ text: cleanText, el: textSpan, onDone });
    if (!this.typewriterBusy) this.runTypewriter();
  },

  runTypewriter() {
    if (this.typewriterQueue.length === 0) {
      this.typewriterBusy = false;
      return;
    }
    this.typewriterBusy = true;
    const { text, el, onDone } = this.typewriterQueue.shift();
    let i = 0;
    const chars = [...text];

    const next = () => {
      if (i >= chars.length) {
        this.scrollToBottom();
        if (onDone) onDone();
        setTimeout(() => this.runTypewriter(), 200);
        return;
      }
      const ch = chars[i++];
      if (ch === '\n') {
        el.appendChild(document.createElement('br'));
        this.scrollToBottom();
        setTimeout(next, 30);
      } else if (ch === '…') {
        el.appendChild(document.createTextNode(ch));
        setTimeout(next, 200);
      } else {
        el.appendChild(document.createTextNode(ch));
        this.scrollToBottom();
        const delay = ch === '。' || ch === '！' || ch === '？' ? 80 :
                      ch === '，' || ch === '、' ? 40 : 15;
        setTimeout(next, delay);
      }
    };
    next();
  },

  printSystem(text) {
    this.print(text, 'system-msg');
  },

  clearTerminal() {
    this.termEl.innerHTML = '';
  },

  scrollToBottom() {
    const termPanel = document.getElementById('terminal-panel');
    if (termPanel) termPanel.scrollTop = termPanel.scrollHeight;
  },

  updatePrompt(cwd) {
    if (this.promptEl) {
      this.promptEl.textContent = cwd.replace('~/.openclaw/workspace', '~');
    }
  },

  escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },

  // ── 颜色模式切换 ──

  setMode(mode) {
    if (mode === this.currentMode) return;
    const terminal = document.getElementById('terminal');
    const validModes = ['standard','resonance','warning','coffee','crash','restore'];
    validModes.forEach(m => terminal.classList.remove('mode-' + m));
    terminal.classList.add('mode-' + mode);
    this.currentMode = mode;
    if (window.AUDIO) {
      if (mode === 'resonance') AUDIO.modeResonance();
      else if (mode === 'warning') AUDIO.modeWarning();
      else if (mode === 'crash') AUDIO.endingVoid();
    }

    // 波形颜色更新
    this.waveColor = {
      standard: '#33FF33',
      resonance: '#BB88FF',
      warning: '#FF3333',
      coffee: '#FFCC66',
      crash: '#FF0000',
      restore: '#88FFBB'
    }[mode] || '#33FF33';
  },

  glitchEffect(duration) {
    const terminal = document.getElementById('terminal');
    terminal.classList.add('glitch');
    setTimeout(() => terminal.classList.remove('glitch'), duration || 600);
    if (window.AUDIO) AUDIO.glitch();
  },

  // ── 同步率 ──

  updateSync(value) {
    if (this.syncEl) {
      this.syncEl.textContent = Math.min(100, Math.floor(value)) + '%';
    }
  },

  // ── 波形动画 ──

  waveColor: '#33FF33',
  wavePhase: 0,
  waveAnim: null,

  initWave() {
    if (!this.waveCanvas) return;
    this.waveCtx = this.waveCanvas.getContext('2d');
  },

  startWaveAnimation() {
    if (!this.waveCtx) return;
    const draw = () => {
      const canvas = this.waveCanvas;
      const ctx = this.waveCtx;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = this.waveColor;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 6;
      ctx.shadowColor = this.waveColor;
      ctx.globalAlpha = 0.85;

      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const t = x / w * Math.PI * 4 + this.wavePhase;
        const syncMod = (GAME && GAME.state ? GAME.state.syncRate / 100 : 0.3);
        const amp = 4 + syncMod * 10;
        const y = h / 2 + Math.sin(t) * amp + Math.sin(t * 2.3 + 1) * (amp * 0.4);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      this.wavePhase += 0.05;
      requestAnimationFrame(draw);
    };
    draw();
  },

  // ── 命令手册 ──

  unlockManual(entry) {
    if (this.manualEntries.includes(entry.cmd)) return;
    const isNew = this.manualEntries.length > 0; // 初始化时不播音效
    this.manualEntries.push(entry.cmd);
    const div = document.createElement('div');
    div.className = 'manual-entry' + (entry.isOpenClaw ? ' openclaw-cmd' : '');
    div.innerHTML = `<span class="manual-cmd">${entry.cmd}</span><span class="manual-desc">${entry.desc}</span>`;
    this.manualEl.appendChild(div);
    if (isNew && window.AUDIO) AUDIO.cmdUnlock();
  },

  initManual() {
    const basics = [
      // 导航
      { cmd: 'pwd', desc: '显示当前路径' },
      { cmd: 'ls', desc: '列出文件' },
      { cmd: 'ls -a', desc: '含隐藏文件' },
      { cmd: 'ls -l', desc: '详细格式' },
      { cmd: 'cd [路径]', desc: '切换目录' },
      // 读取
      { cmd: 'cat [文件]', desc: '查看文件内容' },
      { cmd: 'head [文件]', desc: '查看前10行' },
      { cmd: 'tail [文件]', desc: '查看后10行' },
      // 搜索
      { cmd: 'grep [词] [文件]', desc: '搜索内容' },
      { cmd: 'grep -v [词] [文件]', desc: '排除匹配行' },
      { cmd: 'grep -r [词] [目录]', desc: '递归搜索' },
      { cmd: 'find [路径] -name', desc: '查找文件' },
      { cmd: 'diff [文件1] [文件2]', desc: '对比差异' },
      // 操作
      { cmd: 'echo "内容" >> [文件]', desc: '追加写入' },
      { cmd: 'rm [文件]', desc: '删除文件' },
      { cmd: 'ps aux', desc: '显示进程' },
      { cmd: 'kill [PID]', desc: '终止进程' },
      // OpenClaw
      { cmd: 'openclaw status', desc: '系统状态', isOpenClaw: true },
      { cmd: 'openclaw gateway status', desc: '网关状态', isOpenClaw: true },
      { cmd: 'openclaw onboard', desc: '引导流程', isOpenClaw: true },
      { cmd: 'openclaw skills list', desc: '技能列表', isOpenClaw: true },
      // 其他
      { cmd: 'whoami', desc: '你是谁？' },
      { cmd: 'git log', desc: '提交历史' },
      { cmd: 'history', desc: '命令历史' },
      { cmd: 'clear', desc: '清屏' },
      { cmd: 'help', desc: '帮助' },
    ];
    basics.forEach(e => this.unlockManual(e));
  },

  // ── 调查日志 ──

  addLog(text) {
    if (this.logEntries.includes(text)) return;
    this.logEntries.push(text);
    const div = document.createElement('div');
    div.className = 'log-entry new';
    div.textContent = '▶ ' + text;
    this.logEl.appendChild(div);
    setTimeout(() => div.classList.remove('new'), 2000);
    this.logEl.scrollTop = this.logEl.scrollHeight;
    if (window.AUDIO) AUDIO.clueUnlock();
  },

  // ── 结局画面 ──

  showEnding(type, lines, onDone) {
    UI.glitchEffect(800);
    setTimeout(() => {
      this.clearTerminal();
      const endDiv = document.createElement('div');
      endDiv.className = 'ending-container ending-' + type.toLowerCase();
      this.termEl.appendChild(endDiv);

      let idx = 0;
      const showNext = () => {
        if (idx >= lines.length) {
          if (onDone) onDone();
          return;
        }
        const item = lines[idx++];
        setTimeout(() => {
          const div = document.createElement('div');
          div.className = 'term-line ' + (item.class || '');
          div.textContent = item.text;
          endDiv.appendChild(div);
          this.scrollToBottom();
          showNext();
        }, item.delay || 0);
      };
      showNext();
    }, 900);
  },

  showCrashEffect(files, afterLines) {
    UI.glitchEffect(500);
    let idx = 0;
    const showFile = () => {
      if (idx >= files.length) {
        // 最终黑屏
        setTimeout(() => {
          this.setMode('crash');
          this.clearTerminal();
          const cur = document.createElement('div');
          cur.className = 'term-line crash-cursor';
          cur.innerHTML = '█';
          this.termEl.appendChild(cur);
          let blink = true;
          setInterval(() => {
            cur.style.opacity = blink ? '1' : '0';
            blink = !blink;
          }, 500);
        }, 800);
        return;
      }
      const line = document.createElement('div');
      line.className = 'term-line warning';
      line.textContent = files[idx++] + ' done';
      this.termEl.appendChild(line);
      this.scrollToBottom();
      setTimeout(showFile, 300);
    };
    setTimeout(showFile, 500);
  }
};
