import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService } from '../../../core/services/toast.service';
import { ApiService } from '../../../core/services/api.service';

interface SchemaOptions {
  schemaDraft: 'draft-07' | '2020-12';
  camelCaseProperties: boolean;
  requireNonNullableByDefault: boolean;
  indentation: number;
}

interface PropertyDefinition {
  name: string;
  type: string;
  isNullable: boolean;
  attributes: string[];
}

@Component({
  selector: 'app-csharp-to-json-schema',
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
            <h1 class="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">C# POCO to JSON Schema</h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Generate JSON Schema from C# classes with Data Annotations support.</p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            (click)="parseWithRoslynServer()"
            [disabled]="!csharpInput() || isRoslynLoading()"
            title="Generate JSON Schema using real Roslyn syntax tree on api.mahfozmt.com"
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
            (click)="copySchema()"
            [disabled]="!schemaOutput()"
            class="px-3 py-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-1.5">
            <lucide-icon name="copy" class="w-3.5 h-3.5"></lucide-icon>
            <span>Copy Schema</span>
          </button>
          <button
            type="button"
            (click)="downloadSchemaFile()"
            [disabled]="!schemaOutput()"
            class="px-2.5 py-1.5 text-xs font-medium text-surface-700 dark:text-surface-300 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5">
            <lucide-icon name="download" class="w-3.5 h-3.5"></lucide-icon>
            <span>Download</span>
          </button>
        </div>
      </div>

      <!-- Settings Toolbar -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl text-xs">
        <div>
          <label class="block text-[11px] font-medium text-surface-600 dark:text-surface-400 mb-1">Schema Standard</label>
          <select
            [ngModel]="options().schemaDraft"
            (ngModelChange)="updateOption('schemaDraft', $event)"
            class="w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md px-2 py-1 text-surface-900 dark:text-surface-100 focus:outline-none focus:border-brand-500">
            <option value="draft-07">JSON Schema Draft-07</option>
            <option value="2020-12">JSON Schema 2020-12</option>
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
          <label class="block text-[11px] font-medium text-surface-600 dark:text-surface-400 mb-1">Required Properties</label>
          <select
            [ngModel]="options().requireNonNullableByDefault"
            (ngModelChange)="updateOption('requireNonNullableByDefault', $event === 'true' || $event === true)"
            class="w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md px-2 py-1 text-surface-900 dark:text-surface-100 focus:outline-none focus:border-brand-500">
            <option [ngValue]="true">Non-nullable & [Required]</option>
            <option [ngValue]="false">Only [Required] attribute</option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] font-medium text-surface-600 dark:text-surface-400 mb-1">Indentation</label>
          <select
            [ngModel]="options().indentation"
            (ngModelChange)="updateOption('indentation', +$event)"
            class="w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md px-2 py-1 text-surface-900 dark:text-surface-100 focus:outline-none focus:border-brand-500">
            <option [ngValue]="2">2 spaces</option>
            <option [ngValue]="4">4 spaces</option>
          </select>
        </div>
      </div>

      <!-- Main Editor Columns -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[460px]">
        <!-- C# Input Column -->
        <div class="flex flex-col border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden">
          <div class="h-9 px-3.5 bg-surface-50/90 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500 shrink-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-surface-700 dark:text-surface-300">C# Class with Data Annotations</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-800 font-mono">.cs</span>
            </div>
            <span class="text-[11px] text-surface-400 font-mono">{{ csharpInput().length }} chars</span>
          </div>
          <div class="flex-1 relative">
            <textarea
              class="w-full h-full min-h-[420px] p-3.5 bg-transparent font-mono text-xs leading-relaxed text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none"
              placeholder="// Paste your C# class with attributes here...&#10;public class CreateUserRequest {&#10;    [Required]&#10;    [EmailAddress]&#10;    public string Email { get; set; } = string.Empty;&#10;&#10;    [Range(18, 120)]&#10;    public int Age { get; set; }&#10;}"
              [ngModel]="csharpInput()"
              (ngModelChange)="onInputChange($event)"
              spellcheck="false"></textarea>
          </div>
        </div>

        <!-- JSON Schema Output Column -->
        <div class="flex flex-col border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden">
          <div class="h-9 px-3.5 bg-surface-50/90 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500 shrink-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-surface-700 dark:text-surface-300">Generated JSON Schema</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-800 font-mono">.json</span>
            </div>
            <span class="text-[11px] text-surface-400 font-mono">{{ schemaOutput().length }} chars</span>
          </div>
          <div class="flex-1 relative">
            <textarea
              readonly
              class="w-full h-full min-h-[420px] p-3.5 bg-surface-50/50 dark:bg-surface-900/30 font-mono text-xs leading-relaxed text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none"
              placeholder="// JSON Schema will appear here automatically..."
              [value]="schemaOutput()"></textarea>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CsharpToJsonSchemaComponent {
  private readonly toast = inject(ToastService);
  private readonly api = inject(ApiService);

  readonly csharpInput = signal<string>('');
  readonly roslynOverrideSchema = signal<string | null>(null);
  readonly isRoslynLoading = signal<boolean>(false);

  readonly options = signal<SchemaOptions>({
    schemaDraft: 'draft-07',
    camelCaseProperties: true,
    requireNonNullableByDefault: true,
    indentation: 2
  });

  readonly schemaOutput = computed(() => {
    const override = this.roslynOverrideSchema();
    if (override !== null) return override;
    const input = this.csharpInput().trim();
    if (!input) return '';
    return this.generateJsonSchema(input, this.options());
  });

  onInputChange(val: string): void {
    this.roslynOverrideSchema.set(null);
    this.csharpInput.set(val);
  }

  updateOption<K extends keyof SchemaOptions>(key: K, value: SchemaOptions[K]): void {
    this.roslynOverrideSchema.set(null);
    this.options.update(opts => ({ ...opts, [key]: value }));
  }

  async parseWithRoslynServer(): Promise<void> {
    const code = this.csharpInput().trim();
    if (!code) return;
    this.isRoslynLoading.set(true);
    try {
      const opts = this.options();
      const res = await this.api.convertCSharpToJsonSchemaRoslyn({
        code,
        camelCaseProperties: opts.camelCaseProperties,
        additionalPropertiesFalse: true
      });
      if (res.jsonSchema) {
        this.roslynOverrideSchema.set(res.jsonSchema);
        this.toast.success('Generated JSON Schema via Roslyn on api.mahfozmt.com');
      } else {
        this.toast.warning('Roslyn found no public types; using browser fallback.');
      }
    } catch {
      this.toast.warning('Server API unavailable — using instant local browser generator.');
    } finally {
      this.isRoslynLoading.set(false);
    }
  }

  loadSample(): void {
    const sample = `using System.ComponentModel.DataAnnotations;

namespace Ecommerce.Api.Contracts;

public class RegisterUserRequest
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    [StringLength(50, MinimumLength = 3)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Url]
    public string? Website { get; set; }

    [Range(18, 120)]
    public int Age { get; set; }

    [RegularExpression(@"^\\+?[1-9]\\d{1,14}$")]
    public string? PhoneNumber { get; set; }

    public bool AcceptTerms { get; set; }

    public List<string> SecurityRoles { get; set; } = new();

    public Dictionary<string, string>? Metadata { get; set; }
}`;
    this.csharpInput.set(sample);
    this.toast.info('Sample C# POCO with Data Annotations loaded');
  }

  clearAll(): void {
    this.csharpInput.set('');
    this.toast.info('Cleared');
  }

  copySchema(): void {
    const text = this.schemaOutput();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.toast.success('JSON Schema copied to clipboard!');
    }).catch(() => {
      this.toast.error('Failed to copy to clipboard');
    });
  }

  downloadSchemaFile(): void {
    const text = this.schemaOutput();
    if (!text) return;
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.json';
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success('Downloaded schema.json');
  }

  generateJsonSchema(csharp: string, options: SchemaOptions): string {
    // Strip block and line comments
    const cleaned = csharp
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');

    // Match class or record name: [attributes] public class ModelName { ... }
    const classDeclRegex = /(?:public\s+|internal\s+)*(?:class|record|struct)\s+([A-Za-z0-9_]+)/;
    const classMatch = classDeclRegex.exec(cleaned);
    if (!classMatch) {
      return '// No valid C# class, record, or struct found.';
    }

    const title = classMatch[1];
    const openBraceIdx = cleaned.indexOf('{', classMatch.index);
    if (openBraceIdx === -1) {
      return '// No valid C# class, record, or struct found.';
    }

    let depth = 0;
    let closeBraceIdx = -1;
    for (let i = openBraceIdx; i < cleaned.length; i++) {
      if (cleaned[i] === '{') depth++;
      else if (cleaned[i] === '}') {
        depth--;
        if (depth === 0) {
          closeBraceIdx = i;
          break;
        }
      }
    }

    if (closeBraceIdx === -1) {
      return '// No valid C# class, record, or struct found.';
    }

    const body = cleaned.substring(openBraceIdx + 1, closeBraceIdx);

    const properties = this.extractPropertiesWithAttributes(body);
    const schemaProps: Record<string, any> = {};
    const requiredProps: string[] = [];

    const schemaUri = options.schemaDraft === 'draft-07'
      ? 'http://json-schema.org/draft-07/schema#'
      : 'https://json-schema.org/draft/2020-12/schema';

    properties.forEach(prop => {
      const propName = options.camelCaseProperties ? this.toCamelCase(prop.name) : prop.name;
      const propSchema = this.mapTypeToJsonSchema(prop.type, prop.isNullable, prop.attributes);

      schemaProps[propName] = propSchema;

      const hasRequiredAttr = prop.attributes.some(attr => attr.includes('Required'));
      if (hasRequiredAttr || (options.requireNonNullableByDefault && !prop.isNullable)) {
        requiredProps.push(propName);
      }
    });

    const schema: Record<string, any> = {
      $schema: schemaUri,
      title: title,
      type: 'object',
      properties: schemaProps
    };

    if (requiredProps.length > 0) {
      schema['required'] = requiredProps;
    }

    return JSON.stringify(schema, null, options.indentation);
  }

  private extractPropertiesWithAttributes(body: string): PropertyDefinition[] {
    const lines = body.split('\n');
    const results: PropertyDefinition[] = [];

    let pendingAttributes: string[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Check if line contains attributes like [Required], [StringLength(50)]
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        // May contain multiple attributes like [Required, EmailAddress]
        const inner = trimmed.slice(1, -1);
        const splitAttrs = this.splitAttributeGroup(inner);
        pendingAttributes.push(...splitAttrs);
        return;
      }

      // Check if line matches a property
      // e.g.: public string Name { get; set; } = string.Empty;
      const propMatch = /(?:public\s+|internal\s+|protected\s+)?(?:virtual\s+|override\s+|required\s+)?([A-Za-z0-9_<>?,.\[\]]+(?:\s+[A-Za-z0-9_<>?,.\[\]]+)?)\s+([A-Za-z0-9_]+)\s*\{\s*(?:get|set|init|\s|;)*\}/.exec(trimmed);

      if (propMatch) {
        const rawType = propMatch[1].trim();
        const rawName = propMatch[2].trim();
        const isNullable = rawType.endsWith('?') || rawType.startsWith('Nullable<');
        const cleanType = rawType.replace(/\?$/, '').replace(/^Nullable<(.+)>$/, '$1').trim();

        results.push({
          name: rawName,
          type: cleanType,
          isNullable,
          attributes: [...pendingAttributes]
        });

        pendingAttributes = [];
      }
    });

    return results;
  }

  private splitAttributeGroup(attrStr: string): string[] {
    const res: string[] = [];
    let cur = '';
    let parenDepth = 0;

    for (let i = 0; i < attrStr.length; i++) {
      const c = attrStr[i];
      if (c === '(') parenDepth++;
      else if (c === ')') parenDepth--;

      if (c === ',' && parenDepth === 0) {
        if (cur.trim()) res.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    if (cur.trim()) res.push(cur.trim());
    return res;
  }

  private mapTypeToJsonSchema(type: string, isNullable: boolean, attributes: string[]): Record<string, any> {
    const schema: Record<string, any> = {};

    // Check array: T[] or List<T>
    if (type.endsWith('[]')) {
      const baseType = type.slice(0, -2);
      schema['type'] = isNullable ? ['array', 'null'] : 'array';
      schema['items'] = this.mapTypeToJsonSchema(baseType, false, []);
      return schema;
    }

    const listMatch = /^(?:List|IList|IEnumerable|ICollection|HashSet|IReadOnlyList)<(.+)>$/.exec(type);
    if (listMatch) {
      const inner = listMatch[1].trim();
      schema['type'] = isNullable ? ['array', 'null'] : 'array';
      schema['items'] = this.mapTypeToJsonSchema(inner, false, []);
      return schema;
    }

    // Check Dictionary<string, T>
    const dictMatch = /^(?:Dictionary|IDictionary|IReadOnlyDictionary)<([^,]+),\s*(.+)>$/.exec(type);
    if (dictMatch) {
      const valType = dictMatch[2].trim();
      schema['type'] = isNullable ? ['object', 'null'] : 'object';
      schema['additionalProperties'] = this.mapTypeToJsonSchema(valType, false, []);
      return schema;
    }

    // Primitive mappings
    switch (type) {
      case 'string':
      case 'String':
      case 'char':
      case 'Char':
        schema['type'] = isNullable ? ['string', 'null'] : 'string';
        break;

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
        schema['type'] = isNullable ? ['integer', 'null'] : 'integer';
        break;

      case 'float':
      case 'double':
      case 'decimal':
      case 'Single':
      case 'Double':
      case 'Decimal':
        schema['type'] = isNullable ? ['number', 'null'] : 'number';
        break;

      case 'bool':
      case 'Boolean':
        schema['type'] = isNullable ? ['boolean', 'null'] : 'boolean';
        break;

      case 'Guid':
        schema['type'] = isNullable ? ['string', 'null'] : 'string';
        schema['format'] = 'uuid';
        break;

      case 'DateTime':
      case 'DateTimeOffset':
        schema['type'] = isNullable ? ['string', 'null'] : 'string';
        schema['format'] = 'date-time';
        break;

      case 'DateOnly':
        schema['type'] = isNullable ? ['string', 'null'] : 'string';
        schema['format'] = 'date';
        break;

      case 'TimeOnly':
        schema['type'] = isNullable ? ['string', 'null'] : 'string';
        schema['format'] = 'time';
        break;

      default:
        schema['type'] = isNullable ? ['object', 'null'] : 'object';
        break;
    }

    // Apply data annotation constraints
    attributes.forEach(attr => {
      // [StringLength(50, MinimumLength = 3)]
      const strLenMatch = /StringLength\s*\(\s*(\d+)(?:\s*,\s*MinimumLength\s*=\s*(\d+))?\s*\)/.exec(attr);
      if (strLenMatch) {
        schema['maxLength'] = parseInt(strLenMatch[1], 10);
        if (strLenMatch[2]) {
          schema['minLength'] = parseInt(strLenMatch[2], 10);
        }
      }

      // [MaxLength(50)]
      const maxLenMatch = /MaxLength\s*\(\s*(\d+)\s*\)/.exec(attr);
      if (maxLenMatch) {
        schema['maxLength'] = parseInt(maxLenMatch[1], 10);
      }

      // [MinLength(5)]
      const minLenMatch = /MinLength\s*\(\s*(\d+)\s*\)/.exec(attr);
      if (minLenMatch) {
        schema['minLength'] = parseInt(minLenMatch[1], 10);
      }

      // [Range(18, 120)]
      const rangeMatch = /Range\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/.exec(attr);
      if (rangeMatch) {
        schema['minimum'] = parseFloat(rangeMatch[1]);
        schema['maximum'] = parseFloat(rangeMatch[2]);
      }

      // [EmailAddress]
      if (attr.includes('EmailAddress')) {
        schema['format'] = 'email';
      }

      // [Url]
      if (attr.includes('Url')) {
        schema['format'] = 'uri';
      }

      // [RegularExpression(@"...")]
      const regexMatch = /RegularExpression\s*\(\s*@?"([^"]+)"\s*\)/.exec(attr);
      if (regexMatch) {
        schema['pattern'] = regexMatch[1];
      }
    });

    return schema;
  }

  private toCamelCase(str: string): string {
    if (!str) return '';
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
}
