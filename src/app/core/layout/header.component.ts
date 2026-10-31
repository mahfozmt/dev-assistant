import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { filter } from 'rxjs';
import { ThemeService } from '../services/theme.service';
import { ToolRegistryService } from '../services/tool-registry.service';
import { HotkeysService } from '../services/hotkeys.service';
import { ToolDefinition } from '../models/tool.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <header class="h-14 border-b border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6">
      
      <!-- Left: Mobile Menu & Breadcrumbs -->
      <div class="flex items-center gap-2 sm:gap-4 min-w-0">
        <!-- Mobile Sidebar Toggle -->
        <button
          type="button"
          class="lg:hidden p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          (click)="toggleMobileSidebar.emit()"
          aria-label="Toggle menu">
          <lucide-icon name="menu" class="w-5 h-5"></lucide-icon>
        </button>

        <!-- Desktop Sidebar Toggle -->
        <button
          type="button"
          class="hidden lg:flex p-1.5 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          (click)="toggleSidebar.emit()"
          [title]="isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
          <lucide-icon [name]="isSidebarCollapsed ? 'panel-left-open' : 'panel-left-close'" class="w-4 h-4"></lucide-icon>
        </button>

        <!-- Breadcrumbs & Active Tool Info -->
        <nav class="flex items-center gap-1.5 text-xs sm:text-sm min-w-0" aria-label="Breadcrumb">
          <a routerLink="/" class="text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 transition-colors flex items-center gap-1 shrink-0">
            <lucide-icon name="house" class="w-4 h-4"></lucide-icon>
            <span class="hidden sm:inline font-medium">Home</span>
          </a>

          @if (currentTool) {
            <lucide-icon name="chevron-right" class="w-3.5 h-3.5 text-surface-400 shrink-0"></lucide-icon>
            <span class="text-surface-400 hidden md:inline truncate">{{ currentTool.categoryName }}</span>
            <lucide-icon name="chevron-right" class="w-3.5 h-3.5 text-surface-400 shrink-0 hidden md:inline"></lucide-icon>
            <span class="font-semibold text-surface-900 dark:text-surface-100 truncate flex items-center gap-1.5">
              {{ currentTool.name }}
            </span>

            <!-- Favorite Star Button -->
            <button
              type="button"
              class="p-1 rounded text-surface-400 hover:text-amber-500 transition-colors"
              [class.text-amber-500]="registry.isFavorite(currentTool.id)"
              (click)="registry.toggleFavorite(currentTool.id)"
              [title]="registry.isFavorite(currentTool.id) ? 'Remove from favorites' : 'Add to favorites'">
              <lucide-icon name="star" class="w-4 h-4" [class.fill-amber-500]="registry.isFavorite(currentTool.id)"></lucide-icon>
            </button>
          }
        </nav>
      </div>

      <!-- Right: Search trigger, Theme Switcher, Lab Link -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Quick Search Trigger -->
        <button
          type="button"
          (click)="hotkeys.openSearch()"
          class="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-100 transition-all border border-surface-200/60 dark:border-surface-700/60">
          <lucide-icon name="search" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></lucide-icon>
          <span class="hidden sm:inline">Search tools...</span>
          <kbd class="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded shadow-xs text-surface-500">
            Ctrl K
          </kbd>
        </button>

        <!-- Theme Toggle -->
        <button
          type="button"
          (click)="theme.cycleTheme()"
          class="p-2 rounded-lg text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          [title]="'Theme: ' + theme.theme() + ' (Click to change)'">
          @if (theme.theme() === 'dark') {
            <lucide-icon name="moon" class="w-4 h-4"></lucide-icon>
          } @else if (theme.theme() === 'light') {
            <lucide-icon name="sun" class="w-4 h-4"></lucide-icon>
          } @else {
            <lucide-icon name="laptop" class="w-4 h-4"></lucide-icon>
          }
        </button>

        <!-- Lab badge -->
        <a 
          href="https://lab.mahfozmt.com" 
          target="_blank" 
          rel="noopener"
          class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 transition-colors">
          <span>lab.mahfozmt.com</span>
          <lucide-icon name="arrow-up-right" class="w-3 h-3"></lucide-icon>
        </a>
      </div>
    </header>
  `
})
export class HeaderComponent {
  readonly theme = inject(ThemeService);
  readonly registry = inject(ToolRegistryService);
  readonly hotkeys = inject(HotkeysService);
  private readonly router = inject(Router);

  @Input() isSidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleMobileSidebar = new EventEmitter<void>();

  currentTool: ToolDefinition | undefined;

  constructor() {
    this.updateCurrentTool(this.router.url);
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateCurrentTool(event.urlAfterRedirects || event.url);
      });
  }

  private updateCurrentTool(url: string): void {
    const cleanUrl = url.split('?')[0].split('#')[0];
    this.currentTool = this.registry.getToolByRoute(cleanUrl);
  }
}
