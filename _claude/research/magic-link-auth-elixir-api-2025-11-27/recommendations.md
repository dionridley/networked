# Research Recommendations: Magic Link Authentication

**Date:** 2025-11-27

[← Back to Index](./index.md)

## Executive Summary

For an Elixir API-only backend using Ash Framework, I recommend a **hybrid approach**: use AshAuthentication for token infrastructure but implement custom Ash actions for the magic link flow. This provides Ash integration benefits while maintaining full control over the API-first authentication pattern. The magic link should redirect to your frontend application, which then exchanges the token via API for a session/access token.

---

## Recommended Approach

### Primary Recommendation: Hybrid AshAuthentication + Custom Actions

**Why:** Leverages Ash's token management while providing API-first control.

**Architecture:**
```
User → Frontend → API (request magic link)
                ↓
        Email Service (send link to frontend URL)
                ↓
User clicks → Frontend (receives token in URL)
                ↓
        Frontend → API (exchange token for access token)
                ↓
        Frontend (stores token, user authenticated)
```

---

## Immediate Next Steps

### Priority 1: Set Up Token Infrastructure
**Why:** Required foundation for any magic link implementation
**What:**
1. Add AshAuthentication dependencies
2. Create Token resource with AshAuthentication.TokenResource
3. Configure signing secret (environment variable)
4. Add AshAuthentication.Supervisor to application

**Expected Outcome:** Working token generation/verification infrastructure

### Priority 2: Implement Magic Link Actions
**Why:** Core authentication functionality
**What:**
1. Create `request_magic_link` action on User resource
2. Create `verify_magic_link` action that returns user + token
3. Implement token storage for single-use enforcement
4. Set up email sender integration

**Expected Outcome:** Working magic link request and verification flow

### Priority 3: Configure Frontend Redirect
**Why:** Links must work with SPA frontend
**What:**
1. Define frontend callback URL pattern
2. Configure allowed redirect URLs (whitelist)
3. Implement email template with frontend link
4. Test end-to-end flow

**Expected Outcome:** Magic links redirect to frontend correctly

---

## Strategic Recommendations

### Technical Architecture

**Recommendation:** Use Ash resources for User and Token, custom generic actions for auth flow
**Rationale:** Maintains Ash consistency while providing authentication flexibility
**Trade-offs:** More initial setup vs. full framework magic link support
**Implementation Notes:**

```elixir
defmodule MyApp.Accounts.User do
  use Ash.Resource,
    otp_app: :my_app,
    domain: MyApp.Accounts,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshAuthentication]

  authentication do
    tokens do
      enabled? true
      token_resource MyApp.Accounts.Token
      signing_secret fn _, _ ->
        Application.get_env(:my_app, :token_signing_secret)
      end
    end

    # Optional: still use AshAuthentication strategies for future
    # strategies do ... end
  end

  actions do
    # Custom magic link actions
    action :request_magic_link, :ok do
      argument :email, :ci_string, allow_nil?: false

      run fn input, _context ->
        email = input.arguments.email
        token = MyApp.Auth.MagicLink.generate_token(email)
        MyApp.Emails.deliver_magic_link(email, token)
        :ok
      end
    end

    action :verify_magic_link, :map do
      argument :token, :string, allow_nil?: false

      run fn input, context ->
        with {:ok, email} <- MyApp.Auth.MagicLink.verify_and_consume(input.arguments.token),
             {:ok, user} <- get_or_create_user(email, context) do
          access_token = generate_access_token(user)
          {:ok, %{user: user, token: access_token}}
        end
      end
    end
  end
end
```

### Token Security

**Recommendation:** Implement all security best practices from day one
**Rationale:** Security is non-negotiable; retrofitting is expensive

**Required Security Measures:**
1. Token expiration: 15-30 minutes (recommend 15)
2. Single-use tokens: Store hash in DB, mark used
3. Rate limiting: 5 requests per email per minute
4. Secure generation: Use :crypto for randomness
5. HTTPS only: Never send tokens over HTTP

```elixir
defmodule MyApp.Auth.MagicLink do
  @token_ttl_minutes 15

  def generate_token(email) do
    token = :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
    hash = :crypto.hash(:sha256, token) |> Base.encode16(case: :lower)

    %MagicToken{}
    |> MagicToken.changeset(%{
      email: email,
      token_hash: hash,
      expires_at: DateTime.add(DateTime.utc_now(), @token_ttl_minutes, :minute)
    })
    |> Repo.insert!()

    token
  end

  def verify_and_consume(token) do
    hash = :crypto.hash(:sha256, token) |> Base.encode16(case: :lower)
    now = DateTime.utc_now()

    case Repo.get_by(MagicToken, token_hash: hash, used_at: nil) do
      %{expires_at: exp, email: email} = record when exp > now ->
        Repo.update!(MagicToken.changeset(record, %{used_at: now}))
        {:ok, email}

      %{expires_at: _} ->
        {:error, :token_expired}

      nil ->
        {:error, :token_invalid_or_used}
    end
  end
end
```

### Frontend Integration

**Recommendation:** Frontend handles callback, exchanges token via API
**Rationale:** Standard SPA pattern, clean separation of concerns

**Frontend Flow:**
1. User enters email on frontend
2. Frontend calls `POST /api/auth/magic-link` with email
3. API responds 202 Accepted (or 200 OK)
4. Email sent with link: `https://app.example.com/auth/callback?token=xyz`
5. User clicks link → frontend `/auth/callback` page
6. Frontend extracts token from URL
7. Frontend calls `POST /api/auth/verify` with token
8. API responds with `{user, access_token}`
9. Frontend stores token, redirects to dashboard

**Backend Controller:**
```elixir
defmodule MyAppWeb.AuthController do
  use MyAppWeb, :controller

  def request_magic_link(conn, %{"email" => email}) do
    case MyApp.Accounts.request_magic_link(%{email: email}) do
      :ok ->
        conn
        |> put_status(:accepted)
        |> json(%{message: "If an account exists, a magic link has been sent."})

      {:error, _} ->
        # Don't reveal whether email exists
        conn
        |> put_status(:accepted)
        |> json(%{message: "If an account exists, a magic link has been sent."})
    end
  end

  def verify_magic_link(conn, %{"token" => token}) do
    case MyApp.Accounts.verify_magic_link(%{token: token}) do
      {:ok, %{user: user, token: access_token}} ->
        conn
        |> put_status(:ok)
        |> json(%{
          data: %{id: user.id, email: user.email},
          meta: %{token: access_token}
        })

      {:error, :token_expired} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Token has expired"})

      {:error, _} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid token"})
    end
  end
end
```

---

## What to Avoid

### Anti-Patterns

1. **Long-lived magic link tokens**
   - Never exceed 30 minutes
   - 15 minutes is safest

2. **Reusable tokens**
   - Always enforce single-use
   - Store token hash, not raw token

3. **Revealing email existence**
   - Always return same response for valid/invalid emails
   - Prevents enumeration attacks

4. **Hardcoded signing secrets**
   - Use environment variables
   - Never commit to source control

5. **Skipping rate limiting**
   - Implement from day one
   - Prevents abuse and email flooding

### Common Pitfalls

- **Pitfall:** Using AshAuthentication magic_sign_in_route with API-only backend
  - **Prevention:** Create custom controller, don't use generated routes

- **Pitfall:** Frontend not handling expired token gracefully
  - **Prevention:** Show clear error, offer "resend link" option

- **Pitfall:** No cleanup of expired tokens
  - **Prevention:** Add periodic job to delete expired tokens

---

## Suggested Implementation Plan

### Phase 1: Infrastructure Setup
**Goals:**
- [ ] Add ash_authentication dependency
- [ ] Create Token resource
- [ ] Configure signing secret via environment
- [ ] Add supervisor to application

**Key Tasks:**
1. Update mix.exs with dependencies
2. Generate Token resource with migration
3. Configure config/runtime.exs for secrets
4. Update application.ex supervisor

### Phase 2: Core Magic Link Flow
**Goals:**
- [ ] Implement token generation
- [ ] Implement token verification
- [ ] Set up email delivery
- [ ] Create API endpoints

**Key Tasks:**
1. Create MagicToken schema and migration
2. Implement generate_token function
3. Implement verify_and_consume function
4. Create email template
5. Add controller and routes

### Phase 3: Security Hardening
**Goals:**
- [ ] Add rate limiting
- [ ] Implement token cleanup job
- [ ] Add request logging
- [ ] Security testing

**Key Tasks:**
1. Add Hammer for rate limiting
2. Create Oban job for token cleanup
3. Add structured logging
4. Test expired/used token scenarios

### Phase 4: Frontend Integration
**Goals:**
- [ ] Document API for frontend team
- [ ] Test full flow with frontend
- [ ] Handle edge cases

**Key Tasks:**
1. Create API documentation
2. Test callback URL handling
3. Test error scenarios
4. Add monitoring/alerts

---

## Success Criteria

- [ ] Magic link email delivered within 10 seconds
- [ ] Token expires after 15 minutes
- [ ] Token works exactly once
- [ ] Rate limiting prevents > 5 requests/minute/email
- [ ] API returns consistent response regardless of email validity
- [ ] Frontend can complete full auth flow
- [ ] Access token works for subsequent API calls

---

## Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|---------------------|
| Email delivery delays | High | Medium | Use reliable email service (Postmark, Sendgrid) |
| Token brute force | High | Low | Strong random tokens (32+ bytes) |
| Email interception | High | Low | Short expiration, single-use |
| Rate limiting bypass | Medium | Low | Per-IP and per-email limits |
| Token storage breach | Medium | Low | Store only hashed tokens |

---

## Questions for Further Investigation

- [ ] **Mobile deep links:** How to handle magic links in mobile apps?
- [ ] **Token refresh:** Should access tokens be long-lived or require refresh?
- [ ] **Account linking:** How to handle magic link for existing password user?
- [ ] **Audit logging:** What auth events should be logged?

---

## Related Documents

- [Index](./index.md) - Research overview
- [Findings](./findings.md) - Core research findings
- [Resources](./resources.md) - All references and links
- [Approach Comparison](./approach-comparison.md) - Detailed pros/cons

---

## Next Steps

1. **Review findings** - Ensure understanding of options
2. **Discuss with team** - Validate recommended approach
3. **Create PRD if ready**: `/dr-prd [magic link authentication feature]`
4. **Create implementation plan**: `/dr-plan [magic link implementation]`
