import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CronParserComponent } from './cron-parser.component';
import { provideAppIcons } from '../../../core/icons.provider';

describe('CronParserComponent', () => {
  let component: CronParserComponent;
  let fixture: ComponentFixture<CronParserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CronParserComponent],
      providers: [provideAppIcons()]
    }).compileComponents();

    fixture = TestBed.createComponent(CronParserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should translate standard 5-part cron to human-readable string', () => {
    component.onCronChange('*/15 * * * *');
    const desc = component.cronDescription();
    expect(desc.isValid).toBeTrue();
    expect(desc.text).toContain('15 minutes');
  });

  it('should translate complex cron expressions', () => {
    component.onCronChange('0 4 * * 1-5');
    const desc = component.cronDescription();
    expect(desc.isValid).toBeTrue();
    expect(desc.text.toLowerCase()).toContain('monday');
  });

  it('should report invalid cron syntax', () => {
    component.onCronChange('invalid cron expression');
    const desc = component.cronDescription();
    expect(desc.isValid).toBeFalse();
    expect(component.upcomingRuns().length).toBe(0);
  });

  it('should compute upcoming 5 scheduled runs', () => {
    component.onCronChange('*/5 * * * *');
    const runs = component.upcomingRuns();
    expect(runs.length).toBe(5);
    expect(runs[0].formatted).toBeTruthy();
    expect(runs[0].relativeTime).toBeTruthy();
  });

  it('should provide field breakdown for 5 and 6-field expressions', () => {
    component.onCronChange('10 12 * * 3');
    let breakdown = component.fieldBreakdown();
    expect(breakdown.length).toBe(5);
    expect(breakdown[0].name).toBe('Minute');
    expect(breakdown[0].value).toBe('10');
    expect(breakdown[1].name).toBe('Hour');
    expect(breakdown[1].value).toBe('12');

    component.onCronChange('0 30 9 * * ?');
    breakdown = component.fieldBreakdown();
    expect(breakdown.length).toBe(6);
    expect(breakdown[0].name).toBe('Second');
  });

  it('should clear expression properly', () => {
    component.clearAll();
    expect(component.cronInput()).toBe('');
  });
});
