# Research Resources: Ash Framework 3.x

**Date:** 2025-11-26

[← Back to Index](./index.md)

## Primary Sources

### Official Documentation
- [Ash HexDocs (v3.10.0)](https://hexdocs.pm/ash/) - Official API documentation and guides
- [Ash HQ Website](https://www.ash-hq.org/) - Official website with getting started guide and resources
- [GitHub Repository](https://github.com/ash-project/ash) - Source code, issues, and discussions

### Core Documentation Pages
- [What is Ash?](https://hexdocs.pm/ash/what-is-ash.html) - Framework overview and philosophy
- [Get Started](https://hexdocs.pm/ash/get-started.html) - Installation and first steps
- [Actions](https://hexdocs.pm/ash/actions.html) - Action types and customization
- [Policies](https://hexdocs.pm/ash/policies.html) - Authorization and access control
- [Expressions](https://hexdocs.pm/ash/expressions.html) - Expression syntax and built-in functions
- [Calculations](https://hexdocs.pm/ash/calculations.html) - Computed attributes
- [Aggregates](https://hexdocs.pm/ash/aggregates.html) - Summary data over relationships
- [Relationships](https://hexdocs.pm/ash/relationships.html) - Defining and managing relationships
- [Code Interfaces](https://hexdocs.pm/ash/code-interfaces.html) - Generating functions from actions
- [Project Structure](https://hexdocs.pm/ash/project-structure.html) - Recommended organization

### Upgrade Guide
- [Upgrading to 3.0](https://github.com/ash-project/ash/blob/main/documentation/topics/development/upgrading-to-3.0.md) - Breaking changes and migration steps

## Extension Documentation

### Data Layers
- [AshPostgres](https://hexdocs.pm/ash_postgres/) - PostgreSQL data layer
- [AshSqlite](https://hexdocs.pm/ash_sqlite/) - SQLite data layer

### API Extensions
- [AshGraphQL](https://hexdocs.pm/ash_graphql/) - GraphQL API generation
- [AshJsonApi](https://hexdocs.pm/ash_json_api/) - JSON:API specification implementation

### Authentication & Authorization
- [AshAuthentication](https://hexdocs.pm/ash_authentication/) - User authentication strategies
- [AshAuthenticationPhoenix](https://hexdocs.pm/ash_authentication_phoenix/) - Phoenix integration for auth

### Business Logic Extensions
- [AshStateMachine](https://hexdocs.pm/ash_state_machine/) - State machine support
- [AshOban](https://hexdocs.pm/ash_oban/) - Background job integration
- [AshArchival](https://hexdocs.pm/ash_archival/) - Soft delete/archival
- [AshPaperTrail](https://hexdocs.pm/ash_paper_trail/) - Audit logging
- [AshCloak](https://hexdocs.pm/ash_cloak/) - Field encryption

### UI & Admin
- [AshPhoenix](https://hexdocs.pm/ash_phoenix/) - Phoenix framework integration
- [AshAdmin](https://hexdocs.pm/ash_admin/) - Auto-generated admin interface

## Secondary Sources

### Books
- [Ash Framework (Pragmatic Programmers)](https://pragprog.com/titles/ldash/ash-framework/) - By Rebecca Le and Zach Daniel (creator of Ash) - The definitive guide with insider knowledge and best practices

### Beginner Guides
- [Elixir, Phoenix and Ash Beginner's Guide](https://elixir-phoenix-ash.com/ash/) - Beginner-friendly tutorials and explanations
- [Getting Started with Ash Framework (Alembic)](https://alembic.com.au/blog/getting-started-with-ash-framework) - Practical introduction
- [Getting Started with Ash Framework (Optimum BH)](https://optimum.ba/blog/getting-started-with-ash-framework-in-elixir) - Step-by-step guide

### Technical Articles
- [Ash Framework 3.0 Enhancements (Elixir Merge)](https://elixirmerge.com/p/understanding-ash-framework-3-0-enhancements-and-ecosystem) - Overview of 3.0 changes
- [Ash Framework: Authorization and Monoids](https://www.joekoski.com/blog/2025/10/13/ash-authorization-1.html) - Deep dive into authorization system
- [Understanding Validation in Ash Framework](https://elixirmerge.com/p/understanding-validation-in-the-ash-framework) - Validation patterns

### Community Discussions
- [Ash Framework 3.0 Announcement (Elixir Forum)](https://elixirforum.com/t/ash-framework-3-0/63488) - Release discussion and community feedback
- [Ash Framework: My Misconceptions](https://elixirforum.com/t/ash-framework-my-misconceptions/72763) - Common misunderstandings
- [Ash Calculations Discussion](https://elixirforum.com/t/ash-framework-calculations/73452) - Calculation patterns

## Code Examples and Repositories

- [Ash Tutorial (Official)](https://github.com/ash-project/ash_tutorial) - Official tutorial repository
- [Ash Real World](https://github.com/team-alembic/ash_realworld) - Real-world example application
- [CodeSandbox Examples](https://codesandbox.io/examples/package/ash) - Interactive examples

## Tools and Libraries

### Required Dependencies

| Library | Purpose | Notes |
|---------|---------|-------|
| `ash` | Core framework | `{:ash, "~> 3.0"}` |
| `picosat_elixir` | SAT solver (NIF) | Optional, faster but requires C compiler |
| `simple_sat` | SAT solver (pure Elixir) | Fallback if picosat fails to compile |

### Common Extensions

| Extension | Purpose | When to Use |
|-----------|---------|-------------|
| `ash_postgres` | PostgreSQL data layer | Most production apps |
| `ash_graphql` | GraphQL API | When building GraphQL APIs |
| `ash_json_api` | JSON:API | When building REST APIs |
| `ash_authentication` | User auth | When users need to log in |
| `ash_oban` | Background jobs | When using Oban for jobs |
| `ash_state_machine` | State machines | For workflow/status management |
| `ash_phoenix` | Phoenix integration | When using Phoenix |
| `ash_admin` | Admin panel | Quick admin interface |

### Development Tools

| Tool | Purpose |
|------|---------|
| Igniter | Code generation and project setup |
| AshTypescript | TypeScript type generation |
| OpentelemetryAsh | Telemetry tracing |

## Video Resources

- [Gig City Elixir 2024](https://www.youtube.com/watch?v=...) - Ash 3.0 launch presentation
- [Elixir Phoenix Ash YouTube Channel](https://www.youtube.com/channel/...) - Tutorial videos

## Community Channels

- [Discord (Ash Framework)](https://discord.gg/ash) - Active community chat
- [Elixir Forum (Ash Category)](https://elixirforum.com/c/ash-framework/51) - Discussion forum
- [Ash Weekly Newsletter](https://ash-hq.org/newsletter) - Updates and insights

## Further Reading

### For Beginners
- Start with the official [Get Started Guide](https://hexdocs.pm/ash/get-started.html)
- Follow the Livebook tutorial included in the repository
- Read the [Beginner's Guide](https://elixir-phoenix-ash.com/ash/)

### For Intermediate Users
- Study the [Actions](https://hexdocs.pm/ash/actions.html) documentation deeply
- Understand [Policies](https://hexdocs.pm/ash/policies.html) and authorization
- Learn [Expression](https://hexdocs.pm/ash/expressions.html) syntax

### For Advanced Understanding
- Read the [Pragmatic Programmers book](https://pragprog.com/titles/ldash/ash-framework/)
- Study extension source code on GitHub
- Explore [Writing Extensions](https://hexdocs.pm/ash/writing-extensions.html)

---

## Related Documents

- [Index](./index.md) - Research overview
- [Findings](./findings.md) - Core research findings
- [Recommendations](./recommendations.md) - What to do next
- [Patterns and Examples](./patterns-examples.md) - Code patterns
- [Extensions Guide](./extensions-guide.md) - Extension deep dive
