import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InlineDiffComponent } from './inline-diff.component';
import { ToastService } from '../../../core/services/toast.service';
import { provideAppIcons } from '../../../core/icons.provider';

describe('InlineDiffComponent', () => {
  let component: InlineDiffComponent;
  let fixture: ComponentFixture<InlineDiffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InlineDiffComponent],
      providers: [ToastService, provideAppIcons()]
    }).compileComponents();

    fixture = TestBed.createComponent(InlineDiffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the inline diff component', () => {
    expect(component).toBeTruthy();
  });

  it('should compute unified diff lines and summary', () => {
    component.originalText.set('line 1\nline 2\nline 3');
    component.modifiedText.set('line 1\nline 2 modified\nline 3\nline 4');
    component.computeDiff();

    expect(component.diffLinesList().length).toBeGreaterThan(0);
    expect(component.additions()).toBeGreaterThan(0);
    expect(component.deletions()).toBeGreaterThan(0);
    expect(component.contextLines()).toBeGreaterThan(0);
    expect(component.unifiedPatch()).toContain('@@');
  });

  it('should swap inputs and recompute', () => {
    component.originalText.set('Old Version');
    component.modifiedText.set('New Version');
    component.swapInputs();

    expect(component.originalText()).toBe('New Version');
    expect(component.modifiedText()).toBe('Old Version');
  });

  it('should clear all content', () => {
    component.clearAll();

    expect(component.originalText()).toBe('');
    expect(component.modifiedText()).toBe('');
    expect(component.diffLinesList().length).toBe(0);
    expect(component.unifiedPatch()).toBe('');
  });

  it('should generate valid patch format', () => {
    component.originalText.set('hello');
    component.modifiedText.set('world');
    component.computeDiff();

    const patch = component.unifiedPatch();
    expect(patch).toContain('--- file.txt\toriginal');
    expect(patch).toContain('+++ file.txt\tmodified');
    expect(patch).toContain('-hello');
    expect(patch).toContain('+world');
  });

  it('should switch view modes correctly', () => {
    component.viewMode.set('patch');
    expect(component.viewMode()).toBe('patch');

    component.viewMode.set('diff');
    expect(component.viewMode()).toBe('diff');
  });
});
