import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ToolRegistryService } from '../services/tool-registry.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <aside 
      class="h-full flex flex-col bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 transition-all duration-200"
      [class.w-64]="!isCollapsed"
      [class.w-16]="isCollapsed">
      
      <!-- Brand Logo / Title -->
      <div class="h-14 flex items-center px-4 border-b border-surface-200 dark:border-surface-800 shrink-0">
        <a routerLink="/" class="flex items-center gap-2.5 min-w-0" (click)="navigate.emit()">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center font-bold shadow-md shadow-brand-500/20 shrink-0">
            <lucide-icon name="code" class="w-4 h-4"></lucide-icon>
          </div>
          @if (!isCollapsed) {
            <div class="min-w-0">
              <span class="font-bold text-sm tracking-tight text-surface-900 dark:text-surface-100 flex items-center gap-1.5">
                DevAssistant
                <span class="text-[10px] uppercase font-semibold px-1 py-0.2 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  Lab
                </span>
              </span>
              <p class="text-[11px] text-surface-400 truncate">Developer Workstation</p>
            </div>
          }
        </a>
      </div>

      <!-- Navigation Links -->
      <div class="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        
        <!-- Home / Overview -->
        <div>
          <a
            routerLink="/"
            routerLinkActive="bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
            [routerLinkActiveOptions]="{ exact: true }"
            (click)="navigate.emit()"
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            [title]="isCollapsed ? 'Home' : ''">
            <lucide-icon name="house" class="w-4 h-4 shrink-0"></lucide-icon>
            @if (!isCollapsed) {
              <span>Dashboard Overview</span>
            }
          </a>
        </div>

        <!-- Favorites (if any) -->
        @if (registry.favoriteTools().length > 0) {
          <div>
            @if (!isCollapsed) {
              <div class="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500 flex items-center justify-between">
                <span>Favorites</span>
                <span class="text-[10px] font-mono text-amber-500">{{ registry.favoriteTools().length }}</span>
              </div>
            }
            <div class="space-y-0.5">
              @for (tool of registry.favoriteTools(); track tool.id) {
                <a
                  [routerLink]="tool.route"
                  routerLinkActive="bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium"
                  (click)="navigate.emit()"
                  class="flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  [title]="isCollapsed ? tool.name : ''">
                  <lucide-icon [name]="tool.icon" class="w-3.5 h-3.5 shrink-0 text-amber-500"></lucide-icon>
                  @if (!isCollapsed) {
                    <span class="truncate">{{ tool.name }}</span>
                  }
                </a>
              }
            </div>
          </div>
        }

        <!-- Categories and Tools -->
        @for (category of registry.categories; track category.id) {
          <div>
            @if (!isCollapsed) {
              <div class="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                {{ category.title }}
              </div>
            }
            <div class="space-y-0.5">
              @for (tool of category.tools; track tool.id) {
                <a
                  [routerLink]="tool.route"
                  routerLinkActive="bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium"
                  (click)="navigate.emit()"
                  class="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors group"
                  [title]="isCollapsed ? tool.name : ''">
                  <div class="flex items-center gap-3 min-w-0">
                    <lucide-icon [name]="tool.icon" class="w-3.5 h-3.5 shrink-0 text-surface-400 group-hover:text-surface-700 dark:group-hover:text-surface-200"></lucide-icon>
                    @if (!isCollapsed) {
                      <span class="truncate">{{ tool.name }}</span>
                    }
                  </div>
                  @if (!isCollapsed && tool.isPopular) {
                    <span class="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0"></span>
                  }
                </a>
              }
            </div>
          </div>
        }
      </div>

      <!-- Footer / Privacy guarantee -->
      @if (!isCollapsed) {
        <div class="p-3 border-t border-surface-200 dark:border-surface-800 text-[11px] text-surface-400 space-y-1">
          <div class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <lucide-icon name="shield-check" class="w-3.5 h-3.5"></lucide-icon>
            <span>Client-First Privacy</span>
          </div>
          <p class="text-surface-400 dark:text-surface-500 leading-tight">
            Data processed locally in browser. No code transmitted.
          </p>
        </div>
      }
    </aside>
  `
})
export class SidebarComponent {
  readonly registry = inject(ToolRegistryService);

  @Input() isCollapsed = false;
  @Output() navigate = new EventEmitter<void>();
}
