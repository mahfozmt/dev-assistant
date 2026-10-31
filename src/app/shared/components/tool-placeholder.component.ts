import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { ToolDefinition } from '../../core/models/tool.model';

@Component({
  selector: 'app-tool-placeholder',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    @if (tool) {
      <div class="space-y-6 animate-in fade-in duration-200">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-200 dark:border-surface-800 gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <lucide-icon [name]="tool.icon" class="w-4 h-4"></lucide-icon>
              </div>
              <h1 class="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100">
                {{ tool.name }}
              </h1>
              <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500">
                {{ tool.categoryName }}
              </span>
            </div>
            <p class="text-sm text-surface-500 dark:text-surface-400">
              {{ tool.description }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 text-xs font-medium text-surface-700 dark:text-surface-300 flex items-center gap-1.5 transition-colors"
              (click)="registry.toggleFavorite(tool.id)">
              <lucide-icon name="star" class="w-3.5 h-3.5" [class.fill-amber-500]="registry.isFavorite(tool.id)" [class.text-amber-500]="registry.isFavorite(tool.id)"></lucide-icon>
              <span>{{ registry.isFavorite(tool.id) ? 'Favorited' : 'Favorite' }}</span>
            </button>
          </div>
        </div>

        <!-- Scaffold Card -->
        <div class="p-8 sm:p-12 rounded-2xl border border-dashed border-surface-300 dark:border-surface-700/80 bg-white/40 dark:bg-surface-900/40 text-center space-y-4">
          <div class="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 mx-auto flex items-center justify-center">
            <lucide-icon [name]="tool.icon" class="w-6 h-6"></lucide-icon>
          </div>
          <div class="max-w-md mx-auto space-y-1">
            <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100">{{ tool.name }} Module</h2>
            <p class="text-xs text-surface-500">
              This tool's layout shell and route are active. Full transformation engine (Monaco / Web Worker / Parser) will be wired in accordance with PLAN.md.
            </p>
          </div>
          
          <div class="flex items-center justify-center gap-2 flex-wrap pt-2">
            @for (tag of tool.tags; track tag) {
              <span class="px-2.5 py-1 rounded-md bg-surface-100 dark:bg-surface-800 text-xs text-surface-600 dark:text-surface-400">
                #{{ tag }}
              </span>
            }
          </div>
        </div>
      </div>
    } @else {
      <div class="py-16 text-center space-y-3">
        <h2 class="text-xl font-bold">Tool Not Found</h2>
        <p class="text-sm text-surface-500">The requested tool route could not be found.</p>
        <a routerLink="/" class="inline-flex px-4 py-2 rounded-lg bg-brand-500 text-white text-xs font-semibold">
          Return to Dashboard
        </a>
      </div>
    }
  `
})
export class ToolPlaceholderComponent {
  private readonly router = inject(Router);
  readonly registry = inject(ToolRegistryService);

  get tool(): ToolDefinition | undefined {
    const cleanUrl = this.router.url.split('?')[0].split('#')[0];
    return this.registry.getToolByRoute(cleanUrl);
  }
}
