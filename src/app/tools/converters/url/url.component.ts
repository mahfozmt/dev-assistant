import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ActionToolbarComponent } from '../../../shared/components/action-toolbar.component';
import { ToastService } from '../../../core/services/toast.service';

type UrlMode = 'encode' | 'decode';

interface QueryParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

@Component({
  selector: 'app-url',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    // ActionToolbarComponent
  ],
  template: `
    <div class="flex-1 flex flex-col space-y-3.5 animate-in fade-in duration-100 max-w-6xl mx-auto w-full">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-800 gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-surface-400">Converters</span>
            <span class="text-surface-300 dark:text-surface-700">/</span>
            <h1 class="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">URL & Query String Tool</h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Encode/decode full URLs and interactively edit query parameters.</p>
        </div>
      </div>

      <!-- Main Input Panel -->
      <div class="flex flex-col flex-1 border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden min-h-[250px]">
        <div class="h-9 px-3 bg-surface-50/90 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500 shrink-0">
          <div class="flex items-center gap-2">
            <span class="font-medium text-surface-700 dark:text-surface-300">URL String</span>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              (click)="encodeUrl()"
              class="px-2 py-0.5 rounded font-medium bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
              Encode
            </button>
            <button
              type="button"
              (click)="decodeUrl()"
              class="px-2 py-0.5 rounded font-medium bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
              Decode
            </button>
            <button
              type="button"
              (click)="copyUrl()"
              class="p-1 rounded text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-200/60 dark:hover:bg-surface-800 transition-colors"
              title="Copy URL">
              <lucide-icon name="copy" class="w-3.5 h-3.5"></lucide-icon>
            </button>
            <button
              type="button"
              (click)="clearAll()"
              class="p-1 rounded text-surface-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-surface-200/60 dark:hover:bg-surface-800 transition-colors"
              title="Clear">
              <lucide-icon name="trash-2" class="w-3.5 h-3.5"></lucide-icon>
            </button>
          </div>
        </div>

        <textarea
          class="w-full h-full min-h-[120px] bg-transparent font-mono text-xs p-3 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none leading-relaxed"
          placeholder="Enter URL here (e.g. https://example.com/api?user=123&sort=asc)..."
          [ngModel]="urlContent()"
          (ngModelChange)="onUrlChange($event)"
          spellcheck="false"></textarea>
      </div>

      <!-- Query Parameters Table Panel -->
      <div class="flex flex-col flex-1 border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden">
        <div class="h-9 px-3 bg-surface-50/90 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500 shrink-0">
          <div class="flex items-center gap-2">
            <span class="font-medium text-surface-700 dark:text-surface-300">Query Parameters</span>
            <span class="text-surface-400 font-mono text-[10px] hidden sm:inline">• Live Sync</span>
          </div>

          <button
            type="button"
            (click)="addQueryParam()"
            class="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-200/60 dark:hover:bg-surface-800 transition-colors border border-surface-200 dark:border-surface-700">
            <lucide-icon name="plus" class="w-3 h-3"></lucide-icon>
            Add Param
          </button>
        </div>

        <div class="p-3 overflow-auto">
          @if (queryParams().length === 0) {
            <div class="text-center py-8 text-surface-400 text-xs">
              <lucide-icon name="list-filter" class="w-6 h-6 opacity-30 mx-auto mb-2"></lucide-icon>
              No query parameters found in the URL.
            </div>
          } @else {
            <div class="space-y-2">
              @for (param of queryParams(); track param.id) {
                <div class="flex items-center gap-2 group">
                  <!-- Enable/Disable Checkbox -->
                  <input
                    type="checkbox"
                    [ngModel]="param.enabled"
                    (ngModelChange)="updateParamEnabled(param.id, $event)"
                    class="rounded border-surface-300 text-brand-500 focus:ring-brand-500/50 mt-1 cursor-pointer">

                  <!-- Key Input -->
                  <input
                    type="text"
                    [ngModel]="param.key"
                    (ngModelChange)="updateParamKey(param.id, $event)"
                    placeholder="Key"
                    [class.opacity-50]="!param.enabled"
                    class="flex-1 min-w-0 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-brand-500 font-mono">

                  <span class="text-surface-400">=</span>

                  <!-- Value Input -->
                  <input
                    type="text"
                    [ngModel]="param.value"
                    (ngModelChange)="updateParamValue(param.id, $event)"
                    placeholder="Value"
                    [class.opacity-50]="!param.enabled"
                    class="flex-[2] min-w-0 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-brand-500 font-mono">

                  <!-- Delete Button -->
                  <button
                    type="button"
                    (click)="removeQueryParam(param.id)"
                    class="p-1.5 rounded text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                    <lucide-icon name="trash-2" class="w-3.5 h-3.5"></lucide-icon>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class UrlComponent {
  private readonly toast = inject(ToastService);

  readonly urlContent = signal<string>('');
  readonly queryParams = signal<QueryParam[]>([]);
  private isUpdatingFromTable = false;

  constructor() {
    this.urlContent.set('https://api.example.com/search?q=dev+assistant&sort=desc&page=1&filter=active');
    this.parseUrl();
  }

  onUrlChange(val: string): void {
    this.urlContent.set(val);
    if (!this.isUpdatingFromTable) {
      this.parseUrl();
    }
  }

  encodeUrl(): void {
    const current = this.urlContent();
    if (!current) return;
    try {
      this.urlContent.set(encodeURIComponent(current));
      this.parseUrl(); // Likely clear params as it's no longer a standard URL structure
    } catch (e) {
      this.toast.error('Failed to encode URL');
    }
  }

  decodeUrl(): void {
    const current = this.urlContent();
    if (!current) return;
    try {
      this.urlContent.set(decodeURIComponent(current));
      this.parseUrl();
    } catch (e) {
      this.toast.error('Failed to decode URL');
    }
  }

  async copyUrl(): Promise<void> {
    const text = this.urlContent();
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        this.toast.success('URL copied to clipboard');
      } catch {
        this.toast.error('Failed to copy to clipboard');
      }
    }
  }

  clearAll(): void {
    this.urlContent.set('');
    this.queryParams.set([]);
    this.toast.info('Cleared');
  }

  // --- Query Parameter Management ---

  parseUrl(): void {
    const currentUrl = this.urlContent();
    const params: QueryParam[] = [];

    if (!currentUrl) {
      this.queryParams.set(params);
      return;
    }

    try {
      // Find the query string part. If it starts with '?', 'http', or just has '&', we try to parse it.
      let queryString = '';
      const questionMarkIndex = currentUrl.indexOf('?');

      if (questionMarkIndex !== -1) {
        queryString = currentUrl.substring(questionMarkIndex + 1);
        // Exclude hash fragment if present
        const hashIndex = queryString.indexOf('#');
        if (hashIndex !== -1) {
          queryString = queryString.substring(0, hashIndex);
        }
      } else if (currentUrl.includes('=') && !currentUrl.includes('://')) {
        // Assume the whole thing might be a query string if it looks like key=value
        queryString = currentUrl;
      }

      if (queryString) {
        const searchParams = new URLSearchParams(queryString);
        searchParams.forEach((value, key) => {
          params.push({
            id: Math.random().toString(36).substring(2, 9),
            key,
            value,
            enabled: true
          });
        });
      }
      this.queryParams.set(params);
    } catch (e) {
      // Invalid URL format, don't clear params just in case they are typing
    }
  }

  updateUrlFromParams(): void {
    this.isUpdatingFromTable = true;

    let currentUrl = this.urlContent();
    let baseUrl = currentUrl;
    let hashFragment = '';

    const questionMarkIndex = currentUrl.indexOf('?');
    if (questionMarkIndex !== -1) {
      baseUrl = currentUrl.substring(0, questionMarkIndex);
      const hashIndex = currentUrl.indexOf('#');
      if (hashIndex !== -1 && hashIndex > questionMarkIndex) {
        hashFragment = currentUrl.substring(hashIndex);
      }
    } else {
      const hashIndex = currentUrl.indexOf('#');
      if (hashIndex !== -1) {
        baseUrl = currentUrl.substring(0, hashIndex);
        hashFragment = currentUrl.substring(hashIndex);
      } else if (currentUrl.includes('=') && !currentUrl.includes('://')) {
         // It was just a query string
         baseUrl = '';
      }
    }

    const searchParams = new URLSearchParams();
    this.queryParams().forEach(p => {
      if (p.enabled && p.key) {
        searchParams.append(p.key, p.value);
      }
    });

    const newQueryString = searchParams.toString();

    let newUrl = baseUrl;
    if (newQueryString) {
      // If baseUrl is empty, it means we only had a query string to begin with (or nothing)
      if (baseUrl || currentUrl.startsWith('?')) {
        newUrl += '?' + newQueryString;
      } else {
        newUrl = newQueryString;
      }
    }

    newUrl += hashFragment;

    this.urlContent.set(newUrl);

    setTimeout(() => {
      this.isUpdatingFromTable = false;
    });
  }

  addQueryParam(): void {
    this.queryParams.update(params => [
      ...params,
      { id: Math.random().toString(36).substring(2, 9), key: '', value: '', enabled: true }
    ]);
  }

  removeQueryParam(id: string): void {
    this.queryParams.update(params => params.filter(p => p.id !== id));
    this.updateUrlFromParams();
  }

  updateParamKey(id: string, key: string): void {
    this.queryParams.update(params => params.map(p => p.id === id ? { ...p, key } : p));
    this.updateUrlFromParams();
  }

  updateParamValue(id: string, value: string): void {
    this.queryParams.update(params => params.map(p => p.id === id ? { ...p, value } : p));
    this.updateUrlFromParams();
  }

  updateParamEnabled(id: string, enabled: boolean): void {
    this.queryParams.update(params => params.map(p => p.id === id ? { ...p, enabled } : p));
    this.updateUrlFromParams();
  }
}
