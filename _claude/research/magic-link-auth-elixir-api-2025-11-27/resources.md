# Research Resources: Magic Link Authentication

**Date:** 2025-11-27

[← Back to Index](./index.md)

## Primary Sources

### AshAuthentication Documentation
- [AshAuthentication.Strategy.MagicLink](https://hexdocs.pm/ash_authentication/AshAuthentication.Strategy.MagicLink.html) - Official strategy documentation with all configuration options
- [Magic Links Tutorial](https://hexdocs.pm/ash_authentication/magic-links.html) - Step-by-step setup guide for magic links in AshAuthentication
- [AshAuthentication Get Started](https://hexdocs.pm/ash_authentication/get-started.html) - General setup including tokens, strategies, and plugs
- [Authenticating with AshJsonApi](https://hexdocs.pm/ash_json_api/authenticate-with-json-api.html) - Guide for exposing auth endpoints via JSON API

### Phoenix Documentation
- [Phoenix 1.8 Release Notes](https://www.phoenixframework.org/blog/phoenix-1-8-released) - Overview of magic link as new default auth
- [Phoenix API Authentication Guide](https://hexdocs.pm/phoenix/api_authentication.html) - Official guide for API token authentication on top of gen.auth
- [mix phx.gen.auth](https://hexdocs.pm/phoenix/Mix.Tasks.Phx.Gen.Auth.html) - Generator documentation

## Secondary Sources

### Technical Articles
- [ThinkAddict - Passwordless Authentication](https://thinkaddict.com/articles/passwordless-authentication/) - Comprehensive JWT-based magic link implementation for API backends
- [Magic Link Security Best Practices](https://guptadeepak.com/mastering-magic-link-security-a-deep-dive-for-developers/) - Security deep dive covering token generation, expiration, and attack mitigation
- [FusionAuth Magic Links Guide](https://fusionauth.io/articles/identity-basics/magic-links) - Industry overview of magic link patterns
- [Clerk - Email Magic Links](https://clerk.com/blog/magic-links) - How magic links work and implementation considerations
- [WorkOS - Guide to Magic Links](https://workos.com/blog/a-guide-to-magic-links) - Enterprise perspective on magic link auth

### Community Discussions
- [Elixir Forum - Authentication in 2024](https://elixirforum.com/t/how-do-you-build-authentication-in-your-phoenix-project-in-2024/65104) - Community discussion on current auth approaches
- [Elixir Forum - Magic Links for Registration](https://elixirforum.com/t/using-magic-links-for-registration/61166) - Discussion on using magic links for user registration
- [Ash Questions - API Authentication](https://www.answeroverflow.com/m/1114147178198351902) - Community answers about using AshAuthentication without views

### API-Focused Resources
- [Stytch Magic Link Guide](https://stytch.com/docs/guides/magic-links/email-magic-links/api) - Commercial service API patterns
- [Better Auth Magic Link](https://www.better-auth.com/docs/plugins/magic-link) - TypeScript library with good API patterns
- [Supabase Passwordless](https://supabase.com/docs/guides/auth/auth-email-passwordless) - Database-as-service magic link approach

## Code Examples and Repositories

- [bigardone/passwordless-auth](https://github.com/bigardone/passwordless-auth) - Elixir/Phoenix sample project for passwordless socket auth
- [Mike Zornek - Phoenix Magic Link Tour](https://mikezornek.com/posts/2025/5/phoenix-magic-link-authentication/) - Visual walkthrough of Phoenix 1.8 magic link implementation

## Tools and Libraries

### Elixir/Phoenix
| Library | Purpose | Notes |
|---------|---------|-------|
| `ash_authentication` | Full auth framework for Ash | Magic link built-in, v4.13.0+ |
| `ash_authentication_phoenix` | Phoenix integration | Routes, controllers, LiveView |
| `guardian` | JWT-based auth | For custom implementations |
| `phoenix` 1.8+ | Core framework | Magic link in gen.auth |
| `swoosh` | Email delivery | For sending magic links |
| `bamboo` | Email delivery | Alternative to swoosh |
| `hammer` | Rate limiting | Protect magic link endpoints |

### Token Storage
| Option | Purpose | Notes |
|--------|---------|-------|
| PostgreSQL | Persistent storage | Use with Ecto for token table |
| Redis | Fast, ephemeral storage | Good for short-lived tokens |
| ETS | In-memory | Single-node only |

## Security Resources

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) - General authentication security
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/) - Token security considerations

## Frontend Integration

### React/SPA Resources
- [LogRocket - Magic Links in React](https://blog.logrocket.com/authenticating-react-applications-with-magic-links/) - Frontend implementation patterns
- [FreeCodeCamp - Magic Link with React/Flask](https://www.freecodecamp.org/news/set-up-magic-link-authentication-with-react-flask-and-authsignal/) - Full-stack tutorial

## Further Reading

### For Beginners
- Start with [Phoenix API Authentication Guide](https://hexdocs.pm/phoenix/api_authentication.html) for concepts
- Read [ThinkAddict article](https://thinkaddict.com/articles/passwordless-authentication/) for API-specific patterns

### For Ash Framework Users
- [AshAuthentication Get Started](https://hexdocs.pm/ash_authentication/get-started.html) first
- Then [Magic Links Tutorial](https://hexdocs.pm/ash_authentication/magic-links.html)
- Finally [AshJsonApi Authentication](https://hexdocs.pm/ash_json_api/authenticate-with-json-api.html)

### For Security Understanding
- [Magic Link Security Best Practices](https://guptadeepak.com/mastering-magic-link-security-a-deep-dive-for-developers/)
- [FusionAuth Magic Links Guide](https://fusionauth.io/articles/identity-basics/magic-links)

---

## Related Documents

- [Index](./index.md) - Research overview
- [Findings](./findings.md) - Core research findings
- [Recommendations](./recommendations.md) - What to do next
- [Approach Comparison](./approach-comparison.md) - Detailed pros/cons
