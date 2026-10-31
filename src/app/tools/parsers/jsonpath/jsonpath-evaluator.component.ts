import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { JSONPath } from 'jsonpath-plus';
import { ActionToolbarComponent } from '../../../shared/components/action-toolbar.component';
import { SplitPaneComponent } from '../../../shared/components/split-pane.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-jsonpath-evaluator',
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
              JSONPath Evaluator
            </h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            Query, extract, and filter JSON elements using standard JSONPath expressions with instant feedback.
          </p>
        </div>

        <div class="flex items-center gap-2">
          @if (errorMessage()) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Error
            </span>
          } @else {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {{ matchCount() }} {{ matchCount() === 1 ? 'match' : 'matches' }}
            </span>
          }
        </div>
      </div>

      <!-- JSONPath Expression Query Bar -->
      <div class="p-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl space-y-2">
        <div class="flex items-center gap-2">
          <span class="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400 px-2 py-1 rounded bg-brand-500/10 shrink-0">
            Path
          </span>
          <input
            type="text"
            class="w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-1.5 text-xs font-mono text-surface-900 dark:text-surface-100 focus:outline-none focus:border-brand-500"
            placeholder="e.g. $.store.book[*].author or $..price or $.items[?(@.active)]"
            [ngModel]="pathQuery()"
            (ngModelChange)="onPathChange($event)"
            spellcheck="false"
          />
          <button
            type="button"
            (click)="evaluatePath()"
            class="px-3 py-1.5 rounded-lg bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 text-xs font-medium shrink-0 hover:bg-surface-800 dark:hover:bg-white transition-colors shadow-xs">
            Evaluate
          </button>
        </div>

        <!-- Quick Syntax Presets -->
        <div class="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
          <span class="text-surface-400 font-mono text-[10px]">Presets:</span>
          @for (preset of presets; track preset.query) {
            <button
              type="button"
              (click)="pathQuery.set(preset.query); evaluatePath()"
              class="px-2 py-0.5 rounded-md bg-white dark:bg-surface-800 border border-surface-200/80 dark:border-surface-700/80 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 font-mono transition-colors">
              {{ preset.label }}
            </button>
          }
        </div>
      </div>

      <!-- Error notice -->
      @if (errorMessage()) {
        <div class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-start gap-2.5">
          <lucide-icon name="circle-alert" class="w-4 h-4 shrink-0 mt-0.5"></lucide-icon>
          <div>
            <span class="font-semibold block">Evaluation Error:</span>
            <p>{{ errorMessage() }}</p>
          </div>
        </div>
      }

      <!-- Action Toolbar -->
      <app-action-toolbar
        [primaryActionLabel]="'Run Query'"
        primaryActionIcon="search-code"
        [hasSample]="true"
        [hasClear]="true"
        [hasCopy]="true"
        [hasDownload]="true"
        [copyContent]="outputContent()"
        [downloadContent]="outputContent()"
        downloadFilename="jsonpath-result.json"
        (primaryAction)="evaluatePath()"
        (loadSample)="loadSample()"
        (clear)="clearAll()">
      </app-action-toolbar>

      <!-- Editor Split Pane -->
      <app-split-pane
        [title]="'JSONPath Engine'"
        inputLabel="Payload Document"
        outputLabel="Evaluation Result"
        [inputMeta]="inputContent().length + ' chars'"
        [outputMeta]="matchCount() + ' matches extracted'"
        (swap)="swapPanes()">
        
        <div input-content class="h-full flex flex-col">
          <textarea
            class="w-full h-full min-h-[380px] bg-transparent font-mono text-xs p-2 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none leading-relaxed"
            placeholder="Paste target JSON payload here..."
            [ngModel]="inputContent()"
            (ngModelChange)="onInputChange($event)"
            spellcheck="false"></textarea>
        </div>

        <div output-content class="h-full flex flex-col">
          @if (outputContent()) {
            <pre class="w-full h-full min-h-[380px] overflow-auto font-mono text-xs p-2 text-surface-900 dark:text-surface-100 select-all leading-relaxed">{{ outputContent() }}</pre>
          } @else {
            <div class="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 text-surface-400 font-mono">
              <lucide-icon name="search-code" class="w-7 h-7 opacity-25 mb-2"></lucide-icon>
              <p class="text-xs">No elements matched the current path.</p>
            </div>
          }
        </div>
      </app-split-pane>

    </div>
  `
})
export class JsonPathEvaluatorComponent {
  private readonly toast = inject(ToastService);

  readonly pathQuery = signal<string>('$.store.book[*].title');
  readonly matchCount = signal<number>(0);
  readonly errorMessage = signal<string | null>(null);

  readonly presets = [
    { label: 'All Titles ($.store.book[*].title)', query: '$.store.book[*].title' },
    { label: 'Cheap Books (< $10)', query: '$.store.book[?(@.price < 10)]' },
    { label: 'Recursive Authors ($..author)', query: '$..author' },
    { label: 'All Items ($..*)', query: '$..*' }
  ];

  readonly inputContent = signal<string>(JSON.stringify({
    store: {
      book: [
        { category: "reference", author: "Nigel Rees", title: "Sayings of the Century", price: 8.95 },
        { category: "fiction", author: "Evelyn Waugh", title: "Sword of Honour", price: 12.99 },
        { category: "fiction", author: "Herman Melville", title: "Moby Dick", isbn: "0-553-21311-3", price: 8.99 },
        { category: "fiction", author: "J. R. R. Tolkien", title: "The Lord of the Rings", isbn: "0-395-19395-8", price: 22.99 }
      ],
      bicycle: {
        color: "red",
        price: 19.95
      }
    }
  }, null, 2));

  readonly outputContent = signal<string>('');

  constructor() {
    this.evaluatePath();
  }

  onInputChange(val: string): void {
    this.inputContent.set(val);
    this.evaluatePath();
  }

  onPathChange(val: string): void {
    this.pathQuery.set(val);
    this.evaluatePath();
  }

  evaluatePath(): void {
    const raw = this.inputContent().trim();
    const query = this.pathQuery().trim();

    if (!raw) {
      this.outputContent.set('');
      this.matchCount.set(0);
      this.errorMessage.set(null);
      return;
    }

    try {
      const json = JSON.parse(raw);
      this.errorMessage.set(null);

      if (!query) {
        this.outputContent.set(JSON.stringify(json, null, 2));
        this.matchCount.set(1);
        return;
      }

      const results = JSONPath({ path: query, json: json });
      this.matchCount.set(Array.isArray(results) ? results.length : (results !== undefined ? 1 : 0));
      this.outputContent.set(JSON.stringify(results, null, 2));
    } catch (e: any) {
      this.errorMessage.set(e.message || 'Failed to evaluate JSONPath');
      this.matchCount.set(0);
    }
  }

  loadSample(): void {
    this.pathQuery.set('$.store.book[?(@.price < 10)]');
    this.evaluatePath();
    this.toast.info('Loaded filter query sample');
  }

  clearAll(): void {
    this.inputContent.set('');
    this.outputContent.set('');
    this.matchCount.set(0);
    this.errorMessage.set(null);
    this.toast.info('Cleared');
  }

  swapPanes(): void {
    const temp = this.inputContent();
    this.inputContent.set(this.outputContent());
    this.outputContent.set(temp);
    this.evaluatePath();
  }
}
