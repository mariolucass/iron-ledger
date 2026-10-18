# Iron Ledger

Iron Ledger is a Next.js frontend for inventory operations, forecasting,
reporting, governance, and access management. The original interface design is
available in [Figma](https://www.figma.com/design/c4KH5GHe1r50o0VC128rqQ/Iron-Ledger).

## Running the code

Requirements:

- Node.js 24 LTS (see `engines` in the root `package.json`)
- pnpm 10.12.1 (pinned by `packageManager`; pnpm and corepack switch to it automatically)

Install dependencies from the monorepo root (the web app is a workspace, not a standalone project):

```bash
pnpm install
```

Start the Next.js development server:

```bash
pnpm dev
```

Create a production build:

```bash
pnpm build
```

Run the TypeScript checks:

```bash
pnpm typecheck
```
## Frontend architecture

`src/app` contains Next.js routes, metadata, the root layout and BFF handlers.
Parenthesized route groups remain unchanged and do not appear in URLs.

- `src/views`: routed screens, page-specific queries, filters, drawers and demo state.
- `src/widgets`: the application shell, header, sidebar and navigation.
- `src/features`: `sign-in`, `sign-out` and `record-stock-movement`, with their action state and validation.
- `src/entities`: public domain contracts, API clients and reusable presentation.
- `src/shared`: transport, session helpers, theme and generic UI.

Dependencies flow downward in this order. Consumers import slices through their
`index.ts`; slices do not import other slices on the same layer. Demo warehouse
and transaction data shared by screens use explicit `entities/*/testing` entry
points, separate from production entity exports.

The `views` name avoids a conflict with the Next.js Pages Router. Screen moves
preserve the current URLs and BFF contracts. Alerts, reports and settings retain
their existing demonstration behavior.

See [the migration document](../../docs/architecture/frontend-fsd-proposal.md)
for responsibilities and future actions.

From the monorepo root, run the checks:

```sh
pnpm --filter @iron-ledger/web typecheck   # next typegen + tsc
pnpm --filter @iron-ledger/web test        # entities API, FSD boundaries and schemas
```
