---
title: The terminal
description: What firenook emulators:start and init draw in a terminal, the keys they answer, what they show when something fails, and the plain output pipes and CI get.
---

In a terminal, `firenook emulators:start` draws its own screen: how the
start-up went, where everything listens, and a line for every function
call. This page explains what each part means, the keys it answers, and the
plain output you get instead in a pipe or in CI. `firenook init` draws the
same kind of screen for a new project.

## The screen

This is the screen of a start that picks up kept data, in a window 76
columns wide, after three function calls, one of which failed, and a press
of `?`. The empty rows above the footer are left out.

```text
  ╭──────────────────────────────────────────────────────────────────────╮
  │                                                                      │
  │       ▄█                                                             │
  │    ▄███▀ ▄     firenook  0.2.0                                       │
  │  ▄███▀ ███▄    demo-shop · picking up the data saved 1 minute ago    │
  │  ▀██▀ ███▀     Node 24.20.0 · data in .firenook/state                │
  │      █▀▀                                                             │
  │                                                                      │
  ├─ Start-up ────────────────────────────────────────────────── 577 ms ─┤
  │                                                                      │
  │  Firestore   ✓  31 ms  2 documents                                   │
  │  Auth        ✓  31 ms  0 users                                       │
  │  Storage     ✓  31 ms  0 objects                                     │
  │  Functions   ✓ 507 ms  4 functions                                   │
  │  Pub/Sub     ✓   0 ms  1 schedule                                    │
  │                                                                      │
  ├─ ✓ All emulators ready ──────────────────────────────────────────────┤
  │                                                                      │
  │  Console       http://127.0.0.1:4000/console                         │
  │  Ports         Firestore 8080   Auth 9099   Storage 9199             │
  │                Functions 5001   Pub/Sub 8085   Hub 4400              │
  │                                                                      │
  ╰──────────────────────────────────────────────────────────────────────╯

  ── Logs ────────────────────────────────────────────────────────────────

     19:37:56    ✓ checkout        189 ms  http · POST / · 201
     19:37:56    ✓ sendReceipt       6 ms  firestore · orders/oZ839UsiaAI…
                 │ receipt queued   order oZ839UsiaAIAgVCocxmS · total 36
     19:37:58    ✕ stripeWebhook     2 ms  http · POST / · 500
                 │ Unhandled error Error: No signatures found matching the
                 │ expected signature for payload
                 │   at functions/index.js:24:11
                 │ + 9 more lines · open in console
     19:37:59    ? keys
                   o   open the console in your browser
                   r   reload your functions
                   e   export a snapshot of the data
                   w   list the start-up warnings
                   ?   show these keys
                   q   stop Firenook, keeping your data (Ctrl-C does the …
                   coding agent: run npx firenook mcp add in the project …

  ────────────────────────────────────────────────────────────────────────
     ● running 6s · 3 calls · 1 failed
     o console   r reload   ? keys   q quit
```

### The banner

The card opens with the version and three facts about this start:

- **The project.** A project id that does not start with `demo-` is marked
  `(a real project id)`.
- **Where the data comes from.** It reads `a fresh start`, or
  `first start, importing the seed "<folder>"` when you pass `--import`, or
  `picking up the data saved <time> ago` when
  [kept data](/docs/data/keep-data) is resumed.
- **Node and the data folder.** With `--keep-data`, the data is in
  `.firenook/state`. Without it, every start gets its own folder under
  `.firenook/runs/`, marked `for this run`, which no later start reads.

### Start-up

One row for each emulator you start, filled in as it gets ready, with how
long it took and what it holds: documents, users, objects, functions,
schedules. A step that takes longer than 400 ms shows a progress bar.
Functions shows the codebase it is loading. A start that resumes kept data
has a Saved data row first, while it checks the seed the data came from.
An import runs Firestore, then Auth, then Storage, so the later rows say
`waits for Firestore`. With `--build`, a Build row comes first, for the
first compile:

```text
  │  Build       ✓ 547 ms  functions · build:watch                                               │
  │  Firestore   ✓ 105 ms  0 documents                                                           │
```

### All emulators ready

| Row | Shows |
| --- | --- |
| Console | The [console's](/docs/tools/console) address, or `off` when `firebase.json` turns the UI off |
| Ports | The port of each emulator that runs, and the hub's |
| Warning or Warnings | How many start-up warnings there are, such as `1 start-up warning · press w to show it` |
| Update | A newer release, with the command that installs it (see [Release check](#release-check)) |

A tool that watches the terminal for the words `All emulators ready`, such
as a VS Code task or a process manager, finds them in this heading.

### Logs

Each function call is one line when it ends:

```text
     19:37:56    ✓ sendReceipt       6 ms  firestore · orders/oZ839UsiaAI…
                 │ receipt queued   order oZ839UsiaAIAgVCocxmS · total 36
```

From left to right: the time, `✓` for success or `✕` for failure, the
function, how long it took, and what caused it. For an HTTP or callable
function that is the method, the path and the status, which is yellow for
4xx and red for 5xx. For a background function it is the trigger and what
changed.

What the function logged during the call follows under the `│`, in its
level's colour, with your logger's fields after the message. Output longer
than 30 screen lines shows its start and `+ N more lines`; the whole of it
is in the console. A thrown error shows its message, the first three stack
frames from your own code, and a link that opens the call in the console. A
call that runs for more than two seconds shows a first line marked
`still running`, its output as it comes, and a `finished` line at the end.

Lines that belong to no call show the time, a marker (`·` for information,
`!` for a warning) and the service they come from: Auth's sign-in links
and phone codes, a Storage request that failed in the rules, a Cloud Tasks
warning. In a window 100 columns wide:

```text
     19:39:07    · auth                    To sign in as ada@example.com, follow this link:
                                           http://127.0.0.1:9099/emulator/action?mode=signIn&lang=
                                           en&oobCode=8QmTcBWBfsY-UIdUvaChazaoGV9KCptgtDuPmFZqagVo
                                           0Ghb7vW6BQ&apiKey=fake-api-key&continueUrl=http%3A%2F%2
                                           Flocalhost%3A5173%2Ffinish
     19:39:07    · auth                    To verify the phone number +15555550100, use the code
                                           283916.
     19:39:07    ! storage                 get on gs://demo-shop.appspot.com/report.pdf failed in
                                           the rules: field "token" is not available on this value
     19:39:08    ! tasks                   Tried to queue a task into a non-existent queue
```

When you save a file in a Functions codebase, Firenook reloads it and says
so:

```text
     19:37:28    ↻ reloaded        274 ms  4 functions · default
```

With `--build`, each compile adds a line, with the compiler's errors and
where they are. TypeScript still writes its output when a file has errors,
so the codebase reloads with it:

```text
     19:52:07    ✕ build                   2 errors · functions
                 │ src/index.ts:7:9  Type 'string' is not assignable to type 'number'.
                 │ src/index.ts:7:9  'count' is declared but its value is never read.
     19:52:08    ↻ reloaded        215 ms  1 function · default
     19:52:11    ✓ build                   no errors · functions
     19:52:12    ↻ reloaded        153 ms  1 function · default
```

### The footer

The last two lines stay at the bottom of the window: how long Firenook has
run, how many calls there were and how many failed, and the keys. The keys
`o` and `r` appear only when the console is on, and `r` only when Functions
runs.

## Keys

| Key | Does |
| --- | --- |
| `o` | Opens the console in your browser. If no browser opens, prints the address. |
| `r` | Reloads every Functions codebase of yours, as a save does. |
| `e` | Exports Firestore, Auth and Storage to `.firenook/exports/<date>-<time>`, in the format `--import` reads. |
| `w` | Lists the start-up warnings, or says there were none. |
| `?` or `h` | Shows the keys, and the command that gives a coding agent [the MCP server](/docs/tools/mcp). |
| `q` or Ctrl-C | Stops Firenook. It saves the data first. |

The keys work once the emulators are ready. `q` and Ctrl-C work at any
time: a stop during the start-up closes the data cleanly before Firenook
exits.

`w` lists every warning of the start, such as a codebase that asks for
another Node, or a schedule that cannot run on its own:

```text
     19:39:09    ! schedule of us-central1-cleanup not run automatically (time zone
                   Mars/Olympus_Mons is not in this engine's time-zone database); run it from the
                   console or through the Functions trigger route
```

With none, it says so:

```text
     19:38:06    ✓ warnings                none at start-up
```

Pressing `e` adds a line such as:

```text
     19:39:10    ✓ exported         32 ms  .firenook/exports/2026-10-22-193910
```

A stop ends with a line that says where the data is:

```text
     19:39:42    ✓ stopped          81 ms  everything is kept in .firenook/state
```

## When your functions do not load

What happens depends on when.

At the start, a project whose `firebase.json` has a Functions codebase
needs at least one function. When no codebase loads any, Firenook does not
start: the card says `Functions runtime discovered 0 functions; at least 1
required`, with the error from your code under it. Fix it and start again,
or pass `--minimum-functions 0` to run the rest without them. Every other
emulator then starts, and the card names the error with the code around it
(trimmed):

```text
  ├─ Start-up ────────────────────────────────────────────────────────────── 210 ms ─┤
  │                                                                                  │
  │  Firestore   ✓  87 ms  0 documents                                               │
  │  Auth        ✓  87 ms  0 users                                                   │
  │  Storage     ✓  87 ms  0 objects                                                 │
  │  Functions   ✕  97 ms  your functions did not load · 0 functions                 │
  │  Pub/Sub     ✓   0 ms  0 schedules                                               │
  │                                                                                  │
  ├─ ✕ Your functions did not load ──────────────────────────────────────────────────┤
  │                                                                                  │
  │  Error         SyntaxError: Unexpected token ';'                                 │
  │  Where         functions/index.js:14                                             │
  │                                                                                  │
  │                const x = ;                                                       │
  │                          ^                                                       │
  │                                                                                  │
  │  Next          fix it and save: Firenook loads it again by itself. Every         │
  │                emulator keeps running                                            │
  │                                                                                  │
  ├─ ! All emulators ready, except your functions ───────────────────────────────────┤
```

When some functions do load, from another codebase or an Extension, a
codebase that does not is shown on the card with its error in the same
way, every emulator runs, and the next save loads it again.

Once the emulators run, a save that breaks a codebase does not stop
anything. The log shows the error where it is, and the version from before
the save keeps answering:

```text
     19:37:32    ✕ reload failed   106 ms  default
                 │ SyntaxError: Unexpected token ';'  functions/index.js:14
                 │ const x = ;
                 │           ^
                 │ still running the version loaded at 19:37:28 · open in console
```

Fix it and save again, and the `reloaded` line follows.

## When Firenook cannot start

The card says what went wrong, how to fix it, and what became of the data,
and the command exits with code 1. A port in use names the program that
holds it, with the command that stops it and a free port to put in
`firebase.json`:

```text
  ├─ Start-up ───────────────────────────────────────────────────────────── stopped ─┤
  │                                                                                  │
  │  Firestore   ✓  90 ms  0 documents                                               │
  │  Auth        ✕  90 ms  port 38212 is taken                                       │
  │  Storage     ✓  90 ms  0 objects                                                 │
  │  Functions   ·         not started                                               │
  │  Pub/Sub     ·         not started                                               │
  │                                                                                  │
  ├─ ✕ Firenook could not start ─────────────────────────────────────────────────────┤
  │                                                                                  │
  │  Problem       port 38212 for Auth is held by firenook (PID 94724): another      │
  │                Firenook                                                          │
  │                                                                                  │
  │  Fix           stop it:  kill 94724                                              │
  │                or give Auth a free port in firebase.json:                        │
  │                "emulators": { "auth": { "port": 38218 } }                        │
  │                                                                                  │
  │  Data          nothing of yours was changed                                      │
  │                                                                                  │
  ╰──────────────────────────────────────────────────────────────────────────────────╯
```

The other failures work the same way. Kept data whose seed changed names
the files that changed and gives the `firenook state:adopt-seed` command
that keeps the data (see [Seeds and imports](/docs/data/seeds)). Data that
another Firenook is using says so. A repair after an unclean stop shows how
far it has got (see [Recovery after a crash](/docs/data/recovery)). The
card says nothing was changed only when nothing could have been.

## When the engine stops unexpectedly

If the engine is killed or crashes while it runs, the screen ends with a
card that says so, and the command exits with code 1:

```text
  ├─ ✕ Firenook stopped unexpectedly ─────────────────── signal SIGKILL ─┤
  │                                                                      │
  │  Data          the next start checks .firenook/state first, and      │
  │                repairs it if it needs to                             │
  │                                                                      │
  ╰──────────────────────────────────────────────────────────────────────╯
```

Killing the `firenook` command itself, by closing its terminal pane or with
`kill -9`, is different: the engine notices, saves the data and stops, and
frees the ports.

## Plain output

Firenook prints plain lines, with no screen, when:

- the output goes to a pipe or a file, or input does not come from a
  terminal;
- `CI` is set, as it is in GitHub Actions and most CI services
  (`CI=false`, `CI=0` and an empty `CI` do not count);
- `TERM=dumb`;
- `FIRENOOK_PLAIN=1`;
- you pass `--plain`;
- the command is `emulators:exec`, whose test command shares the terminal.

The plain lines look like this (trimmed):

```text
Firenook 0.2.0; engine 7a9614bea49f8208f96d2126b29ef11ee2f2810b; disk/WAL state ~/demo-shop/.firenook/state
Services: firestore, auth, storage, functions, pubsub; Emulator UI on; host localhost
firenook: Starting emulators: auth, functions, firestore, pubsub, storage
firenook functions: Loaded functions definitions from source: checkout, sendReceipt, stripeWebhook, nightlyReport.
firenook functions[us-central1-checkout]: http function initialized (http://127.0.0.1:5001/demo-shop/us-central1/checkout).
All emulators ready
firenook functions: Beginning execution of "us-central1-checkout"
firenook functions: Beginning execution of "us-central1-sendReceipt"
firenook functions: Finished "us-central1-checkout" in 192ms
firenook functions: {"order":"NxAqPmHBZnvlq03g9ZVi","total":36,"severity":"INFO","message":"receipt queued"}
firenook functions: Finished "us-central1-sendReceipt" in 6.4ms
```

`All emulators ready` stands alone on its line, so a script can wait for it.
There are no keys in plain output: Ctrl-C (or `SIGINT`) stops Firenook and
saves the data, as `q` does. An engine that ends without being asked to
adds a line that says so, and the command exits with code 1:

```text
firenook: the engine was ended (SIGKILL) while it was running; the next start checks the data first, and repairs it if it needs to
```

## Colours, symbols and links

- `NO_COLOR` keeps the screen and drops the colours.
- Colours use 24-bit colour when `COLORTERM` says the terminal has it, 256
  colours when `TERM` names a 256-colour terminal, and 16 otherwise.
- Terminals that cannot draw the symbols get plain characters (`+`, `x`,
  `|`, `=`) and no flame: the Linux text console (`TERM=linux`), the
  Windows console outside Windows Terminal, and any terminal with
  `FIRENOOK_ASCII=1`.
- Addresses are clickable links in terminals that support them, unless
  colours or symbols are off.

## Terminal size

Firenook starts at the top of the window, like a full-screen app, but your
earlier output stays in the scrollback above it. The footer stays on the
window's last line, and the log scrolls above it.

The card is as wide as what it holds, at least 72 columns, and never wider
than the window. In a narrow window, long text is cut with `…`, the footer
splits into two lines, and below 64 columns the banner drops the flame:

```text
  +------------------------------------------------------+
  |                                                      |
  |                firenook  0.2.0                       |
  |                demo-shop - a fresh start             |
  |                Node 24.20.0 - data in .firenook/...  |
  |                                                      |
  +- Start-up ---------------------------------- 468 ms -+
  |                                                      |
  |  Firestore   +  88 ms  0 documents                   |
```

This one is 60 columns wide with `FIRENOOK_ASCII=1`. A window 36 or more
rows tall gets a blank line around each part of the card; a shorter one
gives that space to the log. When you resize the window, Firenook draws the
part that is on screen again at the new width. Lines already in the
scrollback keep the width they were printed at.

## firenook init

In a terminal, `firenook init` draws the same card: the mark, then the new
project's choices as rows, each already made: the project id, the
emulators with their ports, the Functions language, the coding agents and
the set-up. `↑` and `↓` (or Tab) move between rows, `←` and `→` change a
choice, Space turns one of several on or off, letters edit the project id,
Enter creates the project and Esc leaves without writing anything. The row
in focus shows its hint under it.

The set-up then runs as rows of the card, like the start-up, and a yes to
starting the emulators hands the same terminal to the start screen. In a
folder that already has a `firebase.json`, the card shows what
`init --adopt` would add and asks before adding it. See
[Start a new project](/docs/get-started/new-project).

## Release check

Once a day at most, in the background, Firenook asks the npm registry for
its latest version tags. The answer shows on the next start, as the Update
row of the ready summary, so the check never slows a start down. It follows
the channel of the version you have: `latest` for a release such as 0.2.0,
and `next` for a preview, which also hears of a later release on `latest`.
It gives the install command for your package manager, from your lockfile.
It never runs in plain output, in CI, or with
`FIRENOOK_NO_UPDATE_CHECK=1` or `NO_UPDATE_NOTIFIER=1`. As everywhere, a
variable set to nothing, `0` or `false` is not set: `CI=false` is not CI.

## Next

[The console](/docs/tools/console) is one key away, and
[CLI commands](/docs/reference/cli) lists every flag of `emulators:start`.
