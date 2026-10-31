import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to dark theme or saved theme', () => {
    expect(['dark', 'light', 'system']).toContain(service.theme());
  });

  it('should allow setting theme mode', () => {
    service.setTheme('light');
    expect(service.theme()).toBe('light');
    expect(service.isDark()).toBeFalse();

    service.setTheme('dark');
    expect(service.theme()).toBe('dark');
    expect(service.isDark()).toBeTrue();
  });

  it('should cycle through theme modes', () => {
    service.setTheme('dark');
    service.cycleTheme();
    expect(service.theme()).toBe('light');
    service.cycleTheme();
    expect(service.theme()).toBe('system');
    service.cycleTheme();
    expect(service.theme()).toBe('dark');
  });
});
