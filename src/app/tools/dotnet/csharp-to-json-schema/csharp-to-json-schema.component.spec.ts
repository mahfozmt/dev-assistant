import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CsharpToJsonSchemaComponent } from './csharp-to-json-schema.component';
import { provideAppIcons } from '../../../core/icons.provider';

describe('CsharpToJsonSchemaComponent', () => {
  let component: CsharpToJsonSchemaComponent;
  let fixture: ComponentFixture<CsharpToJsonSchemaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CsharpToJsonSchemaComponent],
      providers: [provideAppIcons()]
    }).compileComponents();

    fixture = TestBed.createComponent(CsharpToJsonSchemaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate valid JSON Schema from C# class', () => {
    const cs = `
      public class Product {
        [Required]
        public int Id { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 3)]
        public string Title { get; set; } = string.Empty;

        [Range(0.01, 9999.99)]
        public decimal Price { get; set; }

        public bool IsAvailable { get; set; }
      }
    `;
    component.onInputChange(cs);
    const schema = JSON.parse(component.schemaOutput());

    expect(schema.$schema).toContain('json-schema.org');
    expect(schema.title).toBe('Product');
    expect(schema.type).toBe('object');
    expect(schema.properties.id.type).toBe('integer');
    expect(schema.properties.title.type).toBe('string');
    expect(schema.properties.title.maxLength).toBe(100);
    expect(schema.properties.title.minLength).toBe(3);
    expect(schema.properties.price.type).toBe('number');
    expect(schema.properties.price.minimum).toBe(0.01);
    expect(schema.properties.price.maximum).toBe(9999.99);
    expect(schema.properties.isAvailable.type).toBe('boolean');
    expect(schema.required).toContain('id');
    expect(schema.required).toContain('title');
  });

  it('should map format for email, guid, and date-time', () => {
    const cs = `
      public class Account {
        public Guid Id { get; set; }
        [EmailAddress]
        public string Email { get; set; }
        public DateTime CreatedAt { get; set; }
      }
    `;
    component.onInputChange(cs);
    const schema = JSON.parse(component.schemaOutput());

    expect(schema.properties.id.format).toBe('uuid');
    expect(schema.properties.email.format).toBe('email');
    expect(schema.properties.createdAt.format).toBe('date-time');
  });

  it('should map arrays and generic lists', () => {
    const cs = `
      public class Post {
        public List<string> Tags { get; set; }
      }
    `;
    component.onInputChange(cs);
    const schema = JSON.parse(component.schemaOutput());

    expect(schema.properties.tags.type).toBe('array');
    expect(schema.properties.tags.items.type).toBe('string');
  });

  it('should load sample and clear', () => {
    component.loadSample();
    expect(component.csharpInput()).toContain('RegisterUserRequest');
    const parsed = JSON.parse(component.schemaOutput());
    expect(parsed.title).toBe('RegisterUserRequest');

    component.clearAll();
    expect(component.csharpInput()).toBe('');
    expect(component.schemaOutput()).toBe('');
  });
});
