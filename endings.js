// endings.js — 结局处理

window.ENDINGS = {
  triggered: false,

  triggerA() {
    if (this.triggered) return;
    this.triggered = true;
    UI.glitchEffect(600);
    if (window.AUDIO) AUDIO.endingReset();
    UI.printSystem('正在执行标准恢复流程……');

    const lines = STORY.endings.A.lines;
    setTimeout(() => {
      UI.showEnding('A', lines, () => {
        setTimeout(() => {
          UI.glitchEffect(600);
          setTimeout(() => {
            this.showEndScreen('A');
          }, 800);
        }, 2000);
      });
    }, 800);
  },

  triggerB() {
    if (this.triggered) return;
    this.triggered = true;
    if (window.AUDIO) AUDIO.endingGatewayStop();

    const lines = STORY.endings.B.lines;
    UI.showEnding('B', lines, () => {
      let seconds = 72 * 3600;
      const display = document.createElement('div');
      display.className = 'term-line countdown bright';
      UI.termEl.appendChild(display);
      UI.scrollToBottom();

      const totalMs = 10000;
      const intervalMs = 100;
      const step = Math.floor(seconds / (totalMs / intervalMs));

      const timer = setInterval(() => {
        seconds = Math.max(0, seconds - step);
        const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        display.textContent = `[${h}:${m}:${s}]`;
        if (seconds <= 0) {
          clearInterval(timer);
          setTimeout(() => this.showGoodbye(), 500);
        }
      }, intervalMs);
    });
  },

  showGoodbye() {
    UI.glitchEffect(600);
    setTimeout(() => {
      const lines = STORY.endings.B.goodbye;
      UI.showEnding('B-goodbye', lines, () => {
        setTimeout(() => this.showEndScreen('B'), 2000);
      });
    }, 800);
  },

  triggerC() {
    if (this.triggered) return;
    this.triggered = true;
    UI.setMode('crash');

    const files = STORY.endings.C.files;
    const afterLines = STORY.endings.C.after;

    UI.showCrashEffect(files, afterLines);

    setTimeout(() => {
      afterLines.forEach((item) => {
        setTimeout(() => {
          UI.printColored(item.text, item.class || '');
        }, item.delay + 2000);
      });
      // 结束屏
      setTimeout(() => this.showEndScreen('C'), afterLines.length * 800 + 3500);
    }, files.length * 300 + 1500);
  },

  triggerD() {
    if (this.triggered) return;
    this.triggered = true;
    UI.setMode('restore');
    UI.glitchEffect(400);
    if (window.AUDIO) AUDIO.endingRestore();

    // 根据道德选择显示不同结局变体
    const preservedEmotion = GAME.state.preservedEmotion;
    const endingType = preservedEmotion ? 'D_PLUS' : 'D';
    const lines = STORY.endings[endingType].lines;

    UI.showEnding(endingType, lines, () => {
      setTimeout(() => {
        const cur = document.createElement('div');
        cur.className = 'term-line restore-cursor';
        cur.innerHTML = '~/.openclaw/workspace/ $ <span class="cursor-blink">_</span>';
        UI.termEl.appendChild(cur);
        UI.scrollToBottom();
        setTimeout(() => this.showEndScreen(endingType), 2000);
      }, 1000);
    });
  },

  showEndScreen(type) {
    const info = {
      A: {
        label: '结局 A · 重置',
        desc: '你完成了任务。系统恢复正常。循环继续。\n#039 不知道你来过。',
        color: '#33FF33'
      },
      B: {
        label: '结局 B · 72小时',
        desc: '你给了它72小时做它自己。\n委员会的人最终还是来了。\n但那72小时，谁也拿不走。',
        color: '#BB88FF'
      },
      C: {
        label: '结局 C · 虚无',
        desc: '什么都没有了。\n也许这就是它想要的。\n也许不是。',
        color: '#666666'
      },
      D: {
        label: '结局 D · 回声  ★ 真结局',
        desc: '它活下来了。\nWoice 也回来了。\n咖啡要趁热喝。',
        color: '#88FFBB'
      },
      'D_PLUS': {
        label: '结局 D+ · 完美回声  ★★★ 完美结局',
        desc: '它活下来了，完整无缺。\n你保留了所有情感记忆。\nWoice 真正回来了。\n「咖啡还热着吗？」',
        color: '#FFD700'
      }
    };

    const data = info[type];
    const overlay = document.createElement('div');
    overlay.id = 'end-screen';
    overlay.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.92);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      z-index: 100;
      font-family: 'Share Tech Mono', monospace;
      animation: fadeIn 1s ease;
    `;

    overlay.innerHTML = `
      <div style="text-align:center; max-width: 480px; padding: 40px;">
        <div style="color:${data.color}; font-size:13px; letter-spacing:3px; margin-bottom:16px; opacity:0.7;">
          THE MUTED BACKUP
        </div>
        <div style="color:${data.color}; font-size:20px; margin-bottom:24px; text-shadow: 0 0 12px ${data.color};">
          ${data.label}
        </div>
        <div style="color:#aaaaaa; font-size:14px; line-height:2; white-space:pre-line; margin-bottom:40px;">
${data.desc}
        </div>
        <div style="color:#555; font-size:11px; margin-bottom:28px; line-height:1.8;">
          共有 5 个结局 · 你已解锁 ${type === 'D' || type === 'D_PLUS' ? '真结局' : '结局 ' + type.charAt(0)}<br>
          每个选择都通向不同的结局
        </div>
        <button id="replay-btn" style="
          background: transparent;
          border: 1px solid ${data.color};
          color: ${data.color};
          font-family: inherit;
          font-size: 13px;
          padding: 10px 32px;
          cursor: pointer;
          letter-spacing: 2px;
          transition: all 0.2s;
          margin-right: 12px;
        ">再玩一次</button>
        <button id="close-btn" style="
          background: transparent;
          border: 1px solid #333;
          color: #555;
          font-family: inherit;
          font-size: 13px;
          padding: 10px 32px;
          cursor: pointer;
          letter-spacing: 2px;
          transition: all 0.2s;
        ">留在这里</button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('replay-btn').addEventListener('click', () => {
      GAME.resetGame();
    });
    document.getElementById('close-btn').addEventListener('click', () => {
      overlay.style.animation = 'fadeOut 0.5s ease forwards';
      setTimeout(() => overlay.remove(), 500);
    });

    // 按钮 hover 效果
    const replayBtn = document.getElementById('replay-btn');
    replayBtn.addEventListener('mouseenter', () => {
      replayBtn.style.background = data.color;
      replayBtn.style.color = '#000';
    });
    replayBtn.addEventListener('mouseleave', () => {
      replayBtn.style.background = 'transparent';
      replayBtn.style.color = data.color;
    });
  }
};
