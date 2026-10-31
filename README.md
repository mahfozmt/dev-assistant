# DevAssistant (Developer Productivity Suite)

> An open-source, fast, and secure developer toolkit featuring code formatters, data parsers, diff viewers, converters, and .NET/C# developer utilities. Built for hosting on **[lab.mahfozmt.com](https://lab.mahfozmt.com)**.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Angular%20%7C%20.NET-informational.svg)](#architecture)
[![Host](https://img.shields.io/badge/hosted%20at-lab.mahfozmt.com-success.svg)](https://lab.mahfozmt.com)

---

## Overview

DevAssistant is built to replace cluttered, ad-heavy developer web tools with a sleek, client-first, privacy-respecting dashboard. All lightweight transformations (formatting, parsing, conversions, diffs) execute directly in the browser via Web Workers and WebAssembly, while complex operations (BCrypt validation, .NET Regex compilation, C# POCO generation) leverage a high-performance ASP.NET Core backend.

### Key Tools & Capabilities

- **Code & Query Formatters**: JSON, SQL, XML, HTML, CSS, JavaScript/TypeScript.
- **Parsers & Evaluators**: JSON Validator, JSON Schema checker, JSONPath evaluator, XML/XPath.
- **Diff & Comparison Viewer**: Side-by-side and inline visual difference comparison with whitespace normalization.
- **Data & Schema Converters**: JSON ↔ CSV, JSON ↔ YAML, JSON ↔ XML, Base64 encoder/decoder, URL encoder/decoder, Hex/Binary.
- **Security & Crypto**: BCrypt hash generation & verification, JWT debugger/inspector, SHA-256/512, MD5, HMAC generator, UUID/GUID generator.
- **.NET & Developer Utilities**: C# Class to TypeScript interface / JSON Schema converter, .NET Regex tester with timeout protection, Cron expression parser.

---

## Architecture

```
dev-assistant/
├── src/                      # Angular Frontend (Client-side suite)
│   ├── app/
│   │   ├── core/             # Services, state, layout, theme
│   │   ├── shared/           # UI components, monaco editor, badges
│   │   └── tools/            # Feature modules (formatters, parsers, diff, crypto)
│   └── assets/               # Static assets, web workers
├── api/                      # Optional ASP.NET Core Minimal API (.NET 8/9)
│   ├── Controllers/          # Specialized backend endpoints (BCrypt, Roslyn C# analyzer)
│   └── Program.cs
├── web.config                # Production IIS configuration with URL Rewrite
└── PLAN.md                   # Complete implementation plan & agent build instructions
```

---

## Getting Started

Refer to [PLAN.md](PLAN.md) for step-by-step instructions on bootstrapping and building out each tool module with an AI assistant.

### Frontend (Angular)
```bash
npm install
npm run start
```

### Production Build & Deployment
```bash
npm run build --configuration production
# Copy dist files and web.config to your web server root
```

---

## License

MIT © [Mahfozur Rahman](https://mahfozmt.com)
