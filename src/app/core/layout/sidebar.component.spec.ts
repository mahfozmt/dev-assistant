import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { ToolRegistryService } from '../services/tool-registry.service';
import { provideAppIcons } from '../icons.provider';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let registry: ToolRegistryService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        ToolRegistryService,
        provideAppIcons()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    registry = TestBed.inject(ToolRegistryService);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the sidebar component', () => {
    expect(component).toBeTruthy();
  });

  it('should default all categories to expanded', () => {
    for (const category of registry.categories) {
      expect(component.isExpanded(category.id)).toBeTrue();
    }
  });

  it('should toggle category collapse and persist in localStorage', () => {
    const categoryId = 'formatters';
    expect(component.isExpanded(categoryId)).toBeTrue();

    component.toggleCategory(categoryId);
    expect(component.isExpanded(categoryId)).toBeFalse();

    const stored = JSON.parse(localStorage.getItem('dev_assistant_collapsed_categories') || '[]');
    expect(stored).toContain(categoryId);

    // Toggle back
    component.toggleCategory(categoryId);
    expect(component.isExpanded(categoryId)).toBeTrue();
  });

  it('should auto-expand category for matching active route', () => {
    const router = TestBed.inject(Router);
    // Collapse formatters
    component.toggleCategory('formatters');
    expect(component.isExpanded('formatters')).toBeFalse();

    // Mock router URL to a formatters tool
    spyOnProperty(router, 'url', 'get').and.returnValue('/tools/formatters/json');

    // Call autoExpandActiveRouteCategory via ngOnInit or private method invoke
    (component as any).autoExpandActiveRouteCategory();
    expect(component.isExpanded('formatters')).toBeTrue();
  });
});
