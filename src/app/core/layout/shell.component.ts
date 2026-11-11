import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header.component';
import { SidebarComponent } from './sidebar.component';
import { SearchModalComponent } from './search-modal.component';
import { ToastContainerComponent } from '../../shared/components/toast-container.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    SearchModalComponent,
    ToastContainerComponent
  ],
  template: `
    <div class="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100">
      <!-- Skip to main content link for keyboard & assistive technology navigation -->
      <a
        href="#main-content"
        class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3.5 focus:py-2 focus:rounded-lg focus:bg-brand-600 focus:text-white focus:text-xs focus:font-semibold focus:shadow-lg focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all">
        Skip to main content
      </a>

      <div class="flex-1 flex overflow-hidden">
        
        <!-- Desktop Sidebar -->
        <div class="hidden lg:block shrink-0">
          <app-sidebar 
            [isCollapsed]="isSidebarCollapsed()"
            (navigate)="onNavigate()">
          </app-sidebar>
        </div>

        <!-- Mobile Drawer Sidebar (with backdrop) -->
        @if (isMobileMenuOpen()) {
          <div 
            class="fixed inset-0 z-40 lg:hidden bg-surface-950/60 backdrop-blur-xs animate-in fade-in duration-200"
            (click)="isMobileMenuOpen.set(false)">
            
            <div 
              class="w-72 max-w-[80vw] h-full bg-white dark:bg-surface-900 shadow-2xl animate-in slide-in-from-left duration-200"
              (click)="$event.stopPropagation()">
              <app-sidebar 
                [isCollapsed]="false"
                (navigate)="isMobileMenuOpen.set(false)">
              </app-sidebar>
            </div>
          </div>
        }

        <!-- Main Content Area -->
        <div class="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <!-- Top Header -->
          <app-header
            [isSidebarCollapsed]="isSidebarCollapsed()"
            (toggleSidebar)="toggleSidebar()"
            (toggleMobileSidebar)="toggleMobileSidebar()">
          </app-header>

          <!-- Route Outlet Content -->
          <main id="main-content" tabindex="-1" class="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto focus:outline-none">
            <router-outlet></router-outlet>
          </main>
        </div>
      </div>

      <!-- Global Search Modal (Ctrl/Cmd + K) -->
      <app-search-modal></app-search-modal>

      <!-- Global Toast Container -->
      <app-toast-container></app-toast-container>
    </div>
  `
})
export class ShellComponent {
  readonly isSidebarCollapsed = signal<boolean>(false);
  readonly isMobileMenuOpen = signal<boolean>(false);

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => !v);
  }

  toggleMobileSidebar(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  onNavigate(): void {
    // optional navigation hook
  }
}
