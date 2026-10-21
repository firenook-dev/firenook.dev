---
title: The terminal
description: What firenook emulators:start draws in a terminal, the keys it answers, what it shows when something fails, and the plain output pipes and CI get.
---

In a terminal, `firenook emulators:start` draws its own screen: how the
start-up went, where everything listens, and a line for every function
call. This page explains what each part means, the keys it answers, and the
plain output you get instead in a pipe or in CI.

## The screen

This is the whole screen of a start that picks up kept data, in a window
76 columns wide, after two function calls and a press of `?`. The
project's `firebase.json` puts the emulators on ports from 31400; with the
default ports you see 8080, 9099 and the rest.

```text
  ╭──────────────────────────────────────────────────────────────────────╮
  │                                                                      │
  │       ▄█                                                             │
  │    ▄███▀ ▄     firenook  0.2.0-next.8                                │
  │  ▄███▀ ███▄    demo-shop · picking up the data saved 9 minutes ago   │
  │  ▀██▀ ███▀     Node 24.11.1 · data in .firenook/state                │
  │      █▀▀                                                             │
  │                                                                      │
  ├─ Start-up ────────────────────────────────────────────────── 463 ms ─┤
  │                                                                      │
  │  Firestore   ✓  27 ms  2 documents                                   │
  │  Auth        ✓  27 ms  0 users                                       │
  │  Storage     ✓  27 ms  0 objects                                     │
  │  Functions   ✓ 412 ms  2 functions                                   │
  │  Pub/Sub     ✓   0 ms  0 schedules                                   │
  │                                                                      │
  ├─ ✓ All emulators ready ──────────────────────────────────────────────┤
  │                                                                      │
  │  Console       http://127.0.0.1:31400/console                        │
  │  Ports         Firestore 31480   Auth 31499   Storage 31490          │
  │                Functions 31401   Pub/Sub 31485   Hub 31440           │
  │                                                                      │
  ╰──────────────────────────────────────────────────────────────────────╯

  ── Logs ────────────────────────────────────────────────────────────────

     23:39:35    ✓ helloWorld        9 ms  http · GET / · 200
                 │ Hello logs!   structuredData true
     23:39:35    ✓ onOrderCreated    7 ms  firestore · orders/C7d1 created
                 │ new order   id C7d1
     23:39:37    ? keys
                   o   open the console in your browser
                   r   reload your functions
                   e   export a snapshot of the data
                   w   list the start-up warnings
                   ?   show these keys
                   q   stop Firenook, keeping your data (Ctrl-C does the …
                   coding agent: run npx firenook mcp add in the project …

  ────────────────────────────────────────────────────────────────────────
     ● running 12s · 2 calls
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
`waits for Firestore`.

### All emulators ready

| Row | Shows |
| --- | --- |
| Console | The [console's](/docs/tools/console) address, or `off` when `firebase.json` turns the UI off |
| Ports | The port of each emulator that runs, and the hub's |
| Warning or Warnings | The start-up warning, or how many there are; press `w` to list them |
| Update | A newer release, with the command that installs it (see [Release check](#release-check)) |

A tool that watches the terminal for the words `All emulators ready`, such
as a VS Code task or a process manager, finds them in this heading.

### Logs

Each function call is one line when it ends:

```text
     23:39:35    ✓ onOrderCreated    7 ms  firestore · orders/C7d1 created
                 │ new order   id C7d1
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

Lines that belong to no call, such as an emulator's own warnings, show the
time, a marker and where they come from.

When you save a file in a Functions codebase, Firenook reloads it and says
so:

```text
     23:23:03    ↻ reloaded        265 ms  2 functions · default
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

Pressing `e` adds a line such as:

```text
     23:16:27    ✓ exported         22 ms  .firenook/exports/2026-10-21-231627
```

A stop ends with a line that says where the data is:

```text
     23:30:49    ✓ stopped         129 ms  everything is kept in .firenook/state
```

## When your functions do not load

A save that breaks a codebase does not stop anything. The log shows the
error where it is, and the version from before the save keeps answering:

```text
     23:22:57    ✕ reload failed   119 ms  default
                 │ SyntaxError: Unexpected token ';'  functions/index.js:14
                 │ const x = ;
                 │           ^
                 │ still running the version loaded at 23:22:48 · open in console
```

Fix it and save again, and the `reloaded` line follows.

A codebase that is already broken when you start is different. By default
Firenook needs at least one function when `firebase.json` configures a
codebase, so the start fails with
`Functions runtime discovered 0 functions; at least 1 required` and the
error from your code. To start
anyway, pass `--minimum-functions 0`. Every other emulator then starts,
the card names the error with the code around it, and the heading reads
`All emulators ready, except your functions` until a save loads them.

## When Firenook cannot start

The card says what went wrong, how to fix it, and what became of the data,
and the command exits with code 1. A port in use names the program that
holds it, with the command that stops it and a free port to put in
`firebase.json`:

```text
  ├─ Start-up ─────────────────────────────────────────────────────────────── stopped ─┤
  │                                                                                    │
  │  Firestore   ✓  64 ms  0 documents                                                 │
  │  Auth        ✕  64 ms  port 31499 is taken                                         │
  │                                                                                    │
  ├─ ✕ Firenook could not start ───────────────────────────────────────────────────────┤
  │                                                                                    │
  │  Problem       port 31499 for Auth is held by firenook (PID 30426): another        │
  │                Firenook                                                            │
  │                                                                                    │
  │  Fix           stop it:  kill 30426                                                │
  │                or give Auth a free port in firebase.json:                          │
  │                "emulators": { "auth": { "port": 31500 } }                          │
  │                                                                                    │
  │  Data          nothing of yours was changed                                        │
  │                                                                                    │
  ╰────────────────────────────────────────────────────────────────────────────────────╯
```

The other failures work the same way. Kept data whose seed changed names
the files that changed and gives the `firenook state:adopt-seed` command
that keeps the data (see [Seeds and imports](/docs/data/seeds)). Data that
another Firenook is using says so. A repair after an unclean stop shows how
far it has got (see [Recovery after a crash](/docs/data/recovery)).

## Plain output

Firenook prints plain lines, with no screen, when:

- the output goes to a pipe or a file, or input does not come from a
  terminal;
- `CI` is set, as it is in GitHub Actions and most CI services;
- `TERM=dumb`;
- `FIRENOOK_PLAIN=1`;
- you pass `--plain`;
- the command is `emulators:exec`, whose test command shares the terminal.

The plain lines look like this (trimmed):

```text
Firenook 0.2.0-next.8; engine f7c3c663427fd181b0e67b31f960f6e5751b7d12; disk/WAL state ~/demo-shop/.firenook/runs/session-YS6oKA/state
Services: firestore, auth, storage, functions, pubsub; Emulator UI on; host 127.0.0.1
firenook: Starting emulators: auth, functions, firestore, pubsub, storage
firenook functions: Loaded functions definitions from source: helloWorld, onOrderCreated.
firenook functions[us-central1-helloWorld]: http function initialized (http://127.0.0.1:31401/demo-shop/us-central1/helloWorld).
All emulators ready
firenook functions: Beginning execution of "us-central1-helloWorld"
firenook functions: {"structuredData":true,"severity":"INFO","message":"Hello logs!"}
firenook functions: Finished "us-central1-helloWorld" in 5.1ms
```

`All emulators ready` stands alone on its line, so a script can wait for it.
There are no keys in plain output: Ctrl-C (or `SIGINT`) stops Firenook and
saves the data, as `q` does.

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
  |                firenook  0.2.0-next.8                |
  |                demo-shop - a fresh start             |
  |                Node 24.11.1 - data in .firenook/...  |
  +- Start-up ---------------------------------- 760 ms -+
  |  Firestore   + 165 ms  0 documents                   |
```

This one is 60 columns wide with `FIRENOOK_ASCII=1`. A window 36 or more
rows tall gets a blank line around each part of the card; a shorter one
gives that space to the log. When you resize the window, Firenook draws the
part that is on screen again at the new width. Lines already in the
scrollback keep the width they were printed at.

## Release check

Once a day at most, in the background, Firenook asks the npm registry for
its latest version tags. The answer shows on the next start, as the Update
row of the ready summary, so the check never slows a start down. It follows
the channel of the version you have (`next` for a preview, `latest`
otherwise) and gives the install command for your package manager, from
your lockfile. It never runs in plain output, in CI, or with
`FIRENOOK_NO_UPDATE_CHECK=1` or `NO_UPDATE_NOTIFIER=1`.

## Next

[The console](/docs/tools/console) is one key away, and
[CLI commands](/docs/reference/cli) lists every flag of `emulators:start`.
