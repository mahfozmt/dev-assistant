import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export type SplitLayoutMode = 'horizontal' | 'vertical';

@Component({
  selector: 'app-split-pane',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div 
      class="flex flex-col flex-1 border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden"
      [class.fixed]="isFullscreen()"
      [class.inset-0]="isFullscreen()"
      [class.z-50]="isFullscreen()"
      [class.rounded-none]="isFullscreen()">
      
      <!-- Top Split Bar with Layout Controls -->
      <div class="h-9 px-3 bg-surface-50/90 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500">
        
        <div class="flex items-center gap-2">
          <span class="font-medium text-surface-700 dark:text-surface-300">{{ title }}</span>
          @if (subtitle) {
            <span class="text-surface-400 font-mono text-[10px] hidden sm:inline">• {{ subtitle }}</span>
          }
        </div>

        <div class="flex items-center gap-0.5">
          <!-- Swap Panes -->
          @if (allowSwap) {
            <button
              type="button"
              (click)="onSwap()"
              title="Swap input and output"
              aria-label="Swap input and output"
              class="p-1 rounded text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-200/60 dark:hover:bg-surface-800 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors">
              <lucide-icon name="arrow-left-right" class="w-3.5 h-3.5"></lucide-icon>
            </button>
          }

          <!-- Layout Mode Switcher (Horizontal vs Vertical) -->
          <button
            type="button"
            (click)="toggleLayout()"
            [title]="layoutMode() === 'horizontal' ? 'Switch to stacked vertical layout' : 'Switch to side-by-side layout'"
            [attr.aria-label]="layoutMode() === 'horizontal' ? 'Switch to stacked vertical layout' : 'Switch to side-by-side layout'"
            class="p-1 rounded text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-200/60 dark:hover:bg-surface-800 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors">
            <lucide-icon [name]="layoutMode() === 'horizontal' ? 'columns-2' : 'sheet'" class="w-3.5 h-3.5"></lucide-icon>
          </button>

          <!-- Fullscreen -->
          <button
            type="button"
            (click)="toggleFullscreen()"
            [title]="isFullscreen() ? 'Exit fullscreen' : 'Fullscreen'"
            [attr.aria-label]="isFullscreen() ? 'Exit fullscreen' : 'Fullscreen'"
            [attr.aria-pressed]="isFullscreen()"
            class="p-1 rounded text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-200/60 dark:hover:bg-surface-800 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors">
            <lucide-icon [name]="isFullscreen() ? 'minimize-2' : 'maximize-2'" class="w-3.5 h-3.5"></lucide-icon>
          </button>
        </div>
      </div>

      <!-- Panes Container -->
      <div 
        class="flex-1 flex overflow-hidden min-h-[420px]"
        [ngClass]="{
          'flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-surface-200 dark:divide-surface-800': layoutMode() === 'horizontal',
          'flex-col divide-y divide-surface-200 dark:divide-surface-800': layoutMode() === 'vertical'
        }">
        
        <!-- Left / Top Pane (Input) -->
        <div class="flex-1 flex flex-col min-w-0 min-h-0 bg-white dark:bg-surface-950">
          <div class="h-7 px-3 bg-surface-50/50 dark:bg-surface-900/40 border-b border-surface-100 dark:border-surface-850 flex items-center justify-between text-[11px] text-surface-500 shrink-0">
            <span class="font-mono text-[10px] text-surface-600 dark:text-surface-400 uppercase tracking-wider">{{ inputLabel }}</span>
            <div class="flex items-center gap-2">
              @if (inputMeta) {
                <span class="font-mono text-[10px] text-surface-400">{{ inputMeta }}</span>
              }
              <ng-content select="[input-actions]"></ng-content>
            </div>
          </div>
          
          <div class="flex-1 flex flex-col overflow-auto p-2">
            <ng-content select="[input-content]"></ng-content>
          </div>
        </div>

        <!-- Right / Bottom Pane (Output) -->
        <div class="flex-1 flex flex-col min-w-0 min-h-0 bg-surface-50/20 dark:bg-surface-900/20">
          <div class="h-7 px-3 bg-surface-50/50 dark:bg-surface-900/40 border-b border-surface-100 dark:border-surface-850 flex items-center justify-between text-[11px] text-surface-500 shrink-0">
            <span class="font-mono text-[10px] text-surface-600 dark:text-surface-400 uppercase tracking-wider">{{ outputLabel }}</span>
            <div class="flex items-center gap-2">
              @if (outputMeta) {
                <span class="font-mono text-[10px] text-surface-400">{{ outputMeta }}</span>
              }
              <ng-content select="[output-actions]"></ng-content>
            </div>
          </div>

          <div class="flex-1 flex flex-col overflow-auto p-2">
            <ng-content select="[output-content]"></ng-content>
          </div>
        </div>

      </div>

    </div>
  `
})
export class SplitPaneComponent {
  @Input() title = 'Workstation Editor';
  @Input() subtitle = '';
  @Input() inputLabel = 'Input';
  @Input() outputLabel = 'Output';
  @Input() inputMeta = '';
  @Input() outputMeta = '';
  @Input() allowSwap = true;

  @Output() swap = new EventEmitter<void>();

  readonly layoutMode = signal<SplitLayoutMode>('horizontal');
  readonly isFullscreen = signal<boolean>(false);

  toggleLayout(): void {
    this.layoutMode.update(mode => mode === 'horizontal' ? 'vertical' : 'horizontal');
  }

  toggleFullscreen(): void {
    this.isFullscreen.update(v => !v);
  }

  onSwap(): void {
    this.swap.emit();
  }
}
