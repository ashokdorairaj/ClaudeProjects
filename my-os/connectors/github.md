# GitHub Connector

## Account
- Username: ashokdorairaj
- Primary repo: ashokdorairaj/ClaudeProjects

## Conventions
- Always use feature branches: `feature/short-description`
- Commit messages: imperative tense ("Add X", "Fix Y", "Update Z")
- Always push and create a PR — never push directly to main
- Link PRs to issues when relevant

## Common Workflows

### Start new project
```bash
cd ClaudeProjects
mkdir <project-name> && cd <project-name>
git checkout -b feature/<project-name>
```

### Save work
```bash
git add .
git commit -m "your message"
git push origin <branch-name>
```

### Create a PR
```bash
gh pr create --title "Title" --body "Description"
```

### List repos
```bash
gh repo list
```

### Check PR status
```bash
gh pr list
gh pr status
```
