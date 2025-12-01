# Research Findings: Turborepo Storybook Monorepo Configuration

**Date:** 2025-11-28

[← Back to Index](./index.md)

## Executive Summary

There are three main approaches to configuring Storybook in a Turborepo monorepo, each with distinct tradeoffs. The official Turborepo guidance strongly recommends keeping Storybook as a separate application in the `/apps` folder rather than embedding it within UI packages. Your previous setup (`/apps/web`, `/apps/storybook`, `/packages/ui`) aligns with this recommendation and is considered best practice.

## Detailed Findings

### Finding 1: The Three Configuration Approaches

**Key Points:**
- **Approach A:** Dedicated Storybook app (`/apps/storybook`) that imports from `/packages/ui`
- **Approach B:** Stories co-located with components (`/packages/ui/src/**/*.stories.tsx`) but Storybook app still lives in `/apps`
- **Approach C:** Multiple Storybooks with Composition (one per app/team, combined via refs)

**Analysis:**

| Aspect | Approach A (Dedicated App) | Approach B (Co-located Stories) | Approach C (Composition) |
|--------|---------------------------|--------------------------------|--------------------------|
| **Complexity** | Low | Medium | High |
| **Setup Time** | Fastest | Moderate | Slowest |
| **Cache Efficiency** | Good | Excellent (with config) | Variable |
| **Team Scaling** | Good for 1-5 devs | Good for 1-5 devs | Best for 5+ devs |
| **Developer Experience** | Simple | Intuitive file organization | Requires orchestration |
| **Deployment** | Single build | Single build | Multiple builds |

**Supporting Evidence:**
- [Turborepo Storybook Guide](https://turborepo.com/docs/guides/tools/storybook) recommends the `/apps/storybook` structure
- [GitHub Discussion #6879](https://github.com/vercel/turborepo/discussions/6879) shows community consensus around dedicated app approach

---

### Finding 2: Official Turborepo Recommendation

**Key Points:**
- "Do not create a Storybook in a UI package. That would make it such that there wouldn't be a clean boundary between your Application Package and Library Package."
- Recommended structure: `mkdir apps/storybook` with stories configured to look at packages
- Install UI package into Storybook: `pnpm add @repo/ui --filter=storybook`

**Analysis:**

The Turborepo team explicitly discourages placing Storybook configuration inside `/packages/ui` because:

1. **Dependency Inversion**: UI packages should be consumed by applications, not contain applications. A Storybook instance is fundamentally an application.

2. **Build Graph Clarity**: Turborepo's caching works best when there's a clear DAG (directed acyclic graph) of dependencies. Apps depend on packages, not the reverse.

3. **Configuration Separation**: Applications (web, storybook) often need app-specific config (vite.config.ts, .storybook/main.ts) that doesn't belong in a library.

**Supporting Evidence:**
- [Turborepo Official Guide](https://turborepo.com/docs/guides/tools/storybook)
- [Vercel Design System Template](https://vercel.com/templates/react/turborepo-design-system) uses `apps/docs` for Storybook

---

### Finding 3: Story File Location Options

**Key Points:**
- Stories can live in `/apps/storybook/stories/` OR alongside components in `/packages/ui/src/`
- Co-locating stories requires configuring `.storybook/main.ts` to look at packages
- With co-located stories, you need extra `turbo.json` config to prevent story changes from busting app caches

**Analysis:**

**Option 1: Stories in Storybook App**
```
apps/
  storybook/
    .storybook/
      main.ts
    stories/
      Button.stories.tsx
packages/
  ui/
    src/
      Button.tsx
```

*Pros:* Simple setup, clear separation
*Cons:* Stories far from component code, harder to keep in sync

**Option 2: Stories Co-located with Components**
```
apps/
  storybook/
    .storybook/
      main.ts  # points to ../../packages/ui/src/**/*.stories.tsx
packages/
  ui/
    src/
      Button.tsx
      Button.stories.tsx
```

*Pros:* Stories next to components, easier to maintain
*Cons:* Requires additional turbo.json config for cache efficiency

**Required turbo.json for co-located stories:**
```json
{
  "tasks": {
    "build": {
      "inputs": ["!**/*.stories.{tsx,jsx,mdx}"]
    },
    "build:storybook": {
      "dependsOn": ["^build:storybook"],
      "outputs": ["storybook-static/**"]
    }
  }
}
```

**Supporting Evidence:**
- [Turborepo Storybook Guide](https://turborepo.com/docs/guides/tools/storybook) - co-location configuration

---

### Finding 4: Storybook Composition for Multi-Team Scenarios

**Key Points:**
- Composition allows combining multiple Storybooks via URLs (`refs`)
- Each team can have their own Storybook with their own config
- Not recommended for solo/small team projects due to complexity

**Analysis:**

Storybook Composition uses refs in `.storybook/main.ts`:
```typescript
refs: {
  'design-system': {
    title: 'Design System',
    url: 'http://localhost:6007'  // or deployed URL
  },
  'feature-app': {
    title: 'Feature App',
    url: 'http://localhost:6008'
  }
}
```

**Important Limitations:**
- Addons don't work normally in composed Storybooks
- Requires orchestrating multiple Storybook instances
- Each composed Storybook must be deployed separately
- Build-time type checking can fail for local refs

**When to Use:**
- Multiple teams working on different parts of the system
- Different tech stacks (e.g., React team + Angular team)
- Enterprise-scale design systems with many consumers

**Supporting Evidence:**
- [Storybook Composition Docs](https://storybook.js.org/docs/sharing/storybook-composition)
- [Chromatic Composition Guide](https://www.chromatic.com/docs/composition/)

---

### Finding 5: Vite + Storybook Integration

**Key Points:**
- Storybook 8 has first-class Vite support via `@storybook/react-vite`
- Configuration can be shared or extended from your main `vite.config.ts`
- Vite builder is significantly faster than webpack

**Analysis:**

Basic Storybook + Vite setup:
```typescript
// apps/storybook/.storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  framework: '@storybook/react-vite',
  addons: ['@storybook/addon-essentials'],
};

export default config;
```

Storybook automatically merges your `vite.config.ts` settings, so shared configuration (aliases, plugins) works out of the box.

**Supporting Evidence:**
- [Storybook React Vite Framework](https://storybook.js.org/docs/get-started/frameworks/react-vite)
- [Storybook Vite Builder](https://storybook.js.org/docs/builders/vite)

---

### Finding 6: Firebase Deployment Considerations

**Key Points:**
- Firebase Hosting works well with static builds from monorepos
- Each app (web, storybook) can deploy to different Firebase targets
- Turborepo caches speed up CI builds significantly

**Analysis:**

For Firebase deployment from a Turborepo:

1. **Build Commands:**
   - Web app: `turbo run build --filter=web` → produces `apps/web/dist/`
   - Storybook: `turbo run build:storybook --filter=storybook` → produces `apps/storybook/storybook-static/`

2. **Firebase Config:**
```json
{
  "hosting": [
    {
      "target": "web",
      "public": "apps/web/dist",
      "ignore": ["firebase.json", "**/.*"]
    },
    {
      "target": "storybook",
      "public": "apps/storybook/storybook-static",
      "ignore": ["firebase.json", "**/.*"]
    }
  ]
}
```

3. **Deploy:** `firebase deploy --only hosting:web` or `firebase deploy --only hosting:storybook`

**Supporting Evidence:**
- [Firebase Monorepo Docs](https://firebase.google.com/docs/app-hosting/monorepos)
- [Turborepo + Firebase Example](https://github.com/Hacksore/turborepo-firebase-example)

---

## Cross-Cutting Themes

1. **Separation of Concerns**: The consistent theme across all approaches is maintaining clear boundaries between library packages (like `/packages/ui`) and application packages (like `/apps/storybook`).

2. **Cache Efficiency**: Proper turbo.json configuration is critical regardless of which approach you choose. Story files should be excluded from production build inputs.

3. **Scale Appropriately**: Start simple (Approach A) and only add complexity (Approach C) when team size or organizational needs demand it.

## Implications

### Technical Implications
- Your current `/apps/storybook` + `/packages/ui` structure is correct
- Consider co-locating stories if you find maintaining them separately tedious
- The Vite + React + pnpm stack has excellent tooling support

### Development Experience Implications
- Single Storybook app is easiest to run and debug
- Stories next to components improve discoverability and maintenance
- Running `turbo dev --filter=storybook` from root is convenient

## Gaps and Limitations

- Limited real-world case studies for Firebase specifically with this exact stack
- Storybook 8 changed some configuration patterns; ensure any tutorials reference v8
- No comprehensive benchmarks comparing approaches at small scale

## Related Documents

- [Index](./index.md) - Research overview
- [Resources](./resources.md) - All references and links
- [Recommendations](./recommendations.md) - What to do next
