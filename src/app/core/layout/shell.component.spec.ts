import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ShellComponent } from './shell.component';
import { provideAppIcons } from '../icons.provider';
import { HotkeysService } from '../services/hotkeys.service';
import { ToolRegistryService } from '../services/tool-registry.service';
import { ThemeService } from '../services/theme.service';
import { ToastService } from '../services/toast.service';

describe('ShellComponent', () => {
  let component: ShellComponent;
  let fixture: ComponentFixture<ShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        provideAppIcons(),
        HotkeysService,
        ToolRegistryService,
        ThemeService,
        ToastService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the shell component', () => {
    expect(component).toBeTruthy();
  });

  it('should render an accessible skip to main content link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const skipLink = compiled.querySelector('a[href="#main-content"]');
    expect(skipLink).toBeTruthy();
    expect(skipLink?.textContent?.trim()).toBe('Skip to main content');
    expect(skipLink?.classList).toContain('sr-only');
    expect(skipLink?.className).toContain('focus:not-sr-only');
  });

  it('should have a main element matching the skip link target with tabindex="-1"', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const mainEl = compiled.querySelector('main#main-content');
    expect(mainEl).toBeTruthy();
    expect(mainEl?.getAttribute('tabindex')).toBe('-1');
  });

  it('should toggle sidebar and mobile sidebar states', () => {
    expect(component.isSidebarCollapsed()).toBeFalse();
    component.toggleSidebar();
    expect(component.isSidebarCollapsed()).toBeTrue();

    expect(component.isMobileMenuOpen()).toBeFalse();
    component.toggleMobileSidebar();
    expect(component.isMobileMenuOpen()).toBeTrue();
  });
});
