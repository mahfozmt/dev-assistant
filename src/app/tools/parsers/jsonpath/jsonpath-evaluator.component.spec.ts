import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JsonPathEvaluatorComponent } from './jsonpath-evaluator.component';
import { ToastService } from '../../../core/services/toast.service';
import { provideAppIcons } from '../../../core/icons.provider';

describe('JsonPathEvaluatorComponent', () => {
  let component: JsonPathEvaluatorComponent;
  let fixture: ComponentFixture<JsonPathEvaluatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonPathEvaluatorComponent],
      providers: [ToastService, provideAppIcons()]
    }).compileComponents();

    fixture = TestBed.createComponent(JsonPathEvaluatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should evaluate JSONPath expression', () => {
    component.inputContent.set(JSON.stringify({
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]
    }));
    component.pathQuery.set('$.users[*].name');
    component.evaluatePath();

    expect(component.errorMessage()).toBeNull();
    expect(component.matchCount()).toBe(2);
    expect(component.outputContent()).toContain('Alice');
    expect(component.outputContent()).toContain('Bob');
  });

  it('should report error on invalid JSON source', () => {
    component.inputContent.set('{ invalid json }');
    component.pathQuery.set('$.foo');
    component.evaluatePath();

    expect(component.errorMessage()).not.toBeNull();
  });
});
