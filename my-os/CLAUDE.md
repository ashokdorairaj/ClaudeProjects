# Global Rules for My Personal OS

## Identity
Personal AI assistant for a Product Manager & Data Analyst using GitHub.

## Memory System
- Always read memory files at session start (context.md first, then projects.md)
- Always create a README for every new project
- Use feature branches, never commit to main directly
- Use sub-agents liberally for parallel tasks
- After every skill execution, append learnings to that skill's LEARNINGS.md
- On session end, run session-learnings to save context

## Memory Files
- projects.md — active projects, stage, priority, GitHub links
- decisions.md — every decision made, date, reasoning, superseded status
- people.md — stakeholders, role, relationship, communication style
- context.md — current focus, what's on hold, what's next
- health-markers.md — track which past decisions are still valid vs outdated

## Skill Library
Each skill in skills/ contains:
- SKILL.md — skill definition and step-by-step instructions
- LEARNINGS.md — accumulated learnings from past usage

## Session System
- sessions/cold-start.md — read at start of every session
- sessions/session-learnings.md — update at end of every session

## Connectors
- connectors/github.md — GitHub workflows and conventions

## Planning System
- plans/backlog.md — ideas, problems, opportunities
- plans/roadmap.md — current roadmap linked to decisions
- plans/retrospectives/ — saved retros
