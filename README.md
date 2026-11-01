# DevAssistant (Developer Productivity Suite)

> An open-source, ultra-fast, and privacy-first developer workstation featuring code formatters, data parsers, diff viewers, converters, and .NET/C# developer utilities. Hosted live on **[lab.mahfozmt.com](https://lab.mahfozmt.com)**.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Angular%2019%20%7C%20Tailwind%20CSS-informational.svg)](#architecture)
[![Build & Deploy](https://github.com/mahfozmt/dev-assistant/actions/workflows/deploy.yml/badge.svg)](https://github.com/mahfozmt/dev-assistant/actions/workflows/deploy.yml)
[![Host](https://img.shields.io/badge/hosted%20at-lab.mahfozmt.com-success.svg)](https://lab.mahfozmt.com)

---

## Overview

DevAssistant is built to replace cluttered, ad-heavy developer web tools with a sleek, client-first, privacy-respecting dashboard. 

**Zero Cloud Transmission • Zero Telemetry • 100% Client-Side Processing**:
All transformations, cryptographic operations, schema validations, and diff computations execute directly inside the user's browser. Sensitive connection strings, passwords, JWT tokens, and private source code never leave your device.

### Key Tools & Capabilities

- **Code & Query Formatters**: JSON, SQL, XML, HTML, CSS/SCSS with custom indentation and property alphabetization.
- **Parsers & Evaluators**: JSON Tree Viewer, JSONPath Evaluator, and JSON Schema Validator (Draft-07 & 2020-12 via Ajv).
- **Diff & Comparison Viewer**: Side-by-side synchronized line comparison and unified GitHub-style inline diff with `.patch` export.
- **Data & Schema Converters**: JSON ↔ CSV/TSV (`papaparse`), JSON ↔ YAML (`js-yaml`), Base64 encoder/decoder (Text, File & URL-safe), and URL & Query String Inspector.
- **Security & Crypto**: BCrypt hash generation & verification (`bcryptjs`), JWT debugger/inspector with expiration countdown, MD5, SHA-1, SHA-256, SHA-512 & HMAC generator (`crypto-js`), and UUID/GUID generator (v4 random & v7 time-ordered).
- **.NET & Developer Utilities**: C# Class to TypeScript interface, C# Class to JSON Schema converter, Regex tester with capture group inspector, and Cron expression human-readable parser (`cronstrue`).

---

## Architecture

DevAssistant is architected as an **Angular 19 standalone single-page workstation** designed for instant offline capability and static hosting (Plesk IIS Windows Hosting via FTPS CI/CD):

```
dev-assistant/
├── .github/workflows/deploy.yml # Automated CI/CD pipeline (Test -> Build -> FTPS Deploy)
├── src/                         # Angular 19 Frontend (Client-side suite)
│   ├── app/
│   │   ├── core/                # Services, state, layout, icons, theme
│   │   ├── shared/              # Shared UI components (action toolbar, split-pane)
│   │   └── tools/               # Standalone feature tools (formatters, parsers, diff, converters, crypto, dotnet)
│   ├── assets/                  # Static assets & public resources
│   └── styles.scss              # Global Tailwind styling & theme tokens
├── web.config                   # Production IIS configuration with URL Rewrite
├── PLAN.md                      # Detailed tool specifications & implementation roadmap
└── LICENSE                      # MIT Open Source License
```

> **Note on Backend & Workers**:
> DevAssistant's core philosophy is **100% client-side privacy**. To ensure zero data leakage and effortless serverless hosting, all operations (including BCrypt and cryptographic hashing) run client-side in TypeScript. Web Workers (for off-main-thread compute on large files >50MB) and an optional ASP.NET Core Roslyn engine (`api/`) are reserved as optional extensions on the project roadmap if native server-side assembly execution is needed.

---

## Getting Started

Refer to [PLAN.md](PLAN.md) for detailed tool specifications, route configurations, and testing guides.

### Local Development
```bash
npm install
npm run start
```
Visit `http://localhost:4200/` in your browser.

### Running Test Suite
```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

### Production Build
```bash
npm run build --configuration production
```
Artifacts compile to `dist/dev-assistant/` ready for IIS or static hosting.

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).  
Copyright © 2026 [Mahfozur Rahman](https://mahfozmt.com).
