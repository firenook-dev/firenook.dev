# The home page's demo run

The orders, users, files and function calls on the home page, and the agent's
tool calls, are what Firenook answered about a run of the demo project
(`../terminal/demo-shop/`). Capture them again for a new release so the page
shows what people will see.

```sh
(cd ../terminal/demo-shop && npm install && cd functions && npm install)

# Set the release in ../terminal/demo-shop/package.json and src/lib/site.ts first.
node capture.mjs ../../src/data/demo-run.json
```

`capture.mjs` starts `firenook emulators:start` in the demo project, sends the
same two checkouts and failing webhook as the terminal recording, adds three
users and three product pictures through `firenook mcp`, then asks the MCP
tools for the orders, users, files, schedule, function calls, the failed
call in full, and a Storage rules check. Paths on the machine that ran it are
cut to the project's own folder.
