import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ActionToolbarComponent } from '../../../shared/components/action-toolbar.component';
import { SplitPaneComponent } from '../../../shared/components/split-pane.component';
import { ToastService } from '../../../core/services/toast.service';
import { Change, diffLines, diffWords, diffChars } from 'diff';

export type DiffGranularity = 'lines' | 'words' | 'chars';

export interface DiffRow {
  leftLineNumber: number | null;
  leftContent: string;
  leftType: 'unchanged' | 'removed' | 'empty';
  rightLineNumber: number | null;
  rightContent: string;
  rightType: 'unchanged' | 'added' | 'empty';
}

@Component({
  selector: 'app-side-by-side-diff',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    ActionToolbarComponent,
    SplitPaneComponent
  ],
  template: `
    <div class="space-y-4 max-w-7xl mx-auto w-full pb-8 animate-in fade-in duration-100">
      
      <!-- Tool Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-800 gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-surface-400">Diff Viewer</span>
            <span class="text-surface-300 dark:text-surface-700">/</span>
            <h1 class="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">
              Side-by-Side Diff Viewer
            </h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            Compare two texts or files side-by-side with synchronized line numbering and syntax change highlights.
          </p>
        </div>

        <!-- Summary Badge -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            +{{ additions() }} additions
          </span>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            -{{ deletions() }} deletions
          </span>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-700">
            {{ unchanged() }} unchanged
          </span>
        </div>
      </div>

      <!-- Action Toolbar -->
      <app-action-toolbar
        [primaryActionLabel]="'Compare'"
        primaryActionIcon="git-compare"
        [hasSample]="true"
        [hasClear]="true"
        [hasCopy]="true"
        [hasDownload]="true"
        [copyContent]="getDiffAsText()"
        [downloadContent]="getDiffAsText()"
        downloadFilename="diff-summary.txt"
        (primaryAction)="computeDiff()"
        (loadSample)="loadSample()"
        (clear)="clearAll()">
        
        <!-- Controls Bar: Ignore Whitespace, Case Sensitive, Granularity, Swap Panes -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <!-- Granularity Selector -->
          <div class="flex items-center bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md p-0.5 text-[11px]">
            <button
              type="button"
              (click)="setGranularity('lines')"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="granularity() === 'lines' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              Lines
            </button>
            <button
              type="button"
              (click)="setGranularity('words')"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="granularity() === 'words' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              Words
            </button>
            <button
              type="button"
              (click)="setGranularity('chars')"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="granularity() === 'chars' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              Chars
            </button>
          </div>

          <!-- Ignore Whitespace Toggle -->
          <button
            type="button"
            (click)="toggleIgnoreWhitespace()"
            class="px-2 py-1 rounded-md text-xs font-mono transition-colors border"
            [ngClass]="ignoreWhitespace() 
              ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/30' 
              : 'border-surface-200 dark:border-surface-700 text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
            {{ ignoreWhitespace() ? '✓ Ignore Space' : 'Ignore Space' }}
          </button>

          <!-- Case Sensitive Toggle -->
          <button
            type="button"
            (click)="toggleCaseSensitive()"
            class="px-2 py-1 rounded-md text-xs font-mono transition-colors border"
            [ngClass]="caseSensitive() 
              ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/30' 
              : 'border-surface-200 dark:border-surface-700 text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
            {{ caseSensitive() ? 'Aa Case-Match' : 'Aa Ignore-Case' }}
          </button>

          <!-- Swap Panes -->
          <button
            type="button"
            (click)="swapInputs()"
            title="Swap Original and Modified texts"
            class="px-2 py-1 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors border border-surface-200 dark:border-surface-700 flex items-center gap-1">
            <lucide-icon name="arrow-left-right" class="w-3 h-3"></lucide-icon>
            <span>Swap</span>
          </button>

          <!-- View Toggle: Inputs vs Diff Output -->
          <div class="flex items-center bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md p-0.5 text-[11px]">
            <button
              type="button"
              (click)="activeView.set('split')"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="activeView() === 'split' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              Inputs & Diff
            </button>
            <button
              type="button"
              (click)="activeView.set('diffOnly')"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="activeView() === 'diffOnly' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              Diff Only
            </button>
          </div>
        </div>
      </app-action-toolbar>

      <!-- Input Split Pane (Visible in 'split' mode) -->
      @if (activeView() === 'split') {
        <app-split-pane
          [title]="'Input Text Editors'"
          inputLabel="Original (Left)"
          outputLabel="Modified (Right)"
          [inputMeta]="originalText().length + ' chars • ' + lineCount(originalText()) + ' lines'"
          [outputMeta]="modifiedText().length + ' chars • ' + lineCount(modifiedText()) + ' lines'"
          (swap)="swapInputs()">
          
          <div input-content class="h-full flex flex-col">
            <textarea
              class="w-full h-full min-h-[220px] bg-transparent font-mono text-xs p-2 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none leading-relaxed"
              placeholder="Paste original source text here..."
              [ngModel]="originalText()"
              (ngModelChange)="onOriginalChange($event)"
              spellcheck="false"></textarea>
          </div>

          <div output-content class="h-full flex flex-col">
            <textarea
              class="w-full h-full min-h-[220px] bg-transparent font-mono text-xs p-2 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none leading-relaxed"
              placeholder="Paste modified target text here..."
              [ngModel]="modifiedText()"
              (ngModelChange)="onModifiedChange($event)"
              spellcheck="false"></textarea>
          </div>
        </app-split-pane>
      }

      <!-- Side-by-Side Diff Output Panel -->
      <div class="border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden">
        <div class="h-9 px-3 bg-surface-50/90 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500 font-mono">
          <div class="flex items-center gap-2">
            <lucide-icon name="columns-2" class="w-3.5 h-3.5"></lucide-icon>
            <span class="font-medium text-surface-700 dark:text-surface-300">Synchronized Diff Comparison</span>
          </div>
          <div class="flex items-center gap-4 text-[11px] text-surface-400">
            <span>Left: Original</span>
            <span>Right: Modified</span>
          </div>
        </div>

        <!-- Diff Grid Table -->
        <div class="overflow-x-auto min-h-[300px] max-h-[600px] font-mono text-xs">
          @if (diffRows().length > 0) {
            <table class="w-full border-collapse">
              <tbody>
                @for (row of diffRows(); track $index) {
                  <tr class="hover:bg-surface-50 dark:hover:bg-surface-900/60 transition-colors border-b border-surface-100/60 dark:border-surface-850/60">
                    
                    <!-- Left Line Number -->
                    <td class="w-12 py-0.5 px-2 text-right select-none text-[10px] text-surface-400 bg-surface-50/60 dark:bg-surface-900/40 border-r border-surface-200 dark:border-surface-800 font-mono">
                      {{ row.leftLineNumber !== null ? row.leftLineNumber : '' }}
                    </td>

                    <!-- Left Content (Red if removed) -->
                    <td 
                      class="w-1/2 py-0.5 px-3 whitespace-pre-wrap break-all leading-relaxed border-r border-surface-200 dark:border-surface-800"
                      [ngClass]="{
                        'bg-rose-500/10 text-rose-700 dark:text-rose-300': row.leftType === 'removed',
                        'bg-transparent text-surface-800 dark:text-surface-200': row.leftType === 'unchanged',
                        'bg-surface-50/30 dark:bg-surface-900/20': row.leftType === 'empty'
                      }">
                      {{ row.leftContent }}
                    </td>

                    <!-- Right Line Number -->
                    <td class="w-12 py-0.5 px-2 text-right select-none text-[10px] text-surface-400 bg-surface-50/60 dark:bg-surface-900/40 border-r border-surface-200 dark:border-surface-800 font-mono">
                      {{ row.rightLineNumber !== null ? row.rightLineNumber : '' }}
                    </td>

                    <!-- Right Content (Green if added) -->
                    <td 
                      class="w-1/2 py-0.5 px-3 whitespace-pre-wrap break-all leading-relaxed"
                      [ngClass]="{
                        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300': row.rightType === 'added',
                        'bg-transparent text-surface-800 dark:text-surface-200': row.rightType === 'unchanged',
                        'bg-surface-50/30 dark:bg-surface-900/20': row.rightType === 'empty'
                      }">
                      {{ row.rightContent }}
                    </td>

                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <div class="h-64 flex flex-col items-center justify-center text-center p-6 text-surface-400 font-mono">
              <lucide-icon name="git-compare" class="w-8 h-8 opacity-25 mb-2"></lucide-icon>
              <p class="text-xs">No text provided for comparison.</p>
              <button
                type="button"
                (click)="loadSample()"
                class="mt-2 text-xs text-brand-500 hover:underline">
                Load sample comparison
              </button>
            </div>
          }
        </div>
      </div>

    </div>
  `
})
export class SideBySideDiffComponent implements OnDestroy {
  private readonly toast = inject(ToastService);

  readonly originalText = signal<string>(
    '{\n  "env": "staging",\n  "debug": true,\n  "timeout": 3000,\n  "cache": true\n}'
  );
  readonly modifiedText = signal<string>(
    '{\n  "env": "production",\n  "debug": false,\n  "timeout": 5000,\n  "retries": 3,\n  "cache": true\n}'
  );

  readonly granularity = signal<DiffGranularity>('lines');
  readonly ignoreWhitespace = signal<boolean>(false);
  readonly caseSensitive = signal<boolean>(true);
  readonly activeView = signal<'split' | 'diffOnly'>('split');

  readonly diffRows = signal<DiffRow[]>([]);
  readonly additions = signal<number>(0);
  readonly deletions = signal<number>(0);
  readonly unchanged = signal<number>(0);

  private debounceTimer: any = null;

  constructor() {
    this.computeDiff();
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  onOriginalChange(val: string): void {
    this.originalText.set(val);
    this.scheduleDebouncedDiff();
  }

  onModifiedChange(val: string): void {
    this.modifiedText.set(val);
    this.scheduleDebouncedDiff();
  }

  setGranularity(g: DiffGranularity): void {
    this.granularity.set(g);
    this.computeDiff();
  }

  toggleIgnoreWhitespace(): void {
    this.ignoreWhitespace.update(v => !v);
    this.computeDiff();
  }

  toggleCaseSensitive(): void {
    this.caseSensitive.update(v => !v);
    this.computeDiff();
  }

  swapInputs(): void {
    const temp = this.originalText();
    this.originalText.set(this.modifiedText());
    this.modifiedText.set(temp);
    this.computeDiff();
    this.toast.info('Swapped left and right texts');
  }

  clearAll(): void {
    this.originalText.set('');
    this.modifiedText.set('');
    this.diffRows.set([]);
    this.additions.set(0);
    this.deletions.set(0);
    this.unchanged.set(0);
    this.toast.info('Cleared diff workspace');
  }

  loadSample(): void {
    this.originalText.set('{\n  "env": "staging",\n  "debug": true,\n  "timeout": 3000\n}');
    this.modifiedText.set('{\n  "env": "production",\n  "debug": false,\n  "timeout": 5000,\n  "retries": 3\n}');
    this.computeDiff();
    this.toast.info('Loaded sample diff data');
  }

  private scheduleDebouncedDiff(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.computeDiff();
    }, 300);
  }

  computeDiff(): void {
    let left = this.originalText();
    let right = this.modifiedText();

    if (!left && !right) {
      this.diffRows.set([]);
      this.additions.set(0);
      this.deletions.set(0);
      this.unchanged.set(0);
      return;
    }

    const options: any = {
      ignoreWhitespace: this.ignoreWhitespace(),
      ignoreCase: !this.caseSensitive()
    };

    let changes: Change[] = [];
    const gran = this.granularity();
    if (gran === 'words') {
      changes = (diffWords(left, right, options) as any as Change[]) || [];
    } else if (gran === 'chars') {
      changes = (diffChars(left, right, options) as any as Change[]) || [];
    } else {
      changes = (diffLines(left, right, options) as any as Change[]) || [];
    }

    this.buildSideBySideRows(changes);
  }

  private buildSideBySideRows(changes: Change[]): void {
    const rows: DiffRow[] = [];
    let leftLine = 1;
    let rightLine = 1;
    let addCount = 0;
    let delCount = 0;
    let uncCount = 0;

    for (let i = 0; i < changes.length; i++) {
      const part = changes[i];
      const nextPart = changes[i + 1];

      // Pair consecutive deletion + addition for parallel alignment
      if (part.removed && nextPart && nextPart.added) {
        const leftLines = part.value.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
        const rightLines = nextPart.value.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
        const maxLen = Math.max(leftLines.length, rightLines.length);

        for (let j = 0; j < maxLen; j++) {
          const lTxt = leftLines[j];
          const rTxt = rightLines[j];

          rows.push({
            leftLineNumber: lTxt !== undefined ? leftLine++ : null,
            leftContent: lTxt !== undefined ? lTxt : '',
            leftType: lTxt !== undefined ? 'removed' : 'empty',
            rightLineNumber: rTxt !== undefined ? rightLine++ : null,
            rightContent: rTxt !== undefined ? rTxt : '',
            rightType: rTxt !== undefined ? 'added' : 'empty'
          });

          if (lTxt !== undefined) delCount++;
          if (rTxt !== undefined) addCount++;
        }
        i++; // skip nextPart
      } else if (part.removed) {
        const lines = part.value.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
        for (const line of lines) {
          rows.push({
            leftLineNumber: leftLine++,
            leftContent: line,
            leftType: 'removed',
            rightLineNumber: null,
            rightContent: '',
            rightType: 'empty'
          });
          delCount++;
        }
      } else if (part.added) {
        const lines = part.value.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
        for (const line of lines) {
          rows.push({
            leftLineNumber: null,
            leftContent: '',
            leftType: 'empty',
            rightLineNumber: rightLine++,
            rightContent: line,
            rightType: 'added'
          });
          addCount++;
        }
      } else {
        const lines = part.value.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
        for (const line of lines) {
          rows.push({
            leftLineNumber: leftLine++,
            leftContent: line,
            leftType: 'unchanged',
            rightLineNumber: rightLine++,
            rightContent: line,
            rightType: 'unchanged'
          });
          uncCount++;
        }
      }
    }

    this.diffRows.set(rows);
    this.additions.set(addCount);
    this.deletions.set(delCount);
    this.unchanged.set(uncCount);
  }

  getDiffAsText(): string {
    return this.diffRows()
      .map(r => {
        const left = (r.leftLineNumber ? `L${r.leftLineNumber}: ` : '      ') + r.leftContent;
        const right = (r.rightLineNumber ? `R${r.rightLineNumber}: ` : '      ') + r.rightContent;
        return `${left.padEnd(45)} | ${right}`;
      })
      .join('\n');
  }

  lineCount(text: string): number {
    return text ? text.split('\n').length : 0;
  }
}
