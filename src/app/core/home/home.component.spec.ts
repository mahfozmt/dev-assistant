import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { ToolRegistryService } from '../services/tool-registry.service';
import { HotkeysService } from '../services/hotkeys.service';
import { provideAppIcons } from '../icons.provider';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let registry: ToolRegistryService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        ToolRegistryService,
        HotkeysService,
        provideAppIcons()
      ]
    }).compileComponents();

    registry = TestBed.inject(ToolRegistryService);
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render an accessible category tablist and tabs with ARIA attributes', () => {
    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    expect(tablist).toBeTruthy();
    expect(tablist.getAttribute('aria-label')).toBe('Filter tools by category');

    const tabs: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('[role="tab"]'));
    expect(tabs.length).toBe(registry.categories.length + 1);

    // Initial state: "all" is selected
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].getAttribute('aria-controls')).toBe('tools-grid');

    for (let i = 1; i < tabs.length; i++) {
      expect(tabs[i].getAttribute('aria-selected')).toBe('false');
      expect(tabs[i].getAttribute('aria-controls')).toBe('tools-grid');
    }
  });

  it('should update aria-selected and filter tools when a category tab is clicked', () => {
    const tabs: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('[role="tab"]'));
    const targetCat = registry.categories[0];

    // Click first category tab (index 1)
    tabs[1].click();
    fixture.detectChanges();

    expect(component.selectedCategory()).toBe(targetCat.id);
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(component.displayedTools().length).toBe(targetCat.tools.length);
  });
});
