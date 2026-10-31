import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JsonFormatterComponent } from './json-formatter.component';
import { ToastService } from '../../../core/services/toast.service';
import { provideAppIcons } from '../../../core/icons.provider';

describe('JsonFormatterComponent', () => {
  let component: JsonFormatterComponent;
  let fixture: ComponentFixture<JsonFormatterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonFormatterComponent],
      providers: [ToastService, provideAppIcons()]
    }).compileComponents();

    fixture = TestBed.createComponent(JsonFormatterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should format valid JSON with 2 spaces', () => {
    component.inputContent.set('{"name":"Antigravity","active":true}');
    component.indent.set('2');
    component.formatJson();

    expect(component.validationError()).toBeNull();
    expect(component.outputContent()).toBe('{\n  "name": "Antigravity",\n  "active": true\n}');
  });

  it('should format valid JSON with 4 spaces', () => {
    component.inputContent.set('{"key":"value"}');
    component.indent.set('4');
    component.formatJson();

    expect(component.validationError()).toBeNull();
    expect(component.outputContent()).toBe('{\n    "key": "value"\n}');
  });

  it('should minify JSON', () => {
    component.inputContent.set('{\n  "a": 1,\n  "b": 2\n}');
    component.minifyJson();

    expect(component.validationError()).toBeNull();
    expect(component.outputContent()).toBe('{"a":1,"b":2}');
  });

  it('should sort keys alphabetically', () => {
    component.inputContent.set('{"z":1,"a":2,"m":3}');
    component.sortKeys();

    expect(component.validationError()).toBeNull();
    const parsed = JSON.parse(component.outputContent());
    expect(Object.keys(parsed)).toEqual(['a', 'm', 'z']);
  });

  it('should capture syntax errors on invalid JSON', () => {
    component.inputContent.set('{ invalid json }');
    component.formatJson();

    expect(component.validationError()).not.toBeNull();
  });

  it('should escape JSON string', () => {
    component.inputContent.set('{"hello":"world"}');
    component.formatJson();
    component.escapeJson();
    expect(component.outputContent()).toContain('\\"hello\\"');
  });
});
