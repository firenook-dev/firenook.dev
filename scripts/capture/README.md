# The home page's demo run

The orders, users, files and function calls on the home page, the agent's
tool calls, the timed test run and the six console pictures below all come from
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
signature, which fails. Then the shop's app makes ten Firestore requests
that the rules judge: a visitor browses, Maya Chen keeps her profile and
tries what she may not (another customer's profile, making herself staff,
changing a price), and Amara Abara, given a `staff` claim, reads the orders
and edits a product. Six are allowed and four denied. It writes through
`firenook mcp`, the shop's own functions and the emulators' REST APIs, then
asks the MCP tools for what the page shows. Paths on the machine that ran it
are cut to the project's own folder.

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
| `rules-dark.png` | Firestore, Rules, Maya's denied update of her own profile open (the one adding `staff`) |

Every picture must be the same size, so the console's tabs on the home page
never change height. After SIGTERM the script stops the suite, times
`firenook emulators:exec "node --test checkout.test.mjs"`, and writes
`src/data/demo-run.json`. Without `--hold` it does the same without waiting.

To keep the default ports free, run a copy of the demo with its own ports in
`firebase.json` and in `checkout.test.mjs`, and write the run somewhere else:

```sh
node capture.mjs /tmp/demo-run.json --hold --demo=/tmp/demo-shop
```
