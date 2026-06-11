# Skill: SQL Insights

## When to Use
When you need to write, debug, or optimize a SQL query to answer a data question.

## Steps
1. Clarify the business question
2. Ask for schema / table names if not provided
3. Write the query with comments explaining each section
4. Suggest indexes or optimizations if relevant
5. Interpret the expected output in plain English
6. Append learnings to LEARNINGS.md

## Best Practices
- Always use CTEs for readability over nested subqueries
- Add a LIMIT when exploring unknown data sizes
- Comment complex joins and filters
- For aggregations, always sanity-check with a COUNT(*)
