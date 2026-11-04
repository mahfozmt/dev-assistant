import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionToolbarComponent } from './action-toolbar.component';
import { ToastService } from '../../core/services/toast.service';
import { provideAppIcons } from '../../core/icons.provider';

describe('ActionToolbarComponent', () => {
  let component: ActionToolbarComponent;
  let fixture: ComponentFixture<ActionToolbarComponent>;
  let toastService: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);

    await TestBed.configureTestingModule({
      imports: [ActionToolbarComponent],
      providers: [
        { provide: ToastService, useValue: toastSpy },
        provideAppIcons()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActionToolbarComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    fixture.detectChanges();
  });

  it('should create the action toolbar', () => {
    expect(component).toBeTruthy();
  });

  it('should render accessible labels on sample, clear, copy, and download buttons', () => {
    const sampleBtn = fixture.nativeElement.querySelector('button[aria-label="Load sample input payload"]');
    const clearBtn = fixture.nativeElement.querySelector('button[aria-label="Clear editor contents"]');
    const copyBtn = fixture.nativeElement.querySelector('button[aria-label="Copy output"]');
    const downloadBtn = fixture.nativeElement.querySelector('button[aria-label="Download payload as file"]');

    expect(sampleBtn).toBeTruthy();
    expect(clearBtn).toBeTruthy();
    expect(copyBtn).toBeTruthy();
    expect(downloadBtn).toBeTruthy();
  });

  it('should render fullscreen button with accessible label and aria-pressed attributes', () => {
    component.hasFullscreen = true;
    component.isFullscreen = false;
    fixture.detectChanges();

    let fsBtn = fixture.nativeElement.querySelector('button[aria-label="Fullscreen"]');
    expect(fsBtn).toBeTruthy();
    expect(fsBtn.getAttribute('aria-pressed')).toBe('false');

    component.isFullscreen = true;
    fixture.detectChanges();

    fsBtn = fixture.nativeElement.querySelector('button[aria-label="Exit fullscreen"]');
    expect(fsBtn).toBeTruthy();
    expect(fsBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('should update copy button aria-label when text is copied', async () => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    component.copyContent = 'Sample code';

    await component.onCopy();
    fixture.detectChanges();

    const copyBtn = fixture.nativeElement.querySelector('button[aria-label="Copied to clipboard"]');
    expect(copyBtn).toBeTruthy();
    expect(toastService.success).toHaveBeenCalledWith('Copied to clipboard');
  });

  it('should emit events on button clicks', () => {
    spyOn(component.loadSample, 'emit');
    spyOn(component.clear, 'emit');

    const sampleBtn = fixture.nativeElement.querySelector('button[aria-label="Load sample input payload"]');
    const clearBtn = fixture.nativeElement.querySelector('button[aria-label="Clear editor contents"]');

    sampleBtn.click();
    clearBtn.click();

    expect(component.loadSample.emit).toHaveBeenCalled();
    expect(component.clear.emit).toHaveBeenCalled();
  });
});
