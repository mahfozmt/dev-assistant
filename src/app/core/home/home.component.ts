import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ToolRegistryService } from '../services/tool-registry.service';
import { HotkeysService } from '../services/hotkeys.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-200">
      
      <!-- Hero Section -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900/90 via-surface-900 to-surface-950 border border-brand-500/20 p-6 sm:p-8 lg:p-10 text-white shadow-xl">
        <div class="relative z-10 max-w-3xl space-y-4">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-semibold tracking-wide uppercase">
            <lucide-icon name="sparkles" class="w-3.5 h-3.5 text-brand-400"></lucide-icon>
            <span>Privacy-First Developer Workstation</span>
          </div>

          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            All your developer tools.<br />
            <span class="bg-gradient-to-r from-brand-300 via-brand-200 to-white bg-clip-text text-transparent">
              Zero cloud tracking.
            </span>
          </h1>

          <p class="text-surface-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            DevAssistant runs formatting, parsing, schema validations, diffs, and cryptographic hashing locally in your browser with Web Workers and WebAssembly. Fast, ad-free, and secure.
          </p>

          <!-- Search quick bar -->
          <div class="pt-2">
            <button
              type="button"
              (click)="hotkeys.openSearch()"
              class="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4 px-4 py-3 rounded-xl bg-surface-900/90 hover:bg-surface-800/90 border border-surface-700/80 text-surface-400 hover:text-surface-200 transition-all text-sm shadow-lg group">
              <div class="flex items-center gap-3">
                <lucide-icon name="search" class="w-4 h-4 text-brand-400 group-hover:scale-110 transition-transform"></lucide-icon>
                <span>Search 18+ developer tools...</span>
              </div>
              <kbd class="px-2 py-0.5 text-xs font-mono bg-surface-800 border border-surface-700 text-surface-400 rounded">
                Ctrl + K
              </kbd>
            </button>
          </div>
        </div>

        <!-- Ambient glow decoration -->
        <div class="absolute -right-20 -bottom-20 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <!-- Quick Highlights Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-4 rounded-xl border border-surface-200 dark:border-surface-800/80 bg-white dark:bg-surface-900/50 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <lucide-icon name="shield-check" class="w-5 h-5"></lucide-icon>
          </div>
          <div>
            <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-100">100% Client Privacy</h2>
            <p class="text-xs text-surface-500">Payloads never leave your local browser session</p>
          </div>
        </div>

        <div class="p-4 rounded-xl border border-surface-200 dark:border-surface-800/80 bg-white dark:bg-surface-900/50 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <lucide-icon name="cpu" class="w-5 h-5"></lucide-icon>
          </div>
          <div>
            <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-100">Web Workers Powered</h2>
            <p class="text-xs text-surface-500">Non-blocking background parsing and formatting</p>
          </div>
        </div>

        <div class="p-4 rounded-xl border border-surface-200 dark:border-surface-800/80 bg-white dark:bg-surface-900/50 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <lucide-icon name="sparkles" class="w-5 h-5"></lucide-icon>
          </div>
          <div>
            <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-100">Hosted on Lab</h2>
            <p class="text-xs text-surface-500">Deployed at lab.mahfozmt.com on Windows Server</p>
          </div>
        </div>
      </div>

      <!-- Popular Tools -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">Popular Tools</h2>
            <p class="text-xs text-surface-500">Frequently used formatters, analyzers, and utilities</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (tool of registry.popularTools(); track tool.id) {
            <a
              [routerLink]="tool.route"
              class="group p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 hover:border-brand-500/50 dark:hover:border-brand-500/50 hover:shadow-lg transition-all flex flex-col justify-between">
              
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-colors flex items-center justify-center">
                    <lucide-icon [name]="tool.icon" class="w-5 h-5"></lucide-icon>
                  </div>
                  <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500">
                    {{ tool.categoryName }}
                  </span>
                </div>

                <div>
                  <h3 class="font-bold text-sm text-surface-900 dark:text-surface-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {{ tool.name }}
                  </h3>
                  <p class="text-xs text-surface-500 dark:text-surface-400 mt-1 line-clamp-2 leading-relaxed">
                    {{ tool.description }}
                  </p>
                </div>
              </div>

              <div class="pt-4 flex items-center justify-between text-xs text-surface-400">
                <div class="flex items-center gap-1.5 flex-wrap">
                  @for (tag of tool.tags.slice(0, 3); track tag) {
                    <span class="px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800/80 text-[10px]">
                      #{{ tag }}
                    </span>
                  }
                </div>
                <lucide-icon name="chevron-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></lucide-icon>
              </div>
            </a>
          }
        </div>
      </section>

      <!-- All Tools By Category -->
      <section class="space-y-6">
        <div>
          <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">All Modules & Tool Directory</h2>
          <p class="text-xs text-surface-500">Comprehensive developer utility suites</p>
        </div>

        <div class="space-y-6">
          @for (cat of registry.categories; track cat.id) {
            <div class="p-5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white/50 dark:bg-surface-900/40 space-y-4">
              <div class="flex items-center gap-2.5 pb-2 border-b border-surface-200/60 dark:border-surface-800">
                <div class="w-7 h-7 rounded-lg bg-surface-200 dark:bg-surface-800 flex items-center justify-center text-surface-700 dark:text-surface-300">
                  <lucide-icon [name]="cat.icon" class="w-4 h-4"></lucide-icon>
                </div>
                <div>
                  <h3 class="font-semibold text-sm text-surface-900 dark:text-surface-100">{{ cat.title }}</h3>
                  <p class="text-xs text-surface-400">{{ cat.description }}</p>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                @for (tool of cat.tools; track tool.id) {
                  <a
                    [routerLink]="tool.route"
                    class="p-3 rounded-xl border border-surface-200/70 dark:border-surface-800/70 bg-white dark:bg-surface-900 hover:border-brand-500/40 dark:hover:border-brand-500/40 hover:bg-brand-50/30 dark:hover:bg-brand-950/20 transition-all flex items-start gap-2.5">
                    <lucide-icon [name]="tool.icon" class="w-4 h-4 text-brand-500 mt-0.5 shrink-0"></lucide-icon>
                    <div class="min-w-0">
                      <span class="text-xs font-semibold text-surface-900 dark:text-surface-100 block truncate">
                        {{ tool.name }}
                      </span>
                      <p class="text-[11px] text-surface-500 dark:text-surface-400 line-clamp-1 mt-0.5">
                        {{ tool.description }}
                      </p>
                    </div>
                  </a>
                }
              </div>
            </div>
          }
        </div>
      </section>

    </div>
  `
})
export class HomeComponent {
  readonly registry = inject(ToolRegistryService);
  readonly hotkeys = inject(HotkeysService);
}
