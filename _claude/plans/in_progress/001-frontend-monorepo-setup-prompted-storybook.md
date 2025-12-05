# Frontend Monorepo Setup - Prompted App & Storybook

**Created:** 2025-12-02
**Status:** Draft
**Related PRD:** N/A
**Refinements:** 1

## Executive Summary

Set up the frontend Turborepo monorepo with two new applications: a React 19 app called "prompted" (`apps/prompted`) using Vite 7 and the React Compiler, and a dedicated Storybook 10 application (`apps/storybook`) for component development. Additionally, update the existing `apps/web` to React 19. This establishes the foundation for a modern, type-safe frontend architecture with an isolated component development environment, Tailwind CSS styling, and Vitest testing.

## Current State

- Turborepo monorepo already initialized at `frontend/`
- Basic structure exists with `apps/` and `packages/` directories
- `pnpm-workspace.yaml` configured for `apps/*` and `packages/*`
- `turbo.json` has basic build/dev/lint tasks
- Existing `apps/web` uses React 18.2.0 with Vite 5.1.4 (needs upgrade)
- Existing `packages/ui` has basic component exports (counter, header) with React 18.2.0
- Shared configs exist: `packages/eslint-config`, `packages/typescript-config`
- No Storybook installation currently exists
- React Compiler not yet integrated

## Assumptions Made

These assumptions were made during plan creation. Challenge any that seem incorrect.

- [x] Using pnpm as package manager (confirmed: `pnpm-workspace.yaml` exists, `packageManager` field in root `package.json`)
- [x] Turborepo 2.6.1 already installed (confirmed from `package.json`)
- [x] The monorepo root is at `frontend/` (confirmed from directory structure)
- [x] React 19.2.0 is the target version (latest stable per [npm](https://www.npmjs.com/package/react))
- [x] Stories will be co-located with components in `packages/ui/src/` (per research recommendations)
- [x] The `apps/prompted` name is final (confirmed by user)
- [x] TypeScript will be used throughout (confirmed by user)
- [x] Vite 7.x is the target version (confirmed by user, latest is 7.2.6)
- [x] The existing `apps/web` will be updated to React 19 as part of this plan (confirmed by user)

## Open Questions & Decisions

### Blocking (must resolve before implementation)

- [x] **React Compiler Babel Plugin** [DECIDED: 2025-12-03]
      The React Compiler requires `babel-plugin-react-compiler`. This means we need to configure Babel alongside Vite. Should we:

  - Option A: Use `@vitejs/plugin-react` with Babel config for React Compiler (simpler but slightly slower builds)
  - Option B: Use `@vitejs/plugin-react-swc` with experimental SWC React Compiler support (faster but less mature)
    > **Decision:** Option A - @vitejs/plugin-react + Babel
    > **Rationale:** Simpler setup, well-documented, recommended for stability with the React Compiler

- [x] **Storybook Version** [DECIDED: 2025-12-03]
      Which Storybook version should we target?

  - Option A: Storybook 8.x (stable, well-documented)
  - Option B: Storybook 9.x if available (latest features but may have breaking changes)

    > **Decision:** Storybook 10.x (latest is 10.1.0)
    > **Rationale:** User requested latest available version. Storybook 10 is ESM-only, 29% smaller install size, includes CSF Factories and improved module mocking. Requires Node.js 20.16+, 22.19+, or 24+

- [x] **Package Naming Convention** [DECIDED: 2025-12-03]
      The existing `apps/web` uses plain name "web" while `packages/ui` uses scoped "@repo/ui". For `apps/prompted`:
  - Option A: Use scoped name `@repo/prompted` (consistent with packages, explicit in imports)
  - Option B: Use plain name `prompted` (consistent with existing apps/web)
    > **Decision:** Plain name "prompted"
    > **Rationale:** Consistent with existing apps/web naming convention

### Non-Blocking (can resolve during implementation)

- [x] **CSS Strategy** [DECIDED: 2025-12-03]
      What CSS approach should `apps/prompted` use?

  > **Decision:** Tailwind CSS
  > **Rationale:** Utility-first CSS framework, popular for rapid development

- [x] **Testing Setup** [DECIDED: 2025-12-03]
      Should Vitest be configured during initial setup or deferred?
  > **Decision:** Yes, set up Vitest now
  > **Rationale:** Vitest 3.2+ is required for Vite 7 compatibility, better to include from the start

## Success Criteria

- [ ] `apps/prompted` runs with `pnpm dev --filter=prompted`
- [ ] `apps/prompted` uses React 19.2.0 with React Compiler enabled
- [ ] `apps/prompted` has Tailwind CSS configured
- [ ] `apps/prompted` has Vitest 3.2+ configured
- [ ] `apps/storybook` runs with `pnpm dev --filter=storybook`
- [ ] Storybook 10.x can render stories from `packages/ui/src/**/*.stories.tsx`
- [ ] `apps/web` upgraded to React 19.2.0 and Vite 7.x
- [ ] `pnpm build` from root successfully builds all apps
- [ ] Story file changes do NOT invalidate production build cache
- [ ] All apps can import from `@repo/ui`

## Implementation Plan

### Phase 1: Create apps/prompted React 19 Application

**Estimated Time:** 2.5 hours

#### Tasks

- [x] Create `apps/prompted` directory structure
- [x] Create `apps/prompted/package.json` with React 19.2.0 and Vite 7.x
- [x] Install React Compiler babel plugin (`babel-plugin-react-compiler`)
- [x] Create `apps/prompted/vite.config.ts` with React Compiler integration
- [x] Create `apps/prompted/tsconfig.json` extending shared config
- [x] Create `apps/prompted/index.html` entry point
- [x] Create `apps/prompted/src/main.tsx` React entry point
- [x] Create `apps/prompted/src/App.tsx` root component
- [x] Add `@repo/ui` as workspace dependency
- [x] Install and configure Tailwind CSS v4
- [x] Install and configure Vitest 3.2+
- [x] Create basic test file to verify Vitest works
- [x] Verify `pnpm dev --filter=prompted` works

#### Test Verification

- [x] App starts without errors on `pnpm dev --filter=prompted`
- [x] React DevTools shows React 19 version
- [x] React Compiler is active (check DevTools or build output)
- [x] Tailwind CSS classes work correctly
- [x] `pnpm test --filter=prompted` runs successfully
- [x] Import from `@repo/ui` works

#### Code Changes Needed

**apps/prompted/package.json:**

```json
{
  "name": "prompted",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --clearScreen false",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint \"src/**/*.ts\"",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "dependencies": {
    "@repo/ui": "workspace:*",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.2",
    "@vitejs/plugin-react": "^4.3.4",
    "babel-plugin-react-compiler": "latest",
    "eslint": "^8.57.0",
    "jsdom": "^25.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "5.5.4",
    "vite": "^7.2.0",
    "vitest": "^3.2.0"
  }
}
```

**apps/prompted/vite.config.ts:**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", {}]],
      },
    }),
    tailwindcss(),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

### Phase 2: Create apps/storybook Application (Storybook 10)

**Estimated Time:** 2 hours

#### Tasks

- [ ] Create `apps/storybook` directory structure
- [ ] Create `apps/storybook/package.json` with Storybook 10.x dependencies
- [ ] Create `apps/storybook/.storybook/main.ts` pointing to `packages/ui/src/**/*.stories.tsx`
- [ ] Create `apps/storybook/.storybook/preview.ts` for global decorators
- [ ] Add `@repo/ui` as workspace dependency
- [ ] Configure Storybook to use `@storybook/react-vite` framework
- [ ] Verify `pnpm dev --filter=storybook` works

#### Test Verification

- [ ] Storybook starts without errors on `pnpm dev --filter=storybook`
- [ ] Storybook UI loads in browser
- [ ] Stories from `packages/ui` are discovered

#### Code Changes Needed

**apps/storybook/package.json:**

```json
{
  "name": "storybook",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "storybook dev -p 6006",
    "build": "storybook build",
    "build:storybook": "storybook build"
  },
  "dependencies": {
    "@repo/ui": "workspace:*",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@storybook/addon-essentials": "^10.1.0",
    "@storybook/addon-interactions": "^10.1.0",
    "@storybook/blocks": "^10.1.0",
    "@storybook/react": "^10.1.0",
    "@storybook/react-vite": "^10.1.0",
    "@storybook/test": "^10.1.0",
    "storybook": "^10.1.0",
    "vite": "^7.2.0"
  }
}
```

**apps/storybook/.storybook/main.ts:**

```typescript
import type { StorybookConfig } from "@storybook/react-vite";
import { join, dirname } from "path";

function getAbsolutePath(value: string) {
  return dirname(require.resolve(join(value, "package.json")));
}

const config: StorybookConfig = {
  stories: ["../../../packages/ui/src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
};

export default config;
```

### Phase 3: Update packages/ui for React 19 and Stories

**Estimated Time:** 1.5 hours

#### Tasks

- [ ] Update `packages/ui/package.json` to use React 19 as peer dependency
- [ ] Create example story file: `packages/ui/src/components/Button/Button.stories.tsx`
- [ ] Ensure component exports are compatible with stories
- [ ] Add Storybook types to devDependencies
- [ ] Verify stories appear in Storybook

#### Test Verification

- [ ] Example story renders in Storybook
- [ ] Component hot-reloads when modified
- [ ] No TypeScript errors in story files

#### Code Changes Needed

**packages/ui/package.json (updated peerDependencies):**

```json
{
  "peerDependencies": {
    "react": "^18.2.0 || ^19.0.0",
    "react-dom": "^18.2.0 || ^19.0.0"
  },
  "devDependencies": {
    "@storybook/react": "^10.1.0"
  }
}
```

**packages/ui/src/components/Button/Button.stories.tsx (example):**

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: "Click me",
  },
};
```

### Phase 4: Update apps/web to React 19 and Vite 7

**Estimated Time:** 1.5 hours

#### Tasks

- [ ] Update `apps/web/package.json` to React 19.2.0 and Vite 7.x
- [ ] Update `apps/web/vite.config.ts` if needed for Vite 7 compatibility
- [ ] Optionally add React Compiler to apps/web (consistent with prompted)
- [ ] Update any deprecated API usage for React 19
- [ ] Verify `pnpm dev --filter=web` works
- [ ] Verify `pnpm build --filter=web` works

#### Test Verification

- [ ] App starts without errors on `pnpm dev --filter=web`
- [ ] React DevTools shows React 19 version
- [ ] Build completes successfully
- [ ] No console errors or warnings

#### Code Changes Needed

**apps/web/package.json (updated):**

```json
{
  "dependencies": {
    "@repo/ui": "workspace:*",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.2",
    "@vitejs/plugin-react": "^4.3.4",
    "babel-plugin-react-compiler": "latest",
    "vite": "^7.2.0"
  }
}
```

### Phase 5: Update turbo.json for Storybook Caching

**Estimated Time:** 30 minutes

#### Tasks

- [ ] Update `turbo.json` to exclude `*.stories.tsx` from production build inputs
- [ ] Add `build:storybook` task with proper outputs configuration
- [ ] Add `test` task for Vitest
- [ ] Test that story changes don't invalidate `apps/prompted` build cache

#### Test Verification

- [ ] Run `pnpm build --filter=prompted`, note cache status
- [ ] Modify a `.stories.tsx` file
- [ ] Run `pnpm build --filter=prompted` again - should be FULL HIT (cached)
- [ ] Run `pnpm test` from root to run all tests

#### Code Changes Needed

**frontend/turbo.json (updated):**

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*", "!**/*.stories.{tsx,jsx,mdx}"],
      "outputs": ["dist/**"]
    },
    "build:storybook": {
      "dependsOn": ["^build"],
      "outputs": ["storybook-static/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", "!**/*.stories.{tsx,jsx,mdx}"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Phase 6: Final Verification and Cleanup

**Estimated Time:** 30 minutes

#### Tasks

- [ ] Run `pnpm install` from monorepo root to update lockfile
- [ ] Verify `pnpm dev` runs all apps concurrently
- [ ] Verify `pnpm build` builds all apps successfully
- [ ] Verify `pnpm test` runs all tests
- [ ] Test that all apps can import and use `@repo/ui` components
- [ ] Ensure no TypeScript errors across the monorepo
- [ ] Verify Node.js version compatibility (20.16+, 22.19+, or 24+ required for Storybook 10)
- [ ] Document any setup notes or gotchas

#### Test Verification

- [ ] All three apps (`web`, `prompted`, `storybook`) start correctly
- [ ] Full build completes without errors
- [ ] All tests pass
- [ ] Storybook shows stories from `packages/ui`

## Rollback Plan

1. Delete `apps/prompted` directory
2. Delete `apps/storybook` directory
3. Revert changes to `apps/web/package.json`
4. Revert changes to `frontend/turbo.json`
5. Revert changes to `packages/ui/package.json`
6. Run `pnpm install` to restore lockfile

## Dependencies

- [ ] pnpm 8.15.6+ installed (confirmed in `packageManager` field)
- [ ] Node.js 20.16+, 22.19+, or 24+ (required for Storybook 10 ESM support)
- [ ] Turborepo 2.6.1 (already installed)
- [ ] React 19.2.0 available on npm (confirmed: [react npm](https://www.npmjs.com/package/react))
- [ ] Storybook 10.x available on npm (confirmed: [storybook npm](https://www.npmjs.com/package/storybook))
- [ ] Vite 7.x available on npm (confirmed: [vite npm](https://www.npmjs.com/package/vite), latest 7.2.6)
- [ ] Vitest 3.2+ available on npm (required for Vite 7 compatibility)

## Success Metrics

(To be filled in after implementation)

- [ ] `apps/prompted` build time
- [ ] `apps/storybook` build time
- [ ] `apps/web` build time (after upgrade)
- [ ] Number of stories visible in Storybook
- [ ] Cache hit rate on subsequent builds
- [ ] DevTools confirms React 19 and Compiler active
- [ ] All Vitest tests passing

---

## Refinement History

**Refinements:**

- 2025-12-03: Resolved 9 questions via interactive Q&A - Updated to Storybook 10.x, Vite 7.x, added Tailwind CSS, Vitest, and apps/web upgrade

---

## Implementation Notes

**Actual Time Tracking:**

- Phase 1: [Estimated: 2.5 hours] (Actual: TBD)
- Phase 2: [Estimated: 2 hours] (Actual: TBD)
- Phase 3: [Estimated: 1.5 hours] (Actual: TBD)
- Phase 4: [Estimated: 1.5 hours] (Actual: TBD)
- Phase 5: [Estimated: 0.5 hours] (Actual: TBD)
- Phase 6: [Estimated: 0.5 hours] (Actual: TBD)

**Key Decisions:**

- **React Compiler:** Using @vitejs/plugin-react + Babel for stability
- **Storybook:** Version 10.x (ESM-only, 29% smaller, requires Node 20.16+)
- **Package naming:** Plain "prompted" (consistent with apps/web)
- **CSS:** Tailwind CSS for utility-first styling
- **Testing:** Vitest 3.2+ (required for Vite 7 compatibility)
- **apps/web:** Will be upgraded to React 19 and Vite 7 as part of this plan

**Assumptions Validated:**

- All assumptions now confirmed

**Lessons Learned:**

- TBD during implementation
