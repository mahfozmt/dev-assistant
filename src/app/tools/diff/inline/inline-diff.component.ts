import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ActionToolbarComponent } from '../../../shared/components/action-toolbar.component';
import { SplitPaneComponent } from '../../../shared/components/split-pane.component';
import { ToastService } from '../../../core/services/toast.service';
import { Change, diffLines, createPatch } from 'diff';

export interface InlineDiffLine {
  type: 'addition' | 'deletion' | 'context';
  oldLineNumber: number | null;
  newLineNumber: number | null;
  content: string;
}

@Component({
  selector: 'app-inline-diff',
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
              Inline Diff Viewer
            </h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            Unified single-column GitHub-style diff viewer with unified patch generation and patch download.
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
            {{ contextLines() }} unchanged
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
        [copyContent]="unifiedPatch()"
        [downloadContent]="unifiedPatch()"
        downloadFilename="changes.patch"
        (primaryAction)="computeDiff()"
        (loadSample)="loadSample()"
        (clear)="clearAll()">
        
        <!-- Controls Bar: Generate Patch, Copy Patch, Download .patch, Ignore Space -->
        <div class="flex items-center gap-1.5 flex-wrap">
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

          <!-- Swap Panes -->
          <button
            type="button"
            (click)="swapInputs()"
            title="Swap Original and Modified texts"
            class="px-2 py-1 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors border border-surface-200 dark:border-surface-700 flex items-center gap-1">
            <lucide-icon name="arrow-left-right" class="w-3 h-3"></lucide-icon>
            <span>Swap</span>
          </button>

          <!-- Copy Patch button -->
          <button
            type="button"
            (click)="copyPatch()"
            class="px-2.5 py-1 rounded-md text-xs font-mono font-medium text-surface-700 dark:text-surface-200 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-750 transition-colors flex items-center gap-1">
            <lucide-icon name="copy" class="w-3 h-3"></lucide-icon>
            <span>Copy .patch</span>
          </button>

          <!-- View Mode: Unified vs Raw Patch vs Inputs Split -->
          <div class="flex items-center bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md p-0.5 text-[11px]">
            <button
              type="button"
              (click)="viewMode.set('split')"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="viewMode() === 'split' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              Inputs & Diff
            </button>
            <button
              type="button"
              (click)="viewMode.set('diff')"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="viewMode() === 'diff' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              Unified View
            </button>
            <button
              type="button"
              (click)="viewMode.set('patch')"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="viewMode() === 'patch' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              Raw Patch
            </button>
          </div>
        </div>
      </app-action-toolbar>

      <!-- Input Split Pane (Visible in 'split' mode) -->
      @if (viewMode() === 'split') {
        <app-split-pane
          [title]="'Input Text Editors'"
          inputLabel="Original (Before)"
          outputLabel="Modified (After)"
          [inputMeta]="originalText().length + ' chars • ' + lineCount(originalText()) + ' lines'"
          [outputMeta]="modifiedText().length + ' chars • ' + lineCount(modifiedText()) + ' lines'"
          (swap)="swapInputs()">
          
          <div input-content class="h-full flex flex-col">
            <textarea
              class="w-full h-full min-h-[220px] bg-transparent font-mono text-xs p-2 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none leading-relaxed"
              placeholder="Paste original file content..."
              [ngModel]="originalText()"
              (ngModelChange)="onOriginalChange($event)"
              spellcheck="false"></textarea>
          </div>

          <div output-content class="h-full flex flex-col">
            <textarea
              class="w-full h-full min-h-[220px] bg-transparent font-mono text-xs p-2 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none leading-relaxed"
              placeholder="Paste modified file content..."
              [ngModel]="modifiedText()"
              (ngModelChange)="onModifiedChange($event)"
              spellcheck="false"></textarea>
          </div>
        </app-split-pane>
      }

      <!-- Unified Diff Output View -->
      @if (viewMode() !== 'patch') {
        <div class="border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden">
          <div class="h-9 px-3 bg-surface-50/90 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500 font-mono">
            <div class="flex items-center gap-2">
              <lucide-icon name="git-compare" class="w-3.5 h-3.5"></lucide-icon>
              <span class="font-medium text-surface-700 dark:text-surface-300">Unified Diff</span>
            </div>
            <div class="flex items-center gap-3 text-[11px] text-surface-400">
              <span class="text-rose-600 dark:text-rose-400">- Deletions</span>
              <span class="text-emerald-600 dark:text-emerald-400">+ Additions</span>
            </div>
          </div>

          <!-- Unified Diff Table -->
          <div class="overflow-x-auto min-h-[300px] max-h-[600px] font-mono text-xs">
            @if (diffLinesList().length > 0) {
              <table class="w-full border-collapse">
                <tbody>
                  @for (line of diffLinesList(); track $index) {
                    <tr 
                      class="border-b border-surface-100/60 dark:border-surface-850/60 transition-colors leading-relaxed"
                      [ngClass]="{
                        'bg-rose-500/10 text-rose-700 dark:text-rose-300': line.type === 'deletion',
                        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300': line.type === 'addition',
                        'hover:bg-surface-50 dark:hover:bg-surface-900/60 text-surface-800 dark:text-surface-200': line.type === 'context'
                      }">
                      
                      <!-- Old Line Number -->
                      <td class="w-12 py-0.5 px-2 text-right select-none text-[10px] text-surface-400 bg-surface-50/60 dark:bg-surface-900/40 border-r border-surface-200 dark:border-surface-800 font-mono">
                        {{ line.oldLineNumber !== null ? line.oldLineNumber : '' }}
                      </td>

                      <!-- New Line Number -->
                      <td class="w-12 py-0.5 px-2 text-right select-none text-[10px] text-surface-400 bg-surface-50/60 dark:bg-surface-900/40 border-r border-surface-200 dark:border-surface-800 font-mono">
                        {{ line.newLineNumber !== null ? line.newLineNumber : '' }}
                      </td>

                      <!-- Diff Marker (+ / - / space) -->
                      <td class="w-6 py-0.5 px-2 text-center select-none font-bold text-xs"
                        [ngClass]="{
                          'text-rose-600 dark:text-rose-400': line.type === 'deletion',
                          'text-emerald-600 dark:text-emerald-400': line.type === 'addition',
                          'text-surface-300 dark:text-surface-600': line.type === 'context'
                        }">
                        {{ line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ' }}
                      </td>

                      <!-- Line Content -->
                      <td class="py-0.5 px-3 whitespace-pre-wrap break-all">
                        {{ line.content }}
                      </td>

                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <div class="h-64 flex flex-col items-center justify-center text-center p-6 text-surface-400 font-mono">
                <lucide-icon name="git-compare" class="w-8 h-8 opacity-25 mb-2"></lucide-icon>
                <p class="text-xs">No difference found or no text input.</p>
                <button
                  type="button"
                  (click)="loadSample()"
                  class="mt-2 text-xs text-brand-500 hover:underline">
                  Load sample
                </button>
              </div>
            }
          </div>
        </div>
      } @else {
        <!-- Raw Patch Panel -->
        <div class="border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden">
          <div class="h-9 px-3 bg-surface-50/90 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500 font-mono">
            <span class="font-medium text-surface-700 dark:text-surface-300">Unified Patch Format (.patch / .diff)</span>
            <button
              type="button"
              (click)="copyPatch()"
              class="text-xs text-brand-500 hover:underline">
              Copy Patch Content
            </button>
          </div>
          <pre class="p-4 overflow-auto font-mono text-xs text-surface-900 dark:text-surface-100 select-all min-h-[300px] leading-relaxed">{{ unifiedPatch() }}</pre>
        </div>
      }

    </div>
  `
})
export class InlineDiffComponent implements OnDestroy {
  private readonly toast = inject(ToastService);

  readonly originalText = signal<string>(
    `function calculateDiscount(price, isMember) {
  if (isMember) {
    return price * 0.9;
  }
  return price;
}`
  );
  readonly modifiedText = signal<string>(
    `function calculateDiscount(price, isMember, couponCode) {
  if (couponCode === 'DEVVIP') {
    return price * 0.8;
  }
  if (isMember) {
    return price * 0.9;
  }
  return price;
}`
  );

  readonly ignoreWhitespace = signal<boolean>(false);
  readonly viewMode = signal<'split' | 'diff' | 'patch'>('split');

  readonly diffLinesList = signal<InlineDiffLine[]>([]);
  readonly unifiedPatch = signal<string>('');
  readonly additions = signal<number>(0);
  readonly deletions = signal<number>(0);
  readonly contextLines = signal<number>(0);

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

  toggleIgnoreWhitespace(): void {
    this.ignoreWhitespace.update(v => !v);
    this.computeDiff();
  }

  swapInputs(): void {
    const temp = this.originalText();
    this.originalText.set(this.modifiedText());
    this.modifiedText.set(temp);
    this.computeDiff();
    this.toast.info('Swapped original and modified texts');
  }

  clearAll(): void {
    this.originalText.set('');
    this.modifiedText.set('');
    this.diffLinesList.set([]);
    this.unifiedPatch.set('');
    this.additions.set(0);
    this.deletions.set(0);
    this.contextLines.set(0);
    this.toast.info('Cleared inputs');
  }

  loadSample(): void {
    this.originalText.set(
      `export const config = {\n  env: 'staging',\n  debug: true,\n  timeout: 3000\n};`
    );
    this.modifiedText.set(
      `export const config = {\n  env: 'production',\n  debug: false,\n  timeout: 5000,\n  retries: 3\n};`
    );
    this.computeDiff();
    this.toast.info('Loaded sample code diff');
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
    const oldStr = this.originalText();
    const newStr = this.modifiedText();

    if (!oldStr && !newStr) {
      this.diffLinesList.set([]);
      this.unifiedPatch.set('');
      this.additions.set(0);
      this.deletions.set(0);
      this.contextLines.set(0);
      return;
    }

    const options: any = {
      ignoreWhitespace: this.ignoreWhitespace()
    };

    const changes = (diffLines(oldStr, newStr, options) as any as Change[]) || [];
    this.buildInlineDiffLines(changes);

    // Generate unified patch string
    const patch = createPatch('file.txt', oldStr, newStr, 'original', 'modified', options);
    this.unifiedPatch.set(patch || '');
  }

  private buildInlineDiffLines(changes: Change[]): void {
    const list: InlineDiffLine[] = [];
    let oldLine = 1;
    let newLine = 1;
    let addCount = 0;
    let delCount = 0;
    let ctxCount = 0;

    for (const change of changes) {
      const rawLines = change.value.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');

      if (change.added) {
        for (const line of rawLines) {
          list.push({
            type: 'addition',
            oldLineNumber: null,
            newLineNumber: newLine++,
            content: line
          });
          addCount++;
        }
      } else if (change.removed) {
        for (const line of rawLines) {
          list.push({
            type: 'deletion',
            oldLineNumber: oldLine++,
            newLineNumber: null,
            content: line
          });
          delCount++;
        }
      } else {
        for (const line of rawLines) {
          list.push({
            type: 'context',
            oldLineNumber: oldLine++,
            newLineNumber: newLine++,
            content: line
          });
          ctxCount++;
        }
      }
    }

    this.diffLinesList.set(list);
    this.additions.set(addCount);
    this.deletions.set(delCount);
    this.contextLines.set(ctxCount);
  }

  async copyPatch(): Promise<void> {
    const patch = this.unifiedPatch();
    if (!patch) return;
    try {
      await navigator.clipboard.writeText(patch);
      this.toast.success('Unified patch copied to clipboard');
    } catch {
      this.toast.error('Failed to copy patch');
    }
  }

  lineCount(text: string): number {
    return text ? text.split('\n').length : 0;
  }
}
