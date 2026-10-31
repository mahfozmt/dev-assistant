import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { format as formatSql, SqlLanguage } from 'sql-formatter';
import { ActionToolbarComponent } from '../../../shared/components/action-toolbar.component';
import { SplitPaneComponent } from '../../../shared/components/split-pane.component';
import { ToastService } from '../../../core/services/toast.service';

export type KeywordCase = 'upper' | 'lower' | 'preserve';

@Component({
  selector: 'app-sql-formatter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    ActionToolbarComponent,
    SplitPaneComponent
  ],
  template: `
    <div class="space-y-4 max-w-6xl mx-auto w-full pb-8 animate-in fade-in duration-100">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-800 gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-surface-400">Formatters</span>
            <span class="text-surface-300 dark:text-surface-700">/</span>
            <h1 class="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">
              SQL Query Formatter
            </h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            Beautify, indent, and uppercase keywords for Standard SQL, T-SQL, PostgreSQL, and MySQL queries.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-surface-100 dark:bg-surface-850 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-750">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
            Dialect: {{ dialect().toUpperCase() }}
          </span>
        </div>
      </div>

      <!-- Action Toolbar with Dialect & Formatting Options -->
      <app-action-toolbar
        [primaryActionLabel]="'Format SQL'"
        primaryActionIcon="sparkles"
        [hasSample]="true"
        [hasClear]="true"
        [hasCopy]="true"
        [hasDownload]="true"
        [copyContent]="outputContent()"
        [downloadContent]="outputContent()"
        downloadFilename="query.sql"
        (primaryAction)="formatQuery()"
        (loadSample)="loadSample()"
        (clear)="clearAll()">
        
        <!-- Controls slot: Dialect select, Case, Indent -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Dialect Select -->
          <select
            class="px-2 py-1 rounded-md bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-medium text-surface-700 dark:text-surface-300 focus:outline-none"
            [ngModel]="dialect()"
            (ngModelChange)="dialect.set($event); formatQuery()">
            <option value="sql">Standard SQL</option>
            <option value="tsql">T-SQL (SQL Server)</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="sqlite">SQLite</option>
          </select>

          <!-- Keyword Case -->
          <div class="flex items-center bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md p-0.5 text-[11px]">
            <button
              type="button"
              (click)="keywordCase.set('upper'); formatQuery()"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="keywordCase() === 'upper' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              UPPER
            </button>
            <button
              type="button"
              (click)="keywordCase.set('lower'); formatQuery()"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="keywordCase() === 'lower' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              lower
            </button>
            <button
              type="button"
              (click)="keywordCase.set('preserve'); formatQuery()"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="keywordCase() === 'preserve' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              Preserve
            </button>
          </div>

          <!-- Indent -->
          <select
            class="px-2 py-1 rounded-md bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-mono text-surface-700 dark:text-surface-300 focus:outline-none"
            [ngModel]="tabWidth()"
            (ngModelChange)="tabWidth.set($event); formatQuery()">
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
          </select>
        </div>
      </app-action-toolbar>

      <!-- Editor Split Pane -->
      <app-split-pane
        [title]="'SQL Workspace'"
        inputLabel="Raw Query"
        outputLabel="Formatted SQL"
        [inputMeta]="inputContent().length + ' chars • ' + lineCount(inputContent()) + ' lines'"
        [outputMeta]="outputContent().length + ' chars • ' + lineCount(outputContent()) + ' lines'"
        (swap)="swapPanes()">
        
        <!-- Input -->
        <div input-content class="h-full flex flex-col">
          <textarea
            class="w-full h-full min-h-[380px] bg-transparent font-mono text-xs p-2 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none leading-relaxed"
            placeholder="Paste raw SQL query here (e.g. SELECT * FROM users WHERE active = 1)..."
            [ngModel]="inputContent()"
            (ngModelChange)="onInputChange($event)"
            spellcheck="false"></textarea>
        </div>

        <!-- Output -->
        <div output-content class="h-full flex flex-col">
          @if (outputContent()) {
            <pre class="w-full h-full min-h-[380px] overflow-auto font-mono text-xs p-2 text-surface-900 dark:text-surface-100 select-all leading-relaxed">{{ outputContent() }}</pre>
          } @else {
            <div class="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 text-surface-400 font-mono">
              <lucide-icon name="database" class="w-7 h-7 opacity-25 mb-2"></lucide-icon>
              <p class="text-xs">Formatted SQL query will render here.</p>
              <button
                type="button"
                (click)="loadSample()"
                class="mt-2 text-xs text-brand-500 hover:underline">
                Load sample SQL query
              </button>
            </div>
          }
        </div>
      </app-split-pane>

    </div>
  `
})
export class SqlFormatterComponent {
  private readonly toast = inject(ToastService);

  readonly dialect = signal<SqlLanguage>('tsql');
  readonly keywordCase = signal<KeywordCase>('upper');
  readonly tabWidth = signal<string>('2');

  readonly inputContent = signal<string>(
    "with active_users as (select u.id, u.email, u.created_at, count(o.id) as order_count, sum(o.total_amount) as lifetime_value from users u inner join orders o on u.id = o.user_id where u.status = 'active' and o.created_at >= dateadd(year, -1, getdate()) group by u.id, u.email, u.created_at having count(o.id) > 5) select id, email, order_count, lifetime_value, dense_rank() over (order by lifetime_value desc) as customer_tier from active_users order by lifetime_value desc;"
  );
  readonly outputContent = signal<string>('');

  constructor() {
    this.formatQuery();
  }

  onInputChange(val: string): void {
    this.inputContent.set(val);
  }

  formatQuery(): void {
    const raw = this.inputContent().trim();
    if (!raw) {
      this.outputContent.set('');
      return;
    }

    try {
      const formatted = formatSql(raw, {
        language: this.dialect(),
        tabWidth: parseInt(this.tabWidth(), 10),
        keywordCase: this.keywordCase(),
        linesBetweenQueries: 2
      });
      this.outputContent.set(formatted);
    } catch (e: any) {
      this.toast.error('Could not format query with selected dialect');
      this.outputContent.set(raw);
    }
  }

  loadSample(): void {
    const sample = `select c.customer_id, c.company_name, count(distinct o.order_id) as total_orders, sum(od.unit_price * od.quantity * (1 - od.discount)) as revenue from customers c left join orders o on c.customer_id = o.customer_id left join order_details od on o.order_id = od.order_id where c.country in ('USA', 'UK', 'Germany') and o.order_date between '2024-01-01' and '2026-10-31' group by c.customer_id, c.company_name having count(distinct o.order_id) >= 3 order by revenue desc;`;
    this.inputContent.set(sample);
    this.formatQuery();
    this.toast.info('Sample SQL query loaded');
  }

  clearAll(): void {
    this.inputContent.set('');
    this.outputContent.set('');
    this.toast.info('Cleared query');
  }

  swapPanes(): void {
    const temp = this.inputContent();
    this.inputContent.set(this.outputContent());
    this.outputContent.set(temp);
    this.formatQuery();
  }

  lineCount(text: string): number {
    return text ? text.split('\n').length : 0;
  }
}
