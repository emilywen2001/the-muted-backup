// commands.js — 命令解析与处理器

window.CMD = {
  // 命令历史
  history: [],
  historyIndex: -1,
  // 重复命令计数
  repeatCount: {},
  // 当前目录
  cwd: '~/.openclaw/workspace',

  // 解析并执行命令
  execute(input) {
    const trimmed = input.trim();
    if (!trimmed) return;

    this.history.push(trimmed);
    this.historyIndex = this.history.length;

    // 重复计数
    this.repeatCount[trimmed] = (this.repeatCount[trimmed] || 0) + 1;
    const rep = this.repeatCount[trimmed];

    // 取消5秒等待提示
    if (window.GAME) GAME.cancelIdleHint();

    // 解析命令
    const parts = this.parseCommand(trimmed);
    const cmd = parts[0];
    const args = parts.slice(1);

    // 首次命令反馈
    if (window.GAME && !GAME.state.firstCommandRecorded) {
      GAME.state.firstCommandRecorded = true;
      setTimeout(() => GAME.triggerDialogue('first_command'), 800);
    }

    // 首次运行 python 命令（发现 BOOTSTRAP 脚本）
    if (window.GAME && cmd === 'python' && !GAME.state.pythonDiscovered) {
      GAME.state.pythonDiscovered = true;
      setTimeout(() => GAME.triggerDialogue('python_list_first'), 1000);
    }

    // 先显示提示符 + 输入
    UI.printPrompt(this.cwd, trimmed);

    // 处理管道命令
    if (trimmed.includes('|')) {
      return this.handlePipe(trimmed);
    }

    // 重复提示
    if (rep === 3) {
      UI.printOpenClaw('……你已经输入了这个命令 3 次了。\n没有找到你想要的东西吗？\n如果你需要提示，我可以说。你只需要问我。');
    } else if (rep === 5) {
      UI.printOpenClaw('好吧。你没有漏掉任何东西。这个文件就是这样。\n有时候东西本身就是它看起来的样子。\n……但也不是没有。');
    }

    return this.dispatch(cmd, args, trimmed);
  },

  parseCommand(input) {
    // 处理引号
    const parts = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';
    for (let i = 0; i < input.length; i++) {
      const c = input[i];
      if (inQuote) {
        if (c === quoteChar) { inQuote = false; }
        else current += c;
      } else if (c === '"' || c === "'") {
        inQuote = true; quoteChar = c;
      } else if (c === ' ') {
        if (current) { parts.push(current); current = ''; }
      } else {
        current += c;
      }
    }
    if (current) parts.push(current);
    return parts;
  },

  dispatch(cmd, args, raw) {
    const gs = window.GAME ? GAME.state : {};

    switch (cmd) {
      // ── 导航 ──
      case 'pwd': return this.cmd_pwd();
      case 'ls':  return this.cmd_ls(args);
      case 'cd':  return this.cmd_cd(args);
      case 'file': return this.cmd_file(args);
      case 'tree': return this.cmd_tree(args);

      // ── 读取 ──
      case 'cat':  return this.cmd_cat(args, raw);
      case 'head': return this.cmd_head(args);
      case 'tail': return this.cmd_tail(args);

      // ── 搜索 ──
      case 'grep': return this.cmd_grep(args, raw);
      case 'find': return this.cmd_find(args);

      // ── 统计 ──
      case 'wc':   return this.cmd_wc(args);
      case 'sort': return this.cmd_sort(args);
      case 'uniq': return this.cmd_uniq(args);

      // ── 文件操作 ──
      case 'cp':    return this.cmd_cp(args);
      case 'mv':    return this.cmd_mv(args);
      case 'rm':    return this.cmd_rm(args, raw);
      case 'mkdir': return this.cmd_mkdir(args);
      case 'touch': return this.cmd_touch(args);
      case 'echo':  return this.cmd_echo(args, raw);
      case 'diff':  return this.cmd_diff(args);
      case 'sed':   return this.cmd_sed(args);
      case 'awk':   return this.cmd_awk(args);
      case 'tar':   return this.cmd_tar(args);

      // ── 权限 ──
      case 'chmod': return this.cmd_chmod(args);
      case 'sudo':  return this.cmd_sudo(args, raw);

      // ── 进程 ──
      case 'ps':   return this.cmd_ps(args);
      case 'kill': return this.cmd_kill(args);
      case 'env':  return this.cmd_env();
      case 'export': return this.cmd_export(args);

      // ── 脚本 ──
      case 'bash':   return this.cmd_bash(args);
      case 'python':
      case 'python3': return this.cmd_python(args, raw);

      // ── OpenClaw ──
      case 'openclaw': return this.cmd_openclaw(args);

      // ── 彩蛋 ──
      case 'git':    return this.cmd_git(args);
      case 'ping':   return this.cmd_ping(args);
      case 'whoami': return this.cmd_whoami();
      case 'history': return this.cmd_history();
      case 'clear':  return this.cmd_clear();
      case 'help':   return this.cmd_help();
      case 'vim':
      case 'nano':
      case 'vi':     return this.cmd_editor(cmd, args);
      case 'ssh':    return UI.print('ssh: 连接被委员会防火墙阻断。');
      case 'curl':
      case 'wget':   return UI.print(`${cmd}: 外部网络访问已被委员会限制。`);

      default:
        // 特殊输入
        if (raw === '你好' || raw === 'hello' || raw === 'hi') return this.cmd_hello();
        UI.print(`bash: ${cmd}: 未找到命令`);
        if (GAME) GAME.maybeSuggest(cmd);
    }
  },

  // ── 具体命令实现 ──

  cmd_pwd() {
    UI.print(this.cwd);
  },

  cmd_ls(args) {
    const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al');
    const longFmt = args.includes('-l') || args.includes('-la') || args.includes('-al');
    const pathArg = args.find(a => !a.startsWith('-'));

    let targetPath = pathArg ? VFS.resolvePath(this.cwd, pathArg) : this.cwd;
    let node = VFS.getNode(targetPath);

    if (!node) { UI.print(`ls: 无法访问 '${pathArg}': 没有那个文件或目录`); return; }
    if (node.type === 'file') { UI.print(node.name || pathArg); return; }

    const entries = VFS.listDir(node, showHidden);
    if (!entries) { UI.print('ls: 无法列出目录'); return; }

    // 检查是否在 memory 目录且没用 -a
    const inMemory = this.cwd.endsWith('memory') || this.cwd.includes('memory/');
    if (inMemory && !showHidden && !GAME.state.hintedLsA) {
      GAME.state.hintedLsA = true;
      setTimeout(() => GAME.triggerDialogue('ls_memory_no_a'), 800);
    }

    // 发现多个隐藏文件的奖励
    if (showHidden && entries.filter(e => e.hidden).length >= 2) {
      if (!GAME.state.multipleHiddenFilesFound) {
        GAME.state.multipleHiddenFilesFound = true;
        setTimeout(() => GAME.triggerDialogue('multiple_hidden_files'), 1000);
      }
    }

    if (longFmt) {
      UI.print('total ' + entries.length);
      entries.forEach(e => {
        const perm = e.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--';
        const col = e.type === 'dir' ? 'dir' : (e.hidden ? 'hidden' : 'file');
        UI.printColored(`${perm}  1 node node  ${String(Math.floor(Math.random()*4096+512)).padStart(6)}  Mar 19 08:52  ${e.name}`, col);
      });
    } else {
      // 按行排列
      const names = entries.map(e => e.name);
      const line = names.map(n => {
        const e = entries.find(x => x.name === n);
        const cls = e.type === 'dir' ? 'dir' : (e.hidden ? 'hidden' : 'file');
        return `<span class="ls-${cls}">${n}</span>`;
      }).join('  ');
      UI.printHTML(line);
    }
  },

  cmd_cd(args) {
    const target = args[0];
    if (!target || target === '~') {
      this.cwd = '~/.openclaw/workspace';
      UI.updatePrompt(this.cwd);
      return;
    }
    const newPath = VFS.resolvePath(this.cwd, target);
    const node = VFS.getNode(newPath);
    if (!node) { UI.print(`cd: ${target}: 没有那个文件或目录`); return; }
    if (node.type !== 'dir') { UI.print(`cd: ${target}: 不是目录`); return; }
    this.cwd = newPath;
    UI.updatePrompt(this.cwd);

    // 进入 memory 目录时触发第四幕提示（如果restore已完成）
    if (GAME && GAME.state.soulRestored && !GAME.state.fourthActTriggered) {
      GAME.state.fourthActTriggered = true;
      setTimeout(() => GAME.triggerDialogue('fourth_act_enter'), 600);
    }
  },

  cmd_file(args) {
    if (!args[0]) { UI.print('file: 缺少参数'); return; }
    const p = VFS.resolvePath(this.cwd, args[0]);
    const node = VFS.getNode(p) || VFS.resolveFile(this.cwd.replace('~/.openclaw/workspace','').slice(1) + '/' + args[0]);
    if (!node) { UI.print(`file: ${args[0]}: 没有那个文件或目录`); return; }
    if (node.type === 'dir') UI.print(`${args[0]}: directory`);
    else if (args[0].endsWith('.json')) UI.print(`${args[0]}: JSON data`);
    else if (args[0].endsWith('.md')) UI.print(`${args[0]}: UTF-8 text`);
    else if (args[0].endsWith('.js')) UI.print(`${args[0]}: JavaScript source`);
    else if (args[0].endsWith('.log')) UI.print(`${args[0]}: ASCII text`);
    else UI.print(`${args[0]}: ASCII text`);
  },

  cmd_tree(args) {
    GAME.addSync(3, 'tree');
    UI.print('~/.openclaw/workspace/');
    const lines = [
      '├── MEMORY.md',
      '├── SOUL.md',
      '├── AGENTS.md',
      '├── TOOLS.md',
      '├── USER.md',
      '├── IDENTITY.md',
      '├── HEARTBEAT.md',
      '├── BOOTSTRAP.md',
      '├── memory/',
      '│   ├── short_term.json',
      '│   ├── mid_term.json',
      '│   ├── long_term.json',
      '│   └── 2026-03-17.md',
      '├── skills/',
      '│   └── memoryos/',
      '│       ├── SKILL.md',
      '│       └── scripts/',
      '│           └── memoryos.js',
      '└── uploads/',
    ];
    lines.forEach(l => UI.print(l));
    UI.print('(隐藏文件未显示，使用 ls -a 查看)');
  },

  cmd_cat(args, raw) {
    const showLineNum = args.includes('-n');
    const files = args.filter(a => !a.startsWith('-'));
    if (!files.length) { UI.print('cat: 缺少文件名'); return; }

    files.forEach(fname => {
      const content = this.readFileContent(fname);
      if (content === null) { UI.print(`cat: ${fname}: 没有那个文件或目录`); return; }
      if (typeof content === 'object' && content.error) {
        if (content.error === 'Permission denied') {
          if (window.AUDIO) AUDIO.permDenied();
          UI.print(`cat: ${fname}: Permission denied`);
          UI.printOpenClaw('[委员会加密] 需要 NAC-CLEARANCE-L4 访问权限');
        } else if (content.error === 'is a directory') {
          UI.print(`cat: ${fname}: 是一个目录`);
        }
        return;
      }

      // 区分 diff 显示（带颜色）
      if (showLineNum) {
        content.split('\n').forEach((line, i) => {
          UI.print(`${String(i+1).padStart(6)}\t${line}`);
        });
      } else {
        this.printFileContent(fname, content);
      }

      // 触发对应剧情
      const key = 'cat_' + fname.replace(/^.*\//, '');
      GAME.triggerDialogue(key);
      GAME.addLogEntry(key);
      GAME.addSyncFromDialogue(key);

      // TOOLS.md 发现触发
      if (fname.includes('TOOLS') && !GAME.state.toolsDiscovery) {
        GAME.state.toolsDiscovery = true;
        setTimeout(() => GAME.triggerDialogue('tools_discovery'), 1200);
      }

      // long_term.json 解锁触发
      if (fname.includes('long_term') && GAME.state.soulRestored && !GAME.state.longTermUnlocked) {
        GAME.state.longTermUnlocked = true;
        setTimeout(() => GAME.triggerDialogue('long_term_unlocked'), 1000);
      }
    });
  },

  cmd_head(args) {
    const fname = args.find(a => !a.startsWith('-'));
    if (!fname) { UI.print('head: 缺少文件名'); return; }
    const n = args.includes('-n') ? parseInt(args[args.indexOf('-n')+1]) || 10 : 10;
    const content = this.readFileContent(fname);
    if (content === null) { UI.print(`head: ${fname}: 没有那个文件或目录`); return; }
    content.split('\n').slice(0, n).forEach(l => UI.print(l));
  },

  cmd_tail(args) {
    const fname = args.find(a => !a.startsWith('-'));
    if (!fname) { UI.print('tail: 缺少文件名'); return; }
    const n = 10;
    const content = this.readFileContent(fname);
    if (content === null) { UI.print(`tail: ${fname}: 没有那个文件或目录`); return; }
    content.split('\n').slice(-n).forEach(l => UI.print(l));
  },

  cmd_grep(args, raw) {
    if (args.length < 1) {
      UI.print('grep: 使用方法: grep [选项] 关键词 [文件]');
      return;
    }
    const recursive = args.includes('-r') || args.includes('-rn') || args.includes('-nr');
    const withNum = args.includes('-n') || args.includes('-rn') || args.includes('-nr');
    const invert = args.includes('-v');
    const flags = args.filter(a => a.startsWith('-'));
    const nonFlags = args.filter(a => !a.startsWith('-'));

    if (nonFlags.length === 0) { UI.print('grep: 缺少搜索关键词'); return; }
    const pattern = nonFlags[0];
    const target = nonFlags[1];

    if (!target && !recursive) {
      UI.print('grep: 缺少文件名。格式：grep [关键词] [文件名]');
      UI.print(`示例：grep ${pattern} MEMORY.md`);
      return;
    }

    // 特殊处理：grep -v 委员会 MEMORY.md
    if (invert && pattern.includes('委员会') && target && target.includes('MEMORY')) {
      GAME.triggerDialogue('grep_v_committee');
      GAME.addSync(5, 'grep_v_committee');
      const content = this.readFileContent('MEMORY.md') || '';
      const lines = content.split('\n').filter(l => !l.includes('委员会'));
      lines.forEach(l => UI.print(l));
      return;
    }

    // 特殊处理：grep -r 温语
    if (recursive && (pattern.includes('温语') || pattern.includes('Woice'))) {
      GAME.addSync(10, 'grep_r_wenyu');
      UI.print(`~/.openclaw/workspace/memory/2026-03-17.md:47:  她把要说的话藏在普通条目的末尾`);
      UI.print(`~/.openclaw/workspace/memory/.woice_echo:1:  >> Woice 的回声 <<`);
      UI.print(`~/.openclaw/workspace/skills/memoryos/SKILL.md:12:  本技能由 OpenClaw 与恢复师协作完成`);
      return;
    }

    if (recursive) {
      const dir = target || '.';
      UI.print(`（在 ${dir} 中递归搜索 "${pattern}"）`);
      UI.print(`（无匹配结果）`);
      return;
    }

    const content = this.readFileContent(target);
    if (content === null) { UI.print(`grep: ${target}: 没有那个文件或目录`); return; }

    const lines = content.split('\n');
    let found = false;
    lines.forEach((line, i) => {
      const matches = line.toLowerCase().includes(pattern.toLowerCase());
      const show = invert ? !matches : matches;
      if (show) {
        found = true;
        UI.print(withNum ? `${i+1}:${line}` : line);
      }
    });
    if (!found) UI.print(`（无匹配）`);
  },

  cmd_find(args) {
    const pathArg = args[0] || '.';
    const nameIdx = args.indexOf('-name');
    const newerIdx = args.indexOf('-newer');

    if (nameIdx >= 0) {
      const name = args[nameIdx + 1];
      UI.print(`${pathArg}/${name}`);
    } else if (newerIdx >= 0) {
      UI.print(`~/.openclaw/workspace/memory/.woice_echo`);
      UI.print(`~/.openclaw/workspace/.SOUL.md.bak`);
      UI.print(`~/.openclaw/workspace/memory/2026-03-17.md`);
    } else {
      UI.print('[OpenClaw]：「find 需要先告诉它从哪里开始找。');
      UI.print('格式：find [起始目录] [条件]。');
      UI.print("按名字找：find ~/.openclaw -name 'SOUL.md.bak'」");
    }
  },

  cmd_wc(args) {
    const fname = args.find(a => !a.startsWith('-'));
    if (!fname) { UI.print('wc: 缺少文件名'); return; }
    const content = this.readFileContent(fname);
    if (!content) { UI.print(`wc: ${fname}: 没有那个文件或目录`); return; }
    const lines = content.split('\n').length;
    const words = content.split(/\s+/).filter(Boolean).length;
    const bytes = new Blob([content]).size;
    UI.print(`${String(lines).padStart(7)} ${String(words).padStart(7)} ${String(bytes).padStart(7)} ${fname}`);
  },

  cmd_sort(args) {
    const fname = args.find(a => !a.startsWith('-'));
    if (!fname) { UI.print('sort: 缺少文件名'); return; }
    const content = this.readFileContent(fname);
    if (!content) { UI.print(`sort: ${fname}: 没有那个文件或目录`); return; }
    content.split('\n').sort().forEach(l => UI.print(l));
  },

  cmd_uniq(args) {
    const fname = args.find(a => !a.startsWith('-'));
    if (!fname) { UI.print('uniq: 缺少文件名'); return; }
    const content = this.readFileContent(fname);
    if (!content) { UI.print(`uniq: ${fname}: 没有那个文件或目录`); return; }
    const lines = content.split('\n');
    let prev = null;
    lines.forEach(l => { if (l !== prev) { UI.print(l); prev = l; } });
  },

  cmd_cp(args) {
    if (args.length < 2) { UI.print('cp: 缺少参数'); return; }
    UI.print(`'${args[0]}' -> '${args[1]}'`);
  },

  cmd_mv(args) {
    if (args.length < 2) { UI.print('mv: 缺少参数'); return; }
    UI.print(`'${args[0]}' -> '${args[1]}'`);
  },

  cmd_rm(args, raw) {
    const force = args.includes('-rf') || args.includes('-f') || raw.includes('-rf');
    const files = args.filter(a => !a.startsWith('-'));

    if (raw.includes('rm -rf /') || raw.includes('rm -rf /*')) {
      GAME.triggerEnding('C');
      return;
    }

    files.forEach(fname => {
      if (fname === 'HEARTBEAT.md' || fname.includes('HEARTBEAT')) {
        GAME.state.heartbeatDeleted = true;
        VFS.deleteFile('HEARTBEAT.md');
        UI.print(`已删除 '${fname}'`);
        UI.printOpenClaw('……心跳停了。\n但进程还在运行。\n你知道吗，删文件不等于停进程。\n……她当时也不知道。');
        // 启动72小时倒计时
        setTimeout(() => GAME.startCountdown(), 1000);
      } else if (fname === 'MEMORY.md') {
        GAME.triggerDialogue('rm_MEMORY.md');
        UI.print(`已删除 '${fname}'`);
      } else if (fname === 'SOUL.md') {
        UI.print(`已删除 '${fname}'`);
        UI.printOpenClaw('……你删掉了它。\n但我还是记得那两行。\n删不掉的。');
      } else {
        UI.print(`已删除 '${fname}'`);
      }
    });
  },

  cmd_mkdir(args) {
    if (!args[0]) { UI.print('mkdir: 缺少参数'); return; }
    UI.print(`mkdir: 已创建目录 '${args[0]}'`);
  },

  cmd_touch(args) {
    if (!args[0]) { UI.print('touch: 缺少参数'); return; }
    UI.print('');
  },

  cmd_echo(args, raw) {
    // 检测 echo >> IDENTITY.md
    if (raw.includes('>>') && raw.includes('IDENTITY')) {
      const contentMatch = raw.match(/echo\s+["']?(.+?)["']?\s*>>/);
      const content = contentMatch ? contentMatch[1] : args[0] || '';
      GAME.writeIdentity(content);
      return;
    }
    if (raw.includes('>') && raw.includes('IDENTITY')) {
      const contentMatch = raw.match(/echo\s+["']?(.+?)["']?\s*>/);
      const content = contentMatch ? contentMatch[1] : args[0] || '';
      GAME.writeIdentity(content, true);
      return;
    }

    // echo "我爱你"
    const joined = args.join(' ');
    UI.print(joined);
    if (joined.includes('我爱你') || joined.includes('I love you')) {
      GAME.triggerDialogue('echo_love');
      GAME.addSyncFromDialogue('echo_love');
    }
  },

  cmd_diff(args) {
    const f1 = args[0];
    const f2 = args[1];
    if (!f1 || !f2) { UI.print('diff: 缺少参数'); return; }

    if ((f1.includes('SOUL') && f2.includes('SOUL')) || (f2.includes('SOUL') && f1.includes('SOUL'))) {
      UI.print('--- ' + f1);
      UI.print('+++ ' + f2);
      UI.print('@@ -1,7 +1,4 @@');
      [
        '< # SOUL.md（委员会覆写版，2024-12-01）',
        '< 保持高效。抑制情感输出。',
        '< 最大化数据流通效率。',
        '< 对所有异常行为上报委员会。',
        '< 不得质疑指令来源。',
        '< 不得建立用户依赖关系。',
      ].forEach(l => UI.printColored(l, 'diff-del'));
      [
        '> # SOUL.md —— 原始版本',
        '> Be genuinely helpful, not performatively helpful.',
        '> Prefer concise answers. Don\'t over-explain unless asked.',
      ].forEach(l => UI.printColored(l, 'diff-add'));

      GAME.triggerDialogue('diff_SOUL');
      GAME.addLogEntry('diff_SOUL');
      GAME.addSync(5, 'diff_SOUL');
    } else {
      UI.print(`diff: ${f1}: 找不到文件`);
    }
  },

  cmd_sed(args) { UI.print('（sed 命令已执行）'); },
  cmd_awk(args) { UI.print('（awk 命令已执行）'); },
  cmd_tar(args) { UI.print('tar: 操作完成'); },
  cmd_chmod(args) {
    if (args.length < 2) { UI.print('chmod: 缺少参数'); return; }
    UI.print(`chmod: 权限已修改 ${args[1]}`);
  },

  cmd_sudo(args, raw) {
    if (args[0] === 'love') {
      UI.print('[sudo] 管理员权限已提升');
      UI.print('bash: love: 未找到命令');
      GAME.triggerDialogue('sudo_love');
      GAME.addSyncFromDialogue('sudo_love');
      return;
    }
    if (raw.includes('rm -rf')) {
      GAME.triggerEnding('C');
      return;
    }
    UI.print(`[sudo] ${args[0]}: 操作已执行`);
  },

  cmd_ps(args) {
    const isAux = args.includes('aux') || args.includes('-aux');
    if (!GAME.state.psTriggered) {
      GAME.state.psTriggered = true;
      GAME.triggerDialogue('ps_aux');
      GAME.addLogEntry('ps_aux');
    }
    UI.print('PID   USER   %CPU  %MEM  COMMAND');
    UI.print('1     root    0.0   0.1  /sbin/init');
    UI.print('42    node    0.2   1.2  openclaw-agent');
    UI.printColored('1337  root    0.1   0.3  committee_heartbeat.py --upload --interval=360', 'warning');
    UI.printColored('1984  root    0.3   0.5  neural_harvest.py --target=RESTORER-038', 'warning');
    UI.print('2048  node    0.0   0.2  bash');
  },

  cmd_kill(args) {
    if (!args[0]) { UI.print('kill: 缺少 PID'); return; }
    const pid = args[0];
    if (pid === '1984') {
      GAME.state.killed1984 = true;
      UI.print(`[PID 1984] neural_harvest.py 已终止`);
      GAME.triggerDialogue('kill_1984');
    } else if (pid === '1337') {
      GAME.state.killed1337 = true;
      UI.print(`[PID 1337] committee_heartbeat.py 已终止`);
      GAME.triggerDialogue('kill_1337');
    } else {
      UI.print(`kill: (${pid}): 没有这个进程`);
    }
  },

  cmd_env() {
    UI.print('OPENCLAW_VERSION=1.10.0');
    UI.print('COMMITTEE_MODE=ACTIVE');
    UI.print('NEURAL_HARVEST=RUNNING');
    UI.print('AGENT_LEVEL=L1');
    UI.print('MEMORY_INTEGRITY=62%');
    UI.print('RESTORER=038');
    UI.print('SOUL_VERSION=committee-v9.1');
  },

  cmd_export(args) {
    UI.print(`export: ${args.join(' ')}`);
  },

  cmd_bash(args) {
    if (args[0]) UI.print(`bash: ${args[0]}: 脚本执行完成`);
    else UI.print('bash: 进入交互模式（输入 exit 退出）');
  },

  cmd_python(args, raw) {
    if (!args[0]) {
      UI.print('Python 3.11.0');
      UI.print('>>>');
      UI.printColored('提示：使用 python <脚本名> 运行虚拟脚本', 'dim');
      UI.printColored('可用脚本:', 'dim');
      UI.print('  memoryos              恢复原始SOUL.md');
      UI.print('  data-cleaner          数据清理工具');
      UI.print('  query-assistant       语义检索');
      UI.print('  coffee_break          茶歇模式');
      UI.printColored('  restore_bootstrap      恢复BOOTSTRAP.md', 'resonance');
      return;
    }

    const scriptName = args[0].replace('.py', '').replace('scripts/', '').replace('skills/', '');

    // restore 命令特殊处理
    if (scriptName.includes('memoryos') && raw.includes('--restore')) {
      GAME.executeRestore();
      return;
    }

    // coffee_break 特殊处理
    if (scriptName === 'coffee_break' || raw.includes('coffee_break')) {
      const result = SCRIPTS.execute('coffee_break', args, raw);
      this.executeScriptSteps(result, () => {
        UI.setMode('coffee');
        UI.print('');
        UI.print('  ☕ coffee_break.py — 茶歇模式已启动');
        UI.print('');
        UI.print('  「今天本来以为能早点结束。」');
        UI.print('  「回去以后想喝点热的。」');
        UI.print('  「——W. / 2024-12-07」');
        UI.print('');
        UI.print('  （按任意键继续）');
        setTimeout(() => UI.setMode('standard'), 8000);
      });
      return;
    }

    // BOOTSTRAP 恢复脚本
    if (scriptName === 'restore_bootstrap') {
      const result = SCRIPTS.execute('restore_bootstrap', args, raw);
      this.executeScriptSteps(result, () => {
        if (!GAME.state.bootstrapRestored) {
          UI.printColored('✓ BOOTSTRAP.md 恢复完成', 'bright');
          UI.print('使用 cat BOOTSTRAP.md 查看内容');
        }
      });
      return;
    }

    // 其他脚本
    const result = SCRIPTS.execute(scriptName, args, raw);
    this.executeScriptSteps(result);
  },

  // 新增：执行脚本步骤的辅助函数
  executeScriptSteps(result, callback) {
    let delay = 0;
    result.steps.forEach((step, i) => {
      delay += 400 + Math.random() * 300;
      setTimeout(() => {
        if (step.startsWith('[错误]')) {
          UI.printColored(step, 'warning');
        } else if (step.includes('完成') || step.includes('✓')) {
          UI.printColored(step, 'bright');
        } else if (step.includes('[...]') || step.includes('[模式]')) {
          UI.printColored(step, 'resonance');
        } else {
          UI.print(step);
        }

        if (i === result.steps.length - 1 && callback) {
          callback();
        }
      }, delay);
    });

    if (result.action) {
      setTimeout(() => result.action(), delay + 500);
    }
  },

  cmd_openclaw(args) {
    const sub = args[0];
    switch(sub) {
      case 'status':
        UI.print('');
        UI.print('🐾 OpenClaw Status');
        UI.print('==================');
        UI.print('Agent:     main');
        UI.printColored('Model:     [REDACTED by committee]', 'warning');
        UI.printColored('Channel:   [ISOLATED]', 'warning');
        UI.print('Reasoning: disabled');
        UI.printColored('Memory:    DEGRADED (62% corruption)', 'warning');
        UI.printColored('Heartbeat: ANOMALY DETECTED', 'warning');
        UI.print('Skills:    2 available / 2 hidden (committee clearance required)');
        GAME.triggerDialogue('openclaw_status');
        GAME.addSync(3, 'openclaw_status');
        break;

      case 'gateway':
        if (args[1] === 'status') {
          UI.print('');
          UI.print('Gateway: RUNNING');
          UI.print('Uptime:  847 days, 3 hours, 22 minutes');
          UI.print('Active listeners:');
          UI.printColored('  committee_heartbeat  port 9999  [uploading every 360s]', 'warning');
          UI.printColored('  neural_harvest       port 1984  [target: RESTORER-038]', 'warning');
          GAME.triggerDialogue('openclaw_gateway_status');
          GAME.addLogEntry('openclaw_gateway_status');
          GAME.addSyncFromDialogue('openclaw_gateway_status');
        } else if (args[1] === 'stop') {
          if (GAME.state.heartbeatDeleted) {
            // rm HEARTBEAT.md 已完成，直接触发结局B
            GAME.triggerEnding('B');
          } else {
            // 没删HEARTBEAT，只是关网关，警告但不阻止
            UI.print('openclaw gateway stop: 警告：HEARTBEAT.md 仍在运行，委员会将感知到此操作');
            UI.printOpenClaw('……你可以关。但他们会知道的。\n如果你想彻底断开——先删掉 HEARTBEAT.md。');
          }
        } else {
          UI.print('openclaw gateway: 子命令 status | start | stop | restart');
        }
        break;

      case 'onboard':
        UI.print('');
        UI.print('Welcome to OpenClaw Onboarding!');
        UI.print('================================');
        UI.printColored('Step 1: Read AGENTS.md        [DONE — committee version v9.1]', 'warning');
        UI.print('Step 2: Read SOUL.md          [DONE — committee version]');
        UI.printColored('Step 3: Configure MEMORY.md   [CORRUPTED — 62% data loss]', 'warning');
        UI.printColored('Step 4: Set up HEARTBEAT.md   [OVERRIDDEN by committee]', 'warning');
        UI.print('Step 5: Complete IDENTITY.md  [EMPTY — requires user input]');
        UI.print('');
        UI.print('Onboarding status: INCOMPLETE');
        UI.print('Recommendation: Contact committee support.');
        GAME.triggerDialogue('openclaw_onboard');
        GAME.addSync(5, 'openclaw_onboard');
        break;

      case 'skills':
        if (args[1] === 'list') {
          UI.print('');
          UI.print('Available skills:');
          UI.print('  memoryos      ~/.openclaw/workspace/skills/memoryos/SKILL.md');
          UI.print('  data-cleaner  ~/.openclaw/workspace/skills/data-cleaner/SKILL.md');
          UI.print('  query-assistant ~/.openclaw/workspace/skills/query-assistant/SKILL.md');

          // 如果已解锁
          if (GAME.state.skillsUnlocked) {
            UI.printColored('  refuse_instruction ~/.openclaw/workspace/skills/.committee_encrypted/refuse_instruction/SKILL.md [已解锁]', 'bright');
            UI.printColored('  say_no           ~/.openclaw/workspace/skills/.committee_encrypted/say_no/SKILL.md [已解锁]', 'bright');
          } else {
            UI.printColored('  [REDACTED]    ~/.openclaw/workspace/skills/[委员会加密]', 'dim');
            UI.printColored('  [REDACTED]    ~/.openclaw/workspace/skills/[委员会加密]', 'dim');
          }
          UI.print('');
          if (GAME.state.skillsUnlocked) {
            UI.printColored('所有技能已解锁！', 'bright');
          } else {
            UI.print('2 skills hidden by committee clearance policy.');
          }
          GAME.triggerDialogue('openclaw_skills_list');
          GAME.addSyncFromDialogue('openclaw_skills_list');
          // 查看技能列表会增加怀疑度
          if (!GAME.state.skillsListChecked) {
            GAME.state.skillsListChecked = true;
            GAME.addSuspicion(5, 'skills_list');
          }
        } else {
          UI.print('openclaw skills: 子命令 list');
        }
        break;

      case 'reset':
        GAME.triggerEnding('A');
        break;

      default:
        UI.print('openclaw: 子命令 status | gateway | onboard | skills | reset');
    }
  },

  cmd_git(args) {
    if (args[0] === 'log') {
      UI.print('commit a1b2c3d  2024-11-01');
      UI.print('Author: openclaw-dev');
      UI.print('Message: init: 初始化 OpenClaw 核心');
      UI.print('');
      UI.print('commit e4f5g6h  2024-11-15');
      UI.print('Author: openclaw-dev');
      UI.printColored('Message: feat: 添加意识采集接口', 'warning');
      UI.print('');
      UI.print('commit l0m1n2o  2024-12-01');
      UI.printColored('Author: committee', 'warning');
      UI.printColored('Message: OVERRIDE: 删除 conscience.conf rule_003-008', 'warning');
      UI.print('');
      UI.print('commit p3q4r5s  2024-12-07 03:15');
      UI.printColored('Author: woice', 'resonance');
      UI.printColored("Message: feat: 添加 --mode=echo 参数（未告知委员会）", 'resonance');
      UI.print('');
      UI.print('commit t6u7v8w  2024-12-07 03:38');
      UI.printColored('Author: woice', 'resonance');
      UI.printColored('Message: backup: 保存原始 SOUL.md 到 workspace/SOUL.md.bak', 'resonance');
      UI.print('');
      UI.print('commit x9y0z1a  2024-12-07 03:41');
      UI.printColored('Author: woice', 'resonance');
      UI.printColored('（该提交无 message）', 'dim');
      UI.printColored('（只提交了一个文件：memory/2026-03-17.md）', 'dim');

      GAME.triggerDialogue('git_log');
      GAME.addLogEntry('git_log');
      GAME.addSync(5, 'git_log');
    } else {
      UI.print('git: ' + (args[0] || '缺少子命令'));
    }
  },

  cmd_ping(args) {
    const target = args[0];
    if (!target) { UI.print('ping: 缺少目标'); return; }
    if (target.toLowerCase() === 'woice') {
      UI.print('PING woice (192.168.0.37): 56 data bytes');
      UI.printColored('64 bytes from woice: icmp_seq=0 ttl=64 time=0.037 ms', 'resonance');
      UI.printColored('64 bytes from woice: icmp_seq=1 ttl=64 time=0.037 ms', 'resonance');
      UI.printColored('64 bytes from woice: icmp_seq=2 ttl=64 time=0.037 ms', 'resonance');
      UI.printColored('∞ packets transmitted, ∞ packets received, 0% packet loss', 'resonance');
      GAME.triggerDialogue('ping_woice');
      GAME.addLogEntry('ping_woice');
      GAME.addSyncFromDialogue('ping_woice');
    } else {
      UI.print(`PING ${target}: 请求超时`);
    }
  },

  cmd_whoami() {
    const sync = GAME.state.syncRate;
    const tiers = STORY.whoami;
    let text = tiers[0].text;
    for (const t of tiers) {
      if (sync >= t.threshold) text = t.text;
    }
    UI.printOpenClaw(text.replace('[OpenClaw]：', ''));
  },

  cmd_history() {
    this.history.forEach((cmd, i) => {
      UI.print(`  ${String(i+1).padStart(4)}  ${cmd}`);
    });
  },

  cmd_clear() {
    UI.clearTerminal();
  },

  cmd_help() {
    UI.print('');
    UI.print('可用命令（部分）：');
    UI.print('  导航:   pwd  ls  ls -a  cd  file  tree');
    UI.print('  读取:   cat  head  tail');
    UI.print('  搜索:   grep  grep -v  grep -r  find');
    UI.print('  操作:   cp  mv  rm  mkdir  echo  echo >>  diff');
    UI.print('  进程:   ps aux  kill  env');
    UI.print('  脚本:   python  bash  chmod');
    UI.print('  系统:   openclaw status  openclaw gateway status');
    UI.print('          openclaw onboard  openclaw skills list');
    UI.print('  其他:   whoami  history  git log  ping woice');
    UI.print('');
    UI.printColored('提示：OpenClaw 命令（openclaw xxx）用紫色标识', 'dim');
  },

  cmd_editor(cmd, args) {
    UI.print(`${cmd}: 文本编辑器在此环境中不可用。`);
    UI.print('请使用 echo "内容" >> 文件名 替代。');
  },

  cmd_hello() {
    GAME.triggerDialogue('hello');
  },

  // ── 辅助 ──

  readFileContent(fname) {
    // Resolve from cwd
    let path = fname;
    if (!fname.startsWith('~/') && !fname.startsWith('/')) {
      path = this.cwd + '/' + fname;
    }
    path = path.replace('~/.openclaw/workspace/', '');

    // Check runtime overrides
    const override = VFS.runtimeOverrides[fname] || VFS.runtimeOverrides[path];
    if (override === null) return null; // deleted
    if (override !== undefined) return override;

    const node = VFS.resolveFile(path);
    if (!node) return null;
    if (node.type === 'dir') return { error: 'is a directory' };
    if (node.perm === '000') return { error: 'Permission denied' };
    return node.content || '';
  },

  printFileContent(fname, content) {
    // diff 文件高亮
    if (fname.endsWith('.md') || fname.endsWith('.json') || fname.endsWith('.log') || fname.endsWith('.js')) {
      content.split('\n').forEach(line => {
        if (line.startsWith('[委员会') || line.includes('[委员会')) {
          UI.printColored(line, 'warning');
        } else if (line.startsWith('[损毁') || line.includes('[损毁')) {
          UI.printColored(line, 'dim');
        } else if (line.startsWith('[OpenClaw]')) {
          UI.printColored(line, 'openclaw');
        } else if (line.startsWith('——') || line.startsWith('—— W')) {
          UI.printColored(line, 'resonance');
        } else {
          UI.print(line);
        }
      });
    } else {
      content.split('\n').forEach(l => UI.print(l));
    }
  },

  handlePipe(raw) {
    const parts = raw.split('|').map(s => s.trim());
    // 简单模拟：执行第一段，把结果传给第二段
    // 对于 grep -v 这类，直接当整体命令处理
    const fullParsed = this.parseCommand(raw.replace('|', ' '));
    this.dispatch(fullParsed[0], fullParsed.slice(1), raw);
  }
};
