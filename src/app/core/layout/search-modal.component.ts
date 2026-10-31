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
        class="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-surface-950/70 backdrop-blur-sm animate-in fade-in duration-100"
        (click)="onBackdropClick($event)">
        
        <div 
          class="w-full max-w-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-750 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] transition-all"
          (click)="$event.stopPropagation()">
          
          <!-- Search Header Input -->
          <div class="flex items-center px-3.5 py-3 border-b border-surface-200 dark:border-surface-800 gap-3">
            <lucide-icon name="search" class="w-4 h-4 text-surface-400 shrink-0"></lucide-icon>
            <input
              #searchInput
              type="text"
              class="w-full bg-transparent text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none text-xs sm:text-sm font-sans"
              placeholder="Type a tool name, command, or shortcut (e.g. 'json', 'jwt', 'poco', 'diff')..."
              [(ngModel)]="query"
              (ngModelChange)="onQueryChange()"
              (keydown)="onKeyDown($event)"
            />
            @if (query) {
              <button 
                class="p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
                (click)="query = ''; onQueryChange()">
                <lucide-icon name="x" class="w-3.5 h-3.5"></lucide-icon>
              </button>
            }
            <kbd class="hidden sm:inline-flex text-[9px]">ESC</kbd>
          </div>

          <!-- Results List -->
          <div class="overflow-y-auto p-1.5 divide-y divide-transparent">
            @if (filteredTools.length > 0) {
              <div class="space-y-0.5">
                @for (tool of filteredTools; track tool.id; let i = $index) {
                  <button
                    type="button"
                    class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors group"
                    [ngClass]="selectedIndex() === i 
                      ? 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-50' 
                      : 'text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-850'"
                    (mouseenter)="selectedIndex.set(i)"
                    (click)="selectTool(tool)">
                    
                    <div class="flex items-center gap-2.5 min-w-0">
                      <div 
                        class="w-6 h-6 rounded flex items-center justify-center shrink-0"
                        [ngClass]="selectedIndex() === i 
                          ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-950' 
                          : 'bg-surface-100 dark:bg-surface-800 text-surface-500'">
                        <lucide-icon [name]="tool.icon" class="w-3.5 h-3.5"></lucide-icon>
                      </div>

                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="font-medium text-xs truncate">
                            {{ tool.name }}
                          </span>
                          @if (tool.isPopular) {
                            <span class="px-1 py-0.2 text-[9px] font-mono rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              Top
                            </span>
                          }
                        </div>
                        <p class="text-[11px] text-surface-400 truncate max-w-sm">
                          {{ tool.description }}
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0 ml-2">
                      <span class="text-[10px] font-mono text-surface-400">
                        {{ tool.categoryName }}
                      </span>
                      <lucide-icon 
                        name="chevron-right" 
                        class="w-3.5 h-3.5 text-surface-400 transition-opacity"
                        [ngClass]="selectedIndex() === i ? 'opacity-100' : 'opacity-0'">
                      </lucide-icon>
                    </div>
                  </button>
                }
              </div>
            } @else if (query.trim()) {
              <div class="py-10 text-center space-y-1">
                <p class="text-xs font-medium text-surface-700 dark:text-surface-300">No results found for "{{ query }}"</p>
                <p class="text-[11px] text-surface-400 font-mono">Try searching for json, diff, bcrypt, c#, or guid</p>
              </div>
            } @else {
              <!-- Popular Tools shortcuts -->
              <div class="p-2 space-y-1">
                <div class="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-surface-400 font-semibold">
                  Frequently Used
                </div>
                @for (tool of registry.popularTools(); track tool.id; let i = $index) {
                  <button
                    type="button"
                    class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                    (click)="selectTool(tool)">
                    <div class="flex items-center gap-2.5">
                      <lucide-icon [name]="tool.icon" class="w-3.5 h-3.5 text-surface-400"></lucide-icon>
                      <span class="text-xs font-medium">{{ tool.name }}</span>
                    </div>
                    <span class="text-[10px] font-mono text-surface-400">{{ tool.categoryName }}</span>
                  </button>
                }
              </div>
            }
          </div>

          <!-- Footer keyboard hints -->
          <div class="px-3.5 py-2 bg-surface-50 dark:bg-surface-950/80 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between text-[11px] text-surface-400 font-mono">
            <div class="flex items-center gap-3">
              <span class="flex items-center gap-1">
                <kbd class="text-[9px]">↑</kbd>
                <kbd class="text-[9px]">↓</kbd>
                Navigate
              </span>
              <span class="flex items-center gap-1">
                <kbd class="text-[9px]">↵</kbd>
                Execute
              </span>
            </div>
            <span class="text-[10px]">DevAssistant</span>
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
        setTimeout(() => this.searchInput?.nativeElement.focus(), 40);
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
