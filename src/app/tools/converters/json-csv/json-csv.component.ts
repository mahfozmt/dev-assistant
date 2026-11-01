import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import * as Papa from 'papaparse';
import { ActionToolbarComponent } from '../../../shared/components/action-toolbar.component';
import { SplitPaneComponent } from '../../../shared/components/split-pane.component';
import { ToastService } from '../../../core/services/toast.service';

type ConversionMode = 'json-to-csv' | 'csv-to-json';

@Component({
  selector: 'app-json-csv',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    ActionToolbarComponent,
    SplitPaneComponent
  ],
  template: `
    <div class="flex-1 flex flex-col space-y-3.5 animate-in fade-in duration-100 max-w-6xl mx-auto w-full">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-800 gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-surface-400">Converters</span>
            <span class="text-surface-300 dark:text-surface-700">/</span>
            <h1 class="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">JSON ↔ CSV / TSV</h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Bidirectional conversion between JSON arrays and delimited formats.</p>
        </div>
      </div>

      <!-- Toolbar -->
      <app-action-toolbar
        [primaryActionLabel]="'Convert'"
        primaryActionIcon="arrow-right-left"
        [hasSample]="true"
        [hasClear]="true"
        [hasCopy]="true"
        [hasDownload]="true"
        [copyContent]="outputContent()"
        [downloadContent]="outputContent()"
        [downloadFilename]="getDownloadFilename()"
        (primaryAction)="convert()"
        (loadSample)="loadSample()"
        (clear)="clearAll()">
        
        <div class="flex items-center gap-1.5 flex-wrap">
          <!-- Mode Toggle -->
          <div class="flex items-center bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md p-0.5 text-[11px]">
            <button
              type="button"
              (click)="setMode('json-to-csv')"
              class="px-2 py-0.5 rounded font-medium transition-colors"
              [ngClass]="mode() === 'json-to-csv' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              JSON to CSV
            </button>
            <button
              type="button"
              (click)="setMode('csv-to-json')"
              class="px-2 py-0.5 rounded font-medium transition-colors"
              [ngClass]="mode() === 'csv-to-json' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              CSV to JSON
            </button>
          </div>

          <!-- Delimiter Selector -->
          <select 
            [ngModel]="delimiter()" 
            (ngModelChange)="delimiter.set($event); convert()"
            class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 text-[11px] rounded-md px-2 py-1 pr-6 focus:outline-none focus:ring-2 focus:ring-brand-500/50">
            <option value=",">Comma (,)</option>
            <option value="\t">Tab (\\t)</option>
            <option value=";">Semicolon (;)</option>
            <option value="|">Pipe (|)</option>
          </select>

          <!-- Header Toggle -->
          <label class="flex items-center gap-1.5 text-[11px] text-surface-600 dark:text-surface-400 cursor-pointer hover:text-surface-900 dark:hover:text-surface-200 px-1">
            <input type="checkbox" [ngModel]="hasHeader()" (ngModelChange)="hasHeader.set($event); convert()" class="rounded border-surface-300 text-brand-500 focus:ring-brand-500/50">
            Has Header
          </label>
        </div>
      </app-action-toolbar>

      <!-- Error Banner -->
      @if (error()) {
        <div class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-start gap-2.5">
          <lucide-icon name="circle-alert" class="w-4 h-4 shrink-0 mt-0.5"></lucide-icon>
          <div>
            <span class="font-semibold block">Conversion Error:</span>
            <p>{{ error() }}</p>
          </div>
        </div>
      }

      <!-- Editor Split Pane -->
      <app-split-pane
        [title]="'Converter Workspace'"
        [inputLabel]="mode() === 'json-to-csv' ? 'JSON Input' : 'CSV/TSV Input'"
        [outputLabel]="mode() === 'json-to-csv' ? 'CSV/TSV Output' : 'JSON Output'"
        [inputMeta]="inputContent().length + ' chars'"
        [outputMeta]="outputContent().length + ' chars'"
        (swap)="swapPanes()">
        
        <div input-content class="h-full flex flex-col">
          <textarea
            class="w-full h-full min-h-[400px] bg-transparent font-mono text-xs p-2 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none leading-relaxed"
            placeholder="Paste input here..."
            [ngModel]="inputContent()"
            (ngModelChange)="onInputChange($event)"
            spellcheck="false"></textarea>
        </div>

        <div output-content class="h-full flex flex-col">
          @if (outputContent()) {
            <pre class="w-full h-full min-h-[400px] overflow-auto font-mono text-xs p-2 text-surface-900 dark:text-surface-100 select-all leading-relaxed">{{ outputContent() }}</pre>
          } @else {
            <div class="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-6 text-surface-400">
              <lucide-icon name="arrow-right-left" class="w-6 h-6 opacity-30 mb-2"></lucide-icon>
              <p class="text-xs">Output will appear here after conversion.</p>
            </div>
          }
        </div>
      </app-split-pane>
    </div>
  `
})
export class JsonCsvComponent {
  private readonly toast = inject(ToastService);

  readonly mode = signal<ConversionMode>('json-to-csv');
  readonly inputContent = signal<string>('');
  readonly outputContent = signal<string>('');
  readonly delimiter = signal<string>(',');
  readonly hasHeader = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadSample();
  }

  setMode(newMode: ConversionMode): void {
    if (this.mode() !== newMode) {
      this.mode.set(newMode);
      // Swap content when switching modes
      const currentInput = this.inputContent();
      const currentOutput = this.outputContent();
      this.inputContent.set(currentOutput || '');
      this.outputContent.set(currentInput || '');
      this.convert();
    }
  }

  onInputChange(val: string): void {
    this.inputContent.set(val);
    this.convert();
  }

  convert(): void {
    const input = this.inputContent().trim();
    if (!input) {
      this.outputContent.set('');
      this.error.set(null);
      return;
    }

    try {
      if (this.mode() === 'json-to-csv') {
        this.convertJsonToCsv(input);
      } else {
        this.convertCsvToJson(input);
      }
      this.error.set(null);
    } catch (e: any) {
      this.error.set(e.message || 'Conversion failed');
      this.outputContent.set('');
    }
  }

  private convertJsonToCsv(jsonStr: string): void {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e: any) {
      throw new Error('Invalid JSON input: ' + e.message);
    }

    // Ensure we have an array
    const dataArray = Array.isArray(parsed) ? parsed : [parsed];

    const csv = Papa.unparse(dataArray, {
      quotes: false,
      quoteChar: '"',
      escapeChar: '"',
      delimiter: this.delimiter(),
      header: this.hasHeader(),
      newline: '\n',
      skipEmptyLines: false,
      columns: undefined
    });

    this.outputContent.set(csv);
  }

  private convertCsvToJson(csvStr: string): void {
    const result = Papa.parse(csvStr, {
      delimiter: this.delimiter() === '\\t' ? '\t' : this.delimiter(),
      header: this.hasHeader(),
      dynamicTyping: true,
      skipEmptyLines: true
    });

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message);
    }

    this.outputContent.set(JSON.stringify(result.data, null, 2));
  }

  loadSample(): void {
    if (this.mode() === 'json-to-csv') {
      this.inputContent.set(JSON.stringify([
        { id: 1, name: "Alice Smith", role: "Admin", active: true },
        { id: 2, name: "Bob Jones", role: "Editor", active: false },
        { id: 3, name: "Charlie Brown", role: "Viewer", active: true }
      ], null, 2));
    } else {
      this.inputContent.set(`id,name,role,active\n1,Alice Smith,Admin,true\n2,Bob Jones,Editor,false\n3,Charlie Brown,Viewer,true`);
    }
    this.convert();
    this.toast.info('Sample loaded');
  }

  clearAll(): void {
    this.inputContent.set('');
    this.outputContent.set('');
    this.error.set(null);
    this.toast.info('Cleared');
  }

  swapPanes(): void {
    const temp = this.inputContent();
    this.inputContent.set(this.outputContent());
    this.outputContent.set(temp);
    this.mode.update(m => m === 'json-to-csv' ? 'csv-to-json' : 'json-to-csv');
    this.convert();
  }

  getDownloadFilename(): string {
    const ext = this.mode() === 'json-to-csv' ? 'csv' : 'json';
    return `converted.${ext}`;
  }
}
