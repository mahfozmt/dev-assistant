import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JsonYamlComponent } from './json-yaml.component';
import { LucideAngularModule, ArrowRightLeft, ArrowLeftRight, CircleAlert, ClipboardPaste, Trash2, Copy, Check, Download, Maximize2, Minimize2, Columns2, Sheet } from 'lucide-angular';

describe('JsonYamlComponent', () => {
  let component: JsonYamlComponent;
  let fixture: ComponentFixture<JsonYamlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        JsonYamlComponent,
        LucideAngularModule.pick({ ArrowRightLeft, ArrowLeftRight, CircleAlert, ClipboardPaste, Trash2, Copy, Check, Download, Maximize2, Minimize2, Columns2, Sheet })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(JsonYamlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should convert JSON to YAML', () => {
    component.setMode('json-to-yaml');
    component.inputContent.set('{"a": 1}');
    component.convert();
    expect(component.outputContent().trim()).toBe('a: 1');
  });

  it('should convert YAML to JSON', () => {
    component.setMode('yaml-to-json');
    component.inputContent.set('a: 1');
    component.convert();
    expect(JSON.parse(component.outputContent())).toEqual({ a: 1 });
  });
});
