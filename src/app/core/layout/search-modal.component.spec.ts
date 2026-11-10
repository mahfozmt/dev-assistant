import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SearchModalComponent } from './search-modal.component';
import { HotkeysService } from '../services/hotkeys.service';
import { ToolRegistryService } from '../services/tool-registry.service';
import { provideAppIcons } from '../icons.provider';

describe('SearchModalComponent', () => {
  let component: SearchModalComponent;
  let fixture: ComponentFixture<SearchModalComponent>;
  let hotkeys: HotkeysService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchModalComponent],
      providers: [
        provideRouter([]),
        HotkeysService,
        ToolRegistryService,
        provideAppIcons()
      ]
    }).compileComponents();

    hotkeys = TestBed.inject(HotkeysService);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(SearchModalComponent);
    component = fixture.componentInstance;
  });

  it('should not render modal by default when search is closed', () => {
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog).toBeNull();
  });

  it('should render accessible dialog and search combobox when opened', fakeAsync(() => {
    hotkeys.openSearch();
    fixture.detectChanges();
    tick(50);
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('Quick search tools and commands');

    const input = fixture.nativeElement.querySelector('input[type="text"]');
    expect(input).toBeTruthy();
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(input.getAttribute('aria-label')).toBe('Search tools and commands');
    expect(input.getAttribute('aria-controls')).toBe('search-results-listbox');

    const listbox = fixture.nativeElement.querySelector('[role="listbox"]');
    expect(listbox).toBeTruthy();
    expect(listbox.getAttribute('id')).toBe('search-results-listbox');
    expect(listbox.getAttribute('aria-live')).toBe('polite');

    const activeDescendant = input.getAttribute('aria-activedescendant');
    expect(activeDescendant).toBeTruthy();
    const activeOption = fixture.nativeElement.querySelector(`#${activeDescendant}`);
    expect(activeOption).toBeTruthy();
    expect(activeOption.getAttribute('role')).toBe('option');
    expect(activeOption.getAttribute('aria-selected')).toBe('true');
  }));

  it('should render accessible clear button when query is entered and clear on click', fakeAsync(() => {
    hotkeys.openSearch();
    fixture.detectChanges();
    tick(50);
    fixture.detectChanges();

    component.query = 'json';
    component.onQueryChange();
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('button[aria-label="Clear search query"]');
    expect(clearBtn).toBeTruthy();
    expect(clearBtn.getAttribute('title')).toBe('Clear search query');

    clearBtn.click();
    fixture.detectChanges();
    expect(component.query).toBe('');
  }));

  it('should support keyboard navigation across results and selection with Enter', fakeAsync(() => {
    spyOn(router, 'navigateByUrl');
    hotkeys.openSearch();
    fixture.detectChanges();
    tick(50);
    fixture.detectChanges();

    component.query = 'diff';
    component.onQueryChange();
    fixture.detectChanges();

    expect(component.filteredTools.length).toBeGreaterThan(0);
    const initialIndex = component.selectedIndex();

    // Arrow down
    const eventDown = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    component.onKeyDown(eventDown);
    fixture.detectChanges();
    const newIndex = (initialIndex + 1) % component.filteredTools.length;
    expect(component.selectedIndex()).toBe(newIndex);
    const input = fixture.nativeElement.querySelector('input[type="text"]');
    expect(input.getAttribute('aria-activedescendant')).toBe('search-result-opt-' + component.filteredTools[newIndex].id);

    // Enter to navigate
    const eventEnter = new KeyboardEvent('keydown', { key: 'Enter' });
    component.onKeyDown(eventEnter);
    fixture.detectChanges();

    expect(router.navigateByUrl).toHaveBeenCalled();
    expect(hotkeys.isSearchOpen()).toBeFalse();
  }));
});
