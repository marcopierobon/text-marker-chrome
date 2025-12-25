## Modus operandi

### Steps

For every request made, the agent should:

1. Start with the tests: I want failing unit tests that validate the required behaviour.
2. Then implement the logic.
3. Then confirm the new tests are passing.
4. Then run text-marker-extension/pre-commit-check.sh.

E.g. I want the code to every five minutes:
Check the status of the pending buy and sell, and update the initial message in discord under the Status field

1. Start with the tests: I want failing unit tests to check that when the order status is updated, the message in discord also gets updated.
2. Then implement the logic checking the pending order statuses and updating the initial message in discord.
3. Then confirm the new tests are passing.
4. Then run text-marker-extension/pre-commit-check.sh.

### Additional requests

Do not create .md files to tell me what you did unless I ask you to.
Do not mess perform git operations unless I ask you to.
