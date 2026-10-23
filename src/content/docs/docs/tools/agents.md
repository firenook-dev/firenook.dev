---
title: Use these docs from an agent
description: Give a coding agent the Firenook docs through an MCP server that searches and reads them, every page as Markdown, llms.txt, and a skill.
---

Everything on firenook.dev is public and needs no sign-in, so an agent reads
it as you do. There are four ways to hand it the docs.

## The docs' MCP server

`https://firenook.dev/docs/mcp` is an MCP server over these docs, on
Streamable HTTP, with three tools:

| Tool | What it does |
| --- | --- |
| `search_docs` | Finds the sections that answer a question, with their addresses |
| `read_page` | Returns a page as Markdown |
| `list_pages` | Lists every page, with a line on what each covers |

It is not `firenook mcp`. That server works on the emulators running on your
machine ([connect your coding agent](/docs/tools/mcp)); this one reads the
docs.

Add it to Claude Code:

```sh
claude mcp add --transport http firenook-docs https://firenook.dev/docs/mcp
```

To Cursor, in `.cursor/mcp.json`:

```json title=".cursor/mcp.json"
{
  "mcpServers": {
    "firenook-docs": { "url": "https://firenook.dev/docs/mcp" }
  }
}
```

To VS Code, in `.vscode/mcp.json`:

```json title=".vscode/mcp.json"
{
  "servers": {
    "firenook-docs": { "type": "http", "url": "https://firenook.dev/docs/mcp" }
  }
}
```

## Pages as Markdown

Every page is also Markdown, at its address plus `.md`:

```sh
curl https://firenook.dev/docs/get-started/install.md
```

Or ask for the page itself as Markdown:

```sh
curl -H 'Accept: text/markdown' https://firenook.dev/docs/get-started/install
```

[llms.txt](https://firenook.dev/llms.txt) lists every page with a line on
what it covers, and [llms-full.txt](https://firenook.dev/llms-full.txt) holds
all of the docs in one file.

## The Firenook skill

The skill teaches an agent to install Firenook, switch a project from the
Firebase emulators, keep data between runs and run tests. It is one file,
`https://firenook.dev/.well-known/agent-skills/firenook/SKILL.md`. For
Claude Code, save it in the project:

```sh
mkdir -p .claude/skills/firenook
curl -o .claude/skills/firenook/SKILL.md https://firenook.dev/.well-known/agent-skills/firenook/SKILL.md
```

Agents that look for skills on a site find it listed at
`https://firenook.dev/.well-known/agent-skills/index.json`.

## In the browser

An agent that works in the browser through WebMCP finds the same three tools
on every page, and `open_page` to go to another.

## Crawlers

`robots.txt` lets every crawler read every page, and its Content Signals say
the pages may be used for search, for answers and for training.
