# 数据目录约定 (Data Layout)

## 概述 (Overview)

`easbot skills find / add / list / remove / update` 共享同一棵数据树。本文档详细说明各路径的作用、查找优先级与多设备同步注意事项。

## 路径表 (Path Table)

| 路径 | 用途 | 作用域 |
|---|---|---|
| `${Global.Path.config}/skills/` | 全局已安装技能（EASBot agent） | 所有项目 |
| `<cwd>/.easbot/skills/` | 项目级已安装技能（EASBot agent） | 仅当前项目 |
| `${Global.Path.config}/skills/.skill-lock.json` | 全局锁定文件（记录已安装版本） | 所有项目 |
| `<cwd>/skills-lock.json` | 项目级锁定文件 | 仅当前项目 |

## 加载顺序 (Load Order)

EASBot Agent 启动时通过 `Skill.all()` 自动扫描这两条路径：

1. 先扫 `${Global.Path.config}/skills/`（全局）
2. 再扫 `<cwd>/.easbot/skills/`（项目级）
3. 同名 skill 以项目级覆盖全局

一旦安装就立即生效，无需重启或重载。

## 多设备同步 (Multi-device Sync)

- `.skill-lock.json` 与 `skills-lock.json` 记录已安装技能列表与版本，建议纳入 git 或 dotfiles 管理
- 多设备同步时若版本不一致，`Skill.all()` 按"项目级 > 全局"加载，冲突时以最后写入者为准
- 跨设备安装新技能时，记得把对应锁定文件一并提交

## 第三方风险技能 (Third-party Risky Skills)

- 第三方未审核技能（特别是 `openclaw` 组织下的）会在 `add` 时提示风险
- 除非用户明确要求并加 `--dangerously-accept-openclaw-risks`，否则拒绝安装
- 联网调用 `skills.sh` API 失败时，会回退到本地 `--owner` 已缓存列表