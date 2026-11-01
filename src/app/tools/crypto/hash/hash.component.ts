import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import * as CryptoJS from 'crypto-js';
import { ToastService } from '../../../core/services/toast.service';

type HashFormat = 'hex' | 'HEX' | 'base64';
type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

interface HashResult {
  algorithm: HashAlgorithm;
  value: string;
}

@Component({
  selector: 'app-hash',
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
            <h1 class="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">Hash & HMAC Generator</h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Compute MD5, SHA-1, SHA-256, and SHA-512 hashes or HMACs locally.</p>
        </div>
      </div>

      <div class="flex flex-col lg:flex-row gap-4 h-full">
        
        <!-- Input Column -->
        <div class="flex-1 flex flex-col gap-4">
          <div class="flex flex-col flex-1 border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs min-h-[200px] overflow-hidden">
            <div class="h-9 px-3 bg-surface-50/90 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500 shrink-0">
              <span class="font-medium text-surface-700 dark:text-surface-300">Input Payload</span>
              <button
                type="button"
                (click)="clearPayload()"
                class="p-1 rounded text-surface-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-surface-200/60 dark:hover:bg-surface-800 transition-colors">
                <lucide-icon name="trash-2" class="w-3.5 h-3.5"></lucide-icon>
              </button>
            </div>
            <textarea
              class="flex-1 w-full bg-transparent font-mono text-xs p-3 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none"
              placeholder="Enter text to hash..."
              [ngModel]="payload()"
              (ngModelChange)="onPayloadChange($event)"
              spellcheck="false"></textarea>
          </div>

          <div class="flex flex-col border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs p-4 gap-4">
            
            <!-- HMAC Secret Key -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-xs font-medium text-surface-700 dark:text-surface-300">HMAC Secret Key (Optional)</label>
                <div class="flex items-center gap-1">
                  <input type="checkbox" id="hmacToggle" [ngModel]="useHmac()" (ngModelChange)="onUseHmacChange($event)" class="rounded border-surface-300 text-brand-500 focus:ring-brand-500/50">
                  <label for="hmacToggle" class="text-[10px] text-surface-500 cursor-pointer">Enable HMAC</label>
                </div>
              </div>
              <input
                type="text"
                [ngModel]="secretKey()"
                (ngModelChange)="onSecretKeyChange($event)"
                [disabled]="!useHmac()"
                placeholder="Enter secret key..."
                class="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 text-xs text-surface-900 dark:text-surface-100 focus:outline-none focus:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono">
            </div>

            <!-- Output Format -->
            <div>
              <label class="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">Output Format</label>
              <div class="flex bg-surface-50 dark:bg-surface-900 p-1 rounded-lg border border-surface-200 dark:border-surface-700">
                <button
                  type="button"
                  (click)="setFormat('hex')"
                  class="flex-1 py-1.5 text-[11px] font-medium rounded-md transition-colors"
                  [ngClass]="format() === 'hex' ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'">
                  Hex (lowercase)
                </button>
                <button
                  type="button"
                  (click)="setFormat('HEX')"
                  class="flex-1 py-1.5 text-[11px] font-medium rounded-md transition-colors"
                  [ngClass]="format() === 'HEX' ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'">
                  Hex (UPPERCASE)
                </button>
                <button
                  type="button"
                  (click)="setFormat('base64')"
                  class="flex-1 py-1.5 text-[11px] font-medium rounded-md transition-colors"
                  [ngClass]="format() === 'base64' ? 'bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'">
                  Base64
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- Output Column -->
        <div class="flex-1 flex flex-col border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden h-full">
          <div class="h-9 px-3 bg-surface-50/90 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500 shrink-0">
            <span class="font-medium text-surface-700 dark:text-surface-300">Generated Hashes</span>
          </div>

          <div class="flex-1 p-3 overflow-auto space-y-4">
            @for (result of results(); track result.algorithm) {
              <div class="space-y-1.5 group">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-surface-700 dark:text-surface-300">{{ useHmac() ? 'HMAC-' : '' }}{{ result.algorithm }}</span>
                  <button
                    type="button"
                    (click)="copy(result.value)"
                    class="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-md text-brand-600 bg-brand-50 dark:bg-brand-500/10 dark:text-brand-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity border border-brand-200 dark:border-brand-500/20">
                    <lucide-icon name="copy" class="w-3 h-3"></lucide-icon>
                    Copy
                  </button>
                </div>
                <div class="p-2.5 rounded-lg bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 font-mono text-xs text-surface-600 dark:text-surface-400 break-all select-all">
                  {{ result.value || ' ' }}
                </div>
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `
})
export class HashComponent {
  private readonly toast = inject(ToastService);

  readonly payload = signal<string>('');
  readonly useHmac = signal<boolean>(false);
  readonly secretKey = signal<string>('');
  readonly format = signal<HashFormat>('hex');
  
  readonly results = signal<HashResult[]>([
    { algorithm: 'MD5', value: '' },
    { algorithm: 'SHA-1', value: '' },
    { algorithm: 'SHA-256', value: '' },
    { algorithm: 'SHA-384', value: '' },
    { algorithm: 'SHA-512', value: '' }
  ]);

  constructor() {
    this.compute();
  }

  onPayloadChange(val: string): void {
    this.payload.set(val);
    this.compute();
  }

  onUseHmacChange(val: boolean): void {
    this.useHmac.set(val);
    this.compute();
  }

  onSecretKeyChange(val: string): void {
    this.secretKey.set(val);
    this.compute();
  }

  setFormat(f: HashFormat): void {
    this.format.set(f);
    this.compute();
  }

  clearPayload(): void {
    this.payload.set('');
    this.compute();
  }

  private compute(): void {
    const input = this.payload();
    const key = this.secretKey();
    const isHmac = this.useHmac();
    const fmt = this.format();

    if (!input) {
      this.results.update(res => res.map(r => ({ ...r, value: '' })));
      return;
    }

    const algorithms: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
    
    const computedResults: HashResult[] = algorithms.map(alg => {
      let hashStr = '';
      
      let cryptoWordArr: any;
      if (isHmac) {
        if (!key) {
          return { algorithm: alg, value: '' }; // Cannot compute HMAC without key
        }
        cryptoWordArr = this.getHmac(alg, input, key);
      } else {
        cryptoWordArr = this.getHash(alg, input);
      }
      
      if (cryptoWordArr) {
        hashStr = this.formatOutput(cryptoWordArr, fmt);
      }
      
      return { algorithm: alg, value: hashStr };
    });

    this.results.set(computedResults);
  }

  private getHash(alg: HashAlgorithm, msg: string): any {
    switch (alg) {
      case 'MD5': return CryptoJS.MD5(msg);
      case 'SHA-1': return CryptoJS.SHA1(msg);
      case 'SHA-256': return CryptoJS.SHA256(msg);
      case 'SHA-384': return CryptoJS.SHA384(msg);
      case 'SHA-512': return CryptoJS.SHA512(msg);
    }
  }

  private getHmac(alg: HashAlgorithm, msg: string, key: string): any {
    switch (alg) {
      case 'MD5': return CryptoJS.HmacMD5(msg, key);
      case 'SHA-1': return CryptoJS.HmacSHA1(msg, key);
      case 'SHA-256': return CryptoJS.HmacSHA256(msg, key);
      case 'SHA-384': return CryptoJS.HmacSHA384(msg, key);
      case 'SHA-512': return CryptoJS.HmacSHA512(msg, key);
    }
  }

  private formatOutput(wordArr: any, fmt: HashFormat): string {
    if (fmt === 'base64') {
      return CryptoJS.enc.Base64.stringify(wordArr);
    } else {
      const hex = CryptoJS.enc.Hex.stringify(wordArr);
      return fmt === 'HEX' ? hex.toUpperCase() : hex.toLowerCase();
    }
  }

  async copy(val: string): Promise<void> {
    if (!val) return;
    try {
      await navigator.clipboard.writeText(val);
      this.toast.success('Copied to clipboard');
    } catch {
      this.toast.error('Failed to copy');
    }
  }
}
