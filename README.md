# vodding

vodding is a "vodding" application — a web app built with React, TypeScript and Vite for creating, managing, and sharing voddings. (A "vodding" in this project is an app-defined unit of content — the repo provides the UI and tooling to author, view, and collaborate on voddings.)

This repository provides a starter application with development tooling, linting, and a straightforward contribution workflow so others can help build and improve vodding. See [CONTRIBUTING.md](CONTRIBUTING.md) and [LICENSE](LICENSE) for contribution guidelines and licensing.

## Table of contents

- What this app is
- Features
- Tech stack
- Getting started
- Environment Variables
- Development
- Contributing
- Code style & tests
- Reporting issues
- License
- Code of conduct

---

## What this app is

Vodingg is the frontend application for authoring and interacting with "voddings". It is intended to be:

- Simple to run locally for development and testing
- Easy to extend with new UI components and integrations
- Friendly to contributors with clear guidelines and automated checks

This repository currently holds the frontend implementation (React + TypeScript + Vite). Backend or hosting integrations may be provided in separate repositories or future work.

---

## Features

- Component-driven UI using React and TypeScript
- Fast local development powered by Vite
- Type-aware linting and recommended ESLint configuration
- Minimal opinionated starter to make contribution straightforward

---

## Tech stack

- React
- TypeScript
- Vite
- ESLint (TypeScript-aware)
- (Optional) Prettier for formatting

---

## Getting started

Prerequisites:

- Node.js (LTS recommended, e.g. Node 18+)
- A modern package manager — we recommend using Bun or pnpm for faster installs and deterministic installs. npm and Yarn are supported as well, but Bun and pnpm are preferred.

Quick start (recommended):

- Using Bun (fast runtime + package manager)
  1. Install dependencies:
     - `bun install`
  2. Start the dev server:
     - `bun run dev`
  3. Build for production:
     - `bun run build`
  4. Preview the production build locally:
     - `bun run preview`

- Using pnpm (fast, disk-efficient, and reproducible):
  1. Install dependencies:
     - `pnpm install`
  2. Start the dev server:
     - `pnpm dev`
     - (or `pnpm run dev` if your environment requires the explicit `run`)
  3. Build for production:
     - `pnpm build`
  4. Preview the production build locally:
     - `pnpm preview`

Notes:

- If you prefer, `npm` or `yarn` also work. For example: `npm install` / `npm run dev` or `yarn` / `yarn dev`.
- This project uses the standard Vite script names by default. If your `package.json` differs, use the scripts defined there.
- Bun provides an integrated runtime and package manager. If you choose Bun, ensure you're running a Bun-supported Node API surface (most Vite workflows work fine with Bun; check Bun docs if you hit runtime differences).

---

## Environment Variables

This project uses environment variables for the Canny feedback board integration. These must be set in your Vite environment (e.g., `.env` file or CI secrets) for the FeedbackBoard component to work.

### Required Variables

The following environment variables are required:

- `VITE_CANNY_FEATURES_TOKEN` - Token for the Feature Requests board
- `VITE_CANNY_BUGS_TOKEN` - Token for the Bug Reports board
- `VITE_CANNY_GENERAL_TOKEN` - Token for the General Feedback board

### How to Obtain Canny Board Tokens

1. Log in to your [Canny dashboard](https://app.canny.io/)
2. Navigate to the board you want to use (or create a new board)
3. Go to **Settings** → **Integrations** → **SDK**
4. Copy the **Board Token** (this is what you need for the environment variable)
5. Repeat for each board you want to integrate (features, bugs, general)

### Setting Up Environment Variables

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Open `.env` and replace the placeholder values with your actual Canny board tokens:

   ```env
   VITE_CANNY_FEATURES_TOKEN=your-actual-feature-board-token
   VITE_CANNY_BUGS_TOKEN=your-actual-bug-board-token
   VITE_CANNY_GENERAL_TOKEN=your-actual-general-board-token
   ```

3. Restart your dev server for the changes to take effect.

### Security Warning

**DO NOT** commit actual tokens to version control. The `.env` file is included in `.gitignore` to prevent this. Only `.env.example` (with placeholders) should be committed.

### Usage in Code

These environment variables are used in `src/components/FeedbackBoard.tsx` in the `BOARDS` constant (lines 17-33):

```typescript
const BOARDS = {
  features: {
    token: import.meta.env.VITE_CANNY_FEATURES_TOKEN,
    name: "Feature Requests",
    description: "Suggest and vote on new features",
  },
  bugs: {
    token: import.meta.env.VITE_CANNY_BUGS_TOKEN,
    name: "Bug Reports",
    description: "Report issues and track fixes",
  },
  general: {
    token: import.meta.env.VITE_CANNY_GENERAL_TOKEN,
    name: "General Feedback",
    description: "Share your thoughts and ideas",
  },
};
```

---

## Development

- Create a feature branch from `main`:
  - Example branch names: `feature/add-login`, `fix/issue-123`
- Keep commits focused and atomic. Prefer multiple small commits over one huge commit.
- Use descriptive commit messages. We recommend Conventional Commits (e.g. `feat: add login button`, `fix: resolve null pointer in Player`).
- Before opening a pull request:
  - Run linters: `npm run lint` or the equivalent script for your package manager (e.g. `pnpm lint` or `bun run lint`)
  - Run tests: `npm test` (or `pnpm test` / `bun run test` if configured)
  - Build the project to ensure production build succeeds: `npm run build` (or `pnpm build` / `bun run build`)

Pull requests will be reviewed by maintainers. A PR should include:

- A short summary of what the change does
- Any relevant screenshots or recordings for UI changes
- Tests or manual verification steps
- Link to a related issue (if any)

---

## Contributing

We welcome contributions of any size.

How to contribute:

1. Fork the repository.
2. Create a branch from `main` named `feature/your-feature` or `fix/issue-number-description`.
3. Make your change, keeping it scoped and well-documented.
4. Run the project's tests and linters locally.
5. Push your branch to your fork and open a pull request against this repository's `main` branch.
6. Address review comments and update your PR until it is approved and merged.

Guidelines:

- Include tests for new features or bug fixes when practical.
- Keep accessibility in mind for UI components.
- Add or update documentation where behavior has changed.
- Small, well-tested PRs merge faster.

Pull request checklist (maintainers may use this):

- [ ] PR targets `main`
- [ ] Descriptive title and summary
- [ ] Linked to an issue when applicable
- [ ] Tests added/updated
- [ ] Linting and type checks pass
- [ ] Manual verification steps provided for UI changes

---

## Code style & tests

- TypeScript should be used for new code.
- Favor functional, pure components where appropriate and isolate side effects.
- Use existing patterns in the codebase for state management, hooks, and component organization.
- Use ESLint rules that are included in the repository. If you add new rules, discuss them in the PR.
- If a test suite exists, add unit and/or integration tests for new features or bug fixes.

---

## Reporting issues

When reporting a bug or requesting a feature, please include:

- A short descriptive title
- Steps to reproduce
- Expected behavior
- Actual behavior (include screenshots if helpful)
- Environment information (OS, Node version, browser/version)
- Any relevant logs or errors

Good issues make it easier for others to help and to triage quickly.

---

## License

This project is licensed under the MIT License.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---

## Code of conduct

Please follow a respectful, inclusive, and constructive approach when interacting in issues and pull requests. We recommend adopting the Contributor Covenant (https://www.contributor-covenant.org/) as a basis for project behavior.

---

## Questions or help

If you need help getting set up or have questions about contributing, open an issue describing your situation and a maintainer or contributor will follow up.

Thank you for your interest in Vodding — contributions are welcome!
