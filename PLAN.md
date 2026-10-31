# DevAssistant — Implementation & Build Plan

> **Objective**: Build a clean, lightning-fast, privacy-first developer productivity suite (Formatters, Parsers, Diff Viewer, Converters, Crypto & .NET Utilities) designed for deployment on **[lab.mahfozmt.com](https://lab.mahfozmt.com)**.

---

## 1. Project Overview & Vision

DevAssistant is created to serve as Mahfozur Rahman's real-world developer laboratory project on `lab.mahfozmt.com`. It replaces fragmented, ad-heavy web tools with a unified, dark-themed, ultra-responsive developer workstation.

### Core Principles
1. **Client-First Privacy**: 95%+ of operations (formatting, parsing, diffing, conversions) execute locally in the browser via Web Workers and WebAssembly. No sensitive code, tokens, or customer data leaves the user's browser.
2. **Offline-Capable (PWA)**: Full offline functionality for daily developer tasks.
3. **.NET & Angular Synergy**: Built with Angular (standalone components, reactive signals) frontend, backed by an optional lightweight ASP.NET Core API for heavy server-side tasks (BCrypt benchmarking, Roslyn-powered C# to TypeScript/JSON Schema translation, and .NET Regex flavor testing).
4. **IIS & Windows Server Ready**: Tailored for IIS 10 with URL Rewrite rules, secure headers, and fast static asset caching.

---

## 2. Tech Stack

- **Frontend**: Angular 18/19 (Standalone Components, Signals, Zoneless or Standard Change Detection)
- **Styling**: Tailwind CSS + Angular CDK + Lucide Angular Icons
- **Code Editor / Diff**: Monaco Editor (`@monaco-editor/angular` or lightweight `codemirror`)
- **Key Client Libraries**:
  - `sql-formatter` (SQL syntax beautifier)
  - `js-beautify` or `prettier/standalone` (JSON/HTML/CSS/JS formatting)
  - `diff` / `diff2html` (text & code diffing)
  - `yaml` & `papaparse` (YAML & CSV conversion)
  - `bcryptjs` (BCrypt hashing & matching)
  - `jwt-decode` (JWT token decoding & claim extraction)
- **Backend (Optional / Hybrid)**: ASP.NET Core 8/9 Minimal API
- **Deployment Target**: IIS 10 Windows Server on `lab.mahfozmt.com`

---

## 3. Tool Module Specifications

### Module 1: Code & Query Formatters
| Tool | Features | Engine |
|---|---|---|
| **JSON Formatter** | Beautify, minify, sort keys, remove whitespace, escape/unescape strings | Native / Prettier |
| **SQL Formatter** | Standard SQL, T-SQL, PostgreSQL, MySQL formatting, uppercase keywords, indent | `sql-formatter` |
| **XML / HTML Formatter** | Indentation, collapse self-closing tags, attribute wrapping | `js-beautify` |
| **CSS / SCSS Formatter** | Ruleset formatting, alphabetical properties, single/multi-line | `prettier` |

### Module 2: Parsers & Evaluators
| Tool | Features | Engine |
|---|---|---|
| **JSON Parser & Tree** | Interactive collapsible tree view, node path copy, error locator | Custom Tree / Monaco |
| **JSONPath Evaluator** | Real-time JSON query evaluator with result highlighting | `jsonpath-plus` |
| **JSON Schema Validator** | Validate JSON payloads against Draft-07 / 2020-12 schemas | `ajv` |

### Module 3: Diff Viewer
| Tool | Features | Engine |
|---|---|---|
| **Side-by-Side Diff** | Two-pane visual diff with line numbers, insertion/deletion highlights | Monaco Diff Editor |
| **Inline Diff** | Unified GitHub-style diff view with character-level accuracy | `diff2html` |
| **Diff Options** | Ignore whitespace, ignore case, swap panes, copy patch | Client-side |

### Module 4: Data & Schema Converters
| Tool | Features | Engine |
|---|---|---|
| **JSON ↔ CSV / TSV** | Two-way conversion, custom delimiter, header toggle, array flattening | `papaparse` |
| **JSON ↔ YAML** | Bidirectional conversion, indentation configuration | `yaml` |
| **Base64 Encoder / Decoder** | Text, JSON, and file Base64 encoding/decoding with URL-safe option | Native / Worker |
| **URL Encoder / Decoder** | Query string parsing, parameter editor, URI component encode | Native `URLSearchParams` |

### Module 5: Security, Crypto & Identity
| Tool | Features | Engine |
|---|---|---|
| **BCrypt Tool** | Hash generation with custom salt rounds (4-14), hash verification against plain text | `bcryptjs` / .NET fallback |
| **JWT Debugger** | Header & payload decoder, expiration timer, signature verification helper | `jwt-decode` |
| **Hash & HMAC Generator** | MD5, SHA-1, SHA-256, SHA-512, HMAC with custom secret keys | Web Crypto API |
| **UUID / GUID Generator** | v4, v7 GUID generation, batch generator (1-100), uppercase/hyphen toggles | `crypto.randomUUID` |

### Module 6: .NET & Developer Utilities
| Tool | Features | Engine |
|---|---|---|
| **C# POCO to TypeScript** | Convert C# class definitions to TypeScript interfaces / types | Regex / Roslyn AST |
| **C# POCO to JSON Schema** | Generate JSON Schema from C# classes | Schema generator |
| **Regex Tester** | Real-time regex testing with flag toggles, explanation, and sample presets | JS / .NET Regex |
| **Cron Expression Parser** | Human-readable schedule translation, next 5 execution timestamps | `cronstrue` |

---

## 4. Implementation Phases & Roadmap

### Phase 1: Project Scaffolding & Core Architecture
- [x] Initialize Angular workspace (`standalone: true`, `routing: true`, `styles: tailwindcss / scss`).
- [x] Install and configure Tailwind CSS and Lucide icons.
- [x] Build responsive shell layout:
  - Collapsible sidebar with category groupings.
  - Top bar with global quick search (Ctrl/Cmd + K).
  - Dark / Light / System theme toggle.
  - Active tool breadcrumbs & favorites star.
- [x] Set up `shared` UI primitives:
  - Action toolbar (Copy, Clear, Paste sample, Download, Fullscreen).
  - Split pane container (Input / Output layout with adjustable divider).
  - Status toast notification system.

### Phase 2: Formatter & Parser Tools
- [x] Build **JSON Formatter & Validator** with beautify (2sp/4sp/tab), minify, sort keys, escape, and validation error locator.
- [x] Build **SQL Formatter** supporting standard SQL, T-SQL, PostgreSQL, MySQL, and SQLite dialects with keyword casing controls.
- [x] Build **XML / HTML Formatter** with indentation formatting, minification, and well-formedness diagnostics.
- [x] Build **JSONPath Evaluator** with real-time JSON filtering, match counters, and common query presets.
- [x] Build **JSON Parser & Tree** with recursive collapsible nodes, type badges, expand/collapse all, and one-click JSONPath copying.

### Phase 3: Diff Viewer & Data Converters
- [ ] Implement Monaco **Diff Editor** with side-by-side and inline toggles.
- [ ] Build **CSV ↔ JSON** and **YAML ↔ JSON** converter panels.
- [ ] Build **Base64** and **URL Encode/Decode** utility tools.

### Phase 4: Crypto, Security & .NET Utilities
- [ ] Implement **BCrypt Generator & Verifier** (hash string, verify password against hash).
- [ ] Implement **JWT Inspector** with payload decoding and token expiration indicators.
- [ ] Implement **UUID/GUID Generator** with bulk generation and formatting options.
- [ ] Implement **C# POCO to TypeScript Interface** generator.
- [ ] Implement **Regex Tester** with group match highlighting.

### Phase 5: Polish, PWA & Performance
- [ ] Configure Web Worker offloading for large file formatting / hashing.
- [ ] Add Service Worker for offline PWA installation.
- [ ] Optimize bundle size (code splitting per tool route, lazy-loading Monaco modules).

### Phase 6: Production Build & IIS Deployment
- [ ] Verify `web.config` rewrite rules for Angular SPA routing.
- [ ] Run `npm run build --configuration production`.
- [ ] Deploy output to production web server root.
- [ ] Verify SSL, caching, and routing at `https://lab.mahfozmt.com`.

---

## 5. Agent Pair-Programming Guide

When opening this workspace with an AI coding agent, use prompts following this structure:

```markdown
We are working on Phase [X]: [Module Name].
Reference PLAN.md for specifications.
Please scaffold [Tool Name] under `src/app/tools/[category]/[tool-name]`:
1. Standalone Angular component with Signals.
2. Two-pane layout with shared action toolbar (Copy, Clear, Sample).
3. Unit tests verifying transformation logic.
```

---

## 6. Directory Structure Target

```
dev-assistant/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Optional CI/CD deployment
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── layout/             # Sidebar, Header, Shell
│   │   │   ├── services/           # ThemeService, StorageService, HotkeysService
│   │   │   └── models/             # Tool definition interfaces
│   │   ├── shared/
│   │   │   ├── components/         # CodeEditor, ToolHeader, SplitPane, CopyButton
│   │   │   └── pipes/
│   │   └── tools/
│   │       ├── formatters/         # json, sql, xml, css
│   │       ├── parsers/            # json-tree, jsonpath, schema-validator
│   │       ├── diff/               # code-diff, text-diff
│   │       ├── converters/         # csv-json, yaml-json, base64, url
│   │       ├── crypto/             # bcrypt, jwt, hash, guid
│   │       └── dotnet/             # csharp-to-ts, regex, cron
│   ├── assets/
│   └── index.html
├── web.config                      # IIS 10 rewrite rules
├── angular.json
├── package.json
├── tsconfig.json
├── README.md
└── PLAN.md
```
