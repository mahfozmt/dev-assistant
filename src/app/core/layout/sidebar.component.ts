import { Component, EventEmitter, Input, Output, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { ToolRegistryService } from '../services/tool-registry.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <aside 
      class="h-full flex flex-col bg-white dark:bg-surface-950 border-r border-surface-200 dark:border-surface-800/80 transition-all duration-150 select-none"
      [class.w-60]="!isCollapsed"
      [class.w-14]="isCollapsed">
      
      <!-- Brand Logo / Title -->
      <div class="h-13 flex items-center px-3.5 border-b border-surface-200 dark:border-surface-800/80 shrink-0">
        <a routerLink="/" class="flex items-center gap-2.5 min-w-0 group" (click)="navigate.emit()">
          <div class="w-7 h-7 rounded-lg bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-950 flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-xs">
            <span>&gt;_</span>
          </div>
          @if (!isCollapsed) {
            <div class="min-w-0">
              <span class="font-semibold text-xs tracking-tight text-surface-900 dark:text-surface-100 flex items-center gap-1.5">
                DevAssistant
              </span>
              <p class="text-[10px] font-mono text-surface-400 truncate">lab.mahfozmt.com</p>
            </div>
          }
        </a>
      </div>

      <!-- Navigation Links -->
      <div class="flex-1 overflow-y-auto px-2 py-2.5 space-y-3">
        
        <!-- Home / Overview -->
        <div>
          <a
            routerLink="/"
            routerLinkActive="bg-surface-100 dark:bg-surface-850 text-surface-900 dark:text-surface-100 font-medium"
            [routerLinkActiveOptions]="{ exact: true }"
            (click)="navigate.emit()"
            class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-surface-500 hover:text-surface-900 dark:hover:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-900 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors"
            [title]="isCollapsed ? 'Dashboard' : ''">
            <lucide-icon name="house" class="w-3.5 h-3.5 shrink-0"></lucide-icon>
            @if (!isCollapsed) {
              <span>Dashboard</span>
            }
          </a>
        </div>

        <!-- Pinned Favorites -->
        @if (registry.favoriteTools().length > 0) {
          <div>
            @if (!isCollapsed) {
              <div class="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-surface-400 font-semibold flex items-center justify-between">
                <span>Pinned</span>
                <span class="text-[9px]">{{ registry.favoriteTools().length }}</span>
              </div>
            }
            <div class="space-y-0.5">
              @for (tool of registry.favoriteTools(); track tool.id) {
                <a
                  [routerLink]="tool.route"
                  routerLinkActive="bg-surface-100 dark:bg-surface-850 text-surface-900 dark:text-surface-100 font-medium"
                  (click)="navigate.emit()"
                  class="flex items-center gap-2.5 px-2.5 py-1 rounded-md text-xs text-surface-500 hover:text-surface-900 dark:hover:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-900 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors"
                  [title]="isCollapsed ? tool.name : ''">
                  <lucide-icon [name]="tool.icon" class="w-3.5 h-3.5 shrink-0 text-amber-500"></lucide-icon>
                  @if (!isCollapsed) {
                    <span class="truncate text-[11px]">{{ tool.name }}</span>
                  }
                </a>
              }
            </div>
          </div>
        }

        <!-- Categories and Tools Accordion -->
        @for (category of registry.categories; track category.id) {
          <div class="space-y-1">
            @if (!isCollapsed) {
              <button
                type="button"
                (click)="toggleCategory(category.id)"
                [attr.aria-expanded]="isExpanded(category.id)"
                [attr.aria-controls]="'category-tools-' + category.id"
                [attr.aria-label]="(isExpanded(category.id) ? 'Collapse ' : 'Expand ') + category.title + ' category'"
                [title]="(isExpanded(category.id) ? 'Collapse ' : 'Expand ') + category.title"
                class="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 font-semibold rounded focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors group">
                <span class="truncate">{{ category.title }}</span>
                <lucide-icon 
                  [name]="isExpanded(category.id) ? 'chevron-down' : 'chevron-right'" 
                  class="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100 transition-transform">
                </lucide-icon>
              </button>
            }
            
            @if (isCollapsed || isExpanded(category.id)) {
              <div class="space-y-0.5" [id]="'category-tools-' + category.id">
                @for (tool of category.tools; track tool.id) {
                  <a
                    [routerLink]="tool.route"
                    routerLinkActive="bg-surface-100 dark:bg-surface-850 text-surface-900 dark:text-surface-100 font-medium"
                    (click)="navigate.emit()"
                    class="flex items-center justify-between px-2.5 py-1 rounded-md text-xs text-surface-500 hover:text-surface-900 dark:hover:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-900 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors group"
                    [title]="isCollapsed ? tool.name : ''">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <lucide-icon [name]="tool.icon" class="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100"></lucide-icon>
                      @if (!isCollapsed) {
                        <span class="truncate text-[11px]">{{ tool.name }}</span>
                      }
                    </div>
                    @if (!isCollapsed && tool.isPopular) {
                      <span class="w-1 h-1 rounded-full bg-brand-500 shrink-0"></span>
                    }
                  </a>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Footer runtime status -->
      @if (!isCollapsed) {
        <div class="p-3 border-t border-surface-200 dark:border-surface-800/80 text-[10px] font-mono text-surface-400 space-y-1">
          <div class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>100% Client Offline</span>
          </div>
          <p class="text-surface-400 dark:text-surface-500 leading-tight">
            No telemetry • No cloud logs
          </p>
        </div>
      }
    </aside>
  `
})
export class SidebarComponent implements OnInit {
  private readonly CATEGORY_COLLAPSE_STORAGE_KEY = 'dev_assistant_collapsed_categories';
  readonly registry = inject(ToolRegistryService);
  private readonly router = inject(Router, { optional: true });

  @Input() isCollapsed = false;
  @Output() navigate = new EventEmitter<void>();

  // Set of collapsed category IDs
  readonly collapsedCategories = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadCollapsedState();
    this.autoExpandActiveRouteCategory();

    this.router?.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.autoExpandActiveRouteCategory();
      });
  }

  isExpanded(categoryId: string): boolean {
    return !this.collapsedCategories().has(categoryId);
  }

  toggleCategory(categoryId: string): void {
    const current = new Set(this.collapsedCategories());
    if (current.has(categoryId)) {
      current.delete(categoryId);
    } else {
      current.add(categoryId);
    }
    this.collapsedCategories.set(current);
    this.saveCollapsedState(current);
  }

  private autoExpandActiveRouteCategory(): void {
    if (!this.router) return;
    const url = this.router.url;
    const matchingTool = this.registry.tools.find(t => url.startsWith(t.route));
    if (matchingTool && this.collapsedCategories().has(matchingTool.category)) {
      const current = new Set(this.collapsedCategories());
      current.delete(matchingTool.category);
      this.collapsedCategories.set(current);
      this.saveCollapsedState(current);
    }
  }

  private loadCollapsedState(): void {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.CATEGORY_COLLAPSE_STORAGE_KEY);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            this.collapsedCategories.set(new Set(list));
          }
        }
      } catch {
        // ignore parse error
      }
    }
  }

  private saveCollapsedState(set: Set<string>): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.CATEGORY_COLLAPSE_STORAGE_KEY, JSON.stringify(Array.from(set)));
      } catch {
        // ignore storage error
      }
    }
  }
}
