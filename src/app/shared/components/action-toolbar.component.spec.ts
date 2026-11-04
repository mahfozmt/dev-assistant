import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionToolbarComponent } from './action-toolbar.component';
import { ToastService } from '../../core/services/toast.service';
import { provideAppIcons } from '../../core/icons.provider';

describe('ActionToolbarComponent', () => {
  let component: ActionToolbarComponent;
  let fixture: ComponentFixture<ActionToolbarComponent>;
  let toastService: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    toastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'info', 'warning']);

    await TestBed.configureTestingModule({
      imports: [ActionToolbarComponent],
      providers: [
        provideAppIcons(),
        { provide: ToastService, useValue: toastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActionToolbarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render accessible action buttons with proper aria-labels', () => {
    component.primaryActionLabel = 'Convert';
    component.hasSample = true;
    component.hasClear = true;
    component.hasCopy = true;
    component.hasDownload = true;
    component.hasFullscreen = true;
    component.isFullscreen = false;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    const sampleBtn = compiled.querySelector('button[aria-label="Load sample input payload"]');
    expect(sampleBtn).toBeTruthy();

    const clearBtn = compiled.querySelector('button[aria-label="Clear editor contents"]');
    expect(clearBtn).toBeTruthy();

    const copyBtn = compiled.querySelector('button[aria-label="Copy output"]');
    expect(copyBtn).toBeTruthy();

    const downloadBtn = compiled.querySelector('button[aria-label="Download payload as file"]');
    expect(downloadBtn).toBeTruthy();

    const fullscreenBtn = compiled.querySelector('button[aria-label="Fullscreen"]');
    expect(fullscreenBtn).toBeTruthy();
    expect(fullscreenBtn?.getAttribute('aria-pressed')).toBe('false');
  });

  it('should update fullscreen aria-label and aria-pressed when isFullscreen is true', () => {
    component.hasFullscreen = true;
    component.isFullscreen = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const fullscreenBtn = compiled.querySelector('button[aria-label="Exit fullscreen"]');
    expect(fullscreenBtn).toBeTruthy();
    expect(fullscreenBtn?.getAttribute('aria-pressed')).toBe('true');
  });

  it('should emit events when toolbar buttons are clicked', () => {
    spyOn(component.primaryAction, 'emit');
    spyOn(component.loadSample, 'emit');
    spyOn(component.clear, 'emit');
    spyOn(component.toggleFullscreen, 'emit');

    component.primaryActionLabel = 'Convert';
    component.hasSample = true;
    component.hasClear = true;
    component.hasFullscreen = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    const primaryBtn = compiled.querySelector('button[type="button"]') as HTMLButtonElement;
    primaryBtn.click();
    expect(component.primaryAction.emit).toHaveBeenCalled();

    const sampleBtn = compiled.querySelector('button[aria-label="Load sample input payload"]') as HTMLButtonElement;
    sampleBtn.click();
    expect(component.loadSample.emit).toHaveBeenCalled();

    const clearBtn = compiled.querySelector('button[aria-label="Clear editor contents"]') as HTMLButtonElement;
    clearBtn.click();
    expect(component.clear.emit).toHaveBeenCalled();

    const fullscreenBtn = compiled.querySelector('button[aria-label="Fullscreen"]') as HTMLButtonElement;
    fullscreenBtn.click();
    expect(component.toggleFullscreen.emit).toHaveBeenCalled();
  });
});
