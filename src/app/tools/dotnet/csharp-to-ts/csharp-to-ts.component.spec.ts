import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CsharpToTsComponent } from './csharp-to-ts.component';
import { provideAppIcons } from '../../../core/icons.provider';

describe('CsharpToTsComponent', () => {
  let component: CsharpToTsComponent;
  let fixture: ComponentFixture<CsharpToTsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CsharpToTsComponent],
      providers: [provideAppIcons()]
    }).compileComponents();

    fixture = TestBed.createComponent(CsharpToTsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should convert standard C# class to TypeScript interface', () => {
    const cs = `
      public class Person {
        public int Id { get; set; }
        public string Name { get; set; }
        public bool IsActive { get; set; }
      }
    `;
    component.onInputChange(cs);
    const output = component.tsOutput();

    expect(output).toContain('export interface Person {');
    expect(output).toContain('id: number;');
    expect(output).toContain('name: string;');
    expect(output).toContain('isActive: boolean;');
  });

  it('should handle C# enums with values', () => {
    const cs = `
      public enum OrderStatus {
        Pending = 0,
        Completed = 1
      }
    `;
    component.onInputChange(cs);
    const output = component.tsOutput();

    expect(output).toContain('export enum OrderStatus {');
    expect(output).toContain('Pending = 0,');
    expect(output).toContain('Completed = 1');
  });

  it('should handle generic collections and dictionaries', () => {
    const cs = `
      public class Cart {
        public List<string> Tags { get; set; }
        public Dictionary<string, int> Stock { get; set; }
      }
    `;
    component.onInputChange(cs);
    const output = component.tsOutput();

    expect(output).toContain('tags: string[];');
    expect(output).toContain('stock: Record<string, number>;');
  });

  it('should handle nullable properties according to options', () => {
    const cs = `
      public class User {
        public string? Nickname { get; set; }
      }
    `;
    // Default: union with null
    component.updateOption('nullableAsUndefined', false);
    component.onInputChange(cs);
    expect(component.tsOutput()).toContain('nickname: string | null;');

    // Optional: prop?: type
    component.updateOption('nullableAsUndefined', true);
    expect(component.tsOutput()).toContain('nickname?: string;');
  });

  it('should support type alias output instead of interface', () => {
    const cs = `
      public class Item {
        public decimal Price { get; set; }
      }
    `;
    component.updateOption('outputType', 'type');
    component.onInputChange(cs);
    expect(component.tsOutput()).toContain('export type Item = {');
    expect(component.tsOutput()).toContain('price: number;');
  });

  it('should load sample and clear', () => {
    component.loadSample();
    expect(component.csharpInput()).toContain('OrderStatus');
    expect(component.tsOutput()).toContain('CustomerProfile');

    component.clearAll();
    expect(component.csharpInput()).toBe('');
    expect(component.tsOutput()).toBe('');
  });
});
