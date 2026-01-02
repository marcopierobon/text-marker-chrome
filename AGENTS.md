Stop thinking "I know what they want right now" and start thinking "What does the `Modus operandi` section of AGENTS.md say I must do first? I must follow it all costs and start every answer by stating how I am following it."

## 🚫 CRITICAL: NO GIT OPERATIONS

**NEVER perform git operations unless explicitly requested by the user.**

- NO `git add`
- NO `git commit`
- NO `git push`
- NO `git pull` (unless explicitly asked)
- NO `git merge` (unless explicitly asked)

This rule is ABSOLUTE and takes precedence over all other instructions.

## Modus operandi

THIS IS MANDATORY - ALL WORK MUST FOLLOW THIS EXACT WORKFLOW.

- CHANGES ONLY IN md, yml or yaml files? => Look at the `NO CODE CHANGES` section.
- OTHER CHANGES? => Look at the `CODE CHANGES` section.
- IN ALL CASES, FOLLOW the `Additional requests` section.

NO EXCEPTIONS UNLESS THE CHANGE IS ONLY IN md, yml or yaml files.

### CODE CHANGES

For every request made, the agent should:

1. Start with the tests: I want failing unit tests that validate the required behaviour.
2. Then implement the logic.
3. Then confirm the new tests are passing.
4. Then run `npm run precommit`.

E.g. I want the code to every five minutes:
Check the status of the pending buy and sell, and update the initial message in discord under the Status field

1. Start with the tests: I want failing unit tests to check that when the order status is updated, the message in discord also gets updated.
2. Then implement the logic checking the pending order statuses and updating the initial message in discord.
3. Then confirm the new tests are passing.
4. Then run `npm run precommit`.

### NOCODE CHANGES

For every request made, the agent should:

1. Then implement the logic.
2. Then run `npm run precommit`.

E.g. I want the pipeline to record the coverage

1. implement the logic.
2. Then run `npm run precommit`.

### Additional requests

Do not create .md files to tell me what you did unless I ask you to.
Do not perform git operations unless I ask you to.
Do not delete any files unless I ask you to.
