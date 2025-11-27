# Extensions Guide: Ash Framework 3.x

**Date:** 2025-11-26

[← Back to Index](./index.md)

This document provides detailed guidance on Ash extensions, when to use them, and how to configure them.

---

## Extension Ecosystem Overview

Ash's power comes from its extension ecosystem. Extensions are "resource-aware" - they understand your domain model and automatically derive functionality from it.

### Extension Categories

| Category | Extensions | Purpose |
|----------|------------|---------|
| **Data Layers** | AshPostgres, AshSqlite | Persist data to databases |
| **API Generation** | AshGraphQL, AshJsonApi | Expose resources via APIs |
| **Authentication** | AshAuthentication | User login/registration |
| **Business Logic** | AshStateMachine, AshOban | Workflows, background jobs |
| **Audit/History** | AshPaperTrail, AshArchival | Track changes, soft delete |
| **Security** | AshCloak | Field encryption |
| **UI** | AshPhoenix, AshAdmin | Phoenix integration, admin panel |

---

## Core Extensions (Usually Required)

### AshPostgres

**When to Use:** Any production application using PostgreSQL (most common scenario)

**What It Provides:**
- PostgreSQL-specific data layer
- Expression portability to SQL
- Advanced features: triggers, custom SQL, JSON queries
- Migration generation

**Setup:**

```elixir
# mix.exs
{:ash_postgres, "~> 2.0"}

# config/config.exs
config :my_app, MyApp.Repo,
  database: "my_app_dev",
  username: "postgres",
  password: "postgres",
  hostname: "localhost"

# Resource
defmodule MyApp.Blog.Post do
  use Ash.Resource,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "posts"
    repo MyApp.Repo
  end
end
```

**Key Features:**
```elixir
postgres do
  table "posts"
  repo MyApp.Repo

  # Custom indexes
  custom_indexes do
    index [:title], unique: true
    index [:status, :inserted_at]
  end

  # References (foreign keys)
  references do
    reference :author, on_delete: :delete
  end
end
```

---

### SAT Solvers (Required for Policies)

**When to Use:** Always, if using Ash policies

**Options:**

1. **simple_sat** (Recommended for reliability)
   ```elixir
   {:simple_sat, "~> 0.1"}
   ```
   - Pure Elixir
   - Always compiles
   - Slightly slower (rarely noticeable)

2. **picosat_elixir** (Faster, but compilation issues)
   ```elixir
   {:picosat_elixir, "~> 0.2"}
   ```
   - NIF-based (requires C compiler)
   - Faster for complex policies
   - May fail to compile on some systems

**Troubleshooting:**
If you see "No SAT solver available":
```bash
mix deps.compile ash --force
```

---

## API Extensions

### AshGraphQL

**When to Use:** Building GraphQL APIs

**What It Provides:**
- Auto-generated GraphQL schema from resources
- Queries and mutations from actions
- Filtering, sorting, pagination
- Subscriptions support

**Setup:**

```elixir
# mix.exs
{:ash_graphql, "~> 1.0"}

# Resource
defmodule MyApp.Blog.Post do
  use Ash.Resource,
    extensions: [AshGraphQL.Resource]

  graphql do
    type :post

    queries do
      get :get_post, :read
      list :list_posts, :read
    end

    mutations do
      create :create_post, :create
      update :update_post, :update
      destroy :delete_post, :destroy
    end
  end
end

# Domain
defmodule MyApp.Blog do
  use Ash.Domain,
    extensions: [AshGraphQL.Domain]

  graphql do
    authorize? true
  end
end

# Schema
defmodule MyAppWeb.Schema do
  use Absinthe.Schema

  use AshGraphql,
    domains: [MyApp.Blog]

  query do
  end

  mutation do
  end
end
```

---

### AshJsonApi

**When to Use:** Building JSON:API spec-compliant REST APIs

**What It Provides:**
- JSON:API compliant endpoints
- Automatic OpenAPI documentation
- Filtering, sorting, pagination per spec
- Relationship includes

**Setup:**

```elixir
# mix.exs
{:ash_json_api, "~> 1.0"}

# Resource
defmodule MyApp.Blog.Post do
  use Ash.Resource,
    extensions: [AshJsonApi.Resource]

  json_api do
    type "posts"

    routes do
      base "/posts"

      get :read
      index :read
      post :create
      patch :update
      delete :destroy
    end
  end
end

# Domain
defmodule MyApp.Blog do
  use Ash.Domain,
    extensions: [AshJsonApi.Domain]

  json_api do
    router MyAppWeb.Router
    log_errors? true
  end
end

# Router
defmodule MyAppWeb.Router do
  use Phoenix.Router
  use AshJsonApi.Router, domains: [MyApp.Blog]
end
```

---

## Authentication Extensions

### AshAuthentication

**When to Use:** User login, registration, OAuth, magic links

**What It Provides:**
- Password authentication
- OAuth (Google, GitHub, Apple, etc.)
- Magic link authentication
- Token management
- Password reset flows

**Setup:**

```elixir
# mix.exs
{:ash_authentication, "~> 4.0"},
{:ash_authentication_phoenix, "~> 2.0"}  # if using Phoenix

# Resource
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
      password :password do
        identity_field :email
        sign_in_tokens_enabled? true

        resettable do
          sender MyApp.Accounts.PasswordResetSender
        end
      end

      # OAuth example
      oauth2 :google do
        client_id fn _, _ -> System.get_env("GOOGLE_CLIENT_ID") end
        redirect_uri fn _, _ -> "http://localhost:4000/auth/google/callback" end
        client_secret fn _, _ -> System.get_env("GOOGLE_CLIENT_SECRET") end
        authorization_params scope: "email profile"
      end
    end
  end

  attributes do
    uuid_primary_key :id
    attribute :email, :ci_string, allow_nil?: false, public?: true
    attribute :hashed_password, :string, allow_nil?: true, sensitive?: true
  end

  identities do
    identity :unique_email, [:email]
  end
end
```

---

## Business Logic Extensions

### AshStateMachine

**When to Use:** Resources with defined states and transitions (orders, workflows, tickets)

**What It Provides:**
- State definition and constraints
- Transition validation
- Automatic state change tracking

**Setup:**

```elixir
# mix.exs
{:ash_state_machine, "~> 0.2"}

# Resource
defmodule MyApp.Orders.Order do
  use Ash.Resource,
    extensions: [AshStateMachine]

  state_machine do
    initial_states [:pending]
    default_initial_state :pending

    transitions do
      transition :confirm, from: :pending, to: :confirmed
      transition :ship, from: :confirmed, to: :shipped
      transition :deliver, from: :shipped, to: :delivered
      transition :cancel, from: [:pending, :confirmed], to: :cancelled
    end
  end

  attributes do
    uuid_primary_key :id
    attribute :status, :atom do
      constraints one_of: [:pending, :confirmed, :shipped, :delivered, :cancelled]
      default :pending
      allow_nil? false
    end
  end

  actions do
    update :confirm do
      change transition_state(:confirmed)
    end

    update :ship do
      change transition_state(:shipped)
    end

    update :cancel do
      change transition_state(:cancelled)
    end
  end
end
```

---

### AshOban

**When to Use:** Background jobs, scheduled tasks

**What It Provides:**
- Trigger Oban jobs from actions
- Scheduled actions
- Automatic job creation from resource changes

**Setup:**

```elixir
# mix.exs
{:ash_oban, "~> 0.2"},
{:oban, "~> 2.0"}

# Resource
defmodule MyApp.Emails.Email do
  use Ash.Resource,
    extensions: [AshOban]

  oban do
    triggers do
      trigger :send_email do
        action :send
        scheduler_cron false  # Don't run on schedule
        on_error :raise
      end
    end

    scheduled_actions do
      schedule :send_daily_digest, "0 8 * * *" do  # 8 AM daily
        action :create_daily_digest
      end
    end
  end

  actions do
    create :send do
      accept [:to, :subject, :body]
      change after_action(fn _changeset, email, _context ->
        MyApp.Mailer.deliver(email)
        {:ok, email}
      end)
    end
  end
end
```

---

## Audit & History Extensions

### AshPaperTrail

**When to Use:** Audit logging, change tracking

**What It Provides:**
- Automatic version history
- Track who changed what and when
- Query historical data

**Setup:**

```elixir
# mix.exs
{:ash_paper_trail, "~> 0.1"}

# Resource
defmodule MyApp.Blog.Post do
  use Ash.Resource,
    extensions: [AshPaperTrail.Resource]

  paper_trail do
    version_resource MyApp.Blog.PostVersion
    on_actions [:create, :update, :destroy]
    change_tracking_mode :changes_only

    store_action_name? true
    ignore_attributes [:updated_at]
  end
end

# Version Resource
defmodule MyApp.Blog.PostVersion do
  use Ash.Resource,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "post_versions"
    repo MyApp.Repo
  end

  attributes do
    uuid_primary_key :id
    attribute :changes, :map
    attribute :action_name, :atom
    create_timestamp :created_at
  end

  relationships do
    belongs_to :post, MyApp.Blog.Post
    belongs_to :actor, MyApp.Accounts.User
  end
end
```

---

### AshArchival

**When to Use:** Soft delete instead of hard delete

**What It Provides:**
- Automatic `archived_at` timestamp
- Filter archived records from queries by default
- Unarchive capability

**Setup:**

```elixir
# mix.exs
{:ash_archival, "~> 1.0"}

# Resource
defmodule MyApp.Blog.Post do
  use Ash.Resource,
    extensions: [AshArchival.Resource]

  archive do
    attribute :archived_at
    exclude_read_actions [:list_all]  # Actions that show archived
  end

  actions do
    defaults [:create, :read, :update]

    # Archive instead of destroy
    destroy :destroy do
      soft? true
    end

    # Hard delete if needed
    destroy :hard_delete do
      soft? false
    end

    # Include archived in this read
    read :list_all do
    end

    # Unarchive
    update :unarchive do
      change set_attribute(:archived_at, nil)
    end
  end
end
```

---

## UI Extensions

### AshPhoenix

**When to Use:** Integrating Ash with Phoenix forms, LiveView

**What It Provides:**
- Form helpers for Ash resources
- LiveView integration
- Error handling and display

**Setup:**

```elixir
# mix.exs
{:ash_phoenix, "~> 2.0"}

# LiveView
defmodule MyAppWeb.PostLive.Form do
  use MyAppWeb, :live_view

  alias AshPhoenix.Form

  def mount(%{"id" => id}, _session, socket) do
    post = MyApp.Blog.get_post!(id)
    form = Form.for_update(post, :update, domain: MyApp.Blog, actor: socket.assigns.current_user)

    {:ok, assign(socket, form: to_form(form))}
  end

  def handle_event("validate", %{"form" => params}, socket) do
    form = Form.validate(socket.assigns.form, params)
    {:noreply, assign(socket, form: to_form(form))}
  end

  def handle_event("save", %{"form" => params}, socket) do
    case Form.submit(socket.assigns.form, params: params) do
      {:ok, post} ->
        {:noreply, push_navigate(socket, to: ~p"/posts/#{post.id}")}

      {:error, form} ->
        {:noreply, assign(socket, form: to_form(form))}
    end
  end

  def render(assigns) do
    ~H"""
    <.form for={@form} phx-change="validate" phx-submit="save">
      <.input field={@form[:title]} label="Title" />
      <.input field={@form[:body]} type="textarea" label="Body" />
      <.button>Save</.button>
    </.form>
    """
  end
end
```

---

### AshAdmin

**When to Use:** Quick admin interface for development or internal tools

**What It Provides:**
- Auto-generated admin panel
- CRUD operations
- Relationship management

**Setup:**

```elixir
# mix.exs
{:ash_admin, "~> 0.11"}

# Router
defmodule MyAppWeb.Router do
  use Phoenix.Router

  import AshAdmin.Router

  scope "/" do
    pipe_through [:browser]

    ash_admin "/admin"
  end
end

# Domain
defmodule MyApp.Blog do
  use Ash.Domain,
    extensions: [AshAdmin.Domain]

  admin do
    show? true
  end
end

# Resource
defmodule MyApp.Blog.Post do
  use Ash.Resource,
    extensions: [AshAdmin.Resource]

  admin do
    show? true
    read_actions [:read]
    create_actions [:create]
    update_actions [:update]
  end
end
```

---

## Extension Decision Matrix

| Need | Extension | Priority |
|------|-----------|----------|
| PostgreSQL database | AshPostgres | Required |
| Policy authorization | simple_sat or picosat_elixir | Required |
| GraphQL API | AshGraphQL | If building GraphQL |
| REST API | AshJsonApi | If building JSON:API |
| User authentication | AshAuthentication | If users log in |
| State workflows | AshStateMachine | If status transitions |
| Background jobs | AshOban | If async processing |
| Audit trail | AshPaperTrail | If tracking changes |
| Soft delete | AshArchival | If keeping deleted data |
| Phoenix forms | AshPhoenix | If using Phoenix |
| Quick admin | AshAdmin | For dev/internal tools |

---

## Extension Compatibility Notes

1. **AshPostgres + AshGraphQL/AshJsonApi**: Work seamlessly together
2. **AshAuthentication + AshPhoenix**: Use AshAuthenticationPhoenix for full integration
3. **AshStateMachine + AshPaperTrail**: Great combo for workflow audit
4. **AshOban + AshArchival**: Be careful with scheduled jobs on archived records

---

## Related Documents

- [Index](./index.md) - Research overview
- [Findings](./findings.md) - Core research findings
- [Resources](./resources.md) - All references and links
- [Recommendations](./recommendations.md) - What to do next
- [Patterns and Examples](./patterns-examples.md) - Code patterns
