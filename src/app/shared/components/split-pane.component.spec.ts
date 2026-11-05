import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SplitPaneComponent } from './split-pane.component';
import { provideAppIcons } from '../../core/icons.provider';

describe('SplitPaneComponent', () => {
  let component: SplitPaneComponent;
  let fixture: ComponentFixture<SplitPaneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitPaneComponent],
      providers: [provideAppIcons()]
    }).compileComponents();

    fixture = TestBed.createComponent(SplitPaneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render accessible control buttons with proper aria-labels and focus classes', () => {
    const swapBtn = fixture.nativeElement.querySelector('button[aria-label="Swap input and output"]');
    expect(swapBtn).toBeTruthy();
    expect(swapBtn.className).toContain('focus-visible:ring-2');

    const layoutBtn = fixture.nativeElement.querySelector('button[aria-label="Switch to stacked vertical layout"]');
    expect(layoutBtn).toBeTruthy();
    expect(layoutBtn.className).toContain('focus-visible:ring-2');

    const fullscreenBtn = fixture.nativeElement.querySelector('button[aria-label="Fullscreen"]');
    expect(fullscreenBtn).toBeTruthy();
    expect(fullscreenBtn.getAttribute('aria-pressed')).toBe('false');
    expect(fullscreenBtn.className).toContain('focus-visible:ring-2');
  });

  it('should update layout button aria-label dynamically when toggling layout', () => {
    component.toggleLayout();
    fixture.detectChanges();

    const layoutBtn = fixture.nativeElement.querySelector('button[aria-label="Switch to side-by-side layout"]');
    expect(layoutBtn).toBeTruthy();
    expect(component.layoutMode()).toBe('vertical');
  });

  it('should update fullscreen aria-label and aria-pressed attributes when toggling fullscreen', () => {
    component.toggleFullscreen();
    fixture.detectChanges();

    const fullscreenBtn = fixture.nativeElement.querySelector('button[aria-label="Exit fullscreen"]');
    expect(fullscreenBtn).toBeTruthy();
    expect(fullscreenBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('should emit swap event when swap button is clicked', () => {
    spyOn(component.swap, 'emit');
    const swapBtn = fixture.nativeElement.querySelector('button[aria-label="Swap input and output"]') as HTMLButtonElement;
    swapBtn.click();
    expect(component.swap.emit).toHaveBeenCalled();
  });
});
