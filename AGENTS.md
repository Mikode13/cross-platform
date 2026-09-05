# AGENTS.md

## What this repository is

`@mikode13/cross-platform` is a MiKode-owned npm package that centralizes
cross-platform-unsafe operations needed by `package.json` build and maintenance
scripts — starting with cross-platform-safe removal of a directory (to replace
`rm -rf` in a `build` script, which fails under native Windows `cmd.exe`).

It implements the decision proposed in
[ADR 0016](https://github.com/Mikode13/engineering/blob/main/adr/0016-centralize-cross-platform-script-utilities.md)
in `mikode-engineering` (currently `Proposed`). The ADR scopes this package's first
version to `clean` only and decides its implementation (Node's built-in `fs` APIs); it
deliberately leaves the package's name and any future API beyond `clean` open.

## Constraint specific to this repository

Every exported utility MUST actually work identically on macOS, Linux, and native
Windows (`cmd.exe`, not only Git Bash or WSL) — that portability is the entire reason
this package exists. Prefer Node's own built-in APIs (for example `node:fs`) over
spawning a shell command, since a Node API call sidesteps the shell-portability problem
entirely rather than working around it per platform.

## Engineering standards

This repository follows the active standards in `Mikode13/engineering`
(`standards/README.md`). Do not duplicate their content here; read them there when a
change touches package management, TypeScript, code quality, formatting, git workflow,
testing, or CI.

## Current state

`clean` is implemented and exported, both as a function and as the `mikode-scripts` CLI.
See `README.md`'s Status section.
