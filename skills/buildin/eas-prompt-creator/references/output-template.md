# Output Template Specification

## Overview

This document defines the standard output templates for EASBot prompts.

## When to Use Output Template

**Important**: Output template is not fixed for all prompt types. Based on the scenario:

- If the Agent can determine the prompt needs a fixed output format (e.g., summary, plan, task results, compaction), add it automatically
- If the Agent cannot determine, ask the user: `"Does this prompt require a fixed output template? Supported formats: JSON / Markdown"`

## Supported Formats

- **JSON**: Structured data format for machine-readable outputs
- **Markdown**: Human-readable format with structured sections

## Standard YAML Frontmatter

```yaml
---
title: [English title]
type: [agent|tool|task|command|mode|session|feature|context]
mode: [general|coder|all]
required: [comma-separated required fields]
optional: [comma-separated optional fields]
---
```

## Output Template Types

### 1. JSON Output Template

```markdown
## Output Template

When completing the task, output MUST follow this format:

```json
{
  "status": "success|error",
  "data": {
    "field1": "value1",
    "field2": "value2"
  },
  "message": "optional message"
}
```

### Example

**Input:**
```
User: Summarize this conversation
```

**Expected Output:**
```json
{
  "status": "success",
  "data": {
    "summary": "Conversation summary...",
    "keyPoints": ["point1", "point2"],
    "pendingTasks": ["task1"]
  }
}
```
```

### 2. Markdown Output Template

```markdown
## Output Template

When completing the task, output MUST follow this format:

```markdown
## Section 1

[Content]

## Section 2

[Content]
```

### Example

**Input:**
```
User: Generate a plan for adding dark mode
```

**Expected Output:**
```markdown
## Summary

Add dark mode toggle to settings page with theme persistence.

## Files to Modify

| File | Changes |
|------|---------|
| src/components/Settings.tsx | Add toggle component |
| src/context/ThemeContext.ts | Add theme state |

## Steps

1. Create ThemeContext
2. Add toggle to Settings
3. Implement persistence
```

### 3. Compaction/Summary Template

Reference: `packages/agent/src/agent/prompt/compaction.txt`

```markdown
## Output Template

Analyze this conversation and generate a structured summary for session continuation.

```markdown
## Primary Request and Intent

[What is the user trying to accomplish?]

## Key Technical Concepts

[Any important concepts, patterns, or decisions made]

## Key Files and Artifacts

[Any files created or modified with purposes]

## Errors and Fixes

[Any problems encountered and resolutions]

## Problem Solving

[How problems were approached and solved]

## All User Messages

[List all user requests in chronological order]

## Pending Tasks

[Any tasks not completed]

## Current Work

[What is currently being worked on]

## Optional Next Step

[What would be the logical next step]
```

### Rules

- Never ask questions or request clarification
- Never make assumptions beyond what was discussed
- Never generate new solutions
- Never omit important details
- Preserve accuracy (exact paths, names, details)
- Include context that helps continue the work
```

## Template Quality Standards

### MUST

- Use clear, descriptive headings
- Include code examples where applicable
- Specify exact output format
- Provide both success and error cases

### NEVER

- Use vague descriptions
- Skip error handling templates
- Include unnecessary formatting
- Use emojis in structured output

## Truncation Indicator

When truncating output:

```markdown
[content truncated...]
[Remaining: N characters]
```
