# Cyprus Tourism SaaS Platform - Monorepo Structure

We will use a **Turborepo** monorepo structure. This allows us to share UI components, database schemas, and utility functions across the mobile app, web apps, and backend API seamlessly.

```text
/cyprus-tourism-platform
├── apps/
│   ├── customer-app/       # React Native (Expo) mobile app for tourists
│   ├── merchant-web/       # Next.js web app for merchants (Tablet/Desktop optimized)
│   └── admin-dashboard/    # Next.js web app for superadmins
├── packages/
│   ├── database/           # Prisma schema, migrations, and generated client (Shared)
│   ├── ui/                 # Shared UI components (shadcn/ui, Tailwind)
│   ├── config/             # Shared configurations (ESLint, Prettier, TSConfig)
│   └── utils/              # Shared utility functions, types, and constants
├── services/
│   └── api-server/         # Node.js/Express backend API
│       ├── src/
│       │   ├── controllers/ # Route handlers
│       │   ├── middlewares/ # Auth, validation, error handling
│       │   ├── routes/      # Express route definitions
│       │   ├── services/    # Stripe Connect, Mock Car Rental API, QR Generation
│       │   └── index.ts     # Entry point
│       ├── .env
│       └── package.json
├── package.json            # Monorepo root package.json (Yarn/npm Workspaces)
├── turbo.json              # Turborepo configuration
└── README.md
```

## Key Architectural Decisions:
1. **`packages/database`**: By keeping Prisma in a shared package, the `api-server`, `merchant-web`, and `admin-dashboard` can all import the exact same generated Prisma client and types.
2. **`packages/ui`**: Contains your Tailwind config and shadcn/ui components. Both Next.js apps (`merchant-web` and `admin-dashboard`) will consume these to maintain a consistent 2026 glassmorphism/neumorphic design system.
3. **`services/api-server`**: Centralized Express API that the Expo mobile app and Next.js apps will communicate with. It will handle the Mock Car Rental API logic and Stripe Connect payment routing.
