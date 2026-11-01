import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService } from '../../../core/services/toast.service';
import { ApiService } from '../../../core/services/api.service';

interface ConversionOptions {
  outputType: 'interface' | 'type';
  exportKeyword: boolean;
  camelCaseProperties: boolean;
  nullableAsUndefined: boolean; // if true, uses `prop?: type | null`, else `prop: type | null`
  dateType: 'string' | 'Date';
}

interface ParsedProperty {
  name: string;
  type: string;
  isNullable: boolean;
  isArray: boolean;
}

interface ParsedEntity {
  kind: 'interface' | 'enum';
  name: string;
  properties?: ParsedProperty[];
  enumMembers?: { key: string; value?: string | number }[];
}

@Component({
  selector: 'app-csharp-to-ts',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="flex-1 flex flex-col space-y-3.5 animate-in fade-in duration-100 max-w-7xl mx-auto w-full">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-800 gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-surface-400">.NET Utilities</span>
            <span class="text-surface-300 dark:text-surface-700">/</span>
            <h1 class="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">C# POCO to TypeScript</h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Convert C# classes, records, structs, and enums into TypeScript interfaces or types.</p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            (click)="parseWithRoslynServer()"
            [disabled]="!csharpInput() || isRoslynLoading()"
            title="Parse C# syntax tree using real Roslyn compiler on api.mahfozmt.com"
            class="px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>{{ isRoslynLoading() ? 'Roslyn Parsing...' : 'Roslyn AST (Runs on server)' }}</span>
          </button>
          <button
            type="button"
            (click)="loadSample()"
            class="px-2.5 py-1.5 text-xs font-medium text-surface-700 dark:text-surface-300 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 rounded-lg transition-colors flex items-center gap-1.5">
            <lucide-icon name="sparkles" class="w-3.5 h-3.5 text-amber-500"></lucide-icon>
            <span>Load Sample</span>
          </button>
          <button
            type="button"
            (click)="clearAll()"
            class="px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors flex items-center gap-1.5">
            <lucide-icon name="trash-2" class="w-3.5 h-3.5"></lucide-icon>
            <span>Clear</span>
          </button>
          <button
            type="button"
            (click)="copyOutput()"
            [disabled]="!tsOutput()"
            class="px-3 py-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-1.5">
            <lucide-icon name="copy" class="w-3.5 h-3.5"></lucide-icon>
            <span>Copy TS</span>
          </button>
          <button
            type="button"
            (click)="downloadTsFile()"
            [disabled]="!tsOutput()"
            class="px-2.5 py-1.5 text-xs font-medium text-surface-700 dark:text-surface-300 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5">
            <lucide-icon name="download" class="w-3.5 h-3.5"></lucide-icon>
            <span>Download</span>
          </button>
        </div>
      </div>

      <!-- Settings Toolbar -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl text-xs">
        <div>
          <label class="block text-[11px] font-medium text-surface-600 dark:text-surface-400 mb-1">Declaration</label>
          <select
            [ngModel]="options().outputType"
            (ngModelChange)="updateOption('outputType', $event)"
            class="w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md px-2 py-1 text-surface-900 dark:text-surface-100 focus:outline-none focus:border-brand-500">
            <option value="interface">interface</option>
            <option value="type">type alias</option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] font-medium text-surface-600 dark:text-surface-400 mb-1">Export Keyword</label>
          <select
            [ngModel]="options().exportKeyword"
            (ngModelChange)="updateOption('exportKeyword', $event === 'true' || $event === true)"
            class="w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md px-2 py-1 text-surface-900 dark:text-surface-100 focus:outline-none focus:border-brand-500">
            <option [ngValue]="true">export</option>
            <option [ngValue]="false">none</option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] font-medium text-surface-600 dark:text-surface-400 mb-1">Property Casing</label>
          <select
            [ngModel]="options().camelCaseProperties"
            (ngModelChange)="updateOption('camelCaseProperties', $event === 'true' || $event === true)"
            class="w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md px-2 py-1 text-surface-900 dark:text-surface-100 focus:outline-none focus:border-brand-500">
            <option [ngValue]="true">camelCase</option>
            <option [ngValue]="false">PascalCase (Preserve)</option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] font-medium text-surface-600 dark:text-surface-400 mb-1">Nullable Handling</label>
          <select
            [ngModel]="options().nullableAsUndefined"
            (ngModelChange)="updateOption('nullableAsUndefined', $event === 'true' || $event === true)"
            class="w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md px-2 py-1 text-surface-900 dark:text-surface-100 focus:outline-none focus:border-brand-500">
            <option [ngValue]="true">Optional (prop?: T)</option>
            <option [ngValue]="false">Union (prop: T | null)</option>
          </select>
        </div>

        <div class="col-span-2 sm:col-span-1">
          <label class="block text-[11px] font-medium text-surface-600 dark:text-surface-400 mb-1">DateTime Mapping</label>
          <select
            [ngModel]="options().dateType"
            (ngModelChange)="updateOption('dateType', $event)"
            class="w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md px-2 py-1 text-surface-900 dark:text-surface-100 focus:outline-none focus:border-brand-500">
            <option value="string">string (ISO)</option>
            <option value="Date">Date object</option>
          </select>
        </div>
      </div>

      <!-- Main Editor Columns -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[460px]">
        <!-- C# Input Column -->
        <div class="flex flex-col border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden">
          <div class="h-9 px-3.5 bg-surface-50/90 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500 shrink-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-surface-700 dark:text-surface-300">C# POCO / Model</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-800 font-mono">.cs</span>
            </div>
            <span class="text-[11px] text-surface-400 font-mono">{{ csharpInput().length }} chars</span>
          </div>
          <div class="flex-1 relative">
            <textarea
              class="w-full h-full min-h-[420px] p-3.5 bg-transparent font-mono text-xs leading-relaxed text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none"
              placeholder="// Paste your C# class, record, struct, or enum here...&#10;public class UserDto {&#10;    public Guid Id { get; set; }&#10;    public string FullName { get; set; } = string.Empty;&#10;    public DateTime? CreatedAt { get; set; }&#10;    public List<string> Roles { get; set; } = new();&#10;}"
              [ngModel]="csharpInput()"
              (ngModelChange)="onInputChange($event)"
              spellcheck="false"></textarea>
          </div>
        </div>

        <!-- TypeScript Output Column -->
        <div class="flex flex-col border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden">
          <div class="h-9 px-3.5 bg-surface-50/90 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500 shrink-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-surface-700 dark:text-surface-300">TypeScript Output</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-800 font-mono">.d.ts</span>
            </div>
            <span class="text-[11px] text-surface-400 font-mono">{{ tsOutput().length }} chars</span>
          </div>
          <div class="flex-1 relative">
            <textarea
              readonly
              class="w-full h-full min-h-[420px] p-3.5 bg-surface-50/50 dark:bg-surface-900/30 font-mono text-xs leading-relaxed text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none"
              placeholder="// TypeScript interfaces will appear here automatically..."
              [value]="tsOutput()"></textarea>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CsharpToTsComponent {
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);

  readonly csharpInput = signal<string>('');
  readonly roslynOverrideOutput = signal<string | null>(null);
  readonly isRoslynLoading = signal<boolean>(false);

  readonly options = signal<ConversionOptions>({
    outputType: 'interface',
    exportKeyword: true,
    camelCaseProperties: true,
    nullableAsUndefined: false,
    dateType: 'string'
  });

  readonly tsOutput = computed(() => {
    const override = this.roslynOverrideOutput();
    if (override !== null) return override;
    const input = this.csharpInput().trim();
    if (!input) return '';
    return this.convertCSharpToTs(input, this.options());
  });

  onInputChange(val: string): void {
    this.roslynOverrideOutput.set(null);
    this.csharpInput.set(val);
  }

  updateOption<K extends keyof ConversionOptions>(key: K, value: ConversionOptions[K]): void {
    this.roslynOverrideOutput.set(null);
    this.options.update(opts => ({ ...opts, [key]: value }));
  }

  async parseWithRoslynServer(): Promise<void> {
    const code = this.csharpInput().trim();
    if (!code) return;
    this.isRoslynLoading.set(true);
    try {
      const opts = this.options();
      const res = await this.api.convertCSharpToTsRoslyn({
        code,
        useTypeInsteadOfInterface: opts.outputType === 'type',
        camelCaseProperties: opts.camelCaseProperties,
        exportKeywords: opts.exportKeyword,
        dateMapping: opts.dateType
      });
      if (res.typeScriptCode) {
        this.roslynOverrideOutput.set(res.typeScriptCode);
        this.toast.success(`Converted ${res.typeCount} type(s) via Roslyn on api.mahfozmt.com`);
      } else {
        this.toast.warning('Roslyn found no public types; using browser fallback.');
      }
    } catch {
      this.toast.warning('Server API unavailable — using instant local browser converter.');
    } finally {
      this.isRoslynLoading.set(false);
    }
  }

  loadSample(): void {
    const sample = `namespace App.Models;

public enum OrderStatus
{
    Pending = 0,
    Processing = 1,
    Shipped = 2,
    Cancelled = 3
}

public class OrderItem
{
    public Guid ItemId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
}

public record CustomerProfile
{
    public int Id { get; init; }
    public string FirstName { get; init; } = default!;
    public string? MiddleName { get; init; }
    public string LastName { get; init; } = default!;
    public string Email { get; init; } = string.Empty;
    public bool IsEmailVerified { get; init; }
    public DateTime RegisteredAt { get; init; }
    public DateTime? LastLoginUtc { get; init; }
    public OrderStatus Status { get; init; }
    public List<OrderItem> RecentOrders { get; init; } = new();
    public Dictionary<string, string>? Metadata { get; init; }
}`;
    this.csharpInput.set(sample);
    this.toast.info('Sample C# POCO classes loaded');
  }

  clearAll(): void {
    this.csharpInput.set('');
    this.toast.info('Cleared');
  }

  copyOutput(): void {
    const text = this.tsOutput();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.toast.success('TypeScript output copied to clipboard!');
    }).catch(() => {
      this.toast.error('Failed to copy to clipboard');
    });
  }

  downloadTsFile(): void {
    const text = this.tsOutput();
    if (!text) return;
    const blob = new Blob([text], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'models.d.ts';
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success('Downloaded models.d.ts');
  }

  convertCSharpToTs(csharp: string, options: ConversionOptions): string {
    const results: string[] = [];

    // Strip block comments and single-line comments
    const cleanedCode = csharp
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');

    // Parse enums
    const enumRegex = /(?:public\s+|internal\s+|private\s+)?enum\s+([A-Za-z0-9_]+)\s*(?::\s*[A-Za-z0-9_]+)?\s*\{([^}]*)\}/g;
    let enumMatch: RegExpExecArray | null;
    while ((enumMatch = enumRegex.exec(cleanedCode)) !== null) {
      const enumName = enumMatch[1];
      const enumBody = enumMatch[2];
      const members = enumBody
        .split(',')
        .map(m => m.trim())
        .filter(m => m.length > 0);

      const exp = options.exportKeyword ? 'export ' : '';
      let enumTs = `${exp}enum ${enumName} {\n`;
      members.forEach((m, idx) => {
        const parts = m.split('=').map(p => p.trim());
        const key = parts[0];
        const val = parts[1];
        const comma = idx < members.length - 1 ? ',' : '';
        if (val !== undefined) {
          enumTs += `  ${key} = ${val}${comma}\n`;
        } else {
          enumTs += `  ${key}${comma}\n`;
        }
      });
      enumTs += `}`;
      results.push(enumTs);
    }

    // Parse classes, records, and structs
    const classRegex = /(?:public\s+|internal\s+|private\s+|sealed\s+|abstract\s+)*(?:class|record|struct)\s+([A-Za-z0-9_]+)[^{]*\{/g;
    let classMatch: RegExpExecArray | null;
    while ((classMatch = classRegex.exec(cleanedCode)) !== null) {
      const entityName = classMatch[1];
      const openBrace = classMatch.index + classMatch[0].length - 1;
      let depth = 0;
      let closeBrace = -1;
      for (let i = openBrace; i < cleanedCode.length; i++) {
        if (cleanedCode[i] === '{') depth++;
        else if (cleanedCode[i] === '}') {
          depth--;
          if (depth === 0) {
            closeBrace = i;
            break;
          }
        }
      }

      if (closeBrace !== -1) {
        const body = cleanedCode.substring(openBrace + 1, closeBrace);
        const properties = this.parseProperties(body, options);
        const exp = options.exportKeyword ? 'export ' : '';

        if (options.outputType === 'interface') {
          let iface = `${exp}interface ${entityName} {\n`;
          properties.forEach(prop => {
            iface += `  ${prop.code};\n`;
          });
          iface += `}`;
          results.push(iface);
        } else {
          let typeAlias = `${exp}type ${entityName} = {\n`;
          properties.forEach(prop => {
            typeAlias += `  ${prop.code};\n`;
          });
          typeAlias += `};`;
          results.push(typeAlias);
        }

        classRegex.lastIndex = closeBrace + 1;
      }
    }

    // Also match positional records: public record Person(int Id, string Name);
    const positionalRecordRegex = /(?:public\s+|internal\s+|private\s+)*record\s+([A-Za-z0-9_]+)\s*\(([^)]+)\)\s*;/g;
    let posMatch: RegExpExecArray | null;
    while ((posMatch = positionalRecordRegex.exec(cleanedCode)) !== null) {
      const entityName = posMatch[1];
      const params = posMatch[2];
      const paramList = params.split(',').map(p => p.trim()).filter(p => p.length > 0);

      const exp = options.exportKeyword ? 'export ' : '';
      const formattedProps: string[] = [];

      paramList.forEach(param => {
        // e.g. "int Id" or "string? Name"
        const parts = param.split(/\s+/);
        if (parts.length >= 2) {
          const csType = parts[0];
          const rawName = parts[1];
          const isNullable = csType.endsWith('?') || csType.startsWith('Nullable<');
          const cleanCsType = csType.replace(/\?$/, '').replace(/^Nullable<(.+)>$/, '$1');
          const tsType = this.mapType(cleanCsType, options);

          let propName = options.camelCaseProperties ? this.toCamelCase(rawName) : rawName;
          if (options.nullableAsUndefined && isNullable) {
            formattedProps.push(`  ${propName}?: ${tsType}`);
          } else if (isNullable) {
            formattedProps.push(`  ${propName}: ${tsType} | null`);
          } else {
            formattedProps.push(`  ${propName}: ${tsType}`);
          }
        }
      });

      if (options.outputType === 'interface') {
        results.push(`${exp}interface ${entityName} {\n${formattedProps.map(p => p + ';').join('\n')}\n}`);
      } else {
        results.push(`${exp}type ${entityName} = {\n${formattedProps.map(p => p + ';').join('\n')}\n};`);
      }
    }

    if (results.length === 0) {
      return '// No valid C# classes, records, structs, or enums detected.\n// Please check the syntax and paste a valid C# definition.';
    }

    return results.join('\n\n');
  }

  private parseProperties(body: string, options: ConversionOptions): { code: string }[] {
    const lines = body.split('\n');
    const props: { code: string }[] = [];

    // Property regex: [attributes] [modifiers] Type Name { get; set; } [= default;]
    // Example: public string? FirstName { get; set; } = string.Empty;
    const propRegex = /(?:\[[^\]]+\]\s*)*(?:public\s+|internal\s+|protected\s+)?(?:virtual\s+|override\s+|required\s+)?([A-Za-z0-9_<>?,.\[\]]+(?:\s+[A-Za-z0-9_<>?,.\[\]]+)?)\s+([A-Za-z0-9_]+)\s*\{\s*(?:get|set|init|\s|;)*\}/;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

      const match = propRegex.exec(trimmed);
      if (match) {
        let rawType = match[1].trim();
        const rawName = match[2].trim();

        const isNullable = rawType.endsWith('?') || rawType.startsWith('Nullable<');
        let cleanType = rawType.replace(/\?$/, '').replace(/^Nullable<(.+)>$/, '$1').trim();

        const tsType = this.mapType(cleanType, options);
        let propName = options.camelCaseProperties ? this.toCamelCase(rawName) : rawName;

        let code = '';
        if (options.nullableAsUndefined && isNullable) {
          code = `${propName}?: ${tsType}`;
        } else if (isNullable) {
          code = `${propName}: ${tsType} | null`;
        } else {
          code = `${propName}: ${tsType}`;
        }

        props.push({ code });
      }
    });

    return props;
  }

  private mapType(csType: string, options: ConversionOptions): string {
    const trimmed = csType.trim();

    // Check array: T[]
    if (trimmed.endsWith('[]')) {
      const base = trimmed.substring(0, trimmed.length - 2);
      return `${this.mapType(base, options)}[]`;
    }

    // Check generic collections: List<T>, IList<T>, IEnumerable<T>, ICollection<T>, HashSet<T>
    const colMatch = /^(?:List|IList|IEnumerable|ICollection|HashSet|IReadOnlyList|IReadOnlyCollection)<(.+)>$/.exec(trimmed);
    if (colMatch) {
      const inner = colMatch[1];
      return `${this.mapType(inner, options)}[]`;
    }

    // Check Dictionary<TKey, TValue> or IDictionary<TKey, TValue>
    const dictMatch = /^(?:Dictionary|IDictionary|IReadOnlyDictionary)<([^,]+),\s*(.+)>$/.exec(trimmed);
    if (dictMatch) {
      const keyType = this.mapType(dictMatch[1], options);
      const valType = this.mapType(dictMatch[2], options);
      return `Record<${keyType}, ${valType}>`;
    }

    // Primitive & standard mappings
    switch (trimmed) {
      case 'string':
      case 'String':
      case 'char':
      case 'Char':
      case 'Guid':
      case 'TimeSpan':
      case 'Uri':
        return 'string';

      case 'int':
      case 'Int16':
      case 'Int32':
      case 'Int64':
      case 'long':
      case 'short':
      case 'byte':
      case 'sbyte':
      case 'uint':
      case 'ulong':
      case 'ushort':
      case 'float':
      case 'double':
      case 'decimal':
      case 'Single':
      case 'Double':
      case 'Decimal':
        return 'number';

      case 'bool':
      case 'Boolean':
        return 'boolean';

      case 'DateTime':
      case 'DateTimeOffset':
      case 'DateOnly':
      case 'TimeOnly':
        return options.dateType === 'Date' ? 'Date' : 'string';

      case 'object':
      case 'Object':
        return 'any';

      case 'dynamic':
        return 'any';

      default:
        // User custom class, enum or type
        return trimmed;
    }
  }

  private toCamelCase(str: string): string {
    if (!str) return '';
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
}
