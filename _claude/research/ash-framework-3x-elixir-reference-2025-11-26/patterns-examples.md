# Patterns and Examples: Ash Framework 3.x

**Date:** 2025-11-26

[← Back to Index](./index.md)

This document provides copy-paste ready code patterns for common Ash Framework scenarios.

---

## Table of Contents
1. [Project Setup](#project-setup)
2. [Resource Definition Patterns](#resource-definition-patterns)
3. [Action Patterns](#action-patterns)
4. [Policy Patterns](#policy-patterns)
5. [Expression and Calculation Patterns](#expression-and-calculation-patterns)
6. [Relationship Patterns](#relationship-patterns)
7. [Aggregate Patterns](#aggregate-patterns)
8. [Code Interface Patterns](#code-interface-patterns)
9. [Testing Patterns](#testing-patterns)

---

## Project Setup

### mix.exs Dependencies

```elixir
defp deps do
  [
    # Core Ash
    {:ash, "~> 3.0"},

    # SAT Solver (choose one)
    {:simple_sat, "~> 0.1"},  # Pure Elixir, always compiles
    # {:picosat_elixir, "~> 0.2"},  # Faster, needs C compiler

    # Data Layer
    {:ash_postgres, "~> 2.0"},

    # API Extensions (add as needed)
    # {:ash_graphql, "~> 1.0"},
    # {:ash_json_api, "~> 1.0"},

    # Phoenix Integration
    # {:ash_phoenix, "~> 2.0"},

    # Authentication
    # {:ash_authentication, "~> 4.0"},
    # {:ash_authentication_phoenix, "~> 2.0"},

    # Business Logic Extensions
    # {:ash_oban, "~> 0.2"},
    # {:ash_state_machine, "~> 0.2"},
  ]
end
```

### Config (config/config.exs)

```elixir
import Config

config :my_app,
  ash_domains: [
    MyApp.Accounts,
    MyApp.Blog
  ]

config :ash,
  include_embedded_source_by_default?: false,
  default_page_type: :keyset,
  policies: [
    no_filter_static_forbidden_reads?: false
  ]
```

---

## Resource Definition Patterns

### Basic Resource with Postgres

```elixir
defmodule MyApp.Blog.Post do
  use Ash.Resource,
    otp_app: :my_app,
    domain: MyApp.Blog,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "posts"
    repo MyApp.Repo
  end

  attributes do
    uuid_primary_key :id

    attribute :title, :string do
      allow_nil? false
      public? true
      constraints min_length: 1, max_length: 255
    end

    attribute :body, :string do
      public? true
    end

    attribute :status, :atom do
      constraints one_of: [:draft, :published, :archived]
      default :draft
      public? true
    end

    attribute :published_at, :utc_datetime_usec

    create_timestamp :inserted_at
    update_timestamp :updated_at
  end

  relationships do
    belongs_to :author, MyApp.Accounts.User do
      allow_nil? false
      public? true
    end

    has_many :comments, MyApp.Blog.Comment
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      primary? true
      accept [:title, :body]

      argument :author_id, :uuid, allow_nil?: false
      change manage_relationship(:author_id, :author, type: :append)
    end

    update :update do
      primary? true
      accept [:title, :body]
    end

    update :publish do
      accept []
      validate attribute_equals(:status, :draft),
        message: "can only publish draft posts"
      change set_attribute(:status, :published)
      change set_attribute(:published_at, &DateTime.utc_now/0)
    end

    update :archive do
      accept []
      change set_attribute(:status, :archived)
    end
  end

  identities do
    identity :unique_title_per_author, [:title, :author_id]
  end
end
```

### Domain Definition

```elixir
defmodule MyApp.Blog do
  use Ash.Domain

  resources do
    resource MyApp.Blog.Post do
      # Code interface definitions
      define :create_post, action: :create
      define :update_post, action: :update
      define :publish_post, action: :publish
      define :archive_post, action: :archive
      define :get_post, action: :read, get_by: [:id]
      define :list_posts, action: :read
    end

    resource MyApp.Blog.Comment
  end
end
```

---

## Action Patterns

### Create with Relationships

```elixir
actions do
  create :create_with_tags do
    accept [:title, :body]

    argument :tag_ids, {:array, :uuid}, default: []
    argument :author_id, :uuid, allow_nil?: false

    change manage_relationship(:author_id, :author, type: :append)
    change manage_relationship(:tag_ids, :tags,
      type: :append_and_remove,
      on_lookup: :relate
    )
  end
end
```

### Update with Validation

```elixir
actions do
  update :submit_for_review do
    accept []

    # Custom validation
    validate fn changeset, _context ->
      if Ash.Changeset.get_attribute(changeset, :body) |> String.length() < 100 do
        {:error, field: :body, message: "must be at least 100 characters for review"}
      else
        :ok
      end
    end

    change set_attribute(:status, :pending_review)
  end
end
```

### Generic Action (Non-CRUD)

```elixir
actions do
  action :calculate_statistics, :map do
    argument :date_range, :map do
      constraints fields: [
        start_date: [type: :date, allow_nil?: false],
        end_date: [type: :date, allow_nil?: false]
      ]
    end

    run fn input, _context ->
      # Custom logic here
      {:ok, %{
        total_posts: 100,
        published: 80,
        drafts: 20
      }}
    end
  end
end
```

### Action with Before/After Hooks

```elixir
actions do
  create :create_with_notification do
    accept [:title, :body]

    change before_transaction(fn changeset, _context ->
      # Validate external dependencies before transaction
      changeset
    end)

    change after_action(fn changeset, result, _context ->
      # Side effects that should only happen on success
      MyApp.Notifications.notify_subscribers(result)
      {:ok, result}
    end)

    change after_transaction(fn
      _changeset, {:ok, result}, _context ->
        # Cleanup or logging
        {:ok, result}

      _changeset, {:error, error}, _context ->
        # Error handling
        {:error, error}
    end)
  end
end
```

---

## Policy Patterns

### Basic Policy Setup

```elixir
defmodule MyApp.Blog.Post do
  use Ash.Resource,
    authorizers: [Ash.Policy.Authorizer]

  policies do
    # Admin bypass - admins can do anything
    bypass actor_attribute_equals(:role, :admin) do
      authorize_if always()
    end

    # Read policy - public published posts, own drafts
    policy action_type(:read) do
      authorize_if expr(status == :published)
      authorize_if relates_to_actor_via(:author)
    end

    # Create policy
    policy action_type(:create) do
      authorize_if actor_present()
    end

    # Update policy - only authors
    policy action_type(:update) do
      authorize_if relates_to_actor_via(:author)
    end

    # Destroy policy - only authors
    policy action_type(:destroy) do
      authorize_if relates_to_actor_via(:author)
    end
  end
end
```

### Field Policies

```elixir
field_policies do
  # Everyone can see title and status
  field_policy [:title, :status] do
    authorize_if always()
  end

  # Body only visible to authors or for published posts
  field_policy :body do
    authorize_if relates_to_actor_via(:author)
    authorize_if expr(status == :published)
  end

  # Internal notes only for admins
  field_policy :internal_notes do
    authorize_if actor_attribute_equals(:role, :admin)
  end
end
```

### Custom Check

```elixir
defmodule MyApp.Checks.IsAuthor do
  use Ash.Policy.SimpleCheck

  @impl true
  def describe(_opts) do
    "actor is the author"
  end

  @impl true
  def match?(actor, %{data: %{author_id: author_id}}, _opts) do
    actor && actor.id == author_id
  end

  def match?(_, _, _), do: false
end

# Usage in policies
policies do
  policy action_type(:update) do
    authorize_if {MyApp.Checks.IsAuthor, []}
  end
end
```

---

## Expression and Calculation Patterns

### Basic Calculations

```elixir
calculations do
  # String concatenation
  calculate :full_name, :string, expr(first_name <> " " <> last_name)

  # With arguments
  calculate :greeting, :string do
    argument :prefix, :string, default: "Hello"
    expr(^arg(:prefix) <> ", " <> full_name)
  end

  # Conditional (always use cond, not case)
  calculate :status_label, :string do
    expr(
      cond do
        status == :draft -> "Draft"
        status == :published -> "Published"
        status == :archived -> "Archived"
        true -> "Unknown"
      end
    )
  end

  # Date calculations
  calculate :age_in_days, :integer do
    expr(fragment("EXTRACT(DAY FROM ? - ?)", now(), inserted_at))
  end

  # Boolean check
  calculate :is_recent, :boolean do
    expr(inserted_at > ago(7, :day))
  end
end
```

### Module-Based Calculation

```elixir
defmodule MyApp.Calculations.WordCount do
  use Ash.Resource.Calculation

  @impl true
  def init(opts) do
    {:ok, opts}
  end

  @impl true
  def load(_query, _opts, _context) do
    [:body]
  end

  @impl true
  def calculate(records, _opts, _context) do
    Enum.map(records, fn record ->
      case record.body do
        nil -> 0
        body -> body |> String.split() |> length()
      end
    end)
  end
end

# Usage
calculations do
  calculate :word_count, :integer, MyApp.Calculations.WordCount
end
```

---

## Relationship Patterns

### Manage Relationship Types

```elixir
actions do
  # Append only (add to collection)
  update :add_tags do
    argument :tag_ids, {:array, :uuid}
    change manage_relationship(:tag_ids, :tags, type: :append)
  end

  # Append and remove (sync collection)
  update :set_tags do
    argument :tag_ids, {:array, :uuid}
    change manage_relationship(:tag_ids, :tags, type: :append_and_remove)
  end

  # Full control (create/update/delete related)
  update :manage_comments do
    argument :comments, {:array, :map}
    change manage_relationship(:comments,
      type: :direct_control,
      on_lookup: :relate,
      on_no_match: :create,
      on_match: :update,
      on_missing: :destroy
    )
  end
end
```

### Loading Relationships

```elixir
# Load single relationship
post = MyApp.Blog.get_post!(id)
post = Ash.load!(post, :author)

# Load multiple
post = Ash.load!(post, [:author, :comments, :tags])

# Nested loading
post = Ash.load!(post, [comments: [:author]])

# In query
posts =
  MyApp.Blog.Post
  |> Ash.Query.load([:author, comments: [:author]])
  |> Ash.read!()
```

---

## Aggregate Patterns

```elixir
aggregates do
  # Count
  count :comment_count, :comments

  # Count with filter
  count :approved_comment_count, :comments do
    filter expr(status == :approved)
  end

  # Sum
  sum :total_likes, :likes, :count

  # First with sort
  first :latest_comment, :comments, :body do
    sort inserted_at: :desc
  end

  # List values
  list :tag_names, :tags, :name

  # Exists check
  exists :has_comments, :comments

  # Max/Min
  max :highest_rating, :reviews, :rating
  min :lowest_rating, :reviews, :rating
end
```

### Using Aggregates

```elixir
# Load
posts = Post |> Ash.Query.load(:comment_count) |> Ash.read!()

# Filter
Post |> Ash.Query.filter(comment_count > 5) |> Ash.read!()

# Sort
Post |> Ash.Query.sort(comment_count: :desc) |> Ash.read!()
```

---

## Code Interface Patterns

### Domain-Level Interface

```elixir
defmodule MyApp.Blog do
  use Ash.Domain

  resources do
    resource MyApp.Blog.Post do
      # Basic CRUD
      define :create_post, action: :create
      define :update_post, action: :update
      define :delete_post, action: :destroy

      # Get by ID
      define :get_post, action: :read, get_by: [:id]

      # Get with not found error
      define :get_post!, action: :read, get_by: [:id]

      # List with options
      define :list_posts, action: :read

      # Named actions
      define :publish_post, action: :publish, args: [:id]
      define :archive_post, action: :archive, args: [:id]
    end
  end
end
```

### Usage Examples

```elixir
# Create
{:ok, post} = MyApp.Blog.create_post(%{title: "Hello", body: "World"}, actor: user)

# Or with bang
post = MyApp.Blog.create_post!(%{title: "Hello", body: "World"}, actor: user)

# Get
{:ok, post} = MyApp.Blog.get_post(id)
post = MyApp.Blog.get_post!(id)

# Get with loading
post = MyApp.Blog.get_post!(id, load: [:author, :comments])

# List
posts = MyApp.Blog.list_posts!(actor: user)

# List with query options
posts = MyApp.Blog.list_posts!(
  actor: user,
  filter: [status: :published],
  sort: [inserted_at: :desc],
  load: [:author]
)

# Named action
{:ok, post} = MyApp.Blog.publish_post(post.id, actor: user)
```

---

## Testing Patterns

### Basic Resource Tests

```elixir
defmodule MyApp.Blog.PostTest do
  use ExUnit.Case

  alias MyApp.Blog
  alias MyApp.Blog.Post

  setup do
    # Create test user
    user = create_user()
    {:ok, user: user}
  end

  describe "create_post/2" do
    test "creates a post with valid data", %{user: user} do
      attrs = %{title: "Test", body: "Content", author_id: user.id}

      assert {:ok, post} = Blog.create_post(attrs, actor: user)
      assert post.title == "Test"
      assert post.status == :draft
    end

    test "fails without title", %{user: user} do
      attrs = %{body: "Content", author_id: user.id}

      assert {:error, %Ash.Error.Invalid{}} = Blog.create_post(attrs, actor: user)
    end
  end

  describe "publish_post/2" do
    test "publishes a draft post", %{user: user} do
      post = create_post(user, status: :draft)

      assert {:ok, published} = Blog.publish_post(post.id, actor: user)
      assert published.status == :published
      assert published.published_at != nil
    end

    test "fails for non-draft posts", %{user: user} do
      post = create_post(user, status: :published)

      assert {:error, _} = Blog.publish_post(post.id, actor: user)
    end
  end

  describe "authorization" do
    test "users can only update own posts", %{user: user} do
      other_user = create_user()
      post = create_post(other_user)

      assert {:error, %Ash.Error.Forbidden{}} =
        Blog.update_post(post.id, %{title: "Hacked"}, actor: user)
    end
  end

  # Helper functions
  defp create_user do
    MyApp.Accounts.create_user!(%{email: "test@example.com", name: "Test"})
  end

  defp create_post(user, opts \\ []) do
    attrs = %{
      title: Keyword.get(opts, :title, "Test Post"),
      body: Keyword.get(opts, :body, "Test content"),
      author_id: user.id
    }

    post = Blog.create_post!(attrs, actor: user)

    case Keyword.get(opts, :status, :draft) do
      :draft -> post
      :published -> Blog.publish_post!(post.id, actor: user)
    end
  end
end
```

---

## Related Documents

- [Index](./index.md) - Research overview
- [Findings](./findings.md) - Core research findings
- [Resources](./resources.md) - All references and links
- [Recommendations](./recommendations.md) - What to do next
- [Extensions Guide](./extensions-guide.md) - Extension deep dive
