import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);

  show(message: string, type: ToastType = 'info', title?: string, duration = 3500): string {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, type, title, message, duration };

    this.toasts.update(current => [...current, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  success(message: string, title?: string, duration = 3500): string {
    return this.show(message, 'success', title, duration);
  }

  error(message: string, title?: string, duration = 4500): string {
    return this.show(message, 'error', title, duration);
  }

  info(message: string, title?: string, duration = 3500): string {
    return this.show(message, 'info', title, duration);
  }

  warning(message: string, title?: string, duration = 4000): string {
    return this.show(message, 'warning', title, duration);
  }

  remove(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
