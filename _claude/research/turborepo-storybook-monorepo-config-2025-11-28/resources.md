# Research Resources: Turborepo Storybook Monorepo Configuration

**Date:** 2025-11-28

[← Back to Index](./index.md)

## Primary Sources

### Official Documentation
- [Turborepo Storybook Guide](https://turborepo.com/docs/guides/tools/storybook) - Official guide for integrating Storybook with Turborepo, includes turbo.json configuration
- [Turborepo Internal Packages](https://turborepo.com/docs/core-concepts/internal-packages) - Explains Just-in-Time, Compiled, and Publishable package strategies
- [Turborepo Vite Integration](https://turborepo.com/docs/guides/frameworks/vite) - Guide for using Vite with Turborepo
- [Storybook React Vite Framework](https://storybook.js.org/docs/get-started/frameworks/react-vite) - Official Storybook docs for React + Vite setup
- [Storybook Vite Builder](https://storybook.js.org/docs/builders/vite) - Configuration details for Vite builder
- [Storybook Composition](https://storybook.js.org/docs/sharing/storybook-composition) - How to combine multiple Storybooks using refs
- [Firebase Monorepo Support](https://firebase.google.com/docs/app-hosting/monorepos) - Firebase's official guide for monorepo deployments

## Secondary Sources

### Community Discussions
- [GitHub Discussion #6879](https://github.com/vercel/turborepo/discussions/6879) - "Storybook Setup in Mono-Repo: Single or Multiple storybooks?" - Key community discussion with maintainer input
- [Storybook RFC #22521](https://github.com/storybookjs/storybook/discussions/22521) - Proposal for first-class monorepo support in Storybook
- [Firebase Monorepo Discussion](https://github.com/firebase/firebase-tools/discussions/7206) - Community discussion on monorepo challenges

### Technical Articles
- [Building a Design System Monorepo with Turborepo](https://leerob.io/blog/turborepo-design-system-monorepo) - Lee Robinson (Vercel) - Comprehensive guide to design system architecture
- [Compose your Turborepo's Storybooks and deploy them to Vercel](https://medium.com/@Seb_L/compose-your-turborepos-storybooks-and-deploy-them-to-vercel-94befbb78a56) - Seb.L. - Multi-Storybook composition approach
- [Boost Your Development with Turborepo, React Vite, Storybook](https://medium.com/@lwdjohari/boost-your-development-with-this-monorepo-with-turborepo-react-vite-grpc-web-storybook-hmr-2b55f626a493) - Linggawasistha Djohari - Full stack setup guide
- [Storybook Composition](https://www.chromatic.com/blog/storybook-composition/) - Chromatic - In-depth explanation of composition feature
- [Creating a component library with Vite and Storybook](https://www.divotion.com/blog/creating-a-component-library-with-vite-and-storybook) - Divotion - Component library patterns

## Code Examples and Repositories

| Repository | Description | Key Features |
|------------|-------------|--------------|
| [Vercel Design System Template](https://vercel.com/templates/react/turborepo-design-system) | Official Vercel starter | Turborepo + React + tsup + Storybook |
| [turborepo-starter-with-tsup](https://github.com/zsh77/turborepo-starter-with-tsup/) | Community starter | Next.js + Vite apps + tsup packages |
| [vite-shadcn-turborepo](https://github.com/Binabh/vite-shadcn-turborepo) | shadcn/ui integration | React + Vite + shadcn components |
| [turborepo-firebase-example](https://github.com/Hacksore/turborepo-firebase-example) | Firebase integration | Turborepo + Firebase Functions + Hosting |

## Tools and Libraries

| Tool/Library | Purpose | Notes |
|--------------|---------|-------|
| [Turborepo](https://turborepo.com/) | Monorepo build system | High-performance caching, parallel execution |
| [Storybook](https://storybook.js.org/) | UI component workshop | v8 has native Vite support |
| [@storybook/react-vite](https://www.npmjs.com/package/@storybook/react-vite) | Storybook framework | Recommended for React + Vite projects |
| [tsup](https://tsup.egoist.dev/) | TypeScript bundler | Recommended for building packages in Turborepo |
| [pnpm](https://pnpm.io/) | Package manager | Workspace support, efficient disk usage |
| [Vite](https://vitejs.dev/) | Build tool | Fast HMR, native ESM support |

## Example Configuration Files

### turbo.json (with Storybook)
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", "!**/*.stories.{tsx,jsx,mdx}"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "build:storybook": {
      "dependsOn": ["^build"],
      "outputs": ["storybook-static/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### .storybook/main.ts (co-located stories)
```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../../../packages/ui/src/**/*.stories.@(js|jsx|ts|tsx)',
    '../stories/**/*.stories.@(js|jsx|ts|tsx)'
  ],
  framework: '@storybook/react-vite',
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions'
  ],
};

export default config;
```

### firebase.json (multi-target hosting)
```json
{
  "hosting": [
    {
      "target": "web",
      "public": "apps/web/dist",
      "ignore": ["firebase.json", "**/.*"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    },
    {
      "target": "storybook",
      "public": "apps/storybook/storybook-static",
      "ignore": ["firebase.json", "**/.*"]
    }
  ]
}
```

## Related Documents

- [Index](./index.md) - Research overview
- [Findings](./findings.md) - Core research findings
- [Recommendations](./recommendations.md) - What to do next
