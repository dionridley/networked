# Research Findings: Magic Link Authentication for Elixir API Server

**Date:** 2025-11-27

[← Back to Index](./index.md)

## Executive Summary

Magic link authentication for an Elixir API-only backend can be implemented through three main approaches: AshAuthentication's built-in strategy, Phoenix 1.8's gen.auth, or a custom implementation. Each has trade-offs around Ash integration, complexity, and flexibility. For API-only backends serving SPA frontends, the key challenge is adapting the typical web-based confirmation flow to a redirect-to-frontend pattern where the frontend exchanges the magic link token for an API access token.

---

## Detailed Findings

### Finding 1: AshAuthentication Magic Link Strategy

**Key Points:**
- Built-in `magic_link` strategy in AshAuthentication (v4.13.0+)
- Configurable token lifetime, single-use, registration via magic link
- Requires implementation of a "sender" module for email delivery
- Designed around Phoenix routes with `magic_sign_in_route`
- Can be used programmatically via `AshAuthentication.Strategy` protocol

**Analysis:**
AshAuthentication provides a complete magic link implementation that integrates well with Ash resources. The strategy auto-generates request and sign-in actions. However, it expects web routes and a confirmation page by default. For API-only use, you need to:

1. Create a custom plug that returns JSON instead of HTML
2. Customize the sign-in flow to redirect to a frontend URL
3. Use the Strategy protocol for programmatic access

**Configuration Example:**
```elixir
defmodule MyApp.Accounts.User do
  use Ash.Resource,
    extensions: [AshAuthentication]

  authentication do
    tokens do
      enabled? true
      token_resource MyApp.Accounts.Token
      signing_secret fn _, _ ->
        Application.get_env(:my_app, :token_signing_secret)
      end
    end

    strategies do
      magic_link do
        identity_field :email
        token_lifetime {30, :minutes}
        single_use_token? true
        registration_enabled? true  # Allow signup via magic link

        sender fn user_or_email, token, _opts ->
          # Build URL that redirects to frontend
          magic_url = "#{frontend_url()}/auth/magic?token=#{token}"
          MyApp.Emails.send_magic_link(user_or_email, magic_url)
        end
      end
    end
  end
end
```

**Pros:**
- Full Ash integration (policies, resources, domains)
- Token management built-in
- Registration via magic link supported
- Multi-tenant support via opts

**Cons:**
- Requires customization for API-only use
- `require_interaction?` feature expects web form
- Documentation focused on Phoenix views

**Supporting Evidence:**
- [AshAuthentication.Strategy.MagicLink docs](https://hexdocs.pm/ash_authentication/AshAuthentication.Strategy.MagicLink.html)
- [Magic Links Tutorial](https://hexdocs.pm/ash_authentication/magic-links.html)

---

### Finding 2: Phoenix 1.8 Magic Link (gen.auth)

**Key Points:**
- Phoenix 1.8 defaults to magic link for authentication
- `mix phx.gen.auth` generates passwordless flow
- Password authentication is opt-in via settings
- Built on Phoenix.Token for secure token generation
- Includes "sudo mode" for sensitive operations

**Analysis:**
Phoenix 1.8's approach provides a complete, security-audited implementation. The generated code includes:

- Token creation with expiration
- Email delivery setup
- Confirmation page (to prevent automated link clicking)
- Session management

However, this is designed for server-rendered Phoenix apps. For API-only use, you would need to:

1. Modify the confirmation controller to return JSON
2. Add API token generation after magic link validation
3. Handle the redirect-to-frontend pattern

**Key Security Feature:**
```
The default implementation raises whenever a user tries to log in
for the first time by magic link and there is a password set.
```

This prevents account takeover if someone adds magic link to an existing password-based app.

**Pros:**
- Official Phoenix implementation
- Security-audited code
- Includes API authentication guide as companion
- "Sudo mode" for sensitive operations

**Cons:**
- Designed for web apps, not API-only
- Requires significant modification for API use
- No direct Ash integration

**Supporting Evidence:**
- [Phoenix 1.8 Release Notes](https://www.phoenixframework.org/blog/phoenix-1-8-released)
- [Phoenix API Authentication Guide](https://hexdocs.pm/phoenix/api_authentication.html)

---

### Finding 3: Custom Implementation Pattern for API-Only

**Key Points:**
- Build magic links using Guardian or Phoenix.Token
- JWT-based with fingerprinting for security
- Two-phase flow: request → email → redeem → access token
- Well-documented patterns from community

**Analysis:**
A custom implementation provides maximum flexibility for API-only backends. The typical flow:

1. **Request Phase** (`POST /api/auth/magic-link`)
   - User submits email
   - Server generates short-lived token (JWT with email claim)
   - Server sends email with link to frontend
   - Returns `202 Accepted`

2. **Redemption Phase** (`POST /api/auth/verify-magic-link`)
   - Frontend receives token from URL params
   - Frontend sends token to API
   - API validates token, creates/finds user
   - API returns access token for subsequent requests

**Implementation Sketch:**
```elixir
defmodule MyApp.Auth.MagicLink do
  @token_max_age 60 * 15  # 15 minutes

  def generate_token(email) do
    Phoenix.Token.sign(MyAppWeb.Endpoint, "magic_link", %{
      email: email,
      issued_at: System.system_time(:second)
    })
  end

  def verify_token(token) do
    case Phoenix.Token.verify(MyAppWeb.Endpoint, "magic_link", token,
           max_age: @token_max_age) do
      {:ok, %{email: email}} ->
        # Mark token as used (store in Redis/DB)
        {:ok, email}
      {:error, :expired} ->
        {:error, :token_expired}
      {:error, :invalid} ->
        {:error, :token_invalid}
    end
  end
end
```

**Pros:**
- Maximum flexibility
- No framework assumptions
- Can be simpler for API-only use
- Easy to understand and maintain

**Cons:**
- Must implement security best practices manually
- No built-in token revocation (need Redis/DB)
- No Ash integration without additional work

**Supporting Evidence:**
- [ThinkAddict Passwordless Guide](https://thinkaddict.com/articles/passwordless-authentication/)

---

### Finding 4: API-Frontend Redirect Flow Pattern

**Key Points:**
- Magic link URL points to frontend, not backend
- Token passed as query parameter
- Frontend exchanges token via API call
- Requires CORS configuration for API
- Can include "callback URL" for different scenarios

**Analysis:**
For SPA frontends (React, Vue, etc.), the magic link should redirect to the frontend application, which then handles token exchange. This is the industry-standard pattern used by Auth0, Stytch, WorkOS, and others.

**Flow Diagram:**
```
1. User enters email on frontend
2. Frontend calls: POST /api/auth/request-magic-link
3. Backend sends email with link: https://app.example.com/auth/magic?token=xyz
4. User clicks link → arrives at frontend /auth/magic page
5. Frontend extracts token from URL
6. Frontend calls: POST /api/auth/verify-magic-link {token}
7. Backend validates, returns: {access_token, user}
8. Frontend stores access_token, redirects to dashboard
```

**Email Link Construction:**
```elixir
def send_magic_link_email(email, token) do
  # Link goes to FRONTEND, not backend
  frontend_base = Application.get_env(:my_app, :frontend_url)
  magic_url = "#{frontend_base}/auth/callback?token=#{token}"

  MyApp.Mailer.deliver_magic_link(email, magic_url)
end
```

**Security Considerations:**
- Validate `callbackURL` against whitelist to prevent open redirect
- Consider device/browser fingerprinting
- Token should be single-use (store used tokens)
- Short expiration (15-30 minutes)

**Pros:**
- Standard pattern used by auth services
- Works with any frontend framework
- Clear separation of concerns
- User stays in their app context

**Cons:**
- Requires frontend code for token exchange
- Must configure CORS properly
- Token exposed in URL (but short-lived)

**Supporting Evidence:**
- [Better Auth Magic Link docs](https://www.better-auth.com/docs/plugins/magic-link)
- [Stytch Magic Link Guide](https://stytch.com/docs/guides/magic-links/email-magic-links/api)

---

### Finding 5: Security Best Practices for Magic Links

**Key Points:**
- Token expiration: 15-30 minutes (15 most common)
- Single-use enforcement required
- Cryptographically secure token generation
- Rate limiting on request endpoint
- Hash tokens in database storage

**Analysis:**
Magic link security requires careful implementation. Key risks include:

1. **Email Interception**: Compromised email = compromised account
2. **Token Reuse**: Without single-use, intercepted tokens can be replayed
3. **Timing Attacks**: Long-lived tokens increase attack window
4. **URL Exposure**: Tokens in URLs appear in logs, browser history

**Mitigation Strategies:**

```elixir
defmodule MyApp.Auth.TokenStore do
  # Store hashed tokens to prevent DB breach exposure
  def store_token(email, token) do
    hashed = :crypto.hash(:sha256, token) |> Base.encode16()
    Repo.insert!(%MagicToken{
      email: email,
      token_hash: hashed,
      expires_at: DateTime.add(DateTime.utc_now(), 15, :minute),
      used_at: nil
    })
  end

  def verify_and_consume(token) do
    hashed = :crypto.hash(:sha256, token) |> Base.encode16()

    case Repo.get_by(MagicToken, token_hash: hashed, used_at: nil) do
      nil -> {:error, :invalid_or_used}
      %{expires_at: exp} = record when exp > DateTime.utc_now() ->
        Repo.update!(record, %{used_at: DateTime.utc_now()})
        {:ok, record.email}
      _ -> {:error, :expired}
    end
  end
end
```

**Rate Limiting:**
```elixir
# Limit magic link requests per email
plug Hammer,
  rate_limit: {"magic_link", 60_000, 5},  # 5 per minute
  by: {:param, "email"}
```

**Supporting Evidence:**
- [Magic Link Security Best Practices](https://guptadeepak.com/mastering-magic-link-security-a-deep-dive-for-developers/)
- [FusionAuth Magic Links Guide](https://fusionauth.io/articles/identity-basics/magic-links)

---

### Finding 6: AshAuthentication with AshJsonApi Integration

**Key Points:**
- AshJsonApi can expose authentication actions as API endpoints
- Token returned in response metadata
- Requires policy bypass for unauthenticated access
- Manual route configuration needed

**Analysis:**
For Ash-based APIs, the recommended approach is to expose authentication actions through AshJsonApi. This provides:

1. Consistent API structure
2. Proper error handling
3. Token in response metadata

**Configuration:**
```elixir
defmodule MyApp.Accounts.User do
  use Ash.Resource,
    extensions: [AshAuthentication, AshJsonApi.Resource]

  json_api do
    type "users"

    routes do
      # Magic link request
      post :request_magic_link do
        route "/auth/magic-link"
      end

      # Magic link verification - returns token in meta
      post :sign_in_with_magic_link do
        route "/auth/magic-link/verify"

        metadata fn _subject, user, _request ->
          %{token: user.__metadata__.token}
        end
      end
    end
  end

  policies do
    # Allow unauthenticated access to auth endpoints
    bypass action(:request_magic_link) do
      authorize_if always()
    end
    bypass action(:sign_in_with_magic_link) do
      authorize_if always()
    end
  end
end
```

**Pros:**
- Native Ash integration
- Consistent with rest of API
- Policies control access

**Cons:**
- More complex setup
- Requires understanding of AshJsonApi
- May need custom action for redirect flow

**Supporting Evidence:**
- [Authenticating with AshJsonApi](https://hexdocs.pm/ash_json_api/authenticate-with-json-api.html)

---

## Cross-Cutting Themes

1. **Web vs API Orientation**: All major Elixir solutions (AshAuthentication, Phoenix gen.auth) are web-oriented and require adaptation for API-only use.

2. **Token Exchange Pattern**: The industry standard for SPAs is redirect-to-frontend + API token exchange, not server-side session creation.

3. **Security is Non-Negotiable**: Token expiration, single-use, and secure generation must be implemented regardless of approach.

---

## Implications

### Technical Implications
- Choose approach based on existing stack (Ash vs vanilla Phoenix)
- Plan for both request and verification API endpoints
- Implement token storage for single-use enforcement
- Configure CORS for frontend communication

### Architecture Implications
- Magic link flow requires email delivery service
- Frontend must handle callback URL and token exchange
- Consider token refresh strategy for long sessions

### Security Implications
- Short-lived tokens (15-30 min) are industry standard
- Single-use tokens require storage mechanism
- Rate limiting prevents abuse
- Token hashing protects against DB breaches

---

## Gaps and Limitations

- **AshAuthentication API Docs**: Limited documentation for API-only usage
- **Frontend Integration**: Most examples assume server-rendered apps
- **Mobile Deep Links**: Research didn't cover mobile app magic link handling
- **Token Refresh**: Magic links typically create session, not long-term tokens

---

## Related Documents

- [Index](./index.md) - Research overview
- [Resources](./resources.md) - All references and links
- [Recommendations](./recommendations.md) - What to do next
- [Approach Comparison](./approach-comparison.md) - Detailed pros/cons
