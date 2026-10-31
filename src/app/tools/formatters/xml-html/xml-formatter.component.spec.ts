import { ComponentFixture, TestBed } from '@angular/core/testing';
import { XmlFormatterComponent } from './xml-formatter.component';
import { ToastService } from '../../../core/services/toast.service';
import { provideAppIcons } from '../../../core/icons.provider';

describe('XmlFormatterComponent', () => {
  let component: XmlFormatterComponent;
  let fixture: ComponentFixture<XmlFormatterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XmlFormatterComponent],
      providers: [ToastService, provideAppIcons()]
    }).compileComponents();

    fixture = TestBed.createComponent(XmlFormatterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should format XML tags', () => {
    component.inputContent.set('<root><child>value</child></root>');
    component.indent.set('2');
    component.formatXml();

    expect(component.validationError()).toBeNull();
    expect(component.outputContent()).toContain('<root>');
    expect(component.outputContent()).toContain('  <child>value</child>');
  });

  it('should minify XML tags', () => {
    component.inputContent.set('<root>\n  <child>value</child>\n</root>');
    component.minifyXml();

    expect(component.outputContent()).toBe('<root><child>value</child></root>');
  });
});
