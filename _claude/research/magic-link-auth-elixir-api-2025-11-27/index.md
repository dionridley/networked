# Research: Magic Link Authentication for Elixir API Server

**Date:** 2025-11-27
**Research Question:** How to implement magic link authentication in an Elixir API-only backend (no web pages), with consideration for Ash Framework integration, frontend redirect patterns, and comparison of available approaches.

## Overview

This research explores magic link (passwordless) authentication options for an Elixir API server that doesn't render web pages but instead authenticates users and redirects to frontend applications. The focus is on:

1. **AshAuthentication** - Ash Framework's built-in magic link strategy
2. **Phoenix 1.8 gen.auth** - Phoenix's new default passwordless authentication
3. **Custom Implementation** - Building magic links with Guardian/Phoenix tokens
4. **API-Frontend Flow Patterns** - How to handle the redirect-callback pattern for SPAs

The key challenge is that traditional magic link implementations expect a server-rendered confirmation page, but for API-only backends, we need the magic link to redirect to a frontend application with a token for exchange.

## Structure

This research is organized into multiple documents:

- **[Findings](./findings.md)** - Core research findings and technical analysis
- **[Resources](./resources.md)** - Links, documentation, and references
- **[Recommendations](./recommendations.md)** - Actionable recommendations for implementation
- **[Approach Comparison](./approach-comparison.md)** - Detailed pros/cons of each approach

## Key Takeaways

1. **AshAuthentication Has Magic Link Support**: The `AshAuthentication.Strategy.MagicLink` provides configurable token lifetime, single-use tokens, and registration-via-magic-link. However, it's designed around Phoenix routes and requires customization for API-only use.

2. **Phoenix 1.8 Defaults to Magic Links**: The new `mix phx.gen.auth` generates magic link authentication by default, with password as opt-in. This provides a solid foundation but is web-oriented.

3. **API-Frontend Pattern Requires Redirect Strategy**: For SPA frontends, the magic link should redirect to a frontend URL with a token parameter (e.g., `https://app.example.com/auth/callback?token=xyz`), which the frontend then exchanges via API for a session token.

4. **Security Best Practices Apply**: Token expiration (15-30 minutes), single-use enforcement, cryptographic randomness, and rate limiting are essential regardless of implementation approach.

5. **Custom Approach May Be Simplest for Pure API**: For a truly API-only backend without web pages, a custom implementation using Phoenix tokens or Guardian may be simpler than adapting AshAuthentication's web-oriented flow.
