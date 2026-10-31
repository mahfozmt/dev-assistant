import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SqlFormatterComponent } from './sql-formatter.component';
import { ToastService } from '../../../core/services/toast.service';
import { provideAppIcons } from '../../../core/icons.provider';

describe('SqlFormatterComponent', () => {
  let component: SqlFormatterComponent;
  let fixture: ComponentFixture<SqlFormatterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SqlFormatterComponent],
      providers: [ToastService, provideAppIcons()]
    }).compileComponents();

    fixture = TestBed.createComponent(SqlFormatterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should format SQL query with UPPERCASE keywords', () => {
    component.inputContent.set('select id, name from users where active = 1');
    component.keywordCase.set('upper');
    component.formatQuery();

    expect(component.outputContent()).toContain('SELECT');
    expect(component.outputContent()).toContain('FROM');
    expect(component.outputContent()).toContain('WHERE');
  });

  it('should format SQL query with lowercase keywords', () => {
    component.inputContent.set('SELECT ID FROM USERS');
    component.keywordCase.set('lower');
    component.formatQuery();

    expect(component.outputContent()).toContain('select');
    expect(component.outputContent()).toContain('from');
  });
});
