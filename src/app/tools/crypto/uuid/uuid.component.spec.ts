import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UuidComponent } from './uuid.component';
import { LucideAngularModule, RefreshCw, Copy, Download } from 'lucide-angular';

describe('UuidComponent', () => {
  let component: UuidComponent;
  let fixture: ComponentFixture<UuidComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UuidComponent,
        LucideAngularModule.pick({ RefreshCw, Copy, Download })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UuidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate correct quantity', () => {
    component.quantity.set(5);
    component.generate();
    expect(component.results().length).toBe(5);
  });

  it('should format UUID without hyphens', () => {
    component.quantity.set(1);
    component.setFormat('no-hyphens');
    const result = component.results()[0];
    expect(result.includes('-')).toBeFalse();
    expect(result.length).toBe(32);
  });

  it('should format UUID in uppercase', () => {
    component.quantity.set(1);
    component.setCase('uppercase');
    const result = component.results()[0];
    expect(result).toEqual(result.toUpperCase());
  });
});
