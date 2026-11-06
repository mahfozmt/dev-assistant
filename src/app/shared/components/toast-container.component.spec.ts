import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from '../../core/services/toast.service';
import { provideAppIcons } from '../../core/icons.provider';

describe('ToastContainerComponent', () => {
  let component: ToastContainerComponent;
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
      providers: [
        ToastService,
        provideAppIcons()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    toastService.clear();
    fixture.detectChanges();
  });

  afterEach(() => {
    toastService.clear();
  });

  it('should create the toast container', () => {
    expect(component).toBeTruthy();
  });

  it('should render toast with role="status" for info/success and role="alert" for error', () => {
    toastService.success('Profile updated', 'Saved', 0);
    toastService.error('Network failed', 'Error', 0);
    fixture.detectChanges();

    const toastElements = fixture.nativeElement.querySelectorAll('[role]');
    expect(toastElements.length).toBe(2);
    expect(toastElements[0].getAttribute('role')).toBe('status');
    expect(toastElements[1].getAttribute('role')).toBe('alert');
  });

  it('should provide accessible dismiss button with aria-label, title, and focus-visible classes', () => {
    toastService.info('Copied payload', 'Clipboard', 0);
    fixture.detectChanges();

    const dismissBtn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(dismissBtn).toBeTruthy();
    expect(dismissBtn.getAttribute('aria-label')).toBe('Dismiss Clipboard');
    expect(dismissBtn.getAttribute('title')).toBe('Dismiss notification');
    expect(dismissBtn.className).toContain('focus-visible:ring-2');
    expect(dismissBtn.className).toContain('focus-visible:ring-brand-500');
  });

  it('should remove toast when dismiss button is clicked', () => {
    toastService.info('Temporary alert', undefined, 0);
    fixture.detectChanges();

    expect(toastService.toasts().length).toBe(1);

    const dismissBtn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    dismissBtn.click();
    fixture.detectChanges();

    expect(toastService.toasts().length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('button').length).toBe(0);
  });
});
