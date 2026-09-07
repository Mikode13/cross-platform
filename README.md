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
and the [cross-platform script utilities standard](https://github.com/Mikode13/engineering/blob/main/standards/cross-platform-script-utilities.md)
in `mikode-engineering` for the decision and usage policy this package implements. The
ADR is `Accepted`.

## Status

The first (and currently only) capability, `clean`, is implemented: cross-platform-safe
removal of a directory using Node's built-in `node:fs/promises`, exposed both as a
function and as a CLI for `package.json` scripts.

## Install

```sh
pnpm add @mikode13/cross-platform
```

## Usage

As a function:

```ts
import { clean } from '@mikode13/cross-platform';

await clean('dist');
```

From a `package.json` script, in place of `rm -rf`:

```json
{
	"scripts": {
		"build": "mikode-scripts clean dist && tsc -p tsconfig.build.json"
	}
}
```

The CLI rejects an empty path, the root of the filesystem, and the current working
directory. It does not restrict the target to be inside the current working directory
(for example `../other-dir` is allowed).

## Tests

`pnpm test` pnpm test runs the unit and packaging integration suites.

## Releases

Versions are derived from Conventional Commit titles by `semantic-release` and published
automatically from `main`. The npm registry, Git tags, and GitHub Releases are the
authoritative history; the `version` field in this repository stays at
`0.0.0-development` and is never committed with a real version.

## License

This project is source-available under the MIT License with the
[Commons Clause License Condition v1.0](https://commonsclause.com/). See
[LICENSE](./LICENSE) for the complete text. It is not OSI open source: the Commons
Clause restricts selling the software or a service whose value derives substantially
from it.
