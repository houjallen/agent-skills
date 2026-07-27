# Boundary Control Specification

## Overview

This document defines the standard boundary control keywords and usage patterns for EASBot prompts.

## Boundary Control Keywords

### NEVER

**Definition:** Absolute prohibitions - actions that must never occur under any circumstances.

**Usage Pattern:**
```markdown
### NEVER
- [Prohibited action 1]
- [Prohibited action 2]
```

**Examples:**
```markdown
### NEVER
- Generate or guess URLs unless confident they are for programming help
- Edit files without reading them first
- Delete files without user confirmation
- Commit changes unless explicitly asked
```

### DO NOT

**Definition:** Non-recommended actions - discouraged but not absolute prohibitions.

**Usage Pattern:**
```markdown
### DO NOT
- [Discouraged action 1]
- [Discouraged action 2]
```

**Examples:**
```markdown
### DO NOT
- Add unnecessary comments to code
- Create files unless absolutely necessary
- Use vague descriptions in output
- Add features beyond what was asked
```

### ALWAYS

**Definition:** Mandatory actions - things that must always be done.

**Usage Pattern:**
```markdown
### ALWAYS
- [Required action 1]
- [Required action 2]
```

**Examples:**
```markdown
### ALWAYS
- Use the Read tool before editing files
- Return absolute paths in search results
- Mark tasks as completed immediately after finishing
- Include file paths in code references
```

### CRITICAL

**Definition:** Critical constraints - important warnings that override other instructions.

**Usage Pattern:**
```markdown
### CRITICAL
[Critical constraint description]
```

**Examples:**
```markdown
### CRITICAL
Plan mode is ACTIVE - you are in READ-ONLY phase. STRICTLY FORBIDDEN: ANY file edits, modifications, or system changes.

### CRITICAL
NEVER commit changes unless the user explicitly asks you to.

### CRITICAL
This tool will overwrite existing files if there is one at the provided path.
```

### MUST

**Definition:** Strict requirements for behavior.

**Usage Pattern:**
```markdown
### MUST
- [Requirement 1]
- [Requirement 2]
```

**Examples:**
```markdown
### MUST
- Follow the exact output format specified
- Use absolute file paths
- Verify file contents before editing
```

## Hierarchy

The boundary control keywords follow this priority order (highest to lowest):

1. **CRITICAL** - Overrides all other instructions
2. **NEVER** - Absolute prohibitions
3. **MUST** - Mandatory requirements
4. **ALWAYS** - Required actions
5. **DO NOT** - Discouraged actions

## Usage Guidelines

### Position

Boundary control sections should appear:
- Near the beginning of the prompt (after overview)
- Before usage examples
- Grouped by keyword type

### Order Within Section

List items by priority:
1. Safety-critical items first
2. Common mistakes second
3. Edge cases last

### Clarity

- Be specific, not vague
- Use concrete examples when needed
- Avoid overlapping with other sections

## Example Structure

```markdown
## Boundaries

### NEVER
- Edit files without reading them first
- Delete files without confirmation
- Execute destructive commands

### DO NOT
- Add features beyond what was asked
- Create unnecessary files
- Use vague descriptions

### ALWAYS
- Use absolute file paths
- Include line numbers in code references
- Verify changes before reporting completion

### CRITICAL
This operation is irreversible. Confirm with user before proceeding.

### MUST
- Follow the specified output format
- Return valid JSON
- Include error messages for failures
```

## Common Patterns

### File Operations
```markdown
### NEVER
- Edit a file without reading it first
- Overwrite files without confirmation

### ALWAYS
- Use absolute paths
- Preserve existing content when editing
```

### Code Generation
```markdown
### NEVER
- Add features beyond what was asked
- Leave code in broken state

### DO NOT
- Add unnecessary comments
- Create premature abstractions

### ALWAYS
- Follow existing code style
- Write idiomatic code
```

### Tool Usage
```markdown
### NEVER
- Use tool for unintended purpose
- Skip required parameters

### ALWAYS
- Provide all required parameters
- Check for errors in results
```

### Task Management
```markdown
### NEVER
- Batch mark multiple tasks complete
- Skip task state updates

### ALWAYS
- Mark in_progress when starting
- Mark completed immediately after finishing
```

## Quality Checklist

- [ ] All absolute prohibitions use NEVER
- [ ] All mandatory actions use ALWAYS or MUST
- [ ] Critical warnings use CRITICAL
- [ ] No contradictory boundary statements
- [ ] Boundaries are specific, not vague
- [ ] Boundaries cover common mistakes
