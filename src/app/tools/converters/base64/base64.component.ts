import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ActionToolbarComponent } from '../../../shared/components/action-toolbar.component';
import { SplitPaneComponent } from '../../../shared/components/split-pane.component';
import { ToastService } from '../../../core/services/toast.service';

type Base64Mode = 'encode' | 'decode';

@Component({
  selector: 'app-base64',
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
            <h1 class="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">Base64 Encoder / Decoder</h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Encode to or decode from Base64 strings, with URL-safe and File support.</p>
        </div>
      </div>

      <!-- Toolbar -->
      <app-action-toolbar
        [primaryActionLabel]="mode() === 'encode' ? 'Encode' : 'Decode'"
        [primaryActionIcon]="mode() === 'encode' ? 'lock' : 'unlock'"
        [hasSample]="false"
        [hasClear]="true"
        [hasCopy]="true"
        [hasDownload]="true"
        [copyContent]="outputContent()"
        [downloadContent]="outputContent()"
        [downloadFilename]="getDownloadFilename()"
        (primaryAction)="process()"
        (clear)="clearAll()">

        <div class="flex items-center gap-1.5 flex-wrap">
          <!-- Mode Toggle -->
          <div class="flex items-center bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md p-0.5 text-[11px]">
            <button
              type="button"
              (click)="setMode('encode')"
              class="px-2 py-0.5 rounded font-medium transition-colors"
              [ngClass]="mode() === 'encode' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              Encode
            </button>
            <button
              type="button"
              (click)="setMode('decode')"
              class="px-2 py-0.5 rounded font-medium transition-colors"
              [ngClass]="mode() === 'decode' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              Decode
            </button>
          </div>

          <!-- URL Safe Toggle -->
          <label class="flex items-center gap-1.5 text-[11px] text-surface-600 dark:text-surface-400 cursor-pointer hover:text-surface-900 dark:hover:text-surface-200 px-1">
            <input type="checkbox" [ngModel]="urlSafe()" (ngModelChange)="urlSafe.set($event); process()" class="rounded border-surface-300 text-brand-500 focus:ring-brand-500/50">
            URL-Safe
          </label>
        </div>
      </app-action-toolbar>

      <!-- Error Banner -->
      @if (error()) {
        <div class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-start gap-2.5">
          <lucide-icon name="circle-alert" class="w-4 h-4 shrink-0 mt-0.5"></lucide-icon>
          <div>
            <span class="font-semibold block">Error:</span>
            <p>{{ error() }}</p>
          </div>
        </div>
      }

      <!-- Editor Split Pane -->
      <app-split-pane
        [title]="'Base64 Workspace'"
        [inputLabel]="mode() === 'encode' ? 'Plain Text Input' : 'Base64 Input'"
        [outputLabel]="mode() === 'encode' ? 'Base64 Output' : 'Plain Text Output'"
        [inputMeta]="inputContent().length + ' chars'"
        [outputMeta]="outputContent().length + ' chars'"
        (swap)="swapPanes()">

        <div input-content class="h-full flex flex-col relative">
          <!-- File Drop Zone Overlay -->
          @if (isDragging()) {
            <div class="absolute inset-0 bg-brand-500/10 border-2 border-brand-500 border-dashed rounded-lg z-10 flex flex-col items-center justify-center pointer-events-none">
              <lucide-icon name="upload-cloud" class="w-8 h-8 text-brand-500 mb-2"></lucide-icon>
              <span class="text-brand-700 font-medium">Drop file to encode</span>
            </div>
          }

          <textarea
            class="w-full h-full min-h-[300px] bg-transparent font-mono text-xs p-2 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none leading-relaxed"
            [placeholder]="mode() === 'encode' ? 'Type text or drop a file here...' : 'Paste Base64 here...'"
            [ngModel]="inputContent()"
            (ngModelChange)="onInputChange($event)"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            spellcheck="false"></textarea>
        </div>

        <div output-content class="h-full flex flex-col">
          @if (outputContent()) {
            <textarea
              class="w-full h-full min-h-[300px] bg-transparent font-mono text-xs p-2 text-surface-900 dark:text-surface-100 focus:outline-none resize-none leading-relaxed"
              [ngModel]="outputContent()"
              readonly
              spellcheck="false"></textarea>
          } @else {
            <div class="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-surface-400">
              <lucide-icon [name]="mode() === 'encode' ? 'lock' : 'unlock'" class="w-6 h-6 opacity-30 mb-2"></lucide-icon>
              <p class="text-xs">Result will appear here.</p>
            </div>
          }
        </div>
      </app-split-pane>
    </div>
  `
})
export class Base64Component {
  private readonly toast = inject(ToastService);

  readonly mode = signal<Base64Mode>('encode');
  readonly inputContent = signal<string>('');
  readonly outputContent = signal<string>('');
  readonly urlSafe = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly isDragging = signal<boolean>(false);

  setMode(newMode: Base64Mode): void {
    if (this.mode() !== newMode) {
      this.mode.set(newMode);
      const currentInput = this.inputContent();
      const currentOutput = this.outputContent();
      this.inputContent.set(currentOutput || '');
      this.outputContent.set(currentInput || '');
      this.process();
    }
  }

  onInputChange(val: string): void {
    this.inputContent.set(val);
    this.process();
  }

  process(): void {
    const input = this.inputContent();
    if (!input) {
      this.outputContent.set('');
      this.error.set(null);
      return;
    }

    try {
      if (this.mode() === 'encode') {
        let b64 = btoa(unescape(encodeURIComponent(input)));
        if (this.urlSafe()) {
          b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        }
        this.outputContent.set(b64);
      } else {
        let b64 = input;
        if (this.urlSafe() || b64.includes('-') || b64.includes('_')) {
          b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
          while (b64.length % 4) {
            b64 += '=';
          }
        }
        const decoded = decodeURIComponent(escape(atob(b64)));
        this.outputContent.set(decoded);
      }
      this.error.set(null);
    } catch (e: any) {
      this.error.set('Invalid input format');
      this.outputContent.set('');
    }
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
    this.mode.update(m => m === 'encode' ? 'decode' : 'encode');
    this.process();
  }

  getDownloadFilename(): string {
    return this.mode() === 'encode' ? 'encoded.txt' : 'decoded.txt';
  }

  onDragOver(event: DragEvent): void {
    if (this.mode() === 'encode') {
      event.preventDefault();
      event.stopPropagation();
      this.isDragging.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (this.mode() === 'encode' && event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          // The result is a data URL: data:image/png;base64,....
          // For a pure Base64 encoder, we might just want to set the raw base64 or the whole data URL
          // We'll set the whole data URL to be helpful, or just the base64 part.
          // Let's set the full data URI so it's clear what it is.
          this.inputContent.set(`File: ${file.name}`);
          const b64 = result.split(',')[1] || result;
          this.outputContent.set(b64);
          this.toast.success(`Encoded ${file.name}`);
        }
      };

      reader.onerror = () => {
        this.toast.error('Failed to read file');
      };

      reader.readAsDataURL(file);
    }
  }
}
