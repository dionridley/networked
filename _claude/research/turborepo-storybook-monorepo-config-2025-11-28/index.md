# Research: Turborepo Storybook Monorepo Configuration

**Date:** 2025-11-28
**Research Question:** What are the pros and cons of different approaches to structuring Storybook in a Turborepo monorepo with React, Vite, and pnpm? Should Storybook be in `/apps/storybook` or are there better configurations?

## Overview

This research explores the various approaches to integrating Storybook into a Turborepo monorepo when using React, Vite, and pnpm. The analysis compares placing Storybook as a separate app (`/apps/storybook`) versus alternative configurations, including co-locating stories with components and using Storybook Composition.

## Structure

This research is organized into multiple documents:

- **[Findings](./findings.md)** - Core research findings comparing different approaches
- **[Resources](./resources.md)** - Links, documentation, and references
- **[Recommendations](./recommendations.md)** - Actionable recommendations for your setup

## Key Takeaways

1. **The `/apps/storybook` approach is the officially recommended pattern** - Turborepo explicitly recommends keeping Storybook in the apps folder, not inside UI packages, to maintain clean boundaries between applications and libraries.

2. **Three viable approaches exist**, each with distinct tradeoffs:
   - Single Storybook app in `/apps/storybook` (recommended for most cases)
   - Stories co-located with components in `/packages/ui` but Storybook app still in `/apps`
   - Multiple Storybooks with Composition (for larger orgs with multiple teams)

3. **Your existing setup is aligned with best practices** - Having `/apps/web`, `/apps/storybook`, and `/packages/ui` follows the recommended Turborepo structure.

4. **For Firebase deployment**, the monorepo structure works well since you'll just be deploying static builds (`storybook-static/` and your web app's `/dist`).

5. **Vite is an excellent choice** for both the web app and Storybook builder, as Storybook 8 has native Vite support via `@storybook/react-vite`.
