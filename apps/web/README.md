# Iron Ledger

Iron Ledger is a Next.js frontend for inventory operations, forecasting,
reporting, governance, and access management. The original interface design is
available in [Figma](https://www.figma.com/design/c4KH5GHe1r50o0VC128rqQ/Iron-Ledger).

## Running the code

Requirements:

- Node.js 20.9 or newer
- pnpm 11

Install dependencies with pnpm:

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
## Domain organization

Both src/app and src/features use the same domain groups:

| Group | Features | Responsibility |
| --- | --- | --- |
| (operations) | inventory, warehouses, transactions | Stock, storage and inventory movements |
| (intelligence) | dashboard, forecasting, reports | Indicators, predictions and reporting |
| (governance) | alerts, audit-log | Monitoring and audit trails |
| (identity) | auth, users | Authentication and access management |
| (marketing) | landing | Public product presentation |
| (platform) | settings, design-system | Workspace configuration and UI reference |

In app, parentheses define Next.js route groups and do not appear in URLs.
For example, src/app/(identity)/login/page.tsx still serves /login,
src/app/(marketing)/page.tsx serves /, and
src/app/(operations)/transactions/[id]/page.tsx serves /transactions/:id.
The root layout and not-found handler remain in app because they apply to all groups.

In features, parentheses are ordinary folder names and must appear in imports:
@/features/(governance)/alerts/ui/AlertsPage. Each feature retains its ui
and model segments. The auth feature backs the login route.

This is domain-oriented grouping inspired by DDD and FSD, not a full DDD model
or strict FSD implementation. Groups organize existing slices; they do not
introduce shared domain logic or enforce dependency boundaries. Platform is
a technical support group. Shared UI and layout remain in shared and widgets.
The existing forecasting dependency on warehouse data is retained.

Place new features in the group responsible for their business behavior and
place their routes in the matching app group. Avoid adding group-level model
or ui folders: these segments belong to each feature.
