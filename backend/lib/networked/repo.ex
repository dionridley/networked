defmodule Networked.Repo do
  use Ecto.Repo,
    otp_app: :networked,
    adapter: Ecto.Adapters.Postgres
end
