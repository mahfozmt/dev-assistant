import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UrlComponent } from './url.component';
import { LucideAngularModule, Copy, Trash2, Plus, ListFilter } from 'lucide-angular';

describe('UrlComponent', () => {
  let component: UrlComponent;
  let fixture: ComponentFixture<UrlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UrlComponent,
        LucideAngularModule.pick({ Copy, Trash2, Plus, ListFilter })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UrlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should encode URL', () => {
    component.urlContent.set('https://example.com/?q=hello world');
    component.encodeUrl();
    expect(component.urlContent()).toBe('https%3A%2F%2Fexample.com%2F%3Fq%3Dhello%20world');
  });

  it('should decode URL', () => {
    component.urlContent.set('https%3A%2F%2Fexample.com%2F%3Fq%3Dhello%20world');
    component.decodeUrl();
    expect(component.urlContent()).toBe('https://example.com/?q=hello world');
  });
  
  it('should parse query parameters', () => {
    component.onUrlChange('https://example.com?a=1&b=2');
    const params = component.queryParams();
    expect(params.length).toBe(2);
    expect(params[0].key).toBe('a');
    expect(params[0].value).toBe('1');
    expect(params[1].key).toBe('b');
    expect(params[1].value).toBe('2');
  });
});
