import { Injectable, computed, signal } from '@angular/core';
import { ToolCategoryGroup, ToolDefinition } from '../models/tool.model';

@Injectable({
  providedIn: 'root'
})
export class ToolRegistryService {
  private readonly FAVORITES_STORAGE_KEY = 'dev_assistant_favorites';
  private readonly RECENTS_STORAGE_KEY = 'dev_assistant_recents';

  readonly tools: ToolDefinition[] = [
    // Module 1: Formatters
    {
      id: 'json-formatter',
      name: 'JSON Formatter & Validator',
      description: 'Beautify, minify, sort keys, remove whitespace, and escape/unescape JSON payloads.',
      category: 'formatters',
      categoryName: 'Formatters',
      route: '/tools/formatters/json',
      icon: 'braces',
      tags: ['json', 'format', 'beautify', 'minify', 'validator'],
      keywords: ['prettier', 'clean', 'indent', 'sort keys'],
      isPopular: true
    },
    {
      id: 'sql-formatter',
      name: 'SQL Formatter',
      description: 'Standard SQL, T-SQL, PostgreSQL, and MySQL queries formatting with keyword uppercasing.',
      category: 'formatters',
      categoryName: 'Formatters',
      route: '/tools/formatters/sql',
      icon: 'database',
      tags: ['sql', 'tsql', 'postgres', 'mysql', 'format'],
      keywords: ['database', 'query', 'beautify']
    },
    {
      id: 'xml-html-formatter',
      name: 'XML / HTML Formatter',
      description: 'Format, indent, collapse tags, and wrap attributes in XML and HTML documents.',
      category: 'formatters',
      categoryName: 'Formatters',
      route: '/tools/formatters/xml-html',
      icon: 'code-xml',
      tags: ['xml', 'html', 'svg', 'format', 'markup'],
      keywords: ['tags', 'beautify', 'collapse']
    },
    {
      id: 'css-formatter',
      name: 'CSS / SCSS Formatter',
      description: 'Ruleset formatting, property sorting, indentation, and minification.',
      category: 'formatters',
      categoryName: 'Formatters',
      route: '/tools/formatters/css',
      icon: 'palette',
      tags: ['css', 'scss', 'style', 'format', 'minify'],
      keywords: ['ruleset', 'properties']
    },

    // Module 2: Parsers
    {
      id: 'json-tree',
      name: 'JSON Parser & Tree Viewer',
      description: 'Interactive collapsible JSON tree view with JSONPath node copying and structural navigation.',
      category: 'parsers',
      categoryName: 'Parsers & Evaluators',
      route: '/tools/parsers/json-tree',
      icon: 'folder-tree',
      tags: ['json', 'tree', 'inspect', 'nodes', 'collapse'],
      keywords: ['visualize', 'expand', 'object inspector']
    },
    {
      id: 'jsonpath',
      name: 'JSONPath Evaluator',
      description: 'Real-time JSONPath query evaluator with dynamic result extraction and highlighting.',
      category: 'parsers',
      categoryName: 'Parsers & Evaluators',
      route: '/tools/parsers/jsonpath',
      icon: 'search-code',
      tags: ['json', 'jsonpath', 'query', 'filter'],
      keywords: ['extract', 'selector']
    },
    {
      id: 'schema-validator',
      name: 'JSON Schema Validator',
      description: 'Validate JSON payloads against Draft-07 and 2020-12 schemas with detailed error pointers.',
      category: 'parsers',
      categoryName: 'Parsers & Evaluators',
      route: '/tools/parsers/schema-validator',
      icon: 'shield-check',
      tags: ['json', 'schema', 'validation', 'ajv'],
      keywords: ['draft-07', 'spec']
    },

    // Module 3: Diff
    {
      id: 'diff-side-by-side',
      name: 'Side-by-Side Diff Viewer',
      description: 'Two-pane visual text and code diff editor with insertion/deletion highlights.',
      category: 'diff',
      categoryName: 'Diff Viewer',
      route: '/tools/diff/side-by-side',
      icon: 'columns-2',
      tags: ['diff', 'compare', 'split', 'monaco', 'code'],
      keywords: ['merge', 'changes', 'side-by-side'],
      isPopular: true
    },
    {
      id: 'diff-inline',
      name: 'Inline Diff Viewer',
      description: 'Unified GitHub-style diff view with character-level accuracy and patch view.',
      category: 'diff',
      categoryName: 'Diff Viewer',
      route: '/tools/diff/inline',
      icon: 'git-compare',
      tags: ['diff', 'unified', 'inline', 'patch', 'git'],
      keywords: ['github', 'changes']
    },

    // Module 4: Converters
    {
      id: 'json-csv',
      name: 'JSON ↔ CSV / TSV Converter',
      description: 'Bidirectional conversion between JSON arrays and CSV/TSV with custom delimiters and headers.',
      category: 'converters',
      categoryName: 'Converters',
      route: '/tools/converters/json-csv',
      icon: 'sheet',
      tags: ['json', 'csv', 'tsv', 'convert', 'table', 'excel'],
      keywords: ['export', 'import', 'flatten'],
      isPopular: true
    },
    {
      id: 'json-yaml',
      name: 'JSON ↔ YAML Converter',
      description: 'Bidirectional lossless conversion between JSON and YAML configurations.',
      category: 'converters',
      categoryName: 'Converters',
      route: '/tools/converters/json-yaml',
      icon: 'file-code-2',
      tags: ['json', 'yaml', 'yml', 'convert', 'kubernetes'],
      keywords: ['config', 'docker-compose']
    },
    {
      id: 'base64',
      name: 'Base64 Encoder / Decoder',
      description: 'Encode and decode plain text, JSON, and files to Base64 with URL-safe option.',
      category: 'converters',
      categoryName: 'Converters',
      route: '/tools/converters/base64',
      icon: 'binary',
      tags: ['base64', 'encode', 'decode', 'url-safe', 'binary'],
      keywords: ['ascii', 'utf-8']
    },
    {
      id: 'url-encoder',
      name: 'URL & Query String Tool',
      description: 'URL encode/decode and interactive query string parameter editor.',
      category: 'converters',
      categoryName: 'Converters',
      route: '/tools/converters/url',
      icon: 'link-2',
      tags: ['url', 'uri', 'encode', 'decode', 'params', 'query'],
      keywords: ['querystring', 'endpoints']
    },

    // Module 5: Crypto & Security
    {
      id: 'bcrypt',
      name: 'BCrypt Generator & Verifier',
      description: 'Generate BCrypt hashes with salt rounds (4-14) and verify passwords against hashes.',
      category: 'crypto',
      categoryName: 'Security & Crypto',
      route: '/tools/crypto/bcrypt',
      icon: 'lock',
      tags: ['bcrypt', 'password', 'hash', 'salt', 'verify'],
      keywords: ['security', 'auth', 'credentials'],
      isPopular: true
    },
    {
      id: 'jwt',
      name: 'JWT Debugger & Inspector',
      description: 'Decode JSON Web Tokens, inspect header/claims, and visualize expiration countdown.',
      category: 'crypto',
      categoryName: 'Security & Crypto',
      route: '/tools/crypto/jwt',
      icon: 'key-round',
      tags: ['jwt', 'token', 'auth', 'bearer', 'decode'],
      keywords: ['claims', 'oauth', 'header', 'payload'],
      isPopular: true
    },
    {
      id: 'hash-generator',
      name: 'Hash & HMAC Generator',
      description: 'Generate MD5, SHA-1, SHA-256, SHA-512, and keyed HMAC checksums in the browser.',
      category: 'crypto',
      categoryName: 'Security & Crypto',
      route: '/tools/crypto/hash',
      icon: 'fingerprint',
      tags: ['hash', 'md5', 'sha256', 'sha512', 'hmac'],
      keywords: ['checksum', 'digest', 'signature']
    },
    {
      id: 'uuid-generator',
      name: 'UUID / GUID Generator',
      description: 'Generate standard v4 and v7 GUIDs with batching (1-100), uppercase, and hyphen options.',
      category: 'crypto',
      categoryName: 'Security & Crypto',
      route: '/tools/crypto/uuid',
      icon: 'hash',
      tags: ['uuid', 'guid', 'random', 'v4', 'v7', 'generator'],
      keywords: ['identifier', 'batch', 'csharp']
    },

    // Module 6: .NET & Utilities
    {
      id: 'csharp-to-ts',
      name: 'C# POCO to TypeScript',
      description: 'Convert C# POCO classes and records to clean TypeScript interfaces and types.',
      category: 'dotnet',
      categoryName: '.NET & Utilities',
      route: '/tools/dotnet/csharp-to-ts',
      icon: 'file-type',
      tags: ['c#', 'csharp', 'dotnet', 'typescript', 'poco', 'dto'],
      keywords: ['interfaces', 'models', 'types'],
      isPopular: true
    },
    {
      id: 'csharp-to-json-schema',
      name: 'C# POCO to JSON Schema',
      description: 'Generate JSON Schema definitions directly from C# class signatures and attributes.',
      category: 'dotnet',
      categoryName: '.NET & Utilities',
      route: '/tools/dotnet/csharp-to-json-schema',
      icon: 'file-json',
      tags: ['c#', 'csharp', 'json-schema', 'dotnet'],
      keywords: ['schema', 'validation']
    },
    {
      id: 'regex-tester',
      name: 'Regex Tester & Explainer',
      description: 'Interactive regular expression tester with real-time match grouping and cheatsheet presets.',
      category: 'dotnet',
      categoryName: '.NET & Utilities',
      route: '/tools/dotnet/regex-tester',
      icon: 'regex',
      tags: ['regex', 'pattern', 'test', 'matcher', 'groups'],
      keywords: ['regexp', 'flags', 'dotnet regex']
    },
    {
      id: 'cron-parser',
      name: 'Cron Expression Parser',
      description: 'Translate 5/6-part cron expressions into human-readable text and next execution runs.',
      category: 'dotnet',
      categoryName: '.NET & Utilities',
      route: '/tools/dotnet/cron-parser',
      icon: 'clock',
      tags: ['cron', 'schedule', 'parser', 'quartz', 'time'],
      keywords: ['scheduler', 'job', 'timer']
    }
  ];

  readonly categories: ToolCategoryGroup[] = [
    {
      id: 'formatters',
      title: 'Code & Query Formatters',
      icon: 'sparkles',
      description: 'Beautify, indent, and format JSON, SQL, XML, HTML, and CSS code.',
      tools: this.tools.filter(t => t.category === 'formatters')
    },
    {
      id: 'parsers',
      title: 'Parsers & Evaluators',
      icon: 'search-code',
      description: 'Inspect JSON tree structures, evaluate JSONPath, and validate JSON Schemas.',
      tools: this.tools.filter(t => t.category === 'parsers')
    },
    {
      id: 'diff',
      title: 'Diff & Comparison',
      icon: 'columns-2',
      description: 'Visual side-by-side and inline difference comparison with character-level accuracy.',
      tools: this.tools.filter(t => t.category === 'diff')
    },
    {
      id: 'converters',
      title: 'Data & Schema Converters',
      icon: 'arrow-left-right',
      description: 'Convert between JSON, CSV, YAML, Base64, and URL parameters.',
      tools: this.tools.filter(t => t.category === 'converters')
    },
    {
      id: 'crypto',
      title: 'Security & Crypto',
      icon: 'shield-alert',
      description: 'BCrypt generator & verifier, JWT debugger, UUID/GUID generator, and cryptographic hashing.',
      tools: this.tools.filter(t => t.category === 'crypto')
    },
    {
      id: 'dotnet',
      title: '.NET & Utilities',
      icon: 'cpu',
      description: 'C# to TypeScript interface converter, Regex tester, and Cron schedule parser.',
      tools: this.tools.filter(t => t.category === 'dotnet')
    }
  ];

  readonly favorites = signal<string[]>(this.getInitialFavorites());
  readonly recentToolIds = signal<string[]>(this.getInitialRecents());

  readonly popularTools = computed(() => this.tools.filter(t => t.isPopular));

  readonly favoriteTools = computed(() => {
    const favIds = this.favorites();
    return this.tools.filter(t => favIds.includes(t.id));
  });

  readonly recentTools = computed(() => {
    const recents = this.recentToolIds();
    return recents
      .map(id => this.tools.find(t => t.id === id))
      .filter((t): t is ToolDefinition => !!t);
  });

  isFavorite(toolId: string): boolean {
    return this.favorites().includes(toolId);
  }

  toggleFavorite(toolId: string): void {
    const current = this.favorites();
    const updated = current.includes(toolId)
      ? current.filter(id => id !== toolId)
      : [...current, toolId];

    this.favorites.set(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    }
  }

  recordToolVisit(toolId: string): void {
    const current = this.recentToolIds().filter(id => id !== toolId);
    const updated = [toolId, ...current].slice(0, 8);
    this.recentToolIds.set(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.RECENTS_STORAGE_KEY, JSON.stringify(updated));
    }
  }

  search(query: string): ToolDefinition[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return this.tools.filter(tool => {
      const matchName = tool.name.toLowerCase().includes(q);
      const matchDesc = tool.description.toLowerCase().includes(q);
      const matchCategory = tool.categoryName.toLowerCase().includes(q);
      const matchTags = tool.tags.some(t => t.toLowerCase().includes(q));
      const matchKeywords = tool.keywords?.some(k => k.toLowerCase().includes(q)) ?? false;
      return matchName || matchDesc || matchCategory || matchTags || matchKeywords;
    });
  }

  getToolByRoute(route: string): ToolDefinition | undefined {
    return this.tools.find(t => t.route === route);
  }

  private getInitialFavorites(): string[] {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.FAVORITES_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {
        // ignore JSON parse error
      }
    }
    // Default favorites
    return ['json-formatter', 'diff-side-by-side', 'csharp-to-ts', 'jwt', 'bcrypt'];
  }

  private getInitialRecents(): string[] {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.RECENTS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {
        // ignore JSON parse error
      }
    }
    return ['json-formatter', 'sql-formatter', 'diff-side-by-side'];
  }
}
