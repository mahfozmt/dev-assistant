import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ActionToolbarComponent } from '../../../shared/components/action-toolbar.component';
import { SplitPaneComponent } from '../../../shared/components/split-pane.component';
import { ToastService } from '../../../core/services/toast.service';
import Ajv, { ErrorObject } from 'ajv';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

export type SchemaDraft = 'draft-07' | 'draft-2020';

export interface ValidationErrorItem {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  message: string;
  params: string;
}

@Component({
  selector: 'app-schema-validator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    ActionToolbarComponent,
    SplitPaneComponent
  ],
  template: `
    <div class="space-y-4 max-w-6xl mx-auto w-full pb-8 animate-in fade-in duration-100">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-800 gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-surface-400">Parsers & Evaluators</span>
            <span class="text-surface-300 dark:text-surface-700">/</span>
            <h1 class="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">
              JSON Schema Validator
            </h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            Validate JSON instance payloads against JSON Schema Draft-07 and 2020-12 specifications.
          </p>
        </div>

        <!-- Result Badge -->
        <div class="flex items-center gap-2">
          @if (schemaParseError() || dataParseError()) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Parse Error
            </span>
          } @else if (validationErrors().length > 0) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              {{ validationErrors().length }} Schema Error{{ validationErrors().length > 1 ? 's' : '' }}
            </span>
          } @else if (isValidated()) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Valid Schema: Data complies with schema
            </span>
          }
        </div>
      </div>

      <!-- Action Toolbar -->
      <app-action-toolbar
        [primaryActionLabel]="'Validate'"
        primaryActionIcon="shield-check"
        [hasSample]="true"
        [hasClear]="true"
        [hasCopy]="false"
        [hasDownload]="true"
        [downloadContent]="jsonContent()"
        downloadFilename="data.json"
        (primaryAction)="validate()"
        (loadSample)="loadSample('user')"
        (clear)="clearAll()">
        
        <!-- Controls: Draft Selector and Presets -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <!-- Draft selector -->
          <div class="flex items-center bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md p-0.5 text-[11px]">
            <button
              type="button"
              (click)="setDraft('draft-07')"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="draft() === 'draft-07' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              Draft-07
            </button>
            <button
              type="button"
              (click)="setDraft('draft-2020')"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="draft() === 'draft-2020' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              2020-12
            </button>
          </div>

          <!-- Presets dropdown/buttons -->
          <button
            type="button"
            (click)="loadSample('user')"
            class="px-2 py-1 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors border border-surface-200 dark:border-surface-700">
            User (Draft-07)
          </button>
          <button
            type="button"
            (click)="loadSample('product')"
            class="px-2 py-1 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors border border-surface-200 dark:border-surface-700">
            Product (2020-12)
          </button>
          <button
            type="button"
            (click)="loadSample('invalid')"
            class="px-2 py-1 rounded-md text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border border-rose-200 dark:border-rose-900/40">
            Trigger Errors
          </button>
        </div>
      </app-action-toolbar>

      <!-- Parse Error Notice -->
      @if (schemaParseError() || dataParseError()) {
        <div class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-start gap-2.5">
          <lucide-icon name="circle-alert" class="w-4 h-4 shrink-0 mt-0.5"></lucide-icon>
          <div class="space-y-1">
            @if (dataParseError()) {
              <div>
                <span class="font-semibold">JSON Data Error:</span> {{ dataParseError() }}
              </div>
            }
            @if (schemaParseError()) {
              <div>
                <span class="font-semibold">JSON Schema Error:</span> {{ schemaParseError() }}
              </div>
            }
          </div>
        </div>
      }

      <!-- Schema Validation Error Locator Box -->
      @if (validationErrors().length > 0) {
        <div class="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 overflow-hidden shadow-xs">
          <div class="px-3.5 py-2 bg-rose-100/60 dark:bg-rose-900/30 border-b border-rose-200 dark:border-rose-900/50 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300 font-medium">
            <div class="flex items-center gap-2">
              <lucide-icon name="circle-alert" class="w-4 h-4"></lucide-icon>
              <span>Validation Failures ({{ validationErrors().length }})</span>
            </div>
            <span class="text-[11px] font-mono">Draft: {{ draft() }}</span>
          </div>

          <div class="divide-y divide-rose-200/50 dark:divide-rose-900/30 max-h-72 overflow-y-auto">
            @for (err of validationErrors(); track $index) {
              <div class="p-3 text-xs font-mono space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                    {{ err.keyword }}
                  </span>
                  <span class="font-semibold text-surface-900 dark:text-surface-100">
                    {{ err.message }}
                  </span>
                </div>
                <div class="text-[11px] text-surface-600 dark:text-surface-400 pl-2 border-l-2 border-rose-400 dark:border-rose-600 space-y-0.5">
                  <div><span class="text-surface-400">instancePath:</span> <span class="text-surface-900 dark:text-surface-200 font-medium">{{ err.instancePath || '(root)' }}</span></div>
                  <div><span class="text-surface-400">schemaPath:</span> {{ err.schemaPath }}</div>
                  @if (err.params) {
                    <div><span class="text-surface-400">params:</span> {{ err.params }}</div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Valid Success Banner -->
      @if (isValidated() && validationErrors().length === 0 && !schemaParseError() && !dataParseError()) {
        <div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono flex items-center gap-2.5">
          <lucide-icon name="circle-check" class="w-4 h-4 shrink-0"></lucide-icon>
          <div>
            <span class="font-bold">Schema Validated Successfully:</span>
            <span> The JSON instance strictly satisfies all constraints defined by the {{ draft() }} schema.</span>
          </div>
        </div>
      }

      <!-- Split Pane (Left: JSON Data, Right: JSON Schema) -->
      <app-split-pane
        [title]="'Validation Workspace'"
        inputLabel="JSON Data (Instance)"
        outputLabel="JSON Schema"
        [inputMeta]="jsonContent().length + ' chars • ' + lineCount(jsonContent()) + ' lines'"
        [outputMeta]="schemaContent().length + ' chars • ' + lineCount(schemaContent()) + ' lines'"
        [allowSwap]="false">
        
        <!-- Left: JSON Data -->
        <div input-content class="h-full flex flex-col">
          <textarea
            class="w-full h-full min-h-[400px] bg-transparent font-mono text-xs p-2 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none leading-relaxed"
            placeholder="Paste JSON data instance here..."
            [ngModel]="jsonContent()"
            (ngModelChange)="onJsonChange($event)"
            spellcheck="false"></textarea>
        </div>

        <!-- Right: JSON Schema -->
        <div output-content class="h-full flex flex-col">
          <textarea
            class="w-full h-full min-h-[400px] bg-transparent font-mono text-xs p-2 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none leading-relaxed"
            placeholder="Paste JSON Schema specification here..."
            [ngModel]="schemaContent()"
            (ngModelChange)="onSchemaChange($event)"
            spellcheck="false"></textarea>
        </div>
      </app-split-pane>

    </div>
  `
})
export class SchemaValidatorComponent {
  private readonly toast = inject(ToastService);

  readonly draft = signal<SchemaDraft>('draft-07');
  readonly jsonContent = signal<string>('');
  readonly schemaContent = signal<string>('');

  readonly validationErrors = signal<ValidationErrorItem[]>([]);
  readonly isValidated = signal<boolean>(false);
  readonly dataParseError = signal<string | null>(null);
  readonly schemaParseError = signal<string | null>(null);

  constructor() {
    this.loadSample('user');
  }

  setDraft(d: SchemaDraft): void {
    this.draft.set(d);
    this.validate();
  }

  onJsonChange(val: string): void {
    this.jsonContent.set(val);
    this.validate();
  }

  onSchemaChange(val: string): void {
    this.schemaContent.set(val);
    this.validate();
  }

  validate(): void {
    const rawData = this.jsonContent().trim();
    const rawSchema = this.schemaContent().trim();

    this.dataParseError.set(null);
    this.schemaParseError.set(null);
    this.validationErrors.set([]);

    if (!rawData || !rawSchema) {
      this.isValidated.set(false);
      return;
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(rawData);
    } catch (e: any) {
      this.dataParseError.set(e.message || 'Malformed JSON in Data instance');
      this.isValidated.set(false);
      return;
    }

    let parsedSchema: any;
    try {
      parsedSchema = JSON.parse(rawSchema);
    } catch (e: any) {
      this.schemaParseError.set(e.message || 'Malformed JSON in Schema specification');
      this.isValidated.set(false);
      return;
    }

    try {
      // Choose AJV validator according to user selection
      let ajv: any;
      if (this.draft() === 'draft-2020') {
        ajv = new Ajv2020({ allErrors: true, strict: false });
      } else {
        ajv = new Ajv({ allErrors: true, strict: false });
      }

      addFormats(ajv);

      const validateFn = ajv.compile(parsedSchema);
      const valid = validateFn(parsedData);

      if (valid) {
        this.validationErrors.set([]);
        this.isValidated.set(true);
      } else {
        const errors: ValidationErrorItem[] = (validateFn.errors || []).map((err: ErrorObject) => ({
          instancePath: err.instancePath,
          schemaPath: err.schemaPath,
          keyword: err.keyword,
          message: err.message || 'Validation error',
          params: JSON.stringify(err.params)
        }));
        this.validationErrors.set(errors);
        this.isValidated.set(true);
      }
    } catch (e: any) {
      this.schemaParseError.set(e.message || 'Schema compilation error');
      this.isValidated.set(false);
    }
  }

  loadSample(type: 'user' | 'product' | 'invalid'): void {
    if (type === 'user') {
      this.draft.set('draft-07');
      this.jsonContent.set(
        JSON.stringify(
          {
            id: 101,
            name: "Mahfozur Rahman",
            email: "mahfoz@example.com",
            roles: ["admin", "developer"],
            age: 28,
            settings: {
              theme: "dark",
              notifications: true
            }
          },
          null,
          2
        )
      );

      this.schemaContent.set(
        JSON.stringify(
          {
            $schema: "http://json-schema.org/draft-07/schema#",
            title: "User Profile",
            type: "object",
            required: ["id", "name", "email", "roles"],
            properties: {
              id: { type: "integer", minimum: 1 },
              name: { type: "string", minLength: 2 },
              email: { type: "string", format: "email" },
              age: { type: "integer", minimum: 18, maximum: 120 },
              roles: {
                type: "array",
                items: { type: "string" },
                minItems: 1
              },
              settings: {
                type: "object",
                properties: {
                  theme: { type: "string", enum: ["light", "dark", "system"] },
                  notifications: { type: "boolean" }
                }
              }
            }
          },
          null,
          2
        )
      );
    } else if (type === 'product') {
      this.draft.set('draft-2020');
      this.jsonContent.set(
        JSON.stringify(
          {
            productId: "prod_9921",
            title: "DevAssistant Pro Workstation",
            price: 49.99,
            inStock: true,
            tags: ["utility", "developer", "offline"]
          },
          null,
          2
        )
      );

      this.schemaContent.set(
        JSON.stringify(
          {
            $schema: "https://json-schema.org/draft/2020-12/schema",
            title: "Product Item",
            type: "object",
            required: ["productId", "title", "price"],
            properties: {
              productId: { type: "string", pattern: "^prod_[0-9]+$" },
              title: { type: "string", minLength: 3 },
              price: { type: "number", minimum: 0 },
              inStock: { type: "boolean" },
              tags: {
                type: "array",
                items: { type: "string" }
              }
            }
          },
          null,
          2
        )
      );
    } else if (type === 'invalid') {
      this.draft.set('draft-07');
      this.jsonContent.set(
        JSON.stringify(
          {
            id: 0,
            name: "A",
            email: "not-an-email",
            roles: [],
            age: 15
          },
          null,
          2
        )
      );

      this.schemaContent.set(
        JSON.stringify(
          {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            required: ["id", "name", "email", "roles"],
            properties: {
              id: { type: "integer", minimum: 1 },
              name: { type: "string", minLength: 3 },
              email: { type: "string", format: "email" },
              age: { type: "integer", minimum: 18 },
              roles: {
                type: "array",
                items: { type: "string" },
                minItems: 1
              }
            }
          },
          null,
          2
        )
      );
    }

    this.validate();
    this.toast.info(`Loaded ${type} schema sample`);
  }

  clearAll(): void {
    this.jsonContent.set('');
    this.schemaContent.set('');
    this.validationErrors.set([]);
    this.isValidated.set(false);
    this.dataParseError.set(null);
    this.schemaParseError.set(null);
    this.toast.info('Cleared schema workspace');
  }

  lineCount(text: string): number {
    return text ? text.split('\n').length : 0;
  }
}
