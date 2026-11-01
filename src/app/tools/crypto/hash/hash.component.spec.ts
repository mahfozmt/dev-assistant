import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HashComponent } from './hash.component';
import { LucideAngularModule, Trash2, Copy } from 'lucide-angular';

describe('HashComponent', () => {
  let component: HashComponent;
  let fixture: ComponentFixture<HashComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HashComponent,
        LucideAngularModule.pick({ Trash2, Copy })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HashComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute MD5 hash correctly', () => {
    component.onPayloadChange('hello world');
    const md5Result = component.results().find(r => r.algorithm === 'MD5');
    expect(md5Result?.value).toBe('5eb63bbbe01eeed093cb22bb8f5acdc3');
  });

  it('should format hash in uppercase hex', () => {
    component.setFormat('HEX');
    component.onPayloadChange('hello world');
    const md5Result = component.results().find(r => r.algorithm === 'MD5');
    expect(md5Result?.value).toBe('5EB63BBBE01EEED093CB22BB8F5ACDC3');
  });
  
  it('should compute HMAC when enabled', () => {
    component.onUseHmacChange(true);
    component.onSecretKeyChange('secret');
    component.onPayloadChange('hello world');
    const md5Result = component.results().find(r => r.algorithm === 'MD5');
    expect(md5Result?.value).toBeTruthy();
    expect(md5Result?.value).not.toBe('5eb63bbbe01eeed093cb22bb8f5acdc3'); // Should be different from plain hash
  });
});
