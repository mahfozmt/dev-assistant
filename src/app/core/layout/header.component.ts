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
    <header class="h-13 border-b border-surface-200 dark:border-surface-800/80 bg-white/95 dark:bg-surface-950/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-3 sm:px-5">
      
      <!-- Left: Mobile Menu & Breadcrumbs -->
      <div class="flex items-center gap-2 sm:gap-3 min-w-0">
        <!-- Mobile Sidebar Toggle -->
        <button
          type="button"
          class="lg:hidden p-1.5 rounded-md text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-850 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors"
          (click)="toggleMobileSidebar.emit()"
          aria-label="Toggle navigation menu">
          <lucide-icon name="menu" class="w-4 h-4"></lucide-icon>
        </button>

        <!-- Desktop Sidebar Toggle -->
        <button
          type="button"
          class="hidden lg:flex p-1.5 rounded-md text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-850 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors"
          (click)="toggleSidebar.emit()"
          [title]="isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          [attr.aria-label]="isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          [attr.aria-expanded]="!isSidebarCollapsed">
          <lucide-icon [name]="isSidebarCollapsed ? 'panel-left-open' : 'panel-left-close'" class="w-4 h-4"></lucide-icon>
        </button>

        <!-- Breadcrumbs & Active Tool Info -->
        <nav class="flex items-center gap-1.5 text-xs min-w-0 font-medium" aria-label="Breadcrumb">
          <a routerLink="/" class="text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none rounded transition-colors flex items-center gap-1 shrink-0">
            <lucide-icon name="house" class="w-3.5 h-3.5"></lucide-icon>
            <span class="hidden sm:inline font-mono text-[11px]">Workstation</span>
          </a>

          @if (currentTool) {
            <span class="text-surface-300 dark:text-surface-700">/</span>
            <span class="text-surface-400 font-mono text-[11px] hidden md:inline truncate">{{ currentTool.categoryName }}</span>
            <span class="text-surface-300 dark:text-surface-700 hidden md:inline">/</span>
            <span class="font-semibold text-surface-900 dark:text-surface-100 truncate flex items-center gap-1.5">
              {{ currentTool.name }}
            </span>

            <!-- Favorite Star Button -->
            <button
              type="button"
              class="p-0.5 rounded text-surface-400 hover:text-amber-500 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors"
              [class.text-amber-500]="registry.isFavorite(currentTool.id)"
              (click)="registry.toggleFavorite(currentTool.id)"
              [title]="registry.isFavorite(currentTool.id) ? 'Remove from favorites' : 'Add to favorites'"
              [attr.aria-label]="registry.isFavorite(currentTool.id) ? 'Remove from favorites' : 'Add to favorites'"
              [attr.aria-pressed]="registry.isFavorite(currentTool.id)">
              <lucide-icon name="star" class="w-3.5 h-3.5" [class.fill-amber-500]="registry.isFavorite(currentTool.id)"></lucide-icon>
            </button>
          }
        </nav>
      </div>

      <!-- Right: Search trigger, Theme Switcher, Lab Link -->
      <div class="flex items-center gap-2">
        <!-- Quick Search Trigger -->
        <button
          type="button"
          (click)="hotkeys.openSearch()"
          aria-label="Search tools (Ctrl+K)"
          class="flex items-center gap-2 px-2.5 py-1 text-xs rounded-md bg-surface-100/80 dark:bg-surface-850 hover:bg-surface-200/80 dark:hover:bg-surface-800 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors border border-surface-200/60 dark:border-surface-750">
          <lucide-icon name="search" class="w-3.5 h-3.5"></lucide-icon>
          <span class="hidden sm:inline text-[11px]">Search</span>
          <kbd class="ml-1 text-[9px] py-0">Ctrl K</kbd>
        </button>

        <!-- Theme Toggle -->
        <button
          type="button"
          (click)="theme.cycleTheme()"
          class="p-1.5 rounded-md text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-850 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors"
          [title]="'Theme: ' + theme.theme() + ' (Click to change)'"
          [attr.aria-label]="'Switch theme (current: ' + theme.theme() + ')'">
          @if (theme.theme() === 'dark') {
            <lucide-icon name="moon" class="w-4 h-4"></lucide-icon>
          } @else if (theme.theme() === 'light') {
            <lucide-icon name="sun" class="w-4 h-4"></lucide-icon>
          } @else {
            <lucide-icon name="laptop" class="w-4 h-4"></lucide-icon>
          }
        </button>

        <!-- Lab link -->
        <a 
          href="https://lab.mahfozmt.com" 
          target="_blank" 
          rel="noopener"
          class="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded-md text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 border border-transparent hover:border-surface-200 dark:hover:border-surface-800 transition-all">
          <span>lab</span>
          <lucide-icon name="arrow-up-right" class="w-3 h-3 text-surface-400"></lucide-icon>
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
