import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Base64Component } from './base64.component';
import { LucideAngularModule, Lock, Unlock, UploadCloud, CircleAlert, ClipboardPaste, Trash2, Copy, Check, Download, Maximize2, Minimize2, Columns2, Sheet, ArrowLeftRight } from 'lucide-angular';

describe('Base64Component', () => {
  let component: Base64Component;
  let fixture: ComponentFixture<Base64Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Base64Component,
        LucideAngularModule.pick({ Lock, Unlock, UploadCloud, CircleAlert, ClipboardPaste, Trash2, Copy, Check, Download, Maximize2, Minimize2, Columns2, Sheet, ArrowLeftRight })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Base64Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should encode text to base64', () => {
    component.setMode('encode');
    component.inputContent.set('Hello World');
    component.process();
    expect(component.outputContent()).toBe('SGVsbG8gV29ybGQ=');
  });

  it('should decode base64 to text', () => {
    component.setMode('decode');
    component.inputContent.set('SGVsbG8gV29ybGQ=');
    component.process();
    expect(component.outputContent()).toBe('Hello World');
  });
});
