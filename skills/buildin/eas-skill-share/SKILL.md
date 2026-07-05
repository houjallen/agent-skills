---
name: eas-skill-share
description: 该技能应在Agent需要向其他系统或Agent分发、发布或共享技能时使用，提供标准格式的技能打包和分发能力。
category: builtin
version: 1.0.0
tags: [easbot, skill, sharing, distribution]
---

# eas-skill-share - EASBot技能分享器 (EASBot Skill Sharer)

## 概述 (Overview)

eas-skill-share 是EASBot项目的官方技能分享和分发工具，负责技能的打包、发布和共享，确保技能能够以标准化格式在不同用户和系统之间安全有效地分发。

## 何时使用 (When to Use)

该技能应在以下情况使用：
- Agent需要将创建的技能分享给其他系统或Agent时
- 需要将技能以标准格式打包进行分发时
- 需要在团队或社区中发布技能时
- 需要管理技能版本的分发和更新时

## 快速参考 (Quick Reference)

- 使用 `scripts/package_skill.py <技能路径>` 打包技能
- 使用 `scripts/quick_validate.py <包路径>` 验证技能包
- 确保技能符合安全要求后再分享

## 核心功能 (Core Functions)

### 1. 技能打包 (Skill Packaging)
提供标准的技能打包流程，将技能转换为可分发格式。

### 2. 分发管理 (Distribution Management)
管理技能的不同分发渠道，如本地分发、远程仓库或团队共享。

### 3. 版本控制 (Version Control)
管理技能的版本生命周期，包括版本标记和兼容性检查。

## 分享流程 (Sharing Process)

### 准备分享
在分享技能之前，验证技能是否符合分享要求：
- 确认技能已完成并通过所有测试
- 验证技能文档是否完整
- 检查技能依赖项

### 打包技能
使用标准打包工具将技能转换为可分发格式：
```bash
# 打包技能为分发格式
scripts/package_skill.py <技能路径> <输出目录>
```

### 验证包
验证打包后的技能包是否完整：
- 检查文件完整性
- 验证元数据正确性
- 确认依赖项完整性

## 分发格式 (Distribution Formats)

技能的标准分发格式是压缩的.skill文件，包含完整的技能结构、文件权限和元数据，并支持数字签名验证。

## 安全考虑 (Security Considerations)

### 权限验证
- 验证技能访问权限
- 检查敏感信息泄露
- 确认安全扫描通过

### 数字签名
- 为技能包添加数字签名
- 验证收到的技能包签名
- 管理信任链

## 命令和工具 (Commands and Tools)

```bash
# 打包技能
scripts/package_skill.py ./skills/myskill

# 带输出目录的打包
scripts/package_skill.py ./skills/myskill ./dist

# 验证技能包
scripts/quick_validate.py ./dist/myskill.skill.jar
```

## 与其他技能的关系 (Relationships with Other Skills)

- **eas-skill-creator**: eas-skill-creator 用于创建技能，eas-skill-share 用于分发创建的技能
- **eas-skill-find**: eas-skill-find 用于查找已有的技能，eas-skill-share 用于分发新的技能