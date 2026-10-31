import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'dark' | 'light' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'dev_assistant_theme';
  
  readonly theme = signal<ThemeMode>(this.getInitialTheme());
  readonly isDark = signal<boolean>(false);

  constructor() {
    this.updateResolvedTheme();

    // Listen to OS system theme changes
    if (typeof window !== 'undefined') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.theme() === 'system') {
          this.updateResolvedTheme();
        }
      });
    }

    // Effect to apply theme whenever signal changes
    effect(() => {
      const currentMode = this.theme();
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, currentMode);
      }
      this.updateResolvedTheme();
    });
  }

  setTheme(mode: ThemeMode): void {
    this.theme.set(mode);
    this.updateResolvedTheme();
  }

  cycleTheme(): void {
    const modes: ThemeMode[] = ['dark', 'light', 'system'];
    const nextIndex = (modes.indexOf(this.theme()) + 1) % modes.length;
    this.setTheme(modes[nextIndex]);
  }

  private getInitialTheme(): ThemeMode {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(this.STORAGE_KEY) as ThemeMode | null;
      if (saved && ['dark', 'light', 'system'].includes(saved)) {
        return saved;
      }
    }
    return 'dark'; // DevAssistant is dark-themed by default
  }

  private updateResolvedTheme(): void {
    if (typeof window === 'undefined') return;

    const currentMode = this.theme();
    let dark = false;

    if (currentMode === 'dark') {
      dark = true;
    } else if (currentMode === 'light') {
      dark = false;
    } else {
      dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    this.isDark.set(dark);

    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}
