# AllServices API — Project Rules

These rules are non-negotiable. Every file, every function, every line of code must comply.

---

## NestJS Standards

Follow all 40 rules in `.agents/skills/agents.md` without exception. That document covers architecture, dependency injection, error handling, security, performance, testing, database, API design, microservices, and DevOps. Read it before writing any code. If a rule in this file conflicts with that document, this file wins.

---

## File Headers & Comments

- NEVER add inline comments in code. The code is self-documenting.
- NEVER add comments above functions, classes, methods, or variables.
- NEVER add TODO, FIXME, HACK, XXX, or any variation anywhere.
- EVERY file must have a header comment block at the top. No exceptions.
- The header is the ONLY comment allowed in the entire file.

### Header Format

TypeScript / JavaScript:
```
/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * <One sentence describing what this file does.>
 */
```

CSS / SCSS:
```
/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * <One sentence describing what this file does.>
 */
```

HTML / Svelte:
```
<!--
  AllServices — ALS Marketing UK Ltd
  Copyright (c) 2026. All rights reserved.
  Developer: linkst

  <One sentence describing what this file does.>
-->
```

---

## Code Completeness

- NEVER create stub files, placeholder files, or skeleton implementations.
- NEVER leave empty function bodies, empty catch blocks, or no-op implementations.
- NEVER write "placeholder", "implement later", "coming soon", or similar.
- NEVER use `throw new Error('Not implemented')` or any not-implemented pattern.
- NEVER create a file unless it is fully complete and production-ready.
- NEVER output partial code with "..." or "// rest of implementation" or "// add more here".
- NEVER skip error handling, validation, or edge cases to save time.
- NEVER write a function that only returns a hardcoded value as a standin.
- NEVER generate code that requires manual followup to be functional.
- If a feature is too large for a single pass, break it into fully complete smaller pieces. Each piece must work independently. No piece depends on unwritten code.
- If you cannot complete something fully, say so. Do not create a half-finished file.

### What "Complete" Means
- Compiles with zero errors under strict TypeScript.
- All imports resolve.
- All dependencies are used.
- All error paths handled.
- All types explicitly declared (no `any`).
- All validation present on inputs.
- No dead code, no unused variables, no unreachable branches.
- Production-ready as written.
