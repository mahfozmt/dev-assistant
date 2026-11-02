import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-action-toolbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg text-xs font-sans">
      
      <!-- Left side: Primary action & custom options -->
      <div class="flex items-center gap-1.5 flex-wrap min-w-0">
        @if (primaryActionLabel) {
          <button
            type="button"
            (click)="primaryAction.emit()"
            [disabled]="isBusy"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-900 dark:bg-surface-100 hover:bg-surface-800 dark:hover:bg-white text-white dark:text-surface-950 font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-all shadow-xs">
            <lucide-icon [name]="primaryActionIcon" class="w-3.5 h-3.5"></lucide-icon>
            <span>{{ primaryActionLabel }}</span>
          </button>
        }

        <!-- Custom Slot -->
        <ng-content></ng-content>
      </div>

      <!-- Right side: Copy, Sample, Clear, Download, Fullscreen -->
      <div class="flex items-center gap-1 ml-auto">
        <!-- Load Sample -->
        @if (hasSample) {
          <button
            type="button"
            (click)="loadSample.emit()"
            title="Load sample input payload"
            aria-label="Load sample input payload"
            class="px-2 py-1 rounded-md text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors flex items-center gap-1.5 text-xs">
            <lucide-icon name="clipboard-paste" class="w-3.5 h-3.5"></lucide-icon>
            <span class="hidden sm:inline">Sample</span>
          </button>
        }

        <!-- Clear -->
        @if (hasClear) {
          <button
            type="button"
            (click)="clear.emit()"
            title="Clear editor contents"
            aria-label="Clear editor contents"
            class="px-2 py-1 rounded-md text-surface-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-surface-100 dark:hover:bg-surface-800 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors flex items-center gap-1.5 text-xs">
            <lucide-icon name="trash-2" class="w-3.5 h-3.5"></lucide-icon>
            <span class="hidden sm:inline">Clear</span>
          </button>
        }

        <!-- Copy -->
        @if (hasCopy) {
          <button
            type="button"
            (click)="onCopy()"
            [title]="copied() ? 'Copied to clipboard' : 'Copy output'"
            [attr.aria-label]="copied() ? 'Copied to clipboard' : 'Copy output'"
            class="px-2 py-1 rounded-md font-medium focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors flex items-center gap-1.5 text-xs"
            [ngClass]="copied() 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
              : 'text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800'">
            <lucide-icon [name]="copied() ? 'check' : 'copy'" class="w-3.5 h-3.5"></lucide-icon>
            <span>{{ copied() ? 'Copied' : 'Copy' }}</span>
          </button>
        }

        <!-- Download -->
        @if (hasDownload) {
          <button
            type="button"
            (click)="onDownload()"
            title="Download payload as file"
            aria-label="Download payload as file"
            class="px-2 py-1 rounded-md text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors flex items-center gap-1.5 text-xs">
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
            [attr.aria-label]="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
            [attr.aria-pressed]="isFullscreen"
            class="p-1 rounded-md text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors">
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
        this.toast.error('Failed to copy to clipboard');
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
