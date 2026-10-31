import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ActionToolbarComponent } from '../../../shared/components/action-toolbar.component';
import { SplitPaneComponent } from '../../../shared/components/split-pane.component';
import { ToastService } from '../../../core/services/toast.service';

export type IndentSize = '2' | '4' | 'tab';

@Component({
  selector: 'app-json-formatter',
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
      
      <!-- Tool Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-800 gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-surface-400">Formatters</span>
            <span class="text-surface-300 dark:text-surface-700">/</span>
            <h1 class="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">
              JSON Formatter & Validator
            </h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            Beautify, validate, minify, sort object keys, and escape/unescape JSON documents locally.
          </p>
        </div>

        <!-- Status Pill -->
        <div class="flex items-center gap-2">
          @if (validationError()) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Invalid JSON
            </span>
          } @else if (inputContent().trim()) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Valid JSON
            </span>
          }
        </div>
      </div>

      <!-- Action Toolbar -->
      <app-action-toolbar
        [primaryActionLabel]="'Beautify'"
        primaryActionIcon="sparkles"
        [hasSample]="true"
        [hasClear]="true"
        [hasCopy]="true"
        [hasDownload]="true"
        [copyContent]="outputContent()"
        [downloadContent]="outputContent()"
        downloadFilename="formatted.json"
        (primaryAction)="formatJson()"
        (loadSample)="loadSample()"
        (clear)="clearAll()">
        
        <!-- Controls slot: Indent selector, Minify, Sort Keys -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <div class="flex items-center bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md p-0.5 text-[11px]">
            <button
              type="button"
              (click)="indent.set('2'); formatJson()"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="indent() === '2' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              2 sp
            </button>
            <button
              type="button"
              (click)="indent.set('4'); formatJson()"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="indent() === '4' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              4 sp
            </button>
            <button
              type="button"
              (click)="indent.set('tab'); formatJson()"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="indent() === 'tab' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              Tab
            </button>
          </div>

          <button
            type="button"
            (click)="minifyJson()"
            title="Minify JSON (remove all whitespace)"
            class="px-2.5 py-1 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors border border-surface-200 dark:border-surface-700">
            Minify
          </button>

          <button
            type="button"
            (click)="sortKeys()"
            title="Sort JSON object keys alphabetically"
            class="px-2.5 py-1 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors border border-surface-200 dark:border-surface-700">
            Sort Keys
          </button>

          <button
            type="button"
            (click)="escapeJson()"
            title="Escape JSON as string"
            class="px-2 py-1 rounded-md text-xs font-mono text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 transition-colors">
            \\Escape
          </button>
        </div>
      </app-action-toolbar>

      <!-- Syntax Error Banner (if any) -->
      @if (validationError()) {
        <div class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-start gap-2.5 animate-in fade-in duration-100">
          <lucide-icon name="circle-alert" class="w-4 h-4 shrink-0 mt-0.5"></lucide-icon>
          <div class="space-y-0.5">
            <span class="font-semibold block">JSON Syntax Error:</span>
            <p>{{ validationError() }}</p>
          </div>
        </div>
      }

      <!-- Editor Split Pane -->
      <app-split-pane
        [title]="'JSON Workspace'"
        inputLabel="Raw JSON"
        outputLabel="Formatted Result"
        [inputMeta]="inputContent().length + ' chars • ' + lineCount(inputContent()) + ' lines'"
        [outputMeta]="outputContent().length + ' chars • ' + lineCount(outputContent()) + ' lines'"
        (swap)="swapPanes()">
        
        <!-- Input Textarea -->
        <div input-content class="h-full flex flex-col">
          <textarea
            class="w-full h-full min-h-[380px] bg-transparent font-mono text-xs p-2 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none leading-relaxed"
            placeholder="Paste raw or unformatted JSON here..."
            [ngModel]="inputContent()"
            (ngModelChange)="onInputChange($event)"
            spellcheck="false"></textarea>
        </div>

        <!-- Output Pre -->
        <div output-content class="h-full flex flex-col">
          @if (outputContent()) {
            <pre class="w-full h-full min-h-[380px] overflow-auto font-mono text-xs p-2 text-surface-900 dark:text-surface-100 select-all leading-relaxed">{{ outputContent() }}</pre>
          } @else {
            <div class="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 text-surface-400 font-mono">
              <lucide-icon name="braces" class="w-7 h-7 opacity-25 mb-2"></lucide-icon>
              <p class="text-xs">Formatted output will render here.</p>
              <button
                type="button"
                (click)="loadSample()"
                class="mt-2 text-xs text-brand-500 hover:underline">
                Load sample JSON
              </button>
            </div>
          }
        </div>
      </app-split-pane>

    </div>
  `
})
export class JsonFormatterComponent {
  private readonly toast = inject(ToastService);

  readonly inputContent = signal<string>('{\n  "name": "DevAssistant",\n  "version": "1.0.0",\n  "tools": ["json", "sql", "xml", "diff", "jwt"],\n  "runtime": {\n    "clientOnly": true,\n    "workers": true\n  }\n}');
  readonly outputContent = signal<string>('');
  readonly indent = signal<IndentSize>('2');
  readonly validationError = signal<string | null>(null);

  constructor() {
    this.formatJson();
  }

  onInputChange(val: string): void {
    this.inputContent.set(val);
    this.validate();
  }

  formatJson(): void {
    const raw = this.inputContent().trim();
    if (!raw) {
      this.outputContent.set('');
      this.validationError.set(null);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const space = this.indent() === 'tab' ? '\t' : parseInt(this.indent(), 10);
      const formatted = JSON.stringify(parsed, null, space);
      this.outputContent.set(formatted);
      this.validationError.set(null);
    } catch (e: any) {
      this.validationError.set(e.message || 'Syntax error in JSON payload');
    }
  }

  minifyJson(): void {
    const raw = this.inputContent().trim();
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      this.outputContent.set(JSON.stringify(parsed));
      this.validationError.set(null);
      this.toast.info('JSON minified');
    } catch (e: any) {
      this.validationError.set(e.message || 'Syntax error in JSON payload');
      this.toast.error('Cannot minify invalid JSON');
    }
  }

  sortKeys(): void {
    const raw = this.inputContent().trim();
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      const sorted = this.deepSortObject(parsed);
      const space = this.indent() === 'tab' ? '\t' : parseInt(this.indent(), 10);
      this.outputContent.set(JSON.stringify(sorted, null, space));
      this.validationError.set(null);
      this.toast.success('Keys sorted alphabetically');
    } catch (e: any) {
      this.validationError.set(e.message || 'Syntax error in JSON payload');
    }
  }

  escapeJson(): void {
    const raw = this.outputContent() || this.inputContent();
    if (!raw) return;
    this.outputContent.set(JSON.stringify(raw));
    this.toast.info('JSON escaped as string literal');
  }

  private validate(): void {
    const raw = this.inputContent().trim();
    if (!raw) {
      this.validationError.set(null);
      return;
    }
    try {
      JSON.parse(raw);
      this.validationError.set(null);
    } catch (e: any) {
      this.validationError.set(e.message);
    }
  }

  private deepSortObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSortObject(item));
    }
    const sorted: Record<string, any> = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = this.deepSortObject(obj[key]);
    });
    return sorted;
  }

  loadSample(): void {
    const sample = {
      server: "win12.hostseba.com",
      environment: "production",
      active: true,
      statusCode: 200,
      database: {
        engine: "MSSQL",
        version: "2022",
        collation: "SQL_Latin1_General_CP1_CI_AS"
      },
      endpoints: [
        { path: "/api/format/json", method: "POST", local: true },
        { path: "/api/format/sql", method: "POST", local: true },
        { path: "/api/evaluate/jsonpath", method: "POST", local: true }
      ]
    };
    this.inputContent.set(JSON.stringify(sample, null, 2));
    this.formatJson();
    this.toast.info('Sample JSON payload loaded');
  }

  clearAll(): void {
    this.inputContent.set('');
    this.outputContent.set('');
    this.validationError.set(null);
    this.toast.info('Workspace cleared');
  }

  swapPanes(): void {
    const temp = this.inputContent();
    this.inputContent.set(this.outputContent());
    this.outputContent.set(temp);
    this.formatJson();
  }

  lineCount(text: string): number {
    return text ? text.split('\n').length : 0;
  }
}
