import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SideBySideDiffComponent } from './side-by-side-diff.component';
import { ToastService } from '../../../core/services/toast.service';
import { provideAppIcons } from '../../../core/icons.provider';

describe('SideBySideDiffComponent', () => {
  let component: SideBySideDiffComponent;
  let fixture: ComponentFixture<SideBySideDiffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideBySideDiffComponent],
      providers: [ToastService, provideAppIcons()]
    }).compileComponents();

    fixture = TestBed.createComponent(SideBySideDiffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the side-by-side diff component', () => {
    expect(component).toBeTruthy();
  });

  it('should correctly calculate additions, deletions and unchanged counts', () => {
    component.originalText.set('alpha\nbeta\ngamma');
    component.modifiedText.set('alpha\nbeta2\ngamma\ndelta');
    component.computeDiff();

    expect(component.diffRows().length).toBeGreaterThan(0);
    expect(component.additions()).toBeGreaterThan(0);
    expect(component.deletions()).toBeGreaterThan(0);
    expect(component.unchanged()).toBeGreaterThan(0);
  });

  it('should swap original and modified inputs', () => {
    component.originalText.set('First');
    component.modifiedText.set('Second');
    component.swapInputs();

    expect(component.originalText()).toBe('Second');
    expect(component.modifiedText()).toBe('First');
  });

  it('should respect ignore whitespace toggle', () => {
    component.originalText.set('hello   world');
    component.modifiedText.set('hello world');

    component.ignoreWhitespace.set(true);
    component.computeDiff();
    const rowsWithIgnore = component.diffRows();
    const addWithIgnore = component.additions();

    component.ignoreWhitespace.set(false);
    component.computeDiff();
    const addWithoutIgnore = component.additions();

    expect(addWithIgnore).toBeLessThanOrEqual(addWithoutIgnore);
  });

  it('should clear inputs and diff rows when clearAll is called', () => {
    component.clearAll();

    expect(component.originalText()).toBe('');
    expect(component.modifiedText()).toBe('');
    expect(component.diffRows().length).toBe(0);
    expect(component.additions()).toBe(0);
    expect(component.deletions()).toBe(0);
  });

  it('should change granularity to words and chars', () => {
    component.originalText.set('foo bar');
    component.modifiedText.set('foo baz');

    component.setGranularity('words');
    expect(component.granularity()).toBe('words');
    expect(component.diffRows().length).toBeGreaterThan(0);

    component.setGranularity('chars');
    expect(component.granularity()).toBe('chars');
    expect(component.diffRows().length).toBeGreaterThan(0);
  });

  it('should output text formatted diff', () => {
    component.originalText.set('one');
    component.modifiedText.set('two');
    component.computeDiff();

    const text = component.getDiffAsText();
    expect(text).toContain('|');
  });
});
