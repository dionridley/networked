# Research Recommendations: Ash Framework 3.x

**Date:** 2025-11-26

[← Back to Index](./index.md)

## Executive Summary

Ash Framework 3.x is recommended for building Elixir applications that require consistent domain modeling, automatic API generation, and robust authorization. The framework excels in medium-to-large applications where the initial setup investment pays off through reduced boilerplate and consistent patterns. Key recommendations include using simple_sat for SAT solver reliability, starting with domain-specific actions rather than generic CRUD, and adopting extensions incrementally based on actual needs.

---

## Immediate Next Steps

### Priority 1: Set Up Dependencies Correctly
**Why:** SAT solver issues are the most common early stumbling block
**What:**
1. Add Ash to mix.exs: `{:ash, "~> 3.0"}`
2. Add SAT solver - prefer simple_sat for reliability: `{:simple_sat, "~> 0.1"}`
3. Add AshPostgres if using PostgreSQL: `{:ash_postgres, "~> 2.0"}`
4. Configure domains in `config/config.exs`

**Expected Outcome:** Clean compilation with no SAT solver errors

### Priority 2: Define Your First Domain and Resource
**Why:** Understanding the domain→resource→action hierarchy is foundational
**What:**
1. Create a domain module (e.g., `MyApp.Accounts`)
2. Create a resource within that domain (e.g., `MyApp.Accounts.User`)
3. Define attributes with explicit `public?: true` where needed
4. Define actions with explicit `accept` lists
5. Test via IEx using code interface functions

**Expected Outcome:** Working resource with CRUD operations

### Priority 3: Implement Authorization Policies
**Why:** Security-by-default means policies are required for protected resources
**What:**
1. Add `authorizers: [Ash.Policy.Authorizer]` to resource
2. Define policies for each action type
3. Use `bypass` for admin access
4. Use `authorize_if expr(...)` for expression-based checks
5. Test with different actors

**Expected Outcome:** Properly secured resources with clear authorization rules

---

## Strategic Recommendations

### Technical Architecture

**Recommendation:** Organize by domain, not by technical layer
**Rationale:** Ash's strength is domain-driven design; organizing by domain (Accounts, Blog, Orders) rather than by layer (models, services, controllers) aligns with the framework's philosophy
**Trade-offs:** May require mindset shift for teams used to MVC patterns
**Implementation Notes:**
```
lib/my_app/
├── accounts/
│   ├── accounts.ex (domain)
│   ├── user.ex (resource)
│   └── user/
│       └── changes/
├── blog/
│   ├── blog.ex (domain)
│   ├── post.ex (resource)
│   └── comment.ex (resource)
```

### Technology Selection

**Recommendation:** Use AshPostgres for production, simple_sat for SAT solving
**Rationale:** AshPostgres enables expression portability to SQL; simple_sat avoids compilation issues across environments
**Alternatives Considered:**
- `picosat_elixir`: Faster but requires C compiler, fails on some systems
- Other data layers: AshSqlite for embedded, in-memory for testing
**Risks:** simple_sat is slower for extremely complex policies (rarely an issue in practice)

### Development Approach

**Recommendation:** Start with named actions, avoid generic CRUD
**Rationale:** Named actions (`:publish_post`, `:approve_order`) better express domain intent than generic `:update`
**Prerequisites:** Clear understanding of domain operations before coding

---

## What to Avoid

### Anti-Patterns Identified

1. **Using `case` in expressions:** Ash expressions don't support `case`; always use `cond`
   ```elixir
   # Wrong
   calculate :status_label, :string, expr(case status do :draft -> "Draft" end)

   # Correct
   calculate :status_label, :string, expr(
     cond do
       status == :draft -> "Draft"
       status == :published -> "Published"
       true -> "Unknown"
     end
   )
   ```

2. **Forgetting accept lists:** In 3.x, actions don't auto-accept attributes
   ```elixir
   # Wrong - will accept nothing
   create :create

   # Correct
   create :create do
     accept [:title, :body, :author_id]
   end
   ```

3. **Putting business logic in controllers:** Keep domain logic in actions/changes
   ```elixir
   # Wrong (in controller)
   def publish(conn, %{"id" => id}) do
     post = Repo.get!(Post, id)
     if post.status == :draft do
       Repo.update!(post, %{status: :published, published_at: DateTime.utc_now()})
     end
   end

   # Correct (in resource)
   update :publish do
     validate attribute_equals(:status, :draft)
     change set_attribute(:status, :published)
     change set_attribute(:published_at, &DateTime.utc_now/0)
   end
   ```

4. **Not using expression portability:** Load calculations/aggregates in queries, not after
   ```elixir
   # Inefficient - loads all posts, then computes
   posts = Ash.read!(Post)
   Enum.map(posts, fn p -> String.length(p.title) end)

   # Efficient - computes in SQL
   Post
   |> Ash.Query.load(:title_length)  # calculation using expr(string_length(title))
   |> Ash.read!()
   ```

### Common Pitfalls

- **Nil poisoning in expressions:** Remember that `nil and true` = `nil` (SQL semantics)
  - **Prevention:** Use `is_nil/1` checks explicitly when nil is possible

- **Forgetting domain context:** Changesets/queries now require domain
  - **Prevention:** Always pass `domain:` option or use code interfaces

- **Over-configuring initially:** Adding all extensions before understanding core
  - **Prevention:** Start with Ash + AshPostgres only, add extensions as needed

---

## Suggested Implementation Plan

### Phase 1: Foundation
**Goals:**
- [ ] Project setup with Ash, AshPostgres, simple_sat
- [ ] First domain and resource defined
- [ ] Basic CRUD working via IEx
- [ ] Database migrations generated and run

**Key Tasks:**
1. Add dependencies to mix.exs
2. Configure domains in config.exs
3. Create first domain module
4. Create first resource with attributes and actions
5. Run `mix ash.codegen` and `mix ecto.migrate`
6. Test in IEx

### Phase 2: Authorization & Business Logic
**Goals:**
- [ ] Policies implemented for all resources
- [ ] Named actions replacing generic CRUD where appropriate
- [ ] Validations and changes encapsulating business rules
- [ ] Code interfaces for domain operations

**Key Tasks:**
1. Add Ash.Policy.Authorizer to resources
2. Define policies for each action type
3. Create domain-specific actions (`:publish`, `:archive`, etc.)
4. Add validations and custom changes
5. Define code interfaces in domains
6. Write tests for authorization scenarios

### Phase 3: API Layer
**Goals:**
- [ ] API extension chosen and configured (GraphQL or JSON:API)
- [ ] Endpoints exposing domain actions
- [ ] Authentication integrated if needed

**Key Tasks:**
1. Add AshGraphQL or AshJsonApi
2. Configure routes/schema
3. Add AshAuthentication if user login required
4. Test API endpoints
5. Add documentation/OpenAPI spec

### Phase 4: Production Hardening
**Goals:**
- [ ] All resources have comprehensive policies
- [ ] Aggregates and calculations optimized
- [ ] Background jobs configured if needed
- [ ] Monitoring and observability in place

**Key Tasks:**
1. Audit all policies for completeness
2. Add aggregates for commonly-needed summary data
3. Configure AshOban if background jobs needed
4. Add OpentelemetryAsh for tracing
5. Performance testing and optimization

---

## Success Criteria

- [ ] All resources compile without warnings
- [ ] SAT solver loads correctly (no "No SAT solver available" errors)
- [ ] Actions accept only explicitly declared attributes
- [ ] Policies prevent unauthorized access
- [ ] Expressions execute in SQL where possible (check logs)
- [ ] Code interfaces provide idiomatic function calls
- [ ] Tests cover authorization scenarios

---

## Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|---------------------|
| SAT solver compilation failure | High | Medium | Use simple_sat instead of picosat_elixir |
| Learning curve too steep | Medium | High | Start with simple resources; read the book |
| Over-engineering early | Medium | Medium | Start minimal; add extensions when needed |
| Expression not portable | Low | Medium | Check data layer capabilities; use fallbacks |
| Policy complexity | Medium | Low | Use policy groups; test thoroughly |

---

## Questions for Further Investigation

- [ ] **Performance at scale:** How do complex policies perform with thousands of records?
- [ ] **Multi-tenancy patterns:** Best approaches for tenant isolation in Ash?
- [ ] **Testing strategies:** Optimal patterns for testing Ash resources?
- [ ] **GraphQL vs JSON:API:** When to choose each for API layer?

---

## Resources Needed

### Technical Resources
- PostgreSQL database for development/production
- Elixir 1.14+ and OTP 25+

### Team Expertise
- Elixir fundamentals (modules, GenServer basics, supervision)
- Domain-driven design concepts helpful
- SQL understanding for optimizing expressions

### Tools and Services
- Mix for dependency management (included with Elixir)
- ExUnit for testing (included with Elixir)
- PostgreSQL (local or hosted)

---

## Related Documents

- [Index](./index.md) - Research overview
- [Findings](./findings.md) - Core research findings
- [Resources](./resources.md) - All references and links
- [Patterns and Examples](./patterns-examples.md) - Code patterns
- [Extensions Guide](./extensions-guide.md) - Extension deep dive

---

## Next Steps

1. **Review findings** - Ensure understanding of core concepts
2. **Set up development environment** - Elixir, PostgreSQL, dependencies
3. **Follow Phase 1** - Get first resource working
4. **Create PRD if needed**: `/dr-prd [feature description]`
5. **Create implementation plan**: `/dr-plan [implementation context]`
