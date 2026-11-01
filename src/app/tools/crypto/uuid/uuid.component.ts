import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService } from '../../../core/services/toast.service';

type UuidVersion = 'v4' | 'v7';
type UuidCase = 'lowercase' | 'uppercase';
type UuidFormat = 'standard' | 'no-hyphens' | 'braces' | 'csharp-parse' | 'csharp-new';

@Component({
  selector: 'app-uuid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule
  ],
  template: `
    <div class="flex-1 flex flex-col space-y-3.5 animate-in fade-in duration-100 max-w-6xl mx-auto w-full">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-800 gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-surface-400">Crypto & Security</span>
            <span class="text-surface-300 dark:text-surface-700">/</span>
            <h1 class="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">UUID / GUID Generator</h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Generate bulk random or time-ordered UUIDs in various formats.</p>
        </div>
      </div>

      <div class="flex flex-col lg:flex-row gap-4 h-full min-h-[500px]">
        
        <!-- Controls Column -->
        <div class="w-full lg:w-72 flex flex-col gap-4">
          <div class="flex flex-col border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs p-4 gap-5 h-full">
            
            <button
              type="button"
              (click)="generate()"
              class="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 text-sm font-semibold rounded-lg hover:bg-surface-800 dark:hover:bg-white transition-colors">
              <lucide-icon name="refresh-cw" class="w-4 h-4"></lucide-icon>
              Generate
            </button>

            <!-- Quantity -->
            <div class="space-y-1.5">
              <div class="flex justify-between items-center text-xs font-medium text-surface-700 dark:text-surface-300">
                <label>Quantity</label>
                <span class="font-mono">{{ quantity() }}</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                [ngModel]="quantity()"
                (ngModelChange)="quantity.set($event); generate()"
                class="w-full accent-brand-500">
            </div>

            <!-- Version -->
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-surface-700 dark:text-surface-300">Version</label>
              <div class="flex bg-surface-50 dark:bg-surface-900 p-1 rounded-lg border border-surface-200 dark:border-surface-700">
                <button
                  type="button"
                  (click)="setVersion('v4')"
                  class="flex-1 py-1.5 text-[11px] font-medium rounded-md transition-colors"
                  [ngClass]="version() === 'v4' ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'">
                  v4 (Random)
                </button>
                <button
                  type="button"
                  (click)="setVersion('v7')"
                  class="flex-1 py-1.5 text-[11px] font-medium rounded-md transition-colors"
                  [ngClass]="version() === 'v7' ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'">
                  v7 (Time)
                </button>
              </div>
            </div>

            <!-- Case -->
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-surface-700 dark:text-surface-300">Case</label>
              <div class="flex bg-surface-50 dark:bg-surface-900 p-1 rounded-lg border border-surface-200 dark:border-surface-700">
                <button
                  type="button"
                  (click)="setCase('lowercase')"
                  class="flex-1 py-1.5 text-[11px] font-medium rounded-md transition-colors"
                  [ngClass]="textCase() === 'lowercase' ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'">
                  lowercase
                </button>
                <button
                  type="button"
                  (click)="setCase('uppercase')"
                  class="flex-1 py-1.5 text-[11px] font-medium rounded-md transition-colors"
                  [ngClass]="textCase() === 'uppercase' ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'">
                  UPPERCASE
                </button>
              </div>
            </div>

            <!-- Format -->
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-surface-700 dark:text-surface-300">Format</label>
              <select 
                [ngModel]="format()" 
                (ngModelChange)="setFormat($event)"
                class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-brand-500">
                <option value="standard">Standard (Hyphens)</option>
                <option value="no-hyphens">No Hyphens</option>
                <option value="braces">Braces &#123;...&#125;</option>
                <option value="csharp-parse">C# Guid.Parse()</option>
                <option value="csharp-new">C# new Guid()</option>
              </select>
            </div>
            
          </div>
        </div>

        <!-- Output Column -->
        <div class="flex-1 flex flex-col border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden h-full">
          <div class="h-9 px-3 bg-surface-50/90 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500 shrink-0">
            <span class="font-medium text-surface-700 dark:text-surface-300">Generated Output ({{ results().length }})</span>
            <div class="flex items-center gap-1">
               <button
                 type="button"
                 (click)="copyAll()"
                 class="px-2 py-1 rounded text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-200/60 dark:hover:bg-surface-800 transition-colors flex items-center gap-1">
                 <lucide-icon name="copy" class="w-3.5 h-3.5"></lucide-icon>
                 <span class="hidden sm:inline">Copy All</span>
               </button>
               <button
                 type="button"
                 (click)="download()"
                 class="px-2 py-1 rounded text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-200/60 dark:hover:bg-surface-800 transition-colors flex items-center gap-1">
                 <lucide-icon name="download" class="w-3.5 h-3.5"></lucide-icon>
                 <span class="hidden sm:inline">Download</span>
               </button>
            </div>
          </div>

          <textarea
            class="flex-1 w-full bg-transparent font-mono text-sm p-4 text-surface-900 dark:text-surface-100 focus:outline-none resize-none leading-loose whitespace-pre"
            [ngModel]="results().join('\n')"
            readonly
            spellcheck="false"></textarea>
        </div>

      </div>
    </div>
  `
})
export class UuidComponent {
  private readonly toast = inject(ToastService);

  readonly quantity = signal<number>(10);
  readonly version = signal<UuidVersion>('v4');
  readonly textCase = signal<UuidCase>('lowercase');
  readonly format = signal<UuidFormat>('standard');
  
  readonly results = signal<string[]>([]);

  constructor() {
    this.generate();
  }

  setVersion(v: UuidVersion): void {
    this.version.set(v);
    this.generate();
  }

  setCase(c: UuidCase): void {
    this.textCase.set(c);
    this.generate();
  }

  setFormat(f: UuidFormat): void {
    this.format.set(f);
    this.generate();
  }

  generate(): void {
    const q = this.quantity();
    const ver = this.version();
    const c = this.textCase();
    const fmt = this.format();
    
    const newResults: string[] = [];
    
    for (let i = 0; i < q; i++) {
      let uuid = '';
      if (ver === 'v4') {
        uuid = crypto.randomUUID();
      } else {
        // v7 implementation approximation
        uuid = this.generateUuidV7();
      }
      
      if (c === 'uppercase') {
        uuid = uuid.toUpperCase();
      } else {
        uuid = uuid.toLowerCase();
      }
      
      switch (fmt) {
        case 'no-hyphens':
          uuid = uuid.replace(/-/g, '');
          break;
        case 'braces':
          uuid = `{${uuid}}`;
          break;
        case 'csharp-parse':
          uuid = `Guid.Parse("${uuid}")`;
          break;
        case 'csharp-new':
          uuid = `new Guid("${uuid}")`;
          break;
        case 'standard':
        default:
          // Keep as is
          break;
      }
      
      newResults.push(uuid);
    }
    
    this.results.set(newResults);
  }
  
  private generateUuidV7(): string {
    // 1. 48-bit timestamp (milliseconds since epoch)
    const timestamp = Date.now();
    
    // Convert timestamp to 12 hex characters
    const tsHex = timestamp.toString(16).padStart(12, '0');
    
    // 2. 74 bits of random data
    // We need 18.5 random hex characters. Let's generate 20 to be safe and slice.
    const randomArray = new Uint8Array(10);
    crypto.getRandomValues(randomArray);
    
    const randomHex = Array.from(randomArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
      
    // Construct the UUID parts
    const time_high = tsHex.substring(0, 8);
    const time_mid = tsHex.substring(8, 12);
    
    // Version 7: 0111 in binary -> 7 in hex
    const versionAndRandA = '7' + randomHex.substring(0, 3);
    
    // Variant 10xx: 8, 9, a, or b in hex
    const variantStr = (parseInt(randomHex.substring(3, 4), 16) & 0x3 | 0x8).toString(16);
    const variantAndRandB = variantStr + randomHex.substring(4, 7);
    
    const randC = randomHex.substring(7, 19);
    
    return `${time_high}-${time_mid}-${versionAndRandA}-${variantAndRandB}-${randC}`;
  }

  async copyAll(): Promise<void> {
    const text = this.results().join('\n');
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        this.toast.success(`Copied ${this.results().length} UUIDs to clipboard`);
      } catch {
        this.toast.error('Failed to copy');
      }
    }
  }

  download(): void {
    const text = this.results().join('\n');
    if (text) {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `uuids-${this.version()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      this.toast.success(`Downloaded uuids-${this.version()}.txt`);
    }
  }
}
