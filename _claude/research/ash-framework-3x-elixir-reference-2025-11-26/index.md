# Research: Ash Framework 3.x for Elixir Applications

**Date:** 2025-11-26
**Research Question:** How to best use Ash Framework 3.x for Elixir applications, including patterns, approaches, gotchas, resolution handling, and required libraries for an AI agent reference guide.

## Overview

Ash Framework is a declarative, resource-oriented application framework for Elixir that brings a "batteries-included" experience to building web apps, APIs, and services. Version 3.0 was released in May 2024 with major themes of security, simplicity, and developer experience. The current version is 3.10.0.

This research provides a comprehensive reference for AI agents implementing Ash-based applications, covering:
- Core architecture and concepts
- Resource definition patterns
- Action lifecycle and customization
- Policy and authorization system (including SAT solver for "truth" resolution)
- Expression and calculation system
- Extension ecosystem and when to use each
- Common pitfalls and best practices

## Structure

This research is organized into multiple documents:

- **[Findings](./findings.md)** - Core research findings and technical analysis
- **[Resources](./resources.md)** - Links, documentation, and references
- **[Recommendations](./recommendations.md)** - Actionable recommendations for implementation
- **[Patterns and Examples](./patterns-examples.md)** - Code patterns and implementation examples
- **[Extensions Guide](./extensions-guide.md)** - Deep dive into Ash extensions

## Key Takeaways

1. **Domain-Centric Architecture**: Ash 3.x renamed `Ash.Api` to `Ash.Domain` to better reflect the domain-driven design philosophy. Resources are organized into domains, which serve as the interface to your business logic.

2. **SAT Solver for Authorization**: Ash uses a boolean satisfiability solver (picosat_elixir or simple_sat) to evaluate complex policy authorization. This handles "truth resolution" - determining if a set of conditions can be satisfied. Use `simple_sat` as a fallback if picosat_elixir compilation fails.

3. **Expressions are Portable**: Ash expressions can execute in SQL (via AshPostgres) or Elixir, enabling calculations to be sorted/filtered at the database level when possible, with automatic fallback to in-memory computation.

4. **Security by Default**: In 3.x, all fields are private by default, authorization is always checked, and accept lists are required for actions. This "secure by default" approach prevents accidental data exposure.

5. **Extension Ecosystem is Key**: AshPostgres, AshGraphQL, AshJsonApi, AshAuthentication, AshOban, and AshStateMachine extend core functionality. Most production apps will use at least AshPostgres and one API extension.

6. **Actions Define Your API**: Instead of generic CRUD, define domain-specific named actions (`:publish_post`, `:approve_order`) that encapsulate business logic, validation, and authorization.
