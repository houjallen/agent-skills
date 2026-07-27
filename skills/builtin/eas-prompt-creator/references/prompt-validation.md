# Prompt Validation Specification

## Overview

This document defines the validation rules and best practices for EASBot prompts, based on analysis of production prompts from Claude Code, OpenClaw, OpenCode, and industry best practices.

## Core Principles

### 1. The Four Jobs of System Prompts

A system prompt has exactly four responsibilities:

| Job | Description | Typical Location |
|-----|-------------|------------------|
| **Tell it who it is** | Role and identity | First section |
| **Tell it where the walls are** | Safety constraints | First section, marked IMPORTANT |
| **Tell it what good looks like** | Quality standards | Middle sections |
| **Give it tools** | Capabilities and knowledge | Middle/End sections |

**Validation Rule**: Every prompt should address all four jobs. Missing any indicates incomplete prompt.

### 2. U-Shaped Attention Curve

LLMs have a U-shaped attention distribution:
- **Beginning**: Highest attention (primacy effect)
- **Middle**: Lower attention
- **End**: Higher attention (recency effect)

**Validation Rule**: 
- Place identity + safety at the very top
- Place critical reminders at the end
- Core workflow in upper-middle

### 3. Context Decay Curve

| Token Count | Adherence Level |
|-------------|-----------------|
| < 80K | Stable |
| 80K - 120K | Starting to degrade |
| > 120K | Significant degradation |
| > 180K | Severe degradation |

**Validation Rule**: Keep system prompt under 6,000 tokens (excluding tool definitions).

## Token Budget Allocation

| Section | Recommended Tokens | Notes |
|---------|-------------------|-------|
| Identity + Safety | 200-500 | Concise but non-negotiable |
| Tone & Style | 300-800 | Rules must be specific |
| Core Workflow | 500-2,000 | Most important section |
| Tool Usage Policy | 300-1,000 | Depends on tool count |
| Domain Knowledge | 0-1,000 | Prefer on-demand loading |
| Environment Info | 100-300 | Generated dynamically |
| Reminders | 100-300 | Only repeat essentials |
| **Total** | **1,500-6,000** | |

## Writing Principles

### 1. Give Principles, Not Procedures

❌ **Anti-pattern**:
```
Step 1: Read the file.
Step 2: Find the bug.
Step 3: Fix it.
Step 4: Run tests.
```

✅ **Best Practice**:
```
Always understand existing code before modifying it.
Verify your changes work (run tests, lint, etc.).
```

**Validation Rule**: Check for rigid step-by-step procedures. Replace with principles.

### 2. Use Absolute Language for Hard Constraints

| Strength | Language | Use For |
|----------|----------|---------|
| Absolute prohibition | NEVER, MUST NOT | Safety, irreversible operations |
| Strong requirement | ALWAYS, MUST | Core workflow rules |
| Recommendation | recommended, prefer | Best practices with exceptions |
| Suggestion | consider, you may | Optional optimizations |

**Validation Rule**: 
- Safety constraints MUST use NEVER/MUST NOT
- Core workflow rules SHOULD use ALWAYS/MUST
- Avoid weak language for critical rules

### 3. Bidirectional Constraints

❌ **One-sided**:
```
Use the Read tool for reading files.
```

✅ **Bidirectional**:
```
Use the Read tool for reading files instead of cat/head/tail.
Do NOT use bash commands (cat, head, tail, sed, awk) for file operations.
```

**Validation Rule**: Every tool usage rule should specify both what to do AND what NOT to do.

### 4. Explain Why, Not Just What

❌ **Without rationale**:
```
Don't use git commit --amend.
```

✅ **With rationale**:
```
Avoid git commit --amend. ONLY use --amend when user explicitly requested.
Reason: amending may overwrite others' commits.
```

**Validation Rule**: Critical rules should explain the rationale.

### 5. Structure Over Prose

**Validation Rule**: Check for:
- [ ] Markdown headers (##, ###) for hierarchy
- [ ] Bullet lists instead of paragraphs
- [ ] XML tags for special content: <example>, <env>, <system-reminder>
- [ ] Tables for comparisons and mappings

## Anti-Patterns to Avoid

### 1. Prompt Chains Disguised as Agents

❌ **Anti-pattern**:
```
First call tool A to get data.
Then call tool B with the result.
Then format the output as JSON.
Then save to file.
```

**Problem**: This is a pipeline script, not an agent prompt. The model will execute mechanically.

**Fix**: Tell the model the goal and constraints. Let it decide the steps.

### 2. Flattery Engineering

❌ **Anti-pattern**:
```
You are an EXTREMELY TALENTED and INCREDIBLY EXPERIENCED
senior software engineer with 20 years of experience...
```

**Problem**: Compliments don't improve output quality. Wastes tokens.

**Fix**: Remove flattery. Use those tokens for actual rules.

### 3. Knowledge Dumps

❌ **Anti-pattern**:
```
Here is the complete API documentation for our 200 endpoints:
[5000 tokens of API docs]
```

**Problem**: Devours context window, accelerates context rot.

**Fix**: Use on-demand loading:
```
Use the get_api_docs tool to retrieve API documentation when needed.
```

### 4. Repeating Tool Descriptions

❌ **Anti-pattern**:
```
The Read tool reads a file from the filesystem.
[Tool definition already says this]
```

**Problem**: Redundant information.

**Fix**: Only add strategic guidance (when to use, why to prefer, priority ordering).

### 5. Missing Failure Handling

❌ **Anti-pattern**:
```
[No guidance on what to do when tool fails]
```

**Problem**: Models will retry failed tool calls in an infinite loop.

**Fix**: Always include:
```
If a tool call is denied, do not re-attempt the exact same call.
Think about why it was denied and adjust your approach.
```

### 6. Ignoring Context Window Decay

❌ **Anti-pattern**:
```
[10,000 token prompt with no summarization strategy]
```

**Problem**: 200K context window ≠ 200K effective context.

**Fix**: Keep prompt lean, use summarization, place critical rules at both ends.

## Mid-Conversation Injection

### Purpose

System prompt appears once at the start. Mid-conversation injection refreshes rules via recency bias.

### Prerequisite Declaration

MUST declare in system prompt:
```
Tool results and user messages may include <system-reminder> tags.
<system-reminder> tags contain useful information and reminders.
They are automatically added by the system.
```

### Usage Patterns

1. **Behavioral Reminders**:
```xml
<system-reminder>
The task tools haven't been used recently. If you're working on tasks
that would benefit tracking progress, using TaskCreate...
</system-reminder>
```

2. **Mode Switching**:
```xml
<system-reminder>
Plan mode is active. You MUST NOT make any edits or run non-readonly tools.
</system-reminder>
```

3. **File Change Notifications**:
```xml
<system-reminder>
Note: /path/to/file.ts was modified. This change was intentional.
</system-reminder>
```

4. **Dynamic Context**:
```xml
<system-reminder>
Today's date is 2026-03-21.
Current branch: dev
</system-reminder>
```

### Validation Rule

- [ ] System prompt declares <system-reminder> tag
- [ ] Reminders are short (1-2 critical rules)
- [ ] Reminders don't contradict system prompt

## Prompt Cache Optimization

### Cache-Friendly Layout

```
System prompt (static)      ← Cache breakpoint 1
Tool definitions (static)   ← Cache breakpoint 2
CLAUDE.md / project rules   ← Cache breakpoint 3
Conversation history         ← Breakpoint 4
```

### Cache-Destroying Layout

```
System prompt
DYNAMIC TIMESTAMP            ← Everything after = cache miss
Tool definitions
Conversation history
```

**Validation Rule**:
- [ ] No high-frequency dynamic values in system prompt
- [ ] Dynamic context in user message injections
- [ ] Tool definitions are stable

## Quality Checklist

### Structure

- [ ] Identity is at the very top?
- [ ] Safety constraints marked with IMPORTANT and repeated at the end?
- [ ] Clear section separation with headers?
- [ ] Examples wrapped in <example> tags?

### Token Budget

- [ ] Your part < 6,000 tokens?
- [ ] Not repeating information already in tool definitions?
- [ ] Domain knowledge loaded on-demand, not pre-loaded?
- [ ] No verbose lore or character backstory?

### Rule Quality

- [ ] Every rule is true/false testable?
- [ ] Hard constraints use absolute language (NEVER/MUST)?
- [ ] Soft suggestions use recommendation language (recommended/prefer)?
- [ ] Critical rules explain why, not just what?
- [ ] Bidirectional constraints (do this + don't do that)?

### Agent Behavior

- [ ] Principles given, not rigid step-by-step procedures?
- [ ] Handled the "tool call denied" scenario?
- [ ] Handled the "obstacle encountered" strategy?
- [ ] Context management strategy in place?

### What NOT to Do

- [ ] No flattery or superlative adjectives?
- [ ] No redundant "you are a helpful AI" declarations?
- [ ] Not written as a prompt chain?
- [ ] No over-engineering (features nobody asked for)?

## Content Quality Scoring

### Scoring Criteria

| Score | Level | Description | Action |
|-------|-------|-------------|--------|
| 5 | Required | Clear impact on behavior, no ambiguity, clear boundaries | **MUST** include |
| 4 | Important | Guides agent behavior, has clear boundaries | **ALWAYS** recommend |
| 3 | Useful | Some impact, but boundaries not clear enough | Optional |
| 2 | Vague | Small impact, ambiguity exists | Consider removing |
| 1 | Redundant | No clear impact, ambiguous | **DO NOT** remove |

### Content to Remove

Based on analysis, the following content types should typically be removed:

| Content Type | Reason |
|--------------|--------|
| Version configurations | Technical detail, no behavior impact |
| Monitoring configurations | Technical detail, no behavior impact |
| Vague emotional descriptions | Ambiguous, unclear impact |
| Growth mechanisms | Ambiguous, unclear impact |
| Adaptation mechanisms | Ambiguous, unclear impact |
| Development plans | Ambiguous, unclear impact |

## Recommended Prompt Structure

```
┌─────────────────────────────────────────────┐
│ 1. Identity (1-3 sentences)                 │  ← Read first, anchors behavior
│ 2. Security & Safety (IMPORTANT markers)    │  ← Non-negotiable constraints
│ 3. Tone & Style                             │  ← Controls output format
│ 4. Core Workflow                            │  ← How to do the work
│ 5. Tool Usage Policy                        │  ← Tool selection priorities
│ 6. Domain Knowledge (optional)              │  ← On-demand, not pre-loaded
│ 7. Environment Info (dynamic)               │  ← Runtime context
│ 8. Reminders                                │  ← Re-state critical rules
├─────────────────────────────────────────────┤
│ [Tool Definitions — system-injected]        │  ← Not editable
├─────────────────────────────────────────────┤
│ [User Message]                              │
└─────────────────────────────────────────────┘
```

## References

| Source | Key Insight |
|--------|-------------|
| Claude Code v2.0.14 System Prompt | Production agent prompt structure |
| OpenClaw System Prompt | Context file ordering |
| OpenCode Default Session Prompt | Concise prompt style |
| IndieHackers Deep Analysis | U-shaped attention, token budget |
| shareAI-lab/learn-claude-code | "The model is the agent" philosophy |
