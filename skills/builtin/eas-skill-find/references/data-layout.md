# 数据目录约定 (Data Layout)

> 这里记录 `easbot skills find / add / list / remove / update / store` 共享的数据目录结构。
> find 相关的 store / cache 结构补充见 [local-search.md](local-search.md)。

## 路径表 (Path Table)

`XDG_DATA_HOME` 默认 `~/.local/share`（Windows: `%LOCALAPPDATA%`）。`getXdgData()` 返回的是 EASBot 私有根 `<XDG_DATA_HOME>/easbot`。

| 路径 | 用途 | 作用域 |
|---|---|---|
| `<XDG_DATA_HOME>/easbot/skills/store/index.json` | store 三层索引（v6 schema：market → plugin → skill） | 全局 |
| `<XDG_DATA_HOME>/easbot/skills/store/<marketId-hash>/` | store 物理：每个 source 一份 cp 副本 | 全局 |
| `<XDG_DATA_HOME>/easbot/skills/cache/<type>/<owner>/<repo>/` | git clone 缓存（type = github / gitlab / git / well-known） | 全局 |
| `<XDG_DATA_HOME>/easbot/skills/cache/wellknown-<hash16>/` | well-known HTTP 缓存（origin hash 区分） | 全局 |
| `<XDG_DATA_HOME>/easbot/skills/.skill-lock.json` | 全局安装锁（已装 skill 列表 + computedHash） | 全局 |
| `<XDG_DATA_HOME>/easbot/skills/store/<marketId-hash>/<agent>/skills/<skillName>/` | **实际 agent 加载路径**（canonical / 软链接 / junction） | 全局 |
| `<cwd>/<agent>/skills/<skillName>/` | 项目级已装 skill 目录（按 agent 分多种） | 仅当前项目 |
| `<cwd>/skills-lock.json` | 项目级安装锁 | 仅当前项目 |

`<agent>` 路径按 agent 字典动态派生，常见例子：

- `.claude/skills/` (Claude Code)
- `.agents/skills/` (canonical 共享，多个 agent 命中)
- `.easbot/skills/` (EASBot 自家)
- `.openclaw/skills/` (OpenClaw)
- `.augment/skills/` / `.aider-desk/skills/` / `.continue/skills/` / 等

完整列表见 `packages/skills/src/agents.ts` 的 `agents` 字典。

## 加载顺序 (Load Order)

EASBot Agent 启动时通过 `Skill.all()` 自动扫描这些路径：

1. 项目级（`<cwd>/<agent>/skills/`，按 `scope: 'project' | 'global'` 过滤）
2. 全局级（`<XDG_DATA_HOME>/easbot/skills/store/<marketId-hash>/<agent>/skills/`，scope = global）

**项目级优先**：同名 skill 项目级覆盖全局级。**没有**"最后写入者胜出"语义（项目级永远赢）。

## 多设备同步 (Multi-device Sync)

- 锁文件（`.skill-lock.json` / `skills-lock.json`）记录**已装 skill + computedHash + sourceKey** —— 建议纳入 git / dotfiles 管理
- store 物理（`<marketId-hash>/`）按 `type|url|ref` 派生（hash）—— 多设备各自独立 add 后 store 内容会一致（同一 source key 命中同一 hash）
- 跨设备安装新 skill：先 `add` 再 commit 锁文件，**不**需要 commit store 物理（store 可通过 add 重新派生）
- cache 目录**不**纳入 git（本地加速用，多设备各自 clone 一次）

## 第三方风险技能 (Third-party Risky Skills)

- 第三方未审核技能（特别是 `openclaw` 组织下的）会在 `add` 时弹风险提示
- 除非用户明确要求并加 `--dangerously-accept-openclaw-risks`，否则**拒绝**安装
- 已装 skill 不可信度无持续校验 —— 升级到 malicious 版本需用户手动 `update`

## 环境变量覆盖 (Env Override)

- `SKILLS_API_URL` —— 覆盖 skills.sh base URL（默认 `https://skills.sh`），自定义 index / mirror 用
- `EASBOT_DATA_PATH` —— 覆盖 `<XDG_DATA_HOME>/easbot` 整个根（debug / 隔离用）
- `XDG_DATA_HOME` —— 通用 XDG 覆盖（影响所有 XDG 应用）
- `XDG_CACHE_HOME` —— 通用 XDG cache 覆盖（影响 cache 目录）

## 设计意图 (Design Intent)

- **store 与 cache 分离**：cache 是网络加速（多设备可重建），store 是 single source of truth（被 install / find 读）
- **local 源不进 cache**：用户原目录只读不写，cache 只放 clone / fetch 的中间产物
- **market 派生用 hash**：不同 source（github / well-known / local）天然分目录，**不会**冲突
- **plugin 派生用源仓库 basename**：`agent-skills` / `easbot-cn-skills` 反映"来自哪个仓库"，用户一眼能识别
