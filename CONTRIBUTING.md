# Contributing to nepali-miti-react

Thanks for helping! This package is the React UI. Date conversion and calendar data live in
[nepali-miti](https://github.com/alexblaze/nepali-miti), so report wrong dates there.

## Setup

Requires Node.js 20+ for development (the published package supports Node.js 18+).

```sh
git clone https://github.com/alexblaze/nepali-miti-react.git
cd nepali-miti-react
npm install
```

## Development workflow

| Command                 | What it does                                |
| ----------------------- | ------------------------------------------- |
| `npm run dev`           | Rebuild `dist/` on change                   |
| `npm test`              | Run the test suite (Vitest)                 |
| `npm run coverage`      | Tests with coverage thresholds              |
| `npm run lint`          | ESLint, Prettier check and `tsc` type check |
| `npm run format`        | Apply Prettier                              |
| `npm run build`         | Build ESM, CJS and type declarations        |
| `npm run check:package` | `publint` and `@arethetypeswrong/cli`       |

Run the tests in another timezone to catch timezone bugs: `TZ=Pacific/Kiritimati npm test`.
Test against React 18: `npm install --no-save react@18 react-dom@18 && npm test`.

Accessibility is a requirement: keep the keyboard behaviour in the README working and keep the axe tests passing.

## Pull requests

- No runtime dependencies besides the `nepali-miti` and React peer dependencies.
- Add tests for every behaviour change.
- Public API changes need README and CHANGELOG updates (under `## [Unreleased]`).
- Use [Conventional Commits](https://www.conventionalcommits.org/): `fix: …`, `feat: …`, `docs: …`, `chore: …`.
- CI must pass: lint, tests on React 18/19 and Node.js 20/22/24 in several timezones, build, package checks.

## Release process (maintainers)

1. Update `CHANGELOG.md` and bump the version: `npm version patch|minor|major`.
   - patch: bug fixes; minor: new features; major: breaking API changes.
2. `git push --follow-tags`.
3. Create a GitHub Release from the tag. The `publish` workflow then publishes to npm with provenance using
   npm trusted publishing (OIDC). No npm token is stored in the repository.
