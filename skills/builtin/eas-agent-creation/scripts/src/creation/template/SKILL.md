---

name: {{skill-name}}
description: {{description}}
mode: {{mode}}
composition: {{composition}}
{{#if secondaryModes}}secondaryModes: {{secondaryModes}}
{{/if}}deliveryChecklist:
developmentGuide: false
pitfallTable: false
reviewProcess: false
deploymentGuide: false
observability: false
scripts: false
portability:
platforms: []
tools: []
{{#if references}}references:
{{#each references}} - {{this}}
{{/each}}{{/if}}---

# {{skill-name}}

{{description}}

## Overview

Brief description of what this skill does.

## When to Use

Use this skill when:

- Scenario 1
- Scenario 2

Do NOT use this skill when:

- Opposite scenario 1
- Opposite scenario 2

## Core Pattern

## Quick Reference

- **Mode**: {{mode}}
- **Composition**: {{composition}}
  {{#if secondaryModes}}- **Secondary Modes**: {{secondaryModes}}
  {{/if}}- **Created**: {{createdAt}}

## Implementation

### Scripts

{{#if scripts}}Available scripts:
{{#each scripts}}- `{{this}}`
{{/each}}{{else}}No scripts provided.
{{/if}}

### References

{{#if references}}For detailed information, see:
{{#each references}}- [{{this}}]({{this}})
{{/each}}{{/if}}

## Common Pitfalls

1. Pitfall 1 and how to avoid it
2. Pitfall 2 and how to handle it

## Examples

### Example 1

```
Input: ...
Output: ...
```

### Example 2

```
Input: ...
Output: ...
```
