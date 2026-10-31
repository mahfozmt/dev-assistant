import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    service.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add success toast', () => {
    const id = service.success('Data saved', 'Success', 0);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].id).toBe(id);
    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[0].message).toBe('Data saved');
  });

  it('should remove toast by id', () => {
    const id = service.error('Error occurred', undefined, 0);
    expect(service.toasts().length).toBe(1);
    service.remove(id);
    expect(service.toasts().length).toBe(0);
  });
});
