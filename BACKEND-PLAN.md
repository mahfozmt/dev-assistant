# DevAssistant Backend Plan

Plan for adding an ASP.NET Core API to DevAssistant. Written 2026-11-01.

## Principles

- **Browser first.** A tool goes to the server only when the browser cannot do it correctly (real .NET engines, Roslyn, Microsoft parsers, storage). BCrypt, hashing, JWT and the converters stay client-side.
- **Never execute user code** on shared hosting. Compile, parse and decompile only.
- **No outbound connections to user-supplied hosts** (no SSRF, no port scanning from our IP).
- **Honest privacy.** Server tools show a "Runs on server" badge. Nothing is stored unless the user explicitly saves or shares it.

## Decisions on the original ideas

| Idea | Decision | Reason |
|---|---|---|
| Live C# code execution | No (on shared hosting) | No sandbox or container isolation on shared IIS. Needs a VPS or Azure Container Apps later. |
| Roslyn compile and IL decompile | Yes (Phase 2) | Compile-only, never loads or runs the assembly. |
| Live database connection tester | No | Would let anyone use the server to probe hosts and ports, invites users to paste production credentials, and shared hosts usually block ports 1433 and 5432. Replaced by the connection string inspector. |
| User accounts and cloud sync | Yes (Phase 4) | GitHub sign-in only, so no passwords are stored. |

## Target stack

- .NET 10 (LTS). .NET 8 support ends 2026-11-10.
- ASP.NET Core minimal APIs with endpoint groups, OpenAPI with Scalar.
- xUnit and `WebApplicationFactory` integration tests.
- SQL Server (Hostseba plan) with EF Core from Phase 3.
- Host: `api.mahfozmt.com` on Hostseba win12 (IIS 10, Plesk), its own app pool.

```
api/
├── DevAssistant.Api/          # Program.cs, Endpoints/, Services/
└── DevAssistant.Api.Tests/    # unit + integration tests
```

## Phase 0: Prove the hosting

1. Check which ASP.NET Core Hosting Bundle is installed on win12 (Plesk or a Hostseba ticket). If .NET 10 is missing, publish self-contained (needs only the ASP.NET Core Module).
2. Create `api.mahfozmt.com`: A record at ExonHost (TTL 7200), Plesk subdomain, Let's Encrypt certificate.
3. Deploy a minimal API with `GET /health`.
4. Add an API job to `.github/workflows/deploy.yml`: `dotnet test`, `dotnet publish`, upload `app_offline.htm`, upload the build over FTPS, remove `app_offline.htm`. Use a separate scoped FTP user for the API folder.

**Done when** `https://api.mahfozmt.com/health` returns 200 after a push to `main`.

## Phase 1: Foundation and stateless .NET tools

Cross-cutting:
- Built-in rate limiter (about 30 requests per minute per IP).
- 64 KB request size limit and a timeout on every endpoint.
- `ProblemDetails` errors, CORS limited to `https://lab.mahfozmt.com`.
- OpenAPI document and Scalar UI.
- Logging to file (Serilog) with no request bodies logged.

Tools:
| Tool | Engine |
|---|---|
| .NET Regex tester | `System.Text.RegularExpressions` with `matchTimeout`, all `RegexOptions`, balancing groups, right-to-left |
| T-SQL parser and formatter | `Microsoft.SqlServer.TransactSql.ScriptDom`: errors with line numbers, formatting, referenced tables |
| Connection string inspector | `SqlConnectionStringBuilder`, `NpgsqlConnectionStringBuilder`: parse, explain, warn (for example `TrustServerCertificate=True`), no network |
| JSON to C# | Records or classes with `System.Text.Json` attributes |
| .NET format and time zone tester | `ToString(format)` across cultures, `TimeZoneInfo` with Windows and IANA IDs |

Frontend:
- `apiBaseUrl` in environment files and a shared `ApiService`.
- "Runs on server" badge on server tools, and a friendly message when the API is unavailable.

## Phase 2: Roslyn workbench

- Compile diagnostics, syntax tree, IL and lowered C# (Roslyn plus ICSharpCode.Decompiler).
- Switch C# to TypeScript and C# to JSON Schema to Roslyn syntax parsing.
- Limits: 20 KB of code, compile timeout via `CancellationToken`, a semaphore allowing one or two compiles at a time.
- Never call `Assembly.Load` or execute user code. Add a test that guards this.

## Phase 3: Share links

- `Snippets` table (id, tool, content, created, expires) with EF Core migrations.
- Anonymous links that expire after 7 or 30 days, plus a cleanup job.

## Phase 4: Accounts and sync

- GitHub OAuth with cookie authentication.
- Saved regex patterns, snippets and preferences.
- "Delete my account and data" button.

## Later

- Real code execution in throwaway containers, only on a VPS or Azure Container Apps.
