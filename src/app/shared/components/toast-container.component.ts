import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService, ToastType } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div 
      aria-live="polite" 
      class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          [attr.role]="toast.type === 'error' ? 'alert' : 'status'"
          class="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-lg border backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 duration-200"
          [ngClass]="getToastClasses(toast.type)">
          
          <div class="shrink-0 mt-0.5" aria-hidden="true">
            @switch (toast.type) {
              @case ('success') {
                <lucide-icon name="circle-check" class="w-4 h-4 text-emerald-500"></lucide-icon>
              }
              @case ('error') {
                <lucide-icon name="circle-alert" class="w-4 h-4 text-rose-500"></lucide-icon>
              }
              @case ('warning') {
                <lucide-icon name="circle-alert" class="w-4 h-4 text-amber-500"></lucide-icon>
              }
              @default {
                <lucide-icon name="info" class="w-4 h-4 text-sky-500"></lucide-icon>
              }
            }
          </div>

          <div class="flex-1 min-w-0">
            @if (toast.title) {
              <h4 class="text-xs font-semibold text-surface-900 dark:text-surface-100">
                {{ toast.title }}
              </h4>
            }
            <p class="text-xs text-surface-700 dark:text-surface-300 leading-relaxed break-words">
              {{ toast.message }}
            </p>
          </div>

          <button 
            type="button" 
            (click)="toastService.remove(toast.id)"
            title="Dismiss notification"
            [attr.aria-label]="'Dismiss ' + (toast.title || toast.message || 'notification')"
            class="text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none transition-colors shrink-0 p-0.5 rounded">
            <lucide-icon name="x" class="w-3.5 h-3.5"></lucide-icon>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  getToastClasses(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'bg-emerald-50/95 dark:bg-surface-900/95 border-emerald-500/30 text-emerald-950 dark:text-emerald-100';
      case 'error':
        return 'bg-rose-50/95 dark:bg-surface-900/95 border-rose-500/30 text-rose-950 dark:text-rose-100';
      case 'warning':
        return 'bg-amber-50/95 dark:bg-surface-900/95 border-amber-500/30 text-amber-950 dark:text-amber-100';
      case 'info':
      default:
        return 'bg-sky-50/95 dark:bg-surface-900/95 border-sky-500/30 text-sky-950 dark:text-sky-100';
    }
  }
}
