# Setup Guide

## How to Start a Session
1. Open Claude Code in this folder
2. Say: "cold start" — Claude will read sessions/cold-start.md and load context
3. Work on tasks, use skills by name (e.g. "write a PRD for X")

## How to End a Session
1. Say: "end session" — Claude will update sessions/session-learnings.md and memory files

## How to Use Skills
- "write a PRD for [feature]" → uses skills/prd-writer
- "analyze this data: [data]" → uses skills/data-analyst
- "prioritize my backlog" → uses skills/prioritize
- "write an update for [stakeholder]" → uses skills/stakeholder-comms
- "write a SQL query for [question]" → uses skills/sql-insights
- "run a retro on [project]" → uses skills/retro

## How to Update Memory
- New project started → update memory/projects.md
- Decision made → update memory/decisions.md
- New stakeholder → update memory/people.md

## Folder Structure
```
my-os/
├── CLAUDE.md              ← global rules (you are here)
├── setup.md               ← this file
├── connectors/
│   └── github.md          ← GitHub workflows
├── memory/
│   ├── projects.md
│   ├── decisions.md
│   ├── people.md
│   ├── context.md
│   └── health-markers.md
├── plans/
│   ├── backlog.md
│   ├── roadmap.md
│   └── retrospectives/
├── sessions/
│   ├── cold-start.md
│   └── session-learnings.md
└── skills/
    ├── prd-writer/
    ├── data-analyst/
    ├── prioritize/
    ├── stakeholder-comms/
    ├── sql-insights/
    └── retro/
```
