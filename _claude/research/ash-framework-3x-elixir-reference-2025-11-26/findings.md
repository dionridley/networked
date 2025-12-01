# Research Findings: Ash Framework 3.x for Elixir

**Date:** 2025-11-26

[← Back to Index](./index.md)

## Executive Summary

Ash Framework 3.x represents a mature, production-ready framework for building Elixir applications with a declarative, resource-oriented approach. The framework excels at reducing boilerplate while maintaining flexibility through its "80/15/5" philosophy: powerful defaults for 80% of cases, extensive configuration for 15%, and escape hatches for the remaining 5%. Key architectural changes in 3.0 include the rename from "Api" to "Domain", security-first defaults, and optional SAT solver dependencies. For AI agents implementing Ash applications, understanding the resource→action→domain hierarchy, the policy authorization system, and the expression/calculation portability is essential.

---

## Detailed Findings

### Finding 1: Core Architecture - Resources, Actions, and Domains

**Key Points:**
- **Resources** are the fundamental building blocks representing domain entities
- **Actions** are the operations you can perform (`:create`, `:read`, `:update`, `:destroy`, plus custom generic actions)
- **Domains** organize resources and expose their actions through a unified interface
- Everything is defined declaratively using Elixir DSL macros

**Analysis:**
Ash inverts the typical MVC pattern. Instead of controllers calling services that manipulate models, you define resources with their actions, and extensions (GraphQL, JSON:API, Phoenix) derive their interfaces from these definitions. This means defining your domain once yields consistent behavior across all interfaces.

**Resource Definition Pattern:**
```elixir
defmodule MyApp.Blog.Post do
  use Ash.Resource,
    otp_app: :my_app,
    domain: MyApp.Blog,
    data_layer: AshPostgres.DataLayer

  attributes do
    uuid_primary_key :id
    attribute :title, :string, allow_nil?: false, public?: true
    attribute :body, :string, public?: true
    attribute :status, :atom, constraints: [one_of: [:draft, :published]], default: :draft
    timestamps()
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      accept [:title, :body]
    end

    update :publish do
      change set_attribute(:status, :published)
      change set_attribute(:published_at, &DateTime.utc_now/0)
    end
  end
end
```

**Domain Definition Pattern:**
```elixir
defmodule MyApp.Blog do
  use Ash.Domain

  resources do
    resource MyApp.Blog.Post
    resource MyApp.Blog.Comment
  end
end
```

**Supporting Evidence:**
- [What is Ash?](https://hexdocs.pm/ash/what-is-ash.html)
- [Actions Documentation](https://hexdocs.pm/ash/actions.html)

---

### Finding 2: SAT Solver for Policy Authorization ("Truth Resolution")

**Key Points:**
- Ash policies are evaluated using a boolean satisfiability (SAT) solver
- The solver determines if authorization conditions can be satisfied
- Two solver options: `picosat_elixir` (NIF-based, faster) or `simple_sat` (pure Elixir, no compilation issues)
- In 3.0, picosat_elixir is optional - add it explicitly or use simple_sat as fallback

**Analysis:**
This is Ash's approach to "truth resolution" - determining whether a set of authorization rules can be satisfied. The SAT solver allows complex, composable policies without manual boolean logic. It handles scenarios like "authorize if (admin OR owner) AND (not_banned)" efficiently.

**Dependency Configuration:**
```elixir
# mix.exs
def deps do
  [
    {:ash, "~> 3.0"},
    # Choose ONE:
    {:picosat_elixir, "~> 0.2"},  # Faster, requires C compiler
    # OR
    {:simple_sat, "~> 0.1"}       # Pure Elixir, always compiles
  ]
end
```

**Policy Example:**
```elixir
defmodule MyApp.Blog.Post do
  use Ash.Resource,
    authorizers: [Ash.Policy.Authorizer]

  policies do
    # Bypass: admins can do anything
    bypass actor_attribute_equals(:role, :admin) do
      authorize_if always()
    end

    # Read: anyone can read published posts
    policy action_type(:read) do
      authorize_if expr(status == :published)
      authorize_if relates_to_actor_via(:author)
    end

    # Update: only author can update
    policy action_type(:update) do
      authorize_if relates_to_actor_via(:author)
    end
  end
end
```

**Supporting Evidence:**
- [Policies Documentation](https://hexdocs.pm/ash/policies.html)
- [simple_sat GitHub](https://github.com/ash-project/simple_sat)

---

### Finding 3: Expressions and Calculations (Portable Computations)

**Key Points:**
- Ash expressions are portable - they can run in SQL or Elixir
- Created using `Ash.Expr.expr/1` macro
- Used in calculations, filters, policies, and validations
- SQL-like NULL semantics: nil values "poison" expressions
- Built-in functions for strings, dates, math, and aggregations

**Analysis:**
Expression portability is powerful: a calculation like `expr(first_name <> " " <> last_name)` will execute as SQL when using AshPostgres (enabling sorting/filtering at DB level) or as Elixir when data is already loaded. This eliminates the common N+1 problem and enables efficient querying.

**Calculation Examples:**
```elixir
calculations do
  # Simple expression calculation
  calculate :full_name, :string, expr(first_name <> " " <> last_name)

  # With arguments
  calculate :name_with_separator, :string do
    argument :separator, :string, default: " "
    expr(first_name <> ^arg(:separator) <> last_name)
  end

  # Conditional logic (use cond, not case)
  calculate :display_status, :string do
    expr(
      cond do
        status == :published -> "Published"
        status == :draft -> "Draft"
        true -> "Unknown"
      end
    )
  end
end
```

**Expression Operators and Functions:**
- Comparison: `==`, `!=`, `>`, `>=`, `<`, `<=`, `in`
- Boolean: `and`, `or`, `not` (SQL-style)
- String: `contains/2`, `string_downcase/1`, `string_join/1-2`, `string_length/1`
- Date/Time: `now/0`, `today/0`, `ago/2`, `from_now/2`, `datetime_add/3`
- Type casting: `type/2`
- Nil handling: `is_nil/1`

**Important:** Use `cond` instead of `case` for conditional expressions.

**Supporting Evidence:**
- [Expressions Reference](https://hexdocs.pm/ash/expressions.html)
- [Calculations Guide](https://hexdocs.pm/ash/calculations.html)

---

### Finding 4: Action Lifecycle and Customization

**Key Points:**
- Actions have a well-defined lifecycle: preparation → transaction → post-transaction
- Customize using: `change`, `validate`, `prepare`, and hooks
- Create, update, destroy run in transactions by default; read does not
- Hook order: `before_transaction` → `before_action` → data operation → `after_action` → `after_transaction`

**Analysis:**
Understanding the action lifecycle is crucial for implementing business logic correctly. External API calls should go in `before_transaction` (before DB transaction starts). Side effects that should only run on success go in `after_action`. Notifications and cleanup go in `after_transaction` (runs regardless of success/failure).

**Action Lifecycle Hooks:**
```elixir
actions do
  create :create_with_notification do
    accept [:title, :body]

    # Runs before transaction starts (good for external API calls)
    change before_transaction(fn changeset, _context ->
      # Validate external data
      changeset
    end)

    # Runs inside transaction, before DB operation
    change before_action(fn changeset, _context ->
      # Last-minute modifications
      changeset
    end)

    # Runs inside transaction, after successful DB operation
    change after_action(fn changeset, result, _context ->
      # Trigger related operations
      {:ok, result}
    end)

    # Runs after transaction (always, even on failure)
    change after_transaction(fn changeset, {:ok, result}, _context ->
      # Send notifications, cleanup
      {:ok, result}
    end)
  end
end
```

**Built-in Changes:**
- `set_attribute/2` - Set an attribute value
- `manage_relationship/3` - Manage related records
- `increment/2` - Atomically increment a value
- `set_context/1` - Add context data

**Supporting Evidence:**
- [Actions Documentation](https://hexdocs.pm/ash/actions.html)

---

### Finding 5: Relationships and Manage Relationship

**Key Points:**
- Four relationship types: `belongs_to`, `has_one`, `has_many`, `many_to_many`
- Load relationships with `Ash.load/2` or `Ash.Query.load/2`
- Manage relationships in actions using `manage_relationship/3`
- Management types: `:append`, `:append_and_remove`, `:remove`, `:direct_control`, `:create`

**Analysis:**
Relationship management in Ash is more declarative than Ecto's approach. Instead of manually building changesets for associations, you declare how relationships should be managed and Ash handles the complexity. This is especially powerful for nested forms and API endpoints.

**Relationship Definition:**
```elixir
relationships do
  belongs_to :author, MyApp.Accounts.User
  has_many :comments, MyApp.Blog.Comment

  many_to_many :tags, MyApp.Blog.Tag do
    through MyApp.Blog.PostTag
    source_attribute_on_join_resource :post_id
    destination_attribute_on_join_resource :tag_id
  end
end
```

**Managing Relationships in Actions:**
```elixir
actions do
  update :update_with_tags do
    argument :tags, {:array, :map}

    change manage_relationship(:tags,
      type: :append_and_remove,
      on_lookup: :relate,
      on_no_match: :create
    )
  end
end
```

**Supporting Evidence:**
- [Relationships Documentation](https://hexdocs.pm/ash/relationships.html)

---

### Finding 6: Aggregates for Efficient Data Summaries

**Key Points:**
- Aggregates compute values over related data: `count`, `sum`, `first`, `list`, `max`, `min`, `avg`, `exists`
- Can be filtered and used in queries/sorts
- Support join filters for complex scenarios
- Both relationship-based and resource-based aggregates available

**Analysis:**
Aggregates solve the common problem of efficiently computing summary data. Instead of loading all related records to count them, Ash generates efficient SQL (with AshPostgres) or handles the computation appropriately for other data layers.

**Aggregate Examples:**
```elixir
aggregates do
  # Count related records
  count :comment_count, :comments

  # Count with filter
  count :published_comment_count, :comments do
    filter expr(status == :approved)
  end

  # Sum a field
  sum :total_revenue, :orders, :amount

  # First value with sorting
  first :latest_comment_body, :comments, :body do
    sort created_at: :desc
  end

  # Check existence
  exists :has_comments, :comments
end
```

**Using Aggregates:**
```elixir
# Load aggregate
Post |> Ash.Query.load(:comment_count) |> Ash.read!()

# Filter on aggregate
Post |> Ash.Query.filter(comment_count > 10) |> Ash.read!()

# Sort by aggregate
Post |> Ash.Query.sort(comment_count: :desc) |> Ash.read!()
```

**Supporting Evidence:**
- [Aggregates Documentation](https://hexdocs.pm/ash/aggregates.html)

---

### Finding 7: Code Interfaces for Idiomatic Elixir

**Key Points:**
- Code interfaces generate functions from actions
- Can be defined on domains or resources
- Support custom inputs, default options, and authorization helpers
- Generate both regular and bang (!) versions

**Analysis:**
Code interfaces bridge the gap between Ash's declarative actions and idiomatic Elixir function calls. Instead of manually building changesets and calling `Ash.create/2`, you get named functions like `MyApp.Blog.publish_post/2`.

**Domain-Level Interface:**
```elixir
defmodule MyApp.Blog do
  use Ash.Domain

  resources do
    resource MyApp.Blog.Post do
      define :create_post, action: :create
      define :publish_post, action: :publish, args: [:id]
      define :get_post_by_id, action: :read, get_by: [:id]
      define :list_posts, action: :read
    end
  end
end

# Usage
MyApp.Blog.create_post(%{title: "Hello", body: "World"})
MyApp.Blog.publish_post!(post_id)
MyApp.Blog.get_post_by_id!(post_id, load: [:comments])
```

**Resource-Level Interface:**
```elixir
defmodule MyApp.Blog.Post do
  code_interface do
    define :publish, args: [:id]
  end
end

# Usage
MyApp.Blog.Post.publish!(post_id)
```

**Supporting Evidence:**
- [Code Interfaces Documentation](https://hexdocs.pm/ash/code-interfaces.html)

---

## Cross-Cutting Themes

1. **Declarative Over Imperative**: Ash favors declaring what you want over writing how to do it. This enables extensions and tooling to derive functionality automatically.

2. **Secure by Default**: 3.x makes security opt-out rather than opt-in. Fields are private, authorization is checked, accept lists are required.

3. **Composition Through Extensions**: The framework is designed around extensions that add capabilities without modifying core behavior.

---

## Implications

### Technical Implications
- Must add SAT solver dependency explicitly (picosat_elixir or simple_sat)
- Actions require explicit `accept` lists - no auto-accepting all attributes
- Calculations and expressions should use `cond` not `case`
- Domain configuration replaces API configuration from 2.x

### Business Logic Placement
- Put business logic in actions, changes, and validations
- UI/controller layers should be thin - just call domain functions
- External API calls go in `before_transaction` hooks

### Performance Implications
- Expression portability enables database-level computation
- Aggregates prevent N+1 queries
- Lazy loading with `Ash.load/2` controls what data is fetched

---

## Gaps and Limitations

- **Learning Curve**: Ash's declarative approach requires mindset shift
- **Documentation Density**: Official docs are comprehensive but can be overwhelming
- **Tooling**: IDE support for the DSL is limited compared to standard Elixir
- **Not for Simple Apps**: Overhead may not be justified for basic CRUD apps

---

## Related Documents

- [Index](./index.md) - Research overview
- [Resources](./resources.md) - All references and links
- [Recommendations](./recommendations.md) - What to do next
- [Patterns and Examples](./patterns-examples.md) - Code patterns
- [Extensions Guide](./extensions-guide.md) - Extension deep dive
