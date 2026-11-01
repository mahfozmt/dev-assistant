import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegexTesterComponent } from './regex-tester.component';
import { provideAppIcons } from '../../../core/icons.provider';

describe('RegexTesterComponent', () => {
  let component: RegexTesterComponent;
  let fixture: ComponentFixture<RegexTesterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegexTesterComponent],
      providers: [provideAppIcons()]
    }).compileComponents();

    fixture = TestBed.createComponent(RegexTesterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should find regex matches and extract groups', () => {
    component.onPatternChange('(\\d{4})-(\\d{2})-(\\d{2})');
    component.onTestTextChange('Release dates: 2026-11-01 and 2027-01-15.');
    
    const matches = component.matches();
    expect(matches.length).toBe(2);
    expect(matches[0].value).toBe('2026-11-01');
    expect(matches[0].groups.length).toBe(3);
    expect(matches[0].groups[0].value).toBe('2026');
    expect(matches[0].groups[1].value).toBe('11');
    expect(matches[0].groups[2].value).toBe('01');
  });

  it('should detect invalid regex and report error message', () => {
    component.onPatternChange('(?<invalid');
    expect(component.regexError()).toBeTruthy();
    expect(component.matches().length).toBe(0);
  });

  it('should perform regex replacement', () => {
    component.onPatternChange('hello');
    component.onTestTextChange('hello world, hello there');
    component.onReplacementChange('hi');

    expect(component.replacedOutput()).toBe('hi world, hi there');
  });

  it('should toggle flags correctly', () => {
    component.activeFlags.set('g');
    component.toggleFlag('i');
    expect(component.activeFlags()).toContain('i');
    expect(component.activeFlags()).toContain('g');

    component.toggleFlag('g');
    expect(component.activeFlags()).toBe('i');
  });

  it('should toggle highlight mode and clear', () => {
    expect(component.showHighlights()).toBeTrue();
    component.toggleHighlightMode();
    expect(component.showHighlights()).toBeFalse();

    component.clearAll();
    expect(component.pattern()).toBe('');
    expect(component.testText()).toBe('');
  });
});
