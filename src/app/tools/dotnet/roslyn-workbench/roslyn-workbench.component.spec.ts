import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Cpu, Share2, TriangleAlert } from 'lucide-angular';
import { RoslynWorkbenchComponent } from './roslyn-workbench.component';

describe('RoslynWorkbenchComponent', () => {
  let component: RoslynWorkbenchComponent;
  let fixture: ComponentFixture<RoslynWorkbenchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RoslynWorkbenchComponent,
        RouterModule.forRoot([]),
        LucideAngularModule.pick({ Cpu, Share2, TriangleAlert })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RoslynWorkbenchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display Runs on server badge', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Runs on server');
  });

  it('should switch between all 5 server tool tabs', () => {
    component.activeTab.set('tsql');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('tsql');

    component.activeTab.set('connstr');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('connstr');

    component.activeTab.set('json2cs');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('json2cs');

    component.activeTab.set('format-tz');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('format-tz');
  });
});
