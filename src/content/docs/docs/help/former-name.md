---
title: Former name
description: Firenook was published as Fireside up to 0.1.0-next.9. The old package, command and variable names, and how to move a project and its saved data over.
---

Firenook used to be called Fireside. It is the same project under a new
name: the last release under the old name was `@fireside-dev/cli@0.1.0-next.9`,
and every release from `0.2.0-next.1` on is published as `firenook`. This
page is for projects that still use the old name.

## What changed

| Before | Now |
| --- | --- |
| npm package `@fireside-dev/cli` | `firenook` |
| platform packages `@fireside-dev/<platform>` | `@firenook/cli-<platform>` |
| command `fireside` | `firenook` |
| environment variables `FIRESIDE_*` | `FIRENOOK_*`, for example `FIRENOOK_OFFLINE` |
| run folder `.fireside/` | `.firenook/` |
| MCP tools `fireside_*` | `firenook_*` |
| store files `fireside.redb`, `fireside.wal` | `firenook.redb`, `firenook.wal` |

No alias of the old names is kept. The ports, the `firebase.json` handling
and the export format did not change with the name.

The old package is deprecated on npm. Its last version, `0.1.0-next.10`,
contains no engine and only says where to go:

```console
$ npx fireside --version
@fireside-dev/cli was renamed to firenook and this version contains no engine.
  npm install --save-dev firenook   (bin: firenook)
  https://www.npmjs.com/package/firenook
The last engine under the old name was @fireside-dev/cli@0.1.0-next.9.
```

## Move a project

1. Replace the package. Remove the old one and install Firenook at an exact
   version:

   ```sh
   npm uninstall @fireside-dev/cli
   npm install --save-dev --save-exact firenook
   ```

2. Change `fireside` to `firenook` in your `package.json` scripts, CI files
   and docs:

   ```diff lang="json"
    "scripts": {
   -  "emulators": "fireside emulators:start --state-dir ./local-state --resume-state --import ./seed"
   +  "emulators": "firenook emulators:start --state-dir ./local-state --resume-state --import ./seed"
    }
   ```

3. Rename every `FIRESIDE_*` variable you set to its `FIRENOOK_*` name.
4. Add `.firenook/` to `.gitignore`. The old `.fireside/` folder holds earlier
   runs; Firenook does not read it, and you can delete it once you no longer
   need them.
5. If you gave a coding agent the old MCP server, remove its `fireside` entry
   and run `npx firenook mcp add`. See
   [connect your coding agent](/docs/tools/mcp).

## Your saved data

Data kept with `--state-dir` and `--resume-state` carries over. On its first
start, Firenook renames the store files from `fireside.redb` and
`fireside.wal` to `firenook.redb` and `firenook.wal`, then picks the data up
where Fireside left it. Start with the same `--state-dir`, and the same
`--import` if the data began from a seed. Trimmed:

```console
$ npx firenook emulators:start --keep-data --state-dir ./local-state --import ./seed
Firenook 0.2.0; engine 7a9614bea49f8208f96d2126b29ef11ee2f2810b; disk/WAL state ~/demo-shop/local-state
firenook resuming validated native state (seed import skipped)
firenook: indexed the top-level fields of 5 Firestore documents in 0.0 s
All emulators ready
```

The first start also indexes the documents' top-level fields, once.

`--keep-data --state-dir ./local-state` is the same as
`--state-dir ./local-state --resume-state`.

The move is one way. Once Firenook has opened the data, `0.1.0-next.9`
refuses it (`native state refused: No such file or directory (os error 2);
existing data preserved`), since the store files have their new names, and
changes nothing. If you may need
to go back, export the data first; every release reads the official export
format.

## Next

[Versions and verification](/docs/help/versions) explains the release tags
and how to pin one.
