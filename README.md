# @mikode13/cross-platform

Cross-platform utilities for MiKode `package.json` build and maintenance scripts.

## Why

Some operations a build script needs — for example deleting a stale output directory
before recompiling — have no single command that works unmodified on every platform.
`rm -rf dist` fails under native Windows `cmd.exe`, which is what `npm`/`pnpm` invoke by
default there, even though it works on macOS, Linux, and Windows under Git Bash, WSL, or
PowerShell with an alias.

This package centralizes that kind of operation in one MiKode-owned place, so a
repository depends on a single first-party package instead of independently picking a
third-party tool or hand-rolling a platform-specific command each time the same problem
appears.

See [ADR 0016](https://github.com/Mikode13/engineering/blob/main/adr/0016-centralize-cross-platform-script-utilities.md)
in `mikode-engineering` for the decision this package implements. The ADR is currently
`Proposed`.

## Status

This package is scaffolded but has no published API yet. Its first capability
(cross-platform-safe removal of a directory, to replace `rm -rf` in a `build` script) is
still being designed.

## Install

```sh
pnpm add @mikode13/cross-platform
```

## Tests

`pnpm test` runs the unit suite; it is currently empty because no behavior has been
implemented yet.

## License

This project is source-available under the MIT License with the
[Commons Clause License Condition v1.0](https://commonsclause.com/). See
[LICENSE](./LICENSE) for the complete text. It is not OSI open source: the Commons
Clause restricts selling the software or a service whose value derives substantially
from it.
