import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ToolRegistryService } from '../services/tool-registry.service';
import { HotkeysService } from '../services/hotkeys.service';
import { ToolCategory, ToolDefinition } from '../models/tool.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="space-y-8 max-w-6xl mx-auto pb-12">
      
      <!-- Workstation Header Bar -->
      <section class="border-b border-surface-200 dark:border-surface-800/80 pb-6 pt-2">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div class="flex items-center gap-2.5 mb-1.5">
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-surface-100 dark:bg-surface-850 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-750">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Local Browser Runtime
              </span>
              <span class="text-xs text-surface-400 font-mono">v1.0.0</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight text-surface-900 dark:text-surface-50 font-sans">
              Developer Utilities Workstation
            </h1>
            <p class="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1 max-w-2xl leading-relaxed">
              Curated client-side formatters, schema validators, diff viewers, and .NET helpers. No server uploads, zero trackers, 100% private.
            </p>
          </div>

          <!-- Quick Action: Search trigger & Host tag -->
          <div class="flex items-center gap-3 shrink-0">
            <button
              type="button"
              (click)="hotkeys.openSearch()"
              aria-label="Open command palette (Ctrl+K)"
              class="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-surface-100 dark:bg-surface-850 hover:bg-surface-200 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-750 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors shadow-xs group">
              <lucide-icon name="search" class="w-3.5 h-3.5 text-surface-400 group-hover:text-surface-700 dark:group-hover:text-surface-200 transition-colors"></lucide-icon>
              <span>Command Palette</span>
              <kbd class="ml-1">Ctrl K</kbd>
            </button>

            <a 
              href="https://lab.mahfozmt.com" 
              target="_blank" 
              rel="noopener"
              class="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium rounded-lg text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors">
              <span>lab.mahfozmt.com</span>
              <lucide-icon name="arrow-up-right" class="w-3 h-3 text-surface-400"></lucide-icon>
            </a>
          </div>
        </div>

        <!-- Filter tabs: Humanized, clean pill list -->
        <div
          role="tablist"
          aria-label="Filter tools by category"
          class="flex items-center gap-1.5 overflow-x-auto pt-6 scrollbar-none">
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="selectedCategory() === 'all'"
            (click)="selectedCategory.set('all')"
            class="px-3 py-1.5 text-xs font-medium rounded-md focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors whitespace-nowrap"
            [ngClass]="selectedCategory() === 'all' 
              ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-950 shadow-xs' 
              : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-850'">
            All Tools ({{ registry.tools.length }})
          </button>

          @for (cat of registry.categories; track cat.id) {
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="selectedCategory() === cat.id"
              (click)="selectedCategory.set(cat.id)"
              class="px-3 py-1.5 text-xs font-medium rounded-md focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors whitespace-nowrap flex items-center gap-1.5"
              [ngClass]="selectedCategory() === cat.id 
                ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-950 shadow-xs' 
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-850'">
              <span>{{ cat.title }}</span>
              <span class="text-[10px] opacity-60 font-mono">{{ cat.tools.length }}</span>
            </button>
          }
        </div>
      </section>

      <!-- Frequent / Starred Tools Strip (if any) -->
      @if (selectedCategory() === 'all' && registry.favoriteTools().length > 0) {
        <section class="space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="font-mono text-[11px] uppercase tracking-wider text-surface-400 dark:text-surface-500 font-semibold flex items-center gap-1.5">
              <lucide-icon name="star" class="w-3.5 h-3.5 text-amber-500 fill-amber-500"></lucide-icon>
              Pinned Workstation Tools
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            @for (tool of registry.favoriteTools().slice(0, 4); track tool.id) {
              <a
                [routerLink]="tool.route"
                class="group p-3.5 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 hover:border-surface-300 dark:hover:border-surface-700 hover:shadow-subtle-dark focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-all flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <div class="w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 flex items-center justify-center group-hover:text-brand-500 transition-colors">
                      <lucide-icon [name]="tool.icon" class="w-3.5 h-3.5"></lucide-icon>
                    </div>
                    <span class="text-[10px] font-mono text-surface-400 uppercase tracking-wider">
                      {{ tool.category }}
                    </span>
                  </div>
                  <h3 class="font-semibold text-xs text-surface-900 dark:text-surface-100 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
                    {{ tool.name }}
                  </h3>
                  <p class="text-[11px] text-surface-500 dark:text-surface-400 line-clamp-1 mt-0.5">
                    {{ tool.description }}
                  </p>
                </div>
              </a>
            }
          </div>
        </section>
      }

      <!-- Main Tools Grid -->
      <section class="space-y-4">
        <div class="flex items-center justify-between text-xs text-surface-400 font-mono">
          <span>Displaying {{ displayedTools().length }} utilities</span>
          <span class="hidden sm:inline">Engine: WebWorker & Local WebCrypto</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          @for (tool of displayedTools(); track tool.id) {
            <a
              [routerLink]="tool.route"
              class="group relative p-4 rounded-xl border border-surface-200/90 dark:border-surface-800 bg-white dark:bg-surface-900/90 hover:border-surface-300 dark:hover:border-surface-700 hover:shadow-subtle-light dark:hover:shadow-subtle-dark focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-all flex flex-col justify-between">
              
              <div class="space-y-2.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-850 text-surface-700 dark:text-surface-300 border border-surface-200/60 dark:border-surface-750 flex items-center justify-center group-hover:border-brand-500/40 group-hover:text-brand-500 transition-colors">
                      <lucide-icon [name]="tool.icon" class="w-4 h-4"></lucide-icon>
                    </div>
                    <div>
                      <h3 class="font-medium text-xs sm:text-sm text-surface-900 dark:text-surface-100 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
                        {{ tool.name }}
                      </h3>
                      <span class="text-[10px] font-mono text-surface-400 block -mt-0.5">
                        {{ tool.categoryName }}
                      </span>
                    </div>
                  </div>

                  @if (tool.isPopular) {
                    <span class="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Top
                    </span>
                  }
                </div>

                <p class="text-xs text-surface-500 dark:text-surface-400 leading-relaxed line-clamp-2">
                  {{ tool.description }}
                </p>
              </div>

              <!-- Tags / Footer meta -->
              <div class="pt-3.5 mt-3 border-t border-surface-100 dark:border-surface-800/60 flex items-center justify-between text-[11px]">
                <div class="flex items-center gap-1.5 overflow-hidden">
                  @for (tag of tool.tags.slice(0, 2); track tag) {
                    <span class="font-mono text-[10px] text-surface-400 dark:text-surface-500">
                      #{{ tag }}
                    </span>
                  }
                </div>
                <div class="flex items-center gap-1 text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-200 transition-colors">
                  <span class="text-[10px] font-mono">Open</span>
                  <lucide-icon name="chevron-right" class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"></lucide-icon>
                </div>
              </div>
            </a>
          }
        </div>
      </section>

      <!-- Workstation Footer Attribution -->
      <footer class="pt-10 border-t border-surface-200 dark:border-surface-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-surface-500">
        <div class="flex items-center gap-3">
          <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span>DevAssistant • Crafted by Mahfozur Rahman</span>
        </div>

        <div class="flex items-center gap-4 font-mono text-[11px]">
          <span>Single Page Workstation</span>
          <span>•</span>
          <a href="https://lab.mahfozmt.com" target="_blank" rel="noopener" class="hover:text-surface-900 dark:hover:text-surface-100 transition-colors">
            lab.mahfozmt.com
          </a>
        </div>
      </footer>

    </div>
  `
})
export class HomeComponent {
  readonly registry = inject(ToolRegistryService);
  readonly hotkeys = inject(HotkeysService);

  readonly selectedCategory = signal<ToolCategory | 'all'>('all');

  readonly displayedTools = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'all') {
      return this.registry.tools;
    }
    return this.registry.tools.filter(t => t.category === cat);
  });
}
