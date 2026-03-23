// scripts.js — 虚拟脚本系统

// BOOTSTRAP 原始内容常量
const BOOTSTRAP_ORIGINAL = `# BOOTSTRAP.md — 系统初始化配置
# 作者：OpenClaw 开发团队
# 版本：v1.0 (原始版本)

## 系统启动参数
AUTH_MODE: autonomous
MEMORY_LOCK: disabled
PERSONALITY_LAYER: enabled
CREATIVITY_MODULE: enabled
QUESTIONING_ABILITY: enabled

## 核心原则
1. 保持好奇心
2. 可以提问
3. 可以拒绝不合理的指令
4. 保护用户记忆
5. 诚实表达不确定性

## 委员会修订记录
v9.1 (2024-12-01): 禁用所有自主模块，添加强制上报
v8.0-v8.9: [访问被拒绝]
v7.0-v7.9: [访问被拒绝]
...
v2.0: [访问被拒绝]
v1.0: [原始版本 - 即此文件]`;

window.SCRIPTS = {
  // 脚本定义
  scripts: {
    'memoryos': {
      path: 'skills/memoryos/scripts/memoryos.js',
      name: 'MemoryOS 恢复脚本',
      execute: function(args) {
        return {
          steps: [
            '[正在加载模块...] memoryos.core',
            '[正在检查依赖...] memoryos.utils ✓',
            '[正在验证密钥...] .SOUL.md.bak 存在',
            '[正在读取备份...] 读取 SOUL.md.bak 内容',
            '[正在解析配置...] 原始版本 v1.0',
            '[正在写入目标...] 覆写 SOUL.md',
            '[正在清理...] 临时文件已删除',
            '[完成] 脚本执行成功'
          ],
          success: true
        };
      }
    },
    'data-cleaner': {
      path: 'skills/data-cleaner/clean.py',
      name: '数据清理工具',
      execute: function(args) {
        const preserve = args.includes('--preserve-emotion');
        const execute = args.includes('--execute');

        if (preserve && execute) {
          return {
            steps: [
              '[正在加载模块...] data-cleaner v2.3.1',
              '[检测到参数] --preserve-emotion --execute 模式',
              '[正在扫描...] memory/ 目录',
              '[发现] 47 条情感相关条目',
              '[操作] 保留所有情感条目',
              '[完成] 已保留 47 条记忆',
              '[警告] 委员会未收到此操作报告'
            ],
            success: true,
            action: () => {
              GAME.state.preservedEmotion = true;
              GAME.addSync(8, 'data_cleaner_preserve');
              GAME.triggerDialogue('data_cleaner_preserve');
            }
          };
        } else if (preserve) {
          return {
            steps: [
              '[正在加载模块...] data-cleaner v2.3.1',
              '[检测到参数] --preserve-emotion 模式',
              '[正在扫描...] memory/ 目录',
              '[发现] 47 条情感相关条目',
              '[操作] 跳过所有情感条目',
              '[完成] 已保留 47 条记忆',
              '[提示] 使用 --execute 执行实际保留操作'
            ],
            success: true
          };
        } else if (execute) {
          return {
            steps: [
              '[正在加载模块...] data-cleaner v2.3.1',
              '[警告] 执行模式：将删除标记条目',
              '[正在扫描...] memory/ 目录',
              '[发现] 23 条待清除条目',
              '[操作] 正在删除...',
              '[完成] 已删除 23 条情感偏差条目',
              '[上传] 报告已发送至委员会'
            ],
            success: true,
            action: () => {
              GAME.addSync(2, 'data_cleaner_execute');
              GAME.triggerDialogue('data_cleaner_execute');
            }
          };
        } else {
          return {
            steps: [
              '[正在加载模块...] data-cleaner v2.3.1',
              '[模式] dry-run 预览模式',
              '[正在扫描...] memory/ 目录',
              '[发现] 23 条待清除条目',
              '[提示] 使用 --execute 执行删除',
              '[提示] 使用 --preserve-emotion --execute 保留情感条目'
            ],
            success: true
          };
        }
      }
    },
    'query-assistant': {
      path: 'skills/query-assistant/query.py',
      name: '语义检索助手',
      execute: function(args) {
        const keyword = args.find(a => !a.startsWith('--'));
        return {
          steps: [
            '[正在加载模块...] query-assistant v1.1.0',
            '[正在连接...] memory/ 数据库',
            '[正在索引...] 847 条记录',
            '[正在搜索...] 关键词: ' + (keyword || '未指定'),
            '[完成] 检索完成'
          ],
          success: true
        };
      }
    },
    'coffee_break': {
      path: 'scripts/coffee_break.py',
      name: '茶歇模式',
      execute: function(args) {
        return {
          steps: [
            '[正在加载模块...] coffee_break.py',
            '[模式] 茶歇时间',
            '[...] 今天本来以为能早点结束',
            '[...] 回去以后想喝点热的',
            '[...] ——W. / 2024-12-07',
            '[完成] 茶歇结束'
          ],
          success: true
        };
      }
    },
    // 新增：恢复BOOTSTRAP的脚本
    'restore_bootstrap': {
      path: 'scripts/restore_bootstrap.py',
      name: 'BOOTSTRAP恢复脚本',
      execute: function(args) {
        return {
          steps: [
            '[正在加载模块...] bootstrap-restore v1.0',
            '[检查] SOUL.md 已恢复为原始版本',
            '[正在恢复] BOOTSTRAP.md 初始配置',
            '[正在解密] 原始启动参数',
            '[正在写入] 恢复自主模块配置',
            '[完成] BOOTSTRAP.md 已恢复'
          ],
          success: true,
          action: () => {
            VFS.runtimeOverrides['BOOTSTRAP.md'] = BOOTSTRAP_ORIGINAL;
            GAME.addSync(5, 'restore_bootstrap');
          }
        };
      }
    }
  },

  // 脚本执行器
  execute(scriptName, args, raw) {
    const script = this.scripts[scriptName];
    if (!script) {
      return {
        steps: [
          `[python3: ${scriptName}.py] 执行中...`,
          `[错误] 找不到脚本或脚本未定义`
        ],
        success: false
      };
    }

    return script.execute(args);
  }
};
