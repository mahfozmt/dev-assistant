import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SchemaValidatorComponent } from './schema-validator.component';
import { ToastService } from '../../../core/services/toast.service';
import { provideAppIcons } from '../../../core/icons.provider';

describe('SchemaValidatorComponent', () => {
  let component: SchemaValidatorComponent;
  let fixture: ComponentFixture<SchemaValidatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchemaValidatorComponent],
      providers: [ToastService, provideAppIcons()]
    }).compileComponents();

    fixture = TestBed.createComponent(SchemaValidatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the schema validator component', () => {
    expect(component).toBeTruthy();
  });

  it('should validate valid data against Draft-07 schema successfully', () => {
    component.loadSample('user');
    expect(component.isValidated()).toBeTrue();
    expect(component.validationErrors().length).toBe(0);
    expect(component.dataParseError()).toBeNull();
    expect(component.schemaParseError()).toBeNull();
  });

  it('should report validation errors with keyword and instancePath for invalid data', () => {
    component.loadSample('invalid');
    expect(component.isValidated()).toBeTrue();
    expect(component.validationErrors().length).toBeGreaterThan(0);

    const emailError = component.validationErrors().find(e => e.instancePath.includes('email'));
    expect(emailError).toBeTruthy();
    expect(emailError?.keyword).toBe('format');
  });

  it('should validate using Draft 2020-12', () => {
    component.draft.set('draft-2020');
    component.loadSample('product');

    expect(component.isValidated()).toBeTrue();
    expect(component.validationErrors().length).toBe(0);
  });

  it('should handle invalid JSON syntax in instance data gracefully', () => {
    component.jsonContent.set('{ malformed json');
    component.validate();

    expect(component.dataParseError()).not.toBeNull();
    expect(component.isValidated()).toBeFalse();
  });

  it('should handle invalid JSON syntax in schema gracefully', () => {
    component.schemaContent.set('{ malformed schema');
    component.validate();

    expect(component.schemaParseError()).not.toBeNull();
    expect(component.isValidated()).toBeFalse();
  });

  it('should clear all fields on clearAll', () => {
    component.clearAll();

    expect(component.jsonContent()).toBe('');
    expect(component.schemaContent()).toBe('');
    expect(component.validationErrors().length).toBe(0);
    expect(component.isValidated()).toBeFalse();
  });
});
