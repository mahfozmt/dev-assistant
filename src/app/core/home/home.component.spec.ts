import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { ToolRegistryService } from '../services/tool-registry.service';
import { HotkeysService } from '../services/hotkeys.service';
import { provideAppIcons } from '../icons.provider';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

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

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create HomeComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should render accessible category filter tabs with role="tablist" and role="tab"', () => {
    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    expect(tablist).toBeTruthy();
    expect(tablist.getAttribute('aria-label')).toBe('Filter tools by category');

    const tabs = fixture.nativeElement.querySelectorAll('button[role="tab"]');
    expect(tabs.length).toBeGreaterThan(0);

    const firstTab = tabs[0] as HTMLButtonElement;
    expect(firstTab.getAttribute('aria-selected')).toBe('true');
    expect(firstTab.className).toContain('focus-visible:ring-2');
  });

  it('should update aria-selected on tabs when filtering categories', () => {
    const tabs = fixture.nativeElement.querySelectorAll('button[role="tab"]') as NodeListOf<HTMLButtonElement>;
    expect(tabs.length).toBeGreaterThan(1);

    const secondTab = tabs[1];
    secondTab.click();
    fixture.detectChanges();

    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
    expect(secondTab.getAttribute('aria-selected')).toBe('true');
  });

  it('should have focus-visible styling on command palette button', () => {
    const searchBtn = fixture.nativeElement.querySelector('button[aria-label="Open command palette (Ctrl+K)"]');
    expect(searchBtn).toBeTruthy();
    expect(searchBtn.className).toContain('focus-visible:ring-2');
  });
});
