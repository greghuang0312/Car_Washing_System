# Superpowers 安装指南

> **适用环境**：Antigravity（本地 `.agent/skills/` 目录）  
> **来源仓库**：[obra/superpowers](https://github.com/obra/superpowers)  
> **更新方式**：重新执行本文档的步骤 2 即可覆盖更新

---

## 背景说明

`obra/superpowers` 是一套完整的 AI 辅助软件开发方法论，由 **14 个可组合的技能（Skills）** 构成，覆盖从需求分析到代码合并的端到端开发流程。

在 Antigravity 环境中，技能以文件夹的形式存放在 `.agent/skills/`（或 `.agents/skills/`）目录下，每个技能文件夹内含一个 `SKILL.md` 文件。

---

## 安装步骤

### 步骤 1：克隆仓库到临时目录

```powershell
git clone https://github.com/obra/superpowers.git C:\tmp\superpowers
```

### 步骤 2：将所有技能复制到本地 skills 目录

将 `skills\` 下的所有文件夹复制到你的项目技能目录（根据实际路径调整目标路径）：

```powershell
# 将 <PROJECT_ROOT> 替换为你的实际项目根目录，例如 e:\test
$target = "<PROJECT_ROOT>\.agent\skills"

Copy-Item -Path "C:\tmp\superpowers\skills\*" `
          -Destination $target `
          -Recurse `
          -Force
```

> **注意**：`-Force` 会覆盖已存在的同名技能（用于更新）。  
> 本地自定义技能不会被删除，仅同名文件夹会被覆盖。

---

## 技能清单（共 14 个）

### 🔄 工作流核心技能（按使用顺序）

| 顺序 | 技能名 | 触发时机 | 说明 |
|------|--------|----------|------|
| 1 | `brainstorming` | 开始编码前 | 通过对话提炼需求，生成设计文档 |
| 2 | `using-git-worktrees` | 设计确认后 | 创建隔离的 Git 分支工作区 |
| 3 | `writing-plans` | 有了设计后 | 将设计拆解为 2~5 分钟粒度的任务 |
| 4 | `subagent-driven-development` | 执行阶段 | 子代理并发执行，双阶段审查 |
| 4* | `executing-plans` | 执行阶段（备选） | 分批执行 + 人工检查点 |
| 5 | `test-driven-development` | 实现过程中 | 红-绿-重构 TDD 循环 |
| 6 | `requesting-code-review` | 任务间隙 | 按计划审查代码，按严重性报告问题 |
| 7 | `finishing-a-development-branch` | 任务完成后 | 验证测试，决策合并/PR/保留/丢弃 |

### 🐛 调试技能

| 技能名 | 说明 |
|--------|------|
| `systematic-debugging` | 4 阶段根因定位流程 |
| `verification-before-completion` | 完成前验证确实已修复 |

### 🤝 协作技能

| 技能名 | 说明 |
|--------|------|
| `dispatching-parallel-agents` | 并发子代理工作流 |
| `receiving-code-review` | 处理收到的代码审查反馈 |

### 🧰 元技能（Meta）

| 技能名 | 说明 |
|--------|------|
| `using-superpowers` | 入口技能：指导 AI 何时调用其他技能 |
| `writing-skills` | 创建新技能的规范与最佳实践 |

---

## 验证安装

安装完成后，运行以下命令验证：

```powershell
# 1. 确认技能目录数量（应 ≥ 14）
Get-ChildItem -Path "e:\test\.agent\skills\" -Directory | Select-Object Name

# 2. 确认所有 SKILL.md 均存在
Get-ChildItem -Path "e:\test\.agent\skills\" -Recurse -Filter "SKILL.md" | Select-Object FullName
```

---

## 在 Antigravity 中的使用方式

> [!IMPORTANT]
> Antigravity **不使用** Claude Code 的 `Skill` 工具，技能通过系统提示中的 `Available skills:` 列表自动加载。

### 技能自动触发机制

`using-superpowers` 技能已要求 Antigravity 在任何任务开始前，如果有 **≥1% 的可能性** 某技能适用，就**必须**读取并遵循该技能。

### 如何在对话中触发特定技能

在需要时，直接在对话中说明意图即可，Antigravity 会自动判断并应用对应技能：

| 你说的话 | 触发的技能 |
|----------|----------|
| "我想开发一个新功能……" | `brainstorming` → `writing-plans` → `executing-plans` |
| "帮我修这个 bug" | `systematic-debugging` → `verification-before-completion` |
| "按计划执行" | `subagent-driven-development` 或 `executing-plans` |
| "帮我写测试" | `test-driven-development` |
| "代码审查一下" | `requesting-code-review` |
| "合并这个分支" | `finishing-a-development-branch` |

### 推荐的端到端工作流

```
1. 新对话：描述你的目标
      ↓ [brainstorming 触发]
2. 确认设计文档
      ↓ [writing-plans 触发]
3. 确认实施计划
      ↓ [subagent-driven-development 触发]
4. 代理自动执行（可工作数小时无需干预）
      ↓ [test-driven-development 贯穿全程]
5. 完成后合并
      ↓ [finishing-a-development-branch 触发]
```

---

## 更新技能

重新运行步骤 1 + 步骤 2（使用 `-Force`），即可从 GitHub 获取最新版本的所有技能。

```powershell
# 更新仓库
git -C C:\tmp\superpowers pull

# 重新覆盖复制
Copy-Item -Path "C:\tmp\superpowers\skills\*" `
          -Destination "e:\test\.agent\skills" `
          -Recurse -Force
```

---

## 参考链接

- GitHub 仓库：<https://github.com/obra/superpowers>
- 作者博客：<https://blog.fsck.com/2025/10/09/superpowers/>
- 问题反馈：<https://github.com/obra/superpowers/issues>
