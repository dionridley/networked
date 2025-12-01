# Research Recommendations: Turborepo Storybook Monorepo Configuration

**Date:** 2025-11-28

[← Back to Index](./index.md)

## Executive Summary

Based on the research, your previous approach of `/apps/web`, `/apps/storybook`, and `/packages/ui` is the officially recommended pattern and aligns with best practices. The main decision is whether to keep stories in the Storybook app or co-locate them with components. For a solo developer project that may grow to 1-2 developers, I recommend **Approach B: Stories co-located with components** while keeping Storybook as a dedicated app.

## Recommended Configuration

### Structure
```
apps/
  web/                    # Your main application
    src/
    vite.config.ts
    package.json
  storybook/              # Storybook application (just config)
    .storybook/
      main.ts
      preview.ts
    package.json
packages/
  ui/                     # Component library
    src/
      Button/
        Button.tsx
        Button.stories.tsx   # Stories next to components
        index.ts
      index.ts
    package.json
    tsconfig.json
turbo.json
pnpm-workspace.yaml
```

### Why This Approach

1. **Stories next to components** - Easier to maintain, discover, and keep in sync
2. **Storybook app is lightweight** - Just configuration files, no duplicated component code
3. **Clean package boundaries** - UI library exports components, Storybook app consumes them
4. **Efficient caching** - With proper turbo.json config, story changes don't bust production builds

---

## Immediate Next Steps

### Priority 1: Set Up Turborepo Structure
**Why:** Foundation for everything else
**What:**
1. Initialize Turborepo with `pnpm dlx create-turbo@latest`
2. Create `/apps/web` (Vite React app)
3. Create `/apps/storybook` (Storybook app)
4. Create `/packages/ui` (component library)

### Priority 2: Configure Storybook with Vite
**Why:** Core development tool for your component library
**What:**
1. Install `@storybook/react-vite` in `/apps/storybook`
2. Configure stories path to point to `/packages/ui/src`
3. Set up preview.ts with any global decorators

### Priority 3: Configure turbo.json for Caching
**Why:** Prevents unnecessary rebuilds, speeds up development and CI
**What:**
1. Exclude `*.stories.tsx` from production build inputs
2. Add `build:storybook` task with proper outputs
3. Configure `dev` task for persistent mode

---

## Strategic Recommendations

### Technical Architecture
- **Recommendation:** Use tsup to bundle `/packages/ui` for production
- **Rationale:** tsup produces both ESM and CJS, handles TypeScript declarations, fast builds
- **Trade-offs:** Adds a build step vs. Just-in-Time compilation
- **Alternative:** Use Just-in-Time (no build) if bundle size isn't a concern

### Story Organization
- **Recommendation:** Co-locate stories with components in `/packages/ui/src`
- **Rationale:** Single source of truth, easier maintenance, better DX
- **Configuration Required:** Update `.storybook/main.ts` stories path

### Firebase Deployment
- **Recommendation:** Use Firebase hosting targets for separate web and storybook deploys
- **Rationale:** Clean separation, can deploy independently
- **Alternative:** Only deploy web app if Storybook is just for development

---

## What to Avoid

### Anti-Patterns Identified

1. **Putting Storybook inside `/packages/ui`:**
   Why to avoid: Violates package boundaries, confuses dependency graph, not recommended by Turborepo team.
   What to do instead: Keep Storybook as a separate app that imports from packages.

2. **Using Storybook Composition for small teams:**
   Why to avoid: Adds orchestration complexity, multiple build processes, addon limitations.
   What to do instead: Use single Storybook app until you have 5+ developers or multiple teams.

3. **Not configuring turbo.json story exclusions:**
   Why to avoid: Story file changes will invalidate production build cache.
   What to do instead: Add `"!**/*.stories.{tsx,jsx,mdx}"` to build task inputs.

### Common Pitfalls

- **Circular dependencies** - Ensure packages don't import from apps
- **Missing peer dependencies** - React should be a peer dep in `/packages/ui`
- **Path alias mismatches** - Ensure Vite and tsconfig paths align

---

## Configuration Templates

### pnpm-workspace.yaml
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", "!**/*.stories.{tsx,jsx,mdx}"],
      "outputs": ["dist/**"]
    },
    "build:storybook": {
      "dependsOn": ["^build"],
      "outputs": ["storybook-static/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    }
  }
}
```

### apps/storybook/.storybook/main.ts
```typescript
import type { StorybookConfig } from '@storybook/react-vite';
import { join, dirname } from 'path';

function getAbsolutePath(value: string) {
  return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
  stories: ['../../../packages/ui/src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-interactions'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
};

export default config;
```

### packages/ui/package.json (key fields)
```json
{
  "name": "@repo/ui",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

---

## Success Criteria

- [ ] Can run `pnpm dev --filter=web` to develop main app
- [ ] Can run `pnpm dev --filter=storybook` to develop components in isolation
- [ ] Changing a story file does NOT trigger web app rebuild
- [ ] Can run `pnpm build` from root to build all apps
- [ ] Firebase deploys work for both web and storybook targets

---

## Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|---------------------|
| Storybook version incompatibilities | Medium | Medium | Pin to Storybook 8.x, test upgrades carefully |
| turbo.json misconfiguration | Medium | Medium | Start with official template, test caching behavior |
| Package resolution issues | Low | Medium | Use `getAbsolutePath` helper in Storybook config |

---

## Questions for Further Investigation

- [ ] Should you use CSS Modules, Tailwind, or styled-components for the UI library?
- [ ] Do you need component testing in Storybook (`@storybook/addon-interactions`)?
- [ ] Will you publish the UI package to npm or keep it internal-only?

---

## Next Steps

1. **Review and discuss** these recommendations
2. **Decide on story location** - co-located (recommended) or in Storybook app
3. **Create implementation plan** if approved: `/dr-plan [turborepo setup with storybook]`

## Related Documents

- [Index](./index.md) - Research overview
- [Findings](./findings.md) - Core research findings
- [Resources](./resources.md) - All references and links
