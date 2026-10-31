# DevAssistant — Implementation & Build Plan

> **Live Deployment**: [https://lab.mahfozmt.com](https://lab.mahfozmt.com)  
> **Repository**: [https://github.com/mahfozmt/dev-assistant](https://github.com/mahfozmt/dev-assistant) (`main` branch)  
> **CI/CD Status**: Automated GitHub Actions testing, building, and deploying via FTPS on every push to `main`.

---

## 1. Project Overview & Architectural Standards

DevAssistant is an ultra-fast, client-side developer workstation built with **Angular 19** (Standalone Components, Signals), **Tailwind CSS**, and **Lucide Icons**. It serves as an ad-free, privacy-first developer utility replacing fragmented web tools.

### Core Architecture Rules for Any Implementing Agent
1. **Client-Side Privacy**: All processing runs directly in the client browser. No code, tokens, or customer data is transmitted to an external server.
2. **Component Architecture**: Every tool must be a Standalone Angular Component with:
   - **Reactive Signals**: Use `signal()` and `computed()` for state management (avoid legacy `Subject` or complex RxJS when signals suffice).
   - **Shared Layout Primitives**: Integrate `<app-split-pane>` (or custom dual-pane) and `<app-action-toolbar>`.
   - **Toast Notifications**: Inject `ToastService` for copy, format, and error notifications.
3. **Route Lazy Loading**: Every tool must be registered in [src/app/app.routes.ts](file:///e:/Mahfoz/dev-assistant/src/app/app.routes.ts) using `loadComponent: () => import(...).then(m => m.ComponentName)`.
4. **Unit Test Coverage**: Every component must have a corresponding `.spec.ts` testing formatting, conversion, and error scenarios. Tests must register `provideAppIcons()` from `src/app/core/icons.provider` to avoid missing icon errors in Karma.
5. **Humanized Design**: Clean typography, subtle dark/light borders, monospace code blocks, and zero AI marketing clichés.

---

## 2. Tool Implementation Inventory & Status

| # | Tool Name | Route | Category | Status |
|---|---|---|---|---|
| 1 | **JSON Formatter & Validator** | `/tools/formatters/json` | Formatters | ✅ Completed & Live |
| 2 | **SQL Formatter** | `/tools/formatters/sql` | Formatters | ✅ Completed & Live |
| 3 | **XML / HTML Formatter** | `/tools/formatters/xml-html` | Formatters | ✅ Completed & Live |
| 4 | **JSON Parser & Tree Viewer** | `/tools/parsers/json-tree` | Parsers | ✅ Completed & Live |
| 5 | **JSONPath Evaluator** | `/tools/parsers/jsonpath` | Parsers | ✅ Completed & Live |
| 6 | **Side-by-Side Diff Viewer** | `/tools/diff/side-by-side` | Diff Viewer | ⏳ **Pending (Phase 3)** |
| 7 | **Inline Diff Viewer** | `/tools/diff/inline` | Diff Viewer | ⏳ **Pending (Phase 3)** |
| 8 | **CSS / SCSS Formatter** | `/tools/formatters/css` | Formatters | ⏳ **Pending (Phase 3)** |
| 9 | **JSON Schema Validator** | `/tools/parsers/schema-validator` | Parsers | ⏳ **Pending (Phase 3)** |
| 10 | **JSON ↔ CSV / TSV Converter** | `/tools/converters/json-csv` | Converters | ⏳ **Pending (Phase 4)** |
| 11 | **JSON ↔ YAML Converter** | `/tools/converters/json-yaml` | Converters | ⏳ **Pending (Phase 4)** |
| 12 | **Base64 Encoder / Decoder** | `/tools/converters/base64` | Converters | ⏳ **Pending (Phase 4)** |
| 13 | **URL & Query String Tool** | `/tools/converters/url` | Converters | ⏳ **Pending (Phase 4)** |
| 14 | **BCrypt Generator & Verifier** | `/tools/crypto/bcrypt` | Crypto & Security | ⏳ **Pending (Phase 5)** |
| 15 | **JWT Debugger & Inspector** | `/tools/crypto/jwt` | Crypto & Security | ⏳ **Pending (Phase 5)** |
| 16 | **Hash & HMAC Generator** | `/tools/crypto/hash` | Crypto & Security | ⏳ **Pending (Phase 5)** |
| 17 | **UUID / GUID Generator** | `/tools/crypto/uuid` | Crypto & Security | ⏳ **Pending (Phase 5)** |
| 18 | **C# POCO to TypeScript** | `/tools/dotnet/csharp-to-ts` | .NET Utilities | ⏳ **Pending (Phase 6)** |
| 19 | **C# POCO to JSON Schema** | `/tools/dotnet/csharp-to-json-schema` | .NET Utilities | ⏳ **Pending (Phase 6)** |
| 20 | **Regex Tester & Explainer** | `/tools/dotnet/regex-tester` | .NET Utilities | ⏳ **Pending (Phase 6)** |
| 21 | **Cron Expression Parser** | `/tools/dotnet/cron-parser` | .NET Utilities | ⏳ **Pending (Phase 6)** |

---

## 3. Detailed Specifications for Uncompleted Tools

---

### 🚀 Phase 3: Diff Viewers & Code Formatters

#### 3.1. Side-by-Side Diff Viewer
* **Route**: `/tools/diff/side-by-side`
* **File Path**: `src/app/tools/diff/side-by-side/side-by-side-diff.component.ts`
* **Test Path**: `src/app/tools/diff/side-by-side/side-by-side-diff.component.spec.ts`
* **Recommended Packages**: `diff` (`npm install diff @types/diff`)
* **UI Layout**:
  - Two input editors: "Original (Left)" and "Modified (Right)".
  - Controls bar:
    - Ignore Whitespace toggle (`boolean`).
    - Case Sensitive toggle (`boolean`).
    - Granularity: `Words` / `Lines` / `Characters`.
    - "Swap Panes" button.
  - Diff Output Panel:
    - Two synchronized line-numbered panels.
    - Red background highlight for deleted lines/words (`bg-rose-500/10 text-rose-600 dark:text-rose-400`).
    - Green background highlight for added lines/words (`bg-emerald-500/10 text-emerald-600 dark:text-emerald-400`).
    - Difference summary badge: `+X additions, -Y deletions, Z unchanged`.
* **Sample Data**:
  - Original: `{"env": "staging", "debug": true, "timeout": 3000}`
  - Modified: `{"env": "production", "debug": false, "timeout": 5000, "retries": 3}`

#### 3.2. Inline Diff Viewer
* **Route**: `/tools/diff/inline`
* **File Path**: `src/app/tools/diff/inline/inline-diff.component.ts`
* **Test Path**: `src/app/tools/diff/inline/inline-diff.component.spec.ts`
* **Recommended Packages**: `diff`
* **UI Layout**:
  - Top input split pane for "Original" and "Modified" text.
  - Action bar with "Generate Patch", "Copy Unified Patch", and "Download .patch".
  - Unified output view: GitHub-style single column with `+` and `-` markers, line numbering for both left and right versions.

#### 3.3. CSS / SCSS Formatter
* **Route**: `/tools/formatters/css`
* **File Path**: `src/app/tools/formatters/css/css-formatter.component.ts`
* **Test Path**: `src/app/tools/formatters/css/css-formatter.component.spec.ts`
* **Key Features**:
  - Indent size (2 spaces, 4 spaces, tabs).
  - Alphabetize CSS properties within each ruleset (`sortProperties` option).
  - Format / Beautify action.
  - Minify CSS action (strips comments, spaces, collapses zero units).
  - Validation: Catch unclosed braces or invalid selector syntax.

#### 3.4. JSON Schema Validator
* **Route**: `/tools/parsers/schema-validator`
* **File Path**: `src/app/tools/parsers/schema-validator/schema-validator.component.ts`
* **Test Path**: `src/app/tools/parsers/schema-validator/schema-validator.component.spec.ts`
* **Recommended Packages**: `ajv` (`npm install ajv ajv-formats`)
* **UI Layout**:
  - Split pane: Left pane for "JSON Data", Right pane for "JSON Schema (Draft-07 / 2020-12)".
  - Top action bar with "Validate" button, "Schema Draft" dropdown, and sample presets.
  - Result Banner:
    - If valid: Green badge `Valid Schema: Data complies with schema`.
    - If invalid: Red error box listing each error with `instancePath`, `schemaPath`, `keyword`, and human-readable message.

---

### 🚀 Phase 4: Data & Schema Converters

#### 4.1. JSON ↔ CSV / TSV Converter
* **Route**: `/tools/converters/json-csv`
* **File Path**: `src/app/tools/converters/json-csv/json-csv.component.ts`
* **Test Path**: `src/app/tools/converters/json-csv/json-csv.component.spec.ts`
* **Recommended Packages**: `papaparse` (`npm install papaparse @types/papaparse`)
* **Key Features**:
  - Two-way toggle: `JSON to CSV` and `CSV to JSON`.
  - Delimiter selection: Comma (`,`), Tab (`\t`), Semicolon (`;`), Pipe (`|`).
  - Header row toggle (`hasHeader: true/false`).
  - Flatten nested JSON objects option (`user.address.city`).
  - Download as `.csv` or `.json`.

#### 4.2. JSON ↔ YAML Converter
* **Route**: `/tools/converters/json-yaml`
* **File Path**: `src/app/tools/converters/json-yaml/json-yaml.component.ts`
* **Test Path**: `src/app/tools/converters/json-yaml/json-yaml.component.spec.ts`
* **Recommended Packages**: `yaml` (`npm install yaml`)
* **Key Features**:
  - Bidirectional instant conversion.
  - Indent size configuration for YAML (2 spaces, 4 spaces).
  - Presets: Docker Compose sample, Kubernetes Deployment manifest, and OpenAPI spec.

#### 4.3. Base64 Encoder / Decoder
* **Route**: `/tools/converters/base64`
* **File Path**: `src/app/tools/converters/base64/base64.component.ts`
* **Test Path**: `src/app/tools/converters/base64/base64.component.spec.ts`
* **Key Features**:
  - Plain Text ↔ Base64 (full UTF-8 support using `TextEncoder` / `TextDecoder`).
  - URL-Safe Base64 mode (replaces `+` with `-` and `/` with `_`, strips `=`).
  - File to Base64 data URL reader (drop image/pdf file and extract `data:image/png;base64,...`).
  - Instant live encoding as the user types.

#### 4.4. URL & Query String Tool
* **Route**: `/tools/converters/url`
* **File Path**: `src/app/tools/converters/url/url-converter.component.ts`
* **Test Path**: `src/app/tools/converters/url/url-converter.component.spec.ts`
* **Key Features**:
  - Full URL encoder & decoder (`encodeURIComponent`, `decodeURIComponent`).
  - Interactive Query Parameter Table:
    - Parses `?key=value&filter=active` into an editable key-value grid.
    - Add, edit, enable/disable, and delete query parameters.
    - Synchronizes back to the full URL string in real-time.

---

### 🚀 Phase 5: Security, Crypto & Identity

#### 5.1. BCrypt Generator & Verifier
* **Route**: `/tools/crypto/bcrypt`
* **File Path**: `src/app/tools/crypto/bcrypt/bcrypt.component.ts`
* **Test Path**: `src/app/tools/crypto/bcrypt/bcrypt.component.spec.ts`
* **Recommended Packages**: `bcryptjs` (`npm install bcryptjs @types/bcryptjs`)
* **Key Features**:
  - **Tab 1: Hash Generator**:
    - Plain text password input.
    - Salt rounds slider (4 to 14, default 10) with estimated computation time.
    - Generate Hash button producing standard `$2a$` or `$2b$` format.
  - **Tab 2: Password Match Verifier**:
    - Inputs for "Plain Text Password" and "BCrypt Hash".
    - Instant match verdict: Green "Password Matches Hash" or Red "Password Mismatch".

#### 5.2. JWT Debugger & Inspector
* **Route**: `/tools/crypto/jwt`
* **File Path**: `src/app/tools/crypto/jwt/jwt-debugger.component.ts`
* **Test Path**: `src/app/tools/crypto/jwt/jwt-debugger.component.spec.ts`
* **Recommended Packages**: `jwt-decode` (`npm install jwt-decode`)
* **Key Features**:
  - 3-part colored JWT viewer (Header: Red, Payload: Purple, Signature: Blue).
  - Decoded Header JSON panel.
  - Decoded Payload claims panel (`sub`, `iss`, `aud`, `exp`, `iat`, custom roles).
  - Expiration Status Badge:
    - Active countdown (`Expires in 42 minutes`) or `Expired 3 days ago` with ISO date conversion.
  - Sample JWT tokens (Auth0, Firebase, ASP.NET Core Identity).

#### 5.3. Hash & HMAC Generator
* **Route**: `/tools/crypto/hash`
* **File Path**: `src/app/tools/crypto/hash/hash-generator.component.ts`
* **Test Path**: `src/app/tools/crypto/hash/hash-generator.component.spec.ts`
* **Recommended Packages**: Web Crypto API (`crypto.subtle`) + `crypto-js` for MD5 fallback
* **Key Features**:
  - Algorithms: MD5, SHA-1, SHA-256, SHA-384, SHA-512.
  - Output formats: Hexadecimal (lowercase/UPPERCASE) and Base64.
  - Keyed HMAC support: Secret key input field for HMAC-SHA256 and HMAC-SHA512 generation.
  - Multi-hash dashboard: Computes all algorithms simultaneously for the input payload.

#### 5.4. UUID / GUID Generator
* **Route**: `/tools/crypto/uuid`
* **File Path**: `src/app/tools/crypto/uuid/uuid-generator.component.ts`
* **Test Path**: `src/app/tools/crypto/uuid/uuid-generator.component.spec.ts`
* **Key Features**:
  - UUID v4 (Cryptographically random via `crypto.randomUUID()`) and UUID v7 (Time-sortable).
  - Bulk generator quantity (1 to 100).
  - Formatting toggles:
    - Uppercase / Lowercase (`E04B...` vs `e04b...`).
    - Hyphens included (`8-4-4-4-12`) or removed (`32 hex digits`).
    - Braces `{...}` or parentheses.
    - C# Guid format `Guid.Parse("...")` or `new Guid("...")`.
  - "Copy All" and "Download as .txt" actions.

---

### 🚀 Phase 6: .NET & Developer Utilities

#### 6.1. C# POCO to TypeScript Interface
* **Route**: `/tools/dotnet/csharp-to-ts`
* **File Path**: `src/app/tools/dotnet/csharp-to-ts/csharp-to-ts.component.ts`
* **Test Path**: `src/app/tools/dotnet/csharp-to-ts/csharp-to-ts.component.spec.ts`
* **Key Features**:
  - Parse C# `class`, `record`, and `struct` definitions.
  - Type mapping table:
    - `string` -> `string`
    - `int`, `long`, `double`, `float`, `decimal` -> `number`
    - `bool` -> `boolean`
    - `DateTime`, `DateTimeOffset`, `DateOnly` -> `string` (or `Date` option)
    - `Guid` -> `string`
    - `List<T>`, `IEnumerable<T>`, `IList<T>`, `T[]` -> `T[]`
    - `Dictionary<string, T>` -> `Record<string, T>`
    - Nullable `T?` -> `T | null` or `T?`
  - Option to generate `interface` or `type`.
  - Option to convert PascalCase properties to camelCase.

#### 6.2. C# POCO to JSON Schema
* **Route**: `/tools/dotnet/csharp-to-json-schema`
* **File Path**: `src/app/tools/dotnet/csharp-to-json-schema/csharp-to-json-schema.component.ts`
* **Test Path**: `src/app/tools/dotnet/csharp-to-json-schema/csharp-to-json-schema.component.spec.ts`
* **Key Features**:
  - Generates JSON Schema Draft-07 from C# class properties.
  - Handles `[Required]`, `[StringLength]`, `[Range]` data annotation attributes to populate schema constraints (`required`, `minLength`, `maxLength`, `minimum`, `maximum`).

#### 6.3. Regex Tester & Explainer
* **Route**: `/tools/dotnet/regex-tester`
* **File Path**: `src/app/tools/dotnet/regex-tester/regex-tester.component.ts`
* **Test Path**: `src/app/tools/dotnet/regex-tester/regex-tester.component.spec.ts`
* **Key Features**:
  - Pattern bar with flags: `g` (global), `i` (case-insensitive), `m` (multiline), `s` (dotAll).
  - Test string editor with real-time match highlighting.
  - Captured Groups table (Group #, Group Name, Match Value, Index Range).
  - Regex Cheatsheet presets: Email, IPv4, Phone, URL, GUID, Slug, ISO Date.

#### 6.4. Cron Expression Parser
* **Route**: `/tools/dotnet/cron-parser`
* **File Path**: `src/app/tools/dotnet/cron-parser/cron-parser.component.ts`
* **Test Path**: `src/app/tools/dotnet/cron-parser/cron-parser.component.spec.ts`
* **Recommended Packages**: `cronstrue` (`npm install cronstrue`)
* **Key Features**:
  - 5-part (Unix standard) and 6-part (Quartz / AWS) cron expression parsing.
  - Human-readable translation banner: e.g. `"At 04:00 AM, on day 1 of the month"`.
  - Next 5 scheduled execution timestamps calculated live.
  - Presets: "Every 5 minutes", "Daily at midnight", "Every Monday at 9am", "First day of month".

---

## 4. Implementation Workflow & Quality Verification

When implementing any phase above, follow these exact 4 steps:

### Step 1: Install Dependencies & Create Component
```bash
npm install <package-name>
```
Scaffold the component under `src/app/tools/<category>/<tool-name>/<tool-name>.component.ts` using Angular Signals and Standalone imports.

### Step 2: Register in Routes
In `src/app/app.routes.ts`, replace the `ToolPlaceholderComponent` route with:
```typescript
{
  path: 'tools/<category>/<tool-name>',
  loadComponent: () => import('./tools/<category>/<tool-name>/<tool-name>.component').then(m => m.<ComponentName>),
  title: '<Tool Name> — DevAssistant'
}
```

### Step 3: Run Unit Tests & Build Check
```bash
npx ng test --watch=false --browsers=ChromeHeadless
npx ng build --configuration production
```
Verify 100% green tests and error-free bundle generation.

### Step 4: Git Commit & Automatic Deployment
Commit with clear conventional commit messages:
```bash
git add .
git commit -m "feat(<category>): implement <tool-name> with unit tests"
git push origin main
```
The GitHub Actions workflow will automatically run tests, build the production artifact, and deploy it to `https://lab.mahfozmt.com` via FTPS.
