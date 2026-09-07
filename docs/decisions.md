# Project decisions

A chronological log of decisions specific to this repository. Cross-project decisions
live in [`Mikode13/engineering`](https://github.com/Mikode13/engineering); this file
records only what a future maintainer of this package could not derive from those.

## Windows validation runs as a repository-owned CI job

**Decision.** Keep a `cross-platform check (Windows)` job in the caller workflow, and
require that status check through a repository ruleset in addition to the organization's
`CI / required`.

**Context.** The shared CI contract in `Mikode13/.github` runs every capability on
`ubuntu-latest`. This package exists because `rm -rf dist` fails under native Windows
`cmd.exe`, so a suite that never runs on Windows cannot observe the defect the package
was created to prevent. The continuous integration standard permits a repository-specific
extension for an invariant the central contract cannot know generically, which this is.

The extension is a sibling job of the caller, so it cannot join the reusable workflow's
`required` aggregate. Without a second required status check it would run, report, and be
ignored by the merge gate.

**Consequences.** Two required checks guard `main` instead of one. A change to the job's
name must be paired with a ruleset update, or merges block on a check that no longer
reports. The job duplicates install, test, and build steps that the shared contract
already runs on Linux; that duplication is the cost of covering a platform the contract
does not.

## The build removes `dist` before compiling

**Decision.** Run `scripts/clean-dist.mjs` before `tsc` in the `build` script, rather than
invoking `tsc` alone.

**Context.** `tsc` writes into `outDir` but never empties it. When `src/cliClean.ts` was
renamed to `src/cli.ts`, the previous `dist/cliClean.*` output survived every later build
and was included in the publishable tarball. `dist` is git-ignored, so the orphan was
invisible in review and absent from CI's fresh checkouts, but present for anyone who
built locally.

The clean step reimplements the single `fs.rm` call in `src/clean.ts` instead of importing
it. The build is what produces the package's runnable output, so it cannot consume that
output without a bootstrap cycle, and making the build depend on Node's experimental
type stripping to read the source directly would put an unstable flag on the declared
Node.js 22 floor.

**Consequences.** `dist` is a function of the current sources alone. Incremental rebuilds
lose their cache and recompile from scratch, which is negligible for a package this size.
The duplicated line must stay in step with `clean` if that function ever grows beyond
`fs.rm`.

**Lesson.** A package that fixes a class of defect is not automatically immune to it.

## `pack:check` builds before inspecting the tarball

**Decision.** Define `pack:check` as `pnpm run build && node scripts/pack-check.mjs`, and
have the script assert the exact expected file set rather than printing the tarball
contents.

**Context.** The shared CI contract's Package capability checks out, installs, and runs
`pnpm run pack:check`; it does not build. With `pack:check` defined as `pnpm pack
--dry-run`, CI packed a tarball containing only `LICENSE`, `package.json`, and
`README.md` — no code at all — and passed, because `pnpm pack` reports contents without
judging them. The capability was reporting success while validating nothing.

The expected file set is derived from `src` rather than hard-coded, so adding a source
file does not require editing the check, while output from a deleted or renamed source
still fails as unexpected. Declared entry points are verified separately from the file
set, because a manifest can promise a path that the build never emits.

**Consequences.** `pack:check` is slower, since it always compiles first. It is now the
gate that catches both an incomplete tarball and a stale one, and it fails locally for
the same reasons it fails in CI.

`tests/integration/packaging.integration.test.ts` locks both behaviors in. It runs the
real build and the real verifier rather than a fake, because the defect lived in how
those two commands compose, which a unit test of either one could not observe. The
expected file count is derived from `src` inside the test, independently of the
verifier, so a verifier that expects the wrong set fails instead of agreeing with
itself.
