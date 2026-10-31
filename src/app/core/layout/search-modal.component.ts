import { Component, ElementRef, ViewChild, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { HotkeysService } from '../services/hotkeys.service';
import { ToolRegistryService } from '../services/tool-registry.service';
import { ToolDefinition } from '../models/tool.model';

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    @if (hotkeys.isSearchOpen()) {
      <div 
        class="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-surface-950/70 backdrop-blur-sm animate-in fade-in duration-150"
        (click)="onBackdropClick($event)">
        
        <div 
          class="w-full max-w-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-all"
          (click)="$event.stopPropagation()">
          
          <!-- Search Header Input -->
          <div class="flex items-center px-4 py-3.5 border-b border-surface-200 dark:border-surface-800 gap-3">
            <lucide-icon name="search" class="w-5 h-5 text-surface-400 dark:text-surface-500 shrink-0"></lucide-icon>
            <input
              #searchInput
              type="text"
              class="w-full bg-transparent text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none text-base"
              placeholder="Search tools, formatters, converters, crypto... (e.g. 'json', 'jwt', 'poco')"
              [(ngModel)]="query"
              (ngModelChange)="onQueryChange()"
              (keydown)="onKeyDown($event)"
            />
            @if (query) {
              <button 
                class="p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
                (click)="query = ''; onQueryChange()">
                <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
              </button>
            }
            <kbd class="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-medium text-surface-500 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded">
              ESC
            </kbd>
          </div>

          <!-- Results List -->
          <div class="overflow-y-auto p-2 divide-y divide-surface-100 dark:divide-surface-800/50">
            @if (filteredTools.length > 0) {
              <div class="space-y-1">
                @for (tool of filteredTools; track tool.id; let i = $index) {
                  <button
                    type="button"
                    class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group"
                    [ngClass]="selectedIndex() === i ? 'bg-brand-50 dark:bg-brand-950/40' : 'hover:bg-surface-100 dark:hover:bg-surface-800/60'"
                    (mouseenter)="selectedIndex.set(i)"
                    (click)="selectTool(tool)">
                    
                    <div class="flex items-center gap-3 min-w-0">
                      <div 
                        class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                        [ngClass]="selectedIndex() === i ? 'bg-brand-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300'">
                        <lucide-icon [name]="tool.icon" class="w-4 h-4"></lucide-icon>
                      </div>

                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="font-medium text-sm text-surface-900 dark:text-surface-100 truncate">
                            {{ tool.name }}
                          </span>
                          @if (tool.isPopular) {
                            <span class="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded">
                              Popular
                            </span>
                          }
                        </div>
                        <p class="text-xs text-surface-500 dark:text-surface-400 truncate max-w-md">
                          {{ tool.description }}
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0 ml-3">
                      <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400">
                        {{ tool.categoryName }}
                      </span>
                      <lucide-icon 
                        name="chevron-right" 
                        class="w-4 h-4 text-surface-400 transition-opacity"
                        [ngClass]="selectedIndex() === i ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'">
                      </lucide-icon>
                    </div>
                  </button>
                }
              </div>
            } @else if (query.trim()) {
              <div class="py-12 text-center">
                <lucide-icon name="search" class="w-8 h-8 text-surface-400 mx-auto mb-2 opacity-50"></lucide-icon>
                <p class="text-sm font-medium text-surface-700 dark:text-surface-300">No tools found for "{{ query }}"</p>
                <p class="text-xs text-surface-500 mt-1">Try searching for "json", "diff", "bcrypt", "c#", or "guid"</p>
              </div>
            } @else {
              <!-- Quick Suggestions / Popular -->
              <div class="p-3">
                <p class="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-2 px-1">
                  Popular Tools
                </p>
                <div class="space-y-1">
                  @for (tool of registry.popularTools(); track tool.id; let i = $index) {
                    <button
                      type="button"
                      class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-surface-100 dark:hover:bg-surface-800/60 transition-colors"
                      (click)="selectTool(tool)">
                      <div class="flex items-center gap-3">
                        <div class="w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 flex items-center justify-center">
                          <lucide-icon [name]="tool.icon" class="w-3.5 h-3.5"></lucide-icon>
                        </div>
                        <span class="text-sm font-medium text-surface-800 dark:text-surface-200">{{ tool.name }}</span>
                      </div>
                      <span class="text-xs text-surface-400">{{ tool.categoryName }}</span>
                    </button>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Footer keyboard hints -->
          <div class="px-4 py-2.5 bg-surface-50 dark:bg-surface-950/60 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 font-mono text-[10px] bg-surface-200 dark:bg-surface-800 rounded">↑</kbd>
                <kbd class="px-1.5 py-0.5 font-mono text-[10px] bg-surface-200 dark:bg-surface-800 rounded">↓</kbd>
                Navigate
              </span>
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 font-mono text-[10px] bg-surface-200 dark:bg-surface-800 rounded">↵</kbd>
                Select
              </span>
            </div>
            <span class="text-surface-400 font-mono text-[11px]">DevAssistant</span>
          </div>
        </div>
      </div>
    }
  `
})
export class SearchModalComponent {
  readonly hotkeys = inject(HotkeysService);
  readonly registry = inject(ToolRegistryService);
  private readonly router = inject(Router);

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  query = '';
  filteredTools: ToolDefinition[] = [];
  selectedIndex = signal<number>(0);

  constructor() {
    effect(() => {
      if (this.hotkeys.isSearchOpen()) {
        this.query = '';
        this.filteredTools = this.registry.popularTools();
        this.selectedIndex.set(0);
        setTimeout(() => this.searchInput?.nativeElement.focus(), 50);
      }
    });
  }

  onQueryChange(): void {
    if (!this.query.trim()) {
      this.filteredTools = this.registry.popularTools();
    } else {
      this.filteredTools = this.registry.search(this.query);
    }
    this.selectedIndex.set(0);
  }

  onKeyDown(e: KeyboardEvent): void {
    if (this.filteredTools.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex.update(i => (i + 1) % this.filteredTools.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex.update(i => (i - 1 + this.filteredTools.length) % this.filteredTools.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = this.filteredTools[this.selectedIndex()];
      if (selected) {
        this.selectTool(selected);
      }
    }
  }

  selectTool(tool: ToolDefinition): void {
    this.registry.recordToolVisit(tool.id);
    this.hotkeys.closeSearch();
    this.router.navigateByUrl(tool.route);
  }

  onBackdropClick(event: MouseEvent): void {
    this.hotkeys.closeSearch();
  }
}
