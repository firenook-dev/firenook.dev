# The home page's demo run

The orders, users, files and function calls on the home page, the agent's
tool calls, the timed test run and the five console pictures all come from
one run of the demo project (`../terminal/demo-shop/`) on the published
package. Capture them again for a new release so the page shows what people
will see.

```sh
(cd ../terminal/demo-shop && npm install && cd functions && npm install)

# Set the release in ../terminal/demo-shop/package.json and src/lib/site.ts first.
node capture.mjs --hold
```

`capture.mjs` starts `firenook emulators:start` in the demo project and opens
the shop: eight products with their pictures, twelve customers, twelve
orders through the shop's `checkout` function, and a webhook without a
signature, which fails. It writes through `firenook mcp` and the shop's own
functions, then asks the MCP tools for what the page shows. Paths on the
machine that ran it are cut to the project's own folder.

With `--hold` the suite stays up until the process gets SIGTERM, so the
console can be photographed at <http://127.0.0.1:4000/console>: a 1600 × 1000
window at twice the density, dark theme, saved as `src/assets/console/`:

| File | Page |
| --- | --- |
| `invocations-dark.png` | Functions, Invocations |
| `overview-dark.png` | Overview |
| `auth-dark.png` | Authentication, Users, with Maya Chen open |
| `firestore-dark.png` | Firestore, `orders`, a two-item order open, its items expanded |
| `storage-dark.png` | Storage, `products/`, as a grid |

Every picture must be the same size, so the console's tabs on the home page
never change height. After SIGTERM the script stops the suite, times
`firenook emulators:exec "node --test checkout.test.mjs"`, and writes
`src/data/demo-run.json`. Without `--hold` it does the same without waiting.
