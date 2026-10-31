import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HotkeysService {
  readonly isSearchOpen = signal<boolean>(false);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        // Ctrl+K or Cmd+K
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          this.toggleSearch();
        }

        // Escape closes search modal
        if (e.key === 'Escape' && this.isSearchOpen()) {
          this.closeSearch();
        }
      });
    }
  }

  openSearch(): void {
    this.isSearchOpen.set(true);
  }

  closeSearch(): void {
    this.isSearchOpen.set(false);
  }

  toggleSearch(): void {
    this.isSearchOpen.update(v => !v);
  }
}
