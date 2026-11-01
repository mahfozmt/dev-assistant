import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JsonCsvComponent } from './json-csv.component';
import { LucideAngularModule, ArrowRightLeft, ArrowLeftRight, CircleAlert, ClipboardPaste, Trash2, Copy, Check, Download, Maximize2, Minimize2, Columns2, Sheet } from 'lucide-angular';

describe('JsonCsvComponent', () => {
  let component: JsonCsvComponent;
  let fixture: ComponentFixture<JsonCsvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        JsonCsvComponent,
        LucideAngularModule.pick({ ArrowRightLeft, ArrowLeftRight, CircleAlert, ClipboardPaste, Trash2, Copy, Check, Download, Maximize2, Minimize2, Columns2, Sheet })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(JsonCsvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should convert JSON to CSV', () => {
    component.setMode('json-to-csv');
    component.inputContent.set('[{"a": 1, "b": 2}]');
    component.convert();
    expect(component.outputContent().trim()).toBe('a,b\n1,2');
  });

  it('should convert CSV to JSON', () => {
    component.setMode('csv-to-json');
    component.inputContent.set('a,b\n1,2');
    component.convert();
    expect(JSON.parse(component.outputContent())).toEqual([{ a: 1, b: 2 }]);
  });
});
