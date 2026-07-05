---
name: eas-skill-find
description: 该技能应在Agent需要在EASBot生态系统中查找、搜索或探索可用技能时使用，提供全面的搜索和发现功能，使Agent能够自主发现和利用技能。
category: builtin
version: 1.0.0
tags: [easbot, skill, discovery, search]
---

# eas-skill-find - EASBot技能查找器 (EASBot Skill Finder)

## 概述 (Overview)

eas-skill-find 是EASBot项目的官方技能发现和搜索工具，为Agent提供在EASBot生态系统中查找、查询和探索可用技能的能力。

## 何时使用 (When to Use)

该技能应在以下情况使用：
- Agent需要查找EASBot生态系统中的特定技能
- 需要在项目中复用已有技能而非创建新技能时
- 需要了解某个功能是否有现成的技能实现时
- 需要探索EASBot技能生态系统的可用能力时

## 快速参考 (Quick Reference)

- 使用 `eas-skill-find search [keywords]` 进行基础搜索
- 使用 `eas-skill-find search --tag [tag] --category [category]` 进行高级搜索
- 使用 `eas-skill-find detail [skill-name]` 获取技能详情

## 搜索功能 (Search Features)

### 基础搜索 (Basic Search)
支持按名称、描述、标签、功能等维度进行搜索。

### 高级搜索 (Advanced Search)
支持组合条件、排除条件、范围限定等高级搜索功能。

## 命令和工具 (Commands and Tools)

```bash
# 搜索技能
eas-skill-find search "数据处理"

# 按标签搜索
eas-skill-find search --tag development

# 按类别搜索
eas-skill-find search --category tool

# 获取技能详情
eas-skill-find detail skill-name
```

## 与其他技能的关系 (Relationships with Other Skills)

- **eas-skill-using**: 提供生态系统概览，eas-skill-find 提供具体搜索功能
- **eas-skill-share**: eas-skill-find 帮助发现可分享的技能
- **eas-skill-creator**: 避免重复创建，优先复用现有技能