import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JwtComponent } from './jwt.component';
import { LucideAngularModule, CircleAlert, Clock3, CheckCircle2 } from 'lucide-angular';

describe('JwtComponent', () => {
  let component: JwtComponent;
  let fixture: ComponentFixture<JwtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        JwtComponent,
        LucideAngularModule.pick({ CircleAlert, Clock3, CheckCircle2 })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(JwtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error for invalid token format', () => {
    component.onTokenChange('invalid-token');
    expect(component.error()).toBeTruthy();
    expect(component.parts().length).toBe(0);
  });

  it('should decode valid token structure', () => {
    // Note: since this uses native btoa which does not produce standard base64url padding,
    // we use standard base64 encoded strings for the test
    const header = btoa('{"alg":"HS256","typ":"JWT"}');
    const payload = btoa('{"sub":"1234567890","name":"John Doe","iat":1516239022}');
    const signature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    component.onTokenChange(`${header}.${payload}.${signature}`);
    expect(component.error()).toBeNull();
    expect(component.parts().length).toBe(3);

    const h = JSON.parse(component.headerJson());
    expect(h.alg).toBe('HS256');

    const p = JSON.parse(component.payloadJson());
    expect(p.name).toBe('John Doe');
  });
});
