# TODO — Zigna Vigil

> **MANDATORY WORKFLOW (see AGENT.md §8):**
> 1. READ THIS FILE FIRST before starting any work. The state below is the handoff.
> 2. If this file contains INCOMPLETE todos from a previous task: **do NOT wipe, rewrite, or
>    overwrite them — STOP and ask the user how to proceed.** The user decides whether to resume,
>    abandon, or override the previous task. Never silently discard another agent's unfinished work.
> 3. **Only WIPE THIS FILE CLEAN when there are NO incomplete todos** (all tasks completed or file
>    empty). Only then write your new task's todos into it, in small, discrete, completable slices.
> 4. **Never delete or rewrite completed items.** If told to continue an in-progress task, ADD your
>    todos on top of the current ones and continue exactly where the last agent stopped.
> 5. **Only overwrite previous agents' todos if the USER explicitly asks you to.**
> 6. UPDATE THIS FILE immediately whenever a slice of the task is fully done — check it off and add
>    short notes (what changed, what remains, gotchas for the next agent).
> 7. Before finishing/handing off, make sure this file reflects reality: done / in progress /
>    blocked, and exactly what the next agent should do first.

---

## Current Task

Tool execution loop implemented — AI now feeds tool results back for natural language summaries.

## Task Plan

1. **NEXT: Test full conversation flow end-to-end** — verify tools execute and AI returns natural language
2. **NEXT: Implement product-side /api/vigil/usage endpoints** — coordinate with product teams
3. **NEXT: Product API forward auth** — when tools call product APIs, forward the user's JWT token

## In Progress

- [ ] Tool execution loop — feeds results back to AI for natural language summaries

## Completed

- [x] All 27 ZignaLyft read-only tools registered
- [x] System prompt with explicit tool names, valid params, current date
- [x] Query classifier routing complex queries to high-tier models
- [x] Multiple tool calls support in AI provider

## Handoff Notes

- **Server runs on port 3100.**
- **AI provider** uses OpenCode Zen with free tier models.
- **Tool execution loop** allows up to 5 rounds of tool calls before returning.
- **System prompt** includes current date to prevent wrong year in date params.
