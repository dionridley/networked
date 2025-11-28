# Approach Comparison: Magic Link Authentication

**Date:** 2025-11-27

[← Back to Index](./index.md)

This document provides a detailed comparison of three approaches for implementing magic link authentication in an Elixir API-only backend.

---

## Overview Table

| Aspect | AshAuthentication | Phoenix 1.8 gen.auth | Custom Implementation |
|--------|------------------|---------------------|----------------------|
| **Ash Integration** | Native | None | Manual |
| **Complexity** | Medium | Medium | Low-Medium |
| **Flexibility** | Medium | Low | High |
| **Documentation** | Good (web-focused) | Excellent | Community articles |
| **Maintenance** | Framework-maintained | Framework-maintained | Self-maintained |
| **API-Ready** | Needs customization | Needs customization | Built for API |

---

## Approach 1: AshAuthentication Magic Link

### Overview
Use AshAuthentication's built-in `magic_link` strategy with customizations for API-only delivery.

### Pros

1. **Native Ash Integration**
   - Works with Ash resources, domains, and policies
   - Token resource managed by Ash
   - Consistent with rest of Ash application

2. **Feature-Rich**
   - Registration via magic link supported
   - Multi-tenant support via opts
   - Configurable token lifetime
   - Single-use enforcement built-in

3. **Maintained by Community**
   - Active development
   - Security updates included
   - Growing ecosystem

4. **Sender Flexibility**
   - Custom sender function receives user_or_email and token
   - Can construct any URL pattern for email
   - Tenant-aware for multi-tenant apps

### Cons

1. **Web-Oriented Documentation**
   - Most examples assume Phoenix LiveView
   - API-only usage requires piecing together information
   - `require_interaction?` expects web form

2. **Customization Required**
   - Default routes render HTML
   - Need custom plug for JSON responses
   - Must bypass `magic_sign_in_route` expectations

3. **Learning Curve**
   - Requires understanding AshAuthentication architecture
   - Multiple moving parts (Token resource, User resource, strategies)
   - Strategy protocol for programmatic access

4. **Opinionated Flow**
   - Expects specific action names
   - May conflict with custom requirements
   - Less flexible than custom implementation

### Best For
- Applications already using Ash Framework
- Teams that want integrated token management
- Projects that may add web UI later

### Implementation Complexity: 6/10

---

## Approach 2: Phoenix 1.8 gen.auth (Magic Link)

### Overview
Use Phoenix 1.8's new default magic link authentication generator, adapted for API use.

### Pros

1. **Official Phoenix Implementation**
   - Security-audited by Phoenix team
   - Best practices built-in
   - Long-term support guaranteed

2. **Complete Generated Code**
   - All components generated (contexts, schemas, controllers)
   - Token management included
   - Session handling ready

3. **Companion API Guide**
   - Phoenix provides official API authentication guide
   - Shows how to extend gen.auth for API tokens
   - Clear patterns for token creation/verification

4. **Modern Features**
   - "Sudo mode" for sensitive operations
   - Scopes for data access control
   - Email confirmation flow

### Cons

1. **No Ash Integration**
   - Separate from Ash resources
   - Duplicate user management if using Ash
   - Manual policy implementation

2. **Designed for Web Apps**
   - Controllers render HTML by default
   - Session-based authentication
   - Requires significant modification for API-only

3. **Code Generation Approach**
   - Generated code must be maintained
   - Updates require manual merging
   - Less flexible than framework approach

4. **Tight Phoenix Coupling**
   - Assumes Phoenix controllers
   - Uses Phoenix.Token for tokens
   - May not fit non-Phoenix APIs

### Best For
- Pure Phoenix applications (no Ash)
- Teams familiar with gen.auth patterns
- Projects that want official, audited code

### Implementation Complexity: 5/10 (higher if adapting for API)

---

## Approach 3: Custom Implementation

### Overview
Build magic link authentication from scratch using Phoenix.Token or Guardian for token management.

### Pros

1. **Maximum Flexibility**
   - Complete control over flow
   - No framework assumptions
   - Adapts to any architecture

2. **API-First Design**
   - Built specifically for API use
   - No web components to remove
   - Clean, focused implementation

3. **Simple to Understand**
   - No hidden magic
   - Clear token flow
   - Easy to debug and maintain

4. **Technology Choice**
   - Use Phoenix.Token, Guardian, or custom JWT
   - Choose your token storage (Redis, Postgres, ETS)
   - Integrate with existing auth if any

5. **Easy Ash Integration**
   - Create Ash actions that use custom logic
   - Can wrap in Ash resource later
   - No conflicts with framework expectations

### Cons

1. **Security Responsibility**
   - Must implement best practices manually
   - No automatic security updates
   - Easy to make mistakes

2. **More Initial Work**
   - Token generation logic
   - Token storage and revocation
   - Rate limiting setup
   - Email delivery integration

3. **Maintenance Burden**
   - Self-maintained code
   - Security patches are your responsibility
   - Testing must be thorough

4. **No Built-in Features**
   - Registration flow manual
   - No multi-tenant support by default
   - Token refresh not included

### Best For
- API-only backends with simple requirements
- Teams wanting full control
- Projects with existing authentication to extend

### Implementation Complexity: 4/10 (basic) to 7/10 (full-featured)

---

## Decision Matrix

### Choose AshAuthentication If:
- [x] Already using Ash Framework
- [x] Want integrated token management
- [x] May add web UI in future
- [x] Need multi-tenant support
- [x] Want registration via magic link

### Choose Phoenix gen.auth If:
- [x] Not using Ash Framework
- [x] Want official, audited code
- [x] Already familiar with gen.auth
- [x] Building hybrid web + API app
- [x] Want "sudo mode" feature

### Choose Custom Implementation If:
- [x] Need maximum flexibility
- [x] Want API-first design
- [x] Have simple requirements
- [x] Want to understand every line of code
- [x] Have security expertise on team

---

## Hybrid Approach Recommendation

For an Ash Framework application with API-only backend, a **hybrid approach** may be optimal:

1. **Use AshAuthentication for token management**
   - Token resource integration
   - Token generation and validation
   - User resource integration

2. **Create custom actions for API flow**
   - Ash action for `request_magic_link`
   - Ash action for `verify_magic_link`
   - Return token in action result

3. **Build simple API controllers**
   - Thin controller layer calling Ash actions
   - JSON responses only
   - No web routes

**Example:**
```elixir
# Custom Ash actions
actions do
  action :request_magic_link, :ok do
    argument :email, :ci_string, allow_nil?: false

    run fn input, _context ->
      email = input.arguments.email
      token = MyApp.MagicLink.generate_token(email)
      MyApp.Emails.send_magic_link(email, token)
      :ok
    end
  end

  action :verify_magic_link, :struct do
    constraints instance_of: __MODULE__

    argument :token, :string, allow_nil?: false

    run fn input, _context ->
      case MyApp.MagicLink.verify_token(input.arguments.token) do
        {:ok, email} ->
          user = get_or_create_user(email)
          access_token = generate_access_token(user)
          {:ok, %{user: user, token: access_token}}
        error -> error
      end
    end
  end
end
```

This gives you:
- Ash integration for data management
- Full control over authentication flow
- API-first design
- No framework fighting

---

## Related Documents

- [Index](./index.md) - Research overview
- [Findings](./findings.md) - Core research findings
- [Resources](./resources.md) - All references and links
- [Recommendations](./recommendations.md) - What to do next
