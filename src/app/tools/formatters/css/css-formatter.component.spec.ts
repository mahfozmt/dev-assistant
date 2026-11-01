import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CssFormatterComponent } from './css-formatter.component';
import { ToastService } from '../../../core/services/toast.service';
import { provideAppIcons } from '../../../core/icons.provider';

describe('CssFormatterComponent', () => {
  let component: CssFormatterComponent;
  let fixture: ComponentFixture<CssFormatterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CssFormatterComponent],
      providers: [ToastService, provideAppIcons()]
    }).compileComponents();

    fixture = TestBed.createComponent(CssFormatterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the CSS formatter component', () => {
    expect(component).toBeTruthy();
  });

  it('should format CSS rulesets with indentation', () => {
    component.inputContent.set('.btn { color: red; background: blue; }');
    component.indent.set('2');
    component.formatCss();

    const output = component.outputContent();
    expect(output).toContain('.btn {');
    expect(output).toContain('  color: red;');
    expect(output).toContain('  background: blue;');
    expect(output).toContain('}');
  });

  it('should alphabetize CSS properties when sortProperties is enabled', () => {
    component.inputContent.set('.box { z-index: 10; border: none; align-items: center; color: white; }');
    component.sortProperties.set(true);
    component.formatCss();

    const output = component.outputContent();
    const lines = output.split('\n').map(l => l.trim()).filter(l => l.includes(':'));
    expect(lines[0]).toContain('align-items: center;');
    expect(lines[1]).toContain('border: none;');
    expect(lines[2]).toContain('color: white;');
    expect(lines[3]).toContain('z-index: 10;');
  });

  it('should minify CSS and strip zero units', () => {
    component.inputContent.set('.card {\n  margin: 0px;\n  padding: 10px;\n  /* comment */\n}');
    component.minifyCss();

    const output = component.outputContent();
    expect(output).toBe('.card{margin:0;padding:10px}');
  });

  it('should flag unclosed braces as validation warnings', () => {
    component.inputContent.set('.card { margin: 10px;');
    component.formatCss();

    expect(component.validationError()).not.toBeNull();
    expect(component.validationError()).toContain('Unclosed brace');
  });

  it('should flag unexpected closing braces', () => {
    component.inputContent.set('.card { margin: 10px; } }');
    component.formatCss();

    expect(component.validationError()).not.toBeNull();
    expect(component.validationError()).toContain('Unexpected closing brace');
  });

  it('should clear workspace', () => {
    component.clearAll();

    expect(component.inputContent()).toBe('');
    expect(component.outputContent()).toBe('');
    expect(component.validationError()).toBeNull();
  });
});
