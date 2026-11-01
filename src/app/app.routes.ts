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
      {
        path: 'tools/formatters/json',
        loadComponent: () => import('./tools/formatters/json/json-formatter.component').then(m => m.JsonFormatterComponent),
        title: 'JSON Formatter & Validator — DevAssistant'
      },
      {
        path: 'tools/formatters/sql',
        loadComponent: () => import('./tools/formatters/sql/sql-formatter.component').then(m => m.SqlFormatterComponent),
        title: 'SQL Formatter — DevAssistant'
      },
      {
        path: 'tools/formatters/xml-html',
        loadComponent: () => import('./tools/formatters/xml-html/xml-formatter.component').then(m => m.XmlFormatterComponent),
        title: 'XML / HTML Formatter — DevAssistant'
      },
      {
        path: 'tools/formatters/css',
        loadComponent: () => import('./tools/formatters/css/css-formatter.component').then(m => m.CssFormatterComponent),
        title: 'CSS / SCSS Formatter — DevAssistant'
      },

      // Module 2: Parsers & Evaluators
      {
        path: 'tools/parsers/json-tree',
        loadComponent: () => import('./tools/parsers/json-tree/json-tree.component').then(m => m.JsonTreeComponent),
        title: 'JSON Parser & Tree — DevAssistant'
      },
      {
        path: 'tools/parsers/jsonpath',
        loadComponent: () => import('./tools/parsers/jsonpath/jsonpath-evaluator.component').then(m => m.JsonPathEvaluatorComponent),
        title: 'JSONPath Evaluator — DevAssistant'
      },
      {
        path: 'tools/parsers/schema-validator',
        loadComponent: () => import('./tools/parsers/schema-validator/schema-validator.component').then(m => m.SchemaValidatorComponent),
        title: 'JSON Schema Validator — DevAssistant'
      },

      // Module 3: Diff Viewer
      {
        path: 'tools/diff/side-by-side',
        loadComponent: () => import('./tools/diff/side-by-side/side-by-side-diff.component').then(m => m.SideBySideDiffComponent),
        title: 'Side-by-Side Diff — DevAssistant'
      },
      {
        path: 'tools/diff/inline',
        loadComponent: () => import('./tools/diff/inline/inline-diff.component').then(m => m.InlineDiffComponent),
        title: 'Inline Diff — DevAssistant'
      },

      // Module 4: Converters
      { path: 'tools/converters/json-csv', loadComponent: () => import('./tools/converters/json-csv/json-csv.component').then(m => m.JsonCsvComponent), title: 'JSON ↔ CSV / TSV — DevAssistant' },
      { path: 'tools/converters/json-yaml', loadComponent: () => import('./tools/converters/json-yaml/json-yaml.component').then(m => m.JsonYamlComponent), title: 'JSON ↔ YAML — DevAssistant' },
      { path: 'tools/converters/base64', loadComponent: () => import('./tools/converters/base64/base64.component').then(m => m.Base64Component), title: 'Base64 Encoder / Decoder — DevAssistant' },
      { path: 'tools/converters/url', loadComponent: () => import('./tools/converters/url/url.component').then(m => m.UrlComponent), title: 'URL & Query String Tool — DevAssistant' },

      // Module 5: Crypto & Security
      { path: 'tools/crypto/bcrypt', loadComponent: () => import('./tools/crypto/bcrypt/bcrypt.component').then(m => m.BcryptComponent), title: 'BCrypt Tool — DevAssistant' },
      { path: 'tools/crypto/jwt', loadComponent: () => import('./tools/crypto/jwt/jwt.component').then(m => m.JwtComponent), title: 'JWT Debugger — DevAssistant' },
      { path: 'tools/crypto/hash', loadComponent: () => import('./tools/crypto/hash/hash.component').then(m => m.HashComponent), title: 'Hash & HMAC Generator — DevAssistant' },
      { path: 'tools/crypto/uuid', loadComponent: () => import('./tools/crypto/uuid/uuid.component').then(m => m.UuidComponent), title: 'UUID / GUID Generator — DevAssistant' },

      // Module 6: .NET Utilities
      { path: 'tools/dotnet/roslyn-workbench', loadComponent: () => import('./tools/dotnet/roslyn-workbench/roslyn-workbench.component').then(m => m.RoslynWorkbenchComponent), title: '.NET 10 & Roslyn Workbench — DevAssistant' },
      { path: 'tools/dotnet/csharp-to-ts', loadComponent: () => import('./tools/dotnet/csharp-to-ts/csharp-to-ts.component').then(m => m.CsharpToTsComponent), title: 'C# POCO to TypeScript — DevAssistant' },
      { path: 'tools/dotnet/csharp-to-json-schema', loadComponent: () => import('./tools/dotnet/csharp-to-json-schema/csharp-to-json-schema.component').then(m => m.CsharpToJsonSchemaComponent), title: 'C# POCO to JSON Schema — DevAssistant' },
      { path: 'tools/dotnet/regex-tester', loadComponent: () => import('./tools/dotnet/regex-tester/regex-tester.component').then(m => m.RegexTesterComponent), title: 'Regex Tester — DevAssistant' },
      { path: 'tools/dotnet/cron-parser', loadComponent: () => import('./tools/dotnet/cron-parser/cron-parser.component').then(m => m.CronParserComponent), title: 'Cron Expression Parser — DevAssistant' },

      { path: '**', redirectTo: '' }
    ]
  }
];
