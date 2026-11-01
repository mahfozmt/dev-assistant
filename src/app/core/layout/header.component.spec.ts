import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HeaderComponent } from './header.component';
import { ThemeService } from '../services/theme.service';
import { ToolRegistryService } from '../services/tool-registry.service';
import { HotkeysService } from '../services/hotkeys.service';
import { provideAppIcons } from '../icons.provider';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        ThemeService,
        ToolRegistryService,
        HotkeysService,
        provideAppIcons()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the header component', () => {
    expect(component).toBeTruthy();
  });

  it('should render desktop sidebar toggle with accessible aria attributes', () => {
    component.isSidebarCollapsed = false;
    fixture.detectChanges();

    const desktopToggle = fixture.nativeElement.querySelector('button.hidden.lg\\:flex');
    expect(desktopToggle).toBeTruthy();
    expect(desktopToggle.getAttribute('aria-label')).toBe('Collapse sidebar');
    expect(desktopToggle.getAttribute('aria-expanded')).toBe('true');

    component.isSidebarCollapsed = true;
    fixture.detectChanges();
    expect(desktopToggle.getAttribute('aria-label')).toBe('Expand sidebar');
    expect(desktopToggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('should render theme toggle with accessible aria-label and title', () => {
    const themeButton = fixture.nativeElement.querySelector('button[title*="Theme:"]');
    expect(themeButton).toBeTruthy();
    expect(themeButton.getAttribute('aria-label')).toContain('Switch theme');
  });

  it('should render favorite button with aria-pressed and aria-label when tool is active', () => {
    // Pick an un-favorited tool id
    const toolId = 'custom-test-tool';
    component.currentTool = {
      id: toolId,
      name: 'Test Tool',
      description: 'Test Tool Description',
      category: 'formatters',
      categoryName: 'Formatters',
      route: '/tools/formatters/test',
      icon: 'braces',
      tags: ['test']
    };
    fixture.detectChanges();

    const favButton = fixture.nativeElement.querySelector('button[title*="favorites"]');
    expect(favButton).toBeTruthy();
    expect(favButton.getAttribute('aria-label')).toBe('Add to favorites');
    expect(favButton.getAttribute('aria-pressed')).toBe('false');

    component.registry.toggleFavorite(toolId);
    fixture.detectChanges();
    expect(favButton.getAttribute('aria-label')).toBe('Remove from favorites');
    expect(favButton.getAttribute('aria-pressed')).toBe('true');
  });
});
