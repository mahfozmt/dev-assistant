import { Routes } from '@angular/router';
import { ShellComponent } from './core/layout/shell.component';
import { HomeComponent } from './core/home/home.component';
import { ToolPlaceholderComponent } from './shared/components/tool-placeholder.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
        title: 'DevAssistant — Developer Productivity Workstation'
      },
      // Module 1: Formatters
      { path: 'tools/formatters/json', component: ToolPlaceholderComponent, title: 'JSON Formatter & Validator — DevAssistant' },
      { path: 'tools/formatters/sql', component: ToolPlaceholderComponent, title: 'SQL Formatter — DevAssistant' },
      { path: 'tools/formatters/xml-html', component: ToolPlaceholderComponent, title: 'XML / HTML Formatter — DevAssistant' },
      { path: 'tools/formatters/css', component: ToolPlaceholderComponent, title: 'CSS / SCSS Formatter — DevAssistant' },

      // Module 2: Parsers & Evaluators
      { path: 'tools/parsers/json-tree', component: ToolPlaceholderComponent, title: 'JSON Parser & Tree — DevAssistant' },
      { path: 'tools/parsers/jsonpath', component: ToolPlaceholderComponent, title: 'JSONPath Evaluator — DevAssistant' },
      { path: 'tools/parsers/schema-validator', component: ToolPlaceholderComponent, title: 'JSON Schema Validator — DevAssistant' },

      // Module 3: Diff Viewer
      { path: 'tools/diff/side-by-side', component: ToolPlaceholderComponent, title: 'Side-by-Side Diff — DevAssistant' },
      { path: 'tools/diff/inline', component: ToolPlaceholderComponent, title: 'Inline Diff — DevAssistant' },

      // Module 4: Converters
      { path: 'tools/converters/json-csv', component: ToolPlaceholderComponent, title: 'JSON ↔ CSV / TSV — DevAssistant' },
      { path: 'tools/converters/json-yaml', component: ToolPlaceholderComponent, title: 'JSON ↔ YAML — DevAssistant' },
      { path: 'tools/converters/base64', component: ToolPlaceholderComponent, title: 'Base64 Encoder / Decoder — DevAssistant' },
      { path: 'tools/converters/url', component: ToolPlaceholderComponent, title: 'URL & Query String Tool — DevAssistant' },

      // Module 5: Crypto & Security
      { path: 'tools/crypto/bcrypt', component: ToolPlaceholderComponent, title: 'BCrypt Tool — DevAssistant' },
      { path: 'tools/crypto/jwt', component: ToolPlaceholderComponent, title: 'JWT Debugger — DevAssistant' },
      { path: 'tools/crypto/hash', component: ToolPlaceholderComponent, title: 'Hash & HMAC Generator — DevAssistant' },
      { path: 'tools/crypto/uuid', component: ToolPlaceholderComponent, title: 'UUID / GUID Generator — DevAssistant' },

      // Module 6: .NET Utilities
      { path: 'tools/dotnet/csharp-to-ts', component: ToolPlaceholderComponent, title: 'C# POCO to TypeScript — DevAssistant' },
      { path: 'tools/dotnet/csharp-to-json-schema', component: ToolPlaceholderComponent, title: 'C# POCO to JSON Schema — DevAssistant' },
      { path: 'tools/dotnet/regex-tester', component: ToolPlaceholderComponent, title: 'Regex Tester — DevAssistant' },
      { path: 'tools/dotnet/cron-parser', component: ToolPlaceholderComponent, title: 'Cron Expression Parser — DevAssistant' },

      { path: '**', redirectTo: '' }
    ]
  }
];
