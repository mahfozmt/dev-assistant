import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-action-toolbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-surface-100/70 dark:bg-surface-850 border border-surface-200 dark:border-surface-800 rounded-xl text-xs">
      
      <!-- Left side: Primary execution / tool-specific options -->
      <div class="flex items-center gap-2 flex-wrap min-w-0">
        @if (primaryActionLabel) {
          <button
            type="button"
            (click)="primaryAction.emit()"
            [disabled]="isBusy"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            <lucide-icon [name]="primaryActionIcon" class="w-3.5 h-3.5"></lucide-icon>
            <span>{{ primaryActionLabel }}</span>
          </button>
        }

        <!-- Custom Slot for options (e.g. indent spaces, dialect) -->
        <ng-content></ng-content>
      </div>

      <!-- Right side: General utilities (Copy, Sample, Clear, Download, Fullscreen) -->
      <div class="flex items-center gap-1 ml-auto">
        <!-- Load Sample -->
        @if (hasSample) {
          <button
            type="button"
            (click)="loadSample.emit()"
            title="Load sample test input"
            class="px-2.5 py-1.5 rounded-lg text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-100 transition-colors flex items-center gap-1.5">
            <lucide-icon name="clipboard-paste" class="w-3.5 h-3.5"></lucide-icon>
            <span class="hidden sm:inline">Sample</span>
          </button>
        }

        <!-- Clear -->
        @if (hasClear) {
          <button
            type="button"
            (click)="clear.emit()"
            title="Clear all fields"
            class="px-2.5 py-1.5 rounded-lg text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1.5">
            <lucide-icon name="trash-2" class="w-3.5 h-3.5"></lucide-icon>
            <span class="hidden sm:inline">Clear</span>
          </button>
        }

        <!-- Copy -->
        @if (hasCopy) {
          <button
            type="button"
            (click)="onCopy()"
            [title]="copied() ? 'Copied to clipboard!' : 'Copy to clipboard'"
            class="px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
            [ngClass]="copied() ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'">
            <lucide-icon [name]="copied() ? 'check' : 'copy'" class="w-3.5 h-3.5"></lucide-icon>
            <span>{{ copied() ? 'Copied' : 'Copy' }}</span>
          </button>
        }

        <!-- Download -->
        @if (hasDownload) {
          <button
            type="button"
            (click)="onDownload()"
            title="Download output file"
            class="px-2.5 py-1.5 rounded-lg text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-100 transition-colors flex items-center gap-1.5">
            <lucide-icon name="download" class="w-3.5 h-3.5"></lucide-icon>
            <span class="hidden sm:inline">Download</span>
          </button>
        }

        <!-- Fullscreen -->
        @if (hasFullscreen) {
          <button
            type="button"
            (click)="toggleFullscreen.emit()"
            [title]="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
            class="p-1.5 rounded-lg text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
            <lucide-icon [name]="isFullscreen ? 'minimize-2' : 'maximize-2'" class="w-3.5 h-3.5"></lucide-icon>
          </button>
        }
      </div>

    </div>
  `
})
export class ActionToolbarComponent {
  private readonly toast = inject(ToastService);

  @Input() primaryActionLabel = '';
  @Input() primaryActionIcon = 'sparkles';
  @Input() isBusy = false;
  @Input() hasSample = true;
  @Input() hasClear = true;
  @Input() hasCopy = true;
  @Input() hasDownload = true;
  @Input() hasFullscreen = false;
  @Input() isFullscreen = false;
  @Input() copyContent = '';
  @Input() downloadFilename = 'output.txt';
  @Input() downloadContent = '';

  @Output() primaryAction = new EventEmitter<void>();
  @Output() loadSample = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
  @Output() copy = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();
  @Output() toggleFullscreen = new EventEmitter<void>();

  readonly copied = signal<boolean>(false);

  async onCopy(): Promise<void> {
    const text = this.copyContent;
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        this.copied.set(true);
        this.toast.success('Copied to clipboard');
        setTimeout(() => this.copied.set(false), 2000);
      } catch {
        this.toast.error('Failed to copy text');
      }
    }
    this.copy.emit();
  }

  onDownload(): void {
    const content = this.downloadContent || this.copyContent;
    if (content) {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.downloadFilename;
      a.click();
      URL.revokeObjectURL(url);
      this.toast.success(`Downloaded ${this.downloadFilename}`);
    }
    this.download.emit();
  }
}
