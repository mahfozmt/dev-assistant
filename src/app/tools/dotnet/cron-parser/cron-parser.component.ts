import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import cronstrue from 'cronstrue';
import { ToastService } from '../../../core/services/toast.service';

interface CronPreset {
  label: string;
  expression: string;
  description: string;
}

interface CronFieldInfo {
  name: string;
  value: string;
  allowed: string;
  meaning: string;
}

interface ScheduledRun {
  date: Date;
  formatted: string;
  relativeTime: string;
}

@Component({
  selector: 'app-cron-parser',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="flex-1 flex flex-col space-y-3.5 animate-in fade-in duration-100 max-w-5xl mx-auto w-full">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-800 gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-surface-400">.NET & Developer Utilities</span>
            <span class="text-surface-300 dark:text-surface-700">/</span>
            <h1 class="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">Cron Expression Parser</h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Parse, explain, and project upcoming scheduled executions for Unix & Quartz cron expressions.</p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <div class="relative">
            <select
              (change)="applyPreset($event)"
              class="px-2.5 py-1.5 text-xs font-medium text-surface-700 dark:text-surface-300 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 rounded-lg transition-colors border-none focus:ring-1 focus:ring-brand-500 cursor-pointer">
              <option value="" disabled selected>Common Presets...</option>
              @for (preset of presets; track preset.label) {
                <option [value]="preset.expression">{{ preset.label }} ({{ preset.expression }})</option>
              }
            </select>
          </div>
          <button
            type="button"
            (click)="copyExpression()"
            [disabled]="!cronInput()"
            class="px-2.5 py-1.5 text-xs font-medium text-surface-700 dark:text-surface-300 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5">
            <lucide-icon name="copy" class="w-3.5 h-3.5"></lucide-icon>
            <span>Copy Cron</span>
          </button>
          <button
            type="button"
            (click)="clearAll()"
            class="px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors flex items-center gap-1.5">
            <lucide-icon name="trash-2" class="w-3.5 h-3.5"></lucide-icon>
            <span>Clear</span>
          </button>
        </div>
      </div>

      <!-- Cron Expression Input Card -->
      <div class="p-4 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl shadow-xs space-y-3">
        <label class="block text-xs font-medium text-surface-700 dark:text-surface-300">
          Cron Expression (5-part Unix or 6-part Quartz)
        </label>
        <div class="flex items-center gap-3">
          <input
            type="text"
            [ngModel]="cronInput()"
            (ngModelChange)="onCronChange($event)"
            placeholder="e.g. */15 * * * * or 0 4 * * 1-5"
            class="flex-1 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg px-3.5 py-2.5 font-mono text-sm tracking-wider font-semibold text-surface-900 dark:text-surface-100 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
            spellcheck="false" />
        </div>

        <!-- Human-Readable Translation Banner -->
        @if (cronDescription().isValid) {
          <div class="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <lucide-icon name="circle-check" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"></lucide-icon>
              <div>
                <span class="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  “{{ cronDescription().text }}”
                </span>
              </div>
            </div>
            <button
              type="button"
              (click)="copyDescription()"
              class="px-2 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded transition-colors flex items-center gap-1 shrink-0">
              <lucide-icon name="copy" class="w-3 h-3"></lucide-icon>
              <span>Copy Text</span>
            </button>
          </div>
        } @else if (cronInput().trim()) {
          <div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
            <lucide-icon name="circle-alert" class="w-4 h-4 shrink-0"></lucide-icon>
            <span><strong>Invalid Expression:</strong> {{ cronDescription().text }}</span>
          </div>
        }
      </div>

      <!-- Segment Breakdown Cards -->
      <div class="space-y-1.5">
        <h2 class="text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Field Breakdown</h2>
        <div class="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
          @for (field of fieldBreakdown(); track field.name) {
            <div class="border border-surface-200 dark:border-surface-800 rounded-xl p-3 bg-white dark:bg-surface-950 shadow-xs flex flex-col justify-between">
              <div>
                <span class="text-[11px] font-medium text-surface-500 uppercase">{{ field.name }}</span>
                <div class="font-mono text-base font-bold text-brand-600 dark:text-brand-400 my-1 truncate">
                  {{ field.value }}
                </div>
              </div>
              <div class="text-[10px] text-surface-400">
                <span>Range: {{ field.allowed }}</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Upcoming Executions Projection -->
      <div class="border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden">
        <div class="h-9 px-3.5 bg-surface-50/90 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500">
          <div class="flex items-center gap-2">
            <lucide-icon name="clock" class="w-3.5 h-3.5 text-surface-400"></lucide-icon>
            <span class="font-medium text-surface-700 dark:text-surface-300">Next 5 Scheduled Runs</span>
          </div>
          <span class="text-[11px] text-surface-400 font-mono">Calculated locally</span>
        </div>

        <div class="divide-y divide-surface-100 dark:divide-surface-800 text-xs">
          @if (!cronDescription().isValid) {
            <div class="p-6 text-center text-surface-400">
              Provide a valid cron expression above to view upcoming execution dates.
            </div>
          } @else if (upcomingRuns().length === 0) {
            <div class="p-6 text-center text-surface-400">
              No upcoming runs could be computed for this expression within the projection window.
            </div>
          } @else {
            @for (run of upcomingRuns(); track run.formatted; let idx = $index) {
              <div class="p-3 flex items-center justify-between hover:bg-surface-50/50 dark:hover:bg-surface-900/30 transition-colors">
                <div class="flex items-center gap-3">
                  <span class="w-5 h-5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 flex items-center justify-center font-mono text-[11px] font-semibold">
                    {{ idx + 1 }}
                  </span>
                  <div class="font-mono text-xs font-medium text-surface-900 dark:text-surface-100">
                    {{ run.formatted }}
                  </div>
                </div>
                <span class="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                  {{ run.relativeTime }}
                </span>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class CronParserComponent {
  private readonly toast = inject(ToastService);

  readonly cronInput = signal<string>('*/15 * * * *');

  readonly presets: CronPreset[] = [
    { label: 'Every minute', expression: '* * * * *', description: 'Runs every minute' },
    { label: 'Every 5 minutes', expression: '*/5 * * * *', description: 'Runs every 5 minutes' },
    { label: 'Every 15 minutes', expression: '*/15 * * * *', description: 'Runs every 15 minutes' },
    { label: 'Every hour (:00)', expression: '0 * * * *', description: 'Runs at the start of every hour' },
    { label: 'Daily at midnight', expression: '0 0 * * *', description: 'Runs daily at 00:00 UTC' },
    { label: 'Daily at 4:00 AM', expression: '0 4 * * *', description: 'Runs daily at 04:00 AM' },
    { label: 'Weekdays at 9:00 AM', expression: '0 9 * * 1-5', description: 'Runs Mon-Fri at 09:00 AM' },
    { label: 'Every Sunday at midnight', expression: '0 0 * * 0', description: 'Runs every Sunday at 00:00' },
    { label: '1st of month at midnight', expression: '0 0 1 * *', description: 'Runs on day 1 of every month' }
  ];

  readonly cronDescription = computed(() => {
    const expr = this.cronInput().trim();
    if (!expr) return { isValid: false, text: 'Please enter a cron expression' };

    try {
      const text = cronstrue.toString(expr, { throwExceptionOnParseError: true, verbose: false });
      return { isValid: true, text };
    } catch (e: any) {
      return { isValid: false, text: e.message || 'Syntax error' };
    }
  });

  readonly fieldBreakdown = computed<CronFieldInfo[]>(() => {
    const expr = this.cronInput().trim();
    const parts = expr.split(/\s+/).filter(p => p.length > 0);

    if (parts.length === 6) {
      return [
        { name: 'Second', value: parts[0], allowed: '0-59', meaning: 'Second of minute' },
        { name: 'Minute', value: parts[1], allowed: '0-59', meaning: 'Minute of hour' },
        { name: 'Hour', value: parts[2], allowed: '0-23', meaning: 'Hour of day' },
        { name: 'Day of Month', value: parts[3], allowed: '1-31', meaning: 'Day of month' },
        { name: 'Month', value: parts[4], allowed: '1-12', meaning: 'Month of year' },
        { name: 'Day of Week', value: parts[5], allowed: '0-6', meaning: 'Day of week (0=Sun)' }
      ];
    }

    // Default 5-part
    return [
      { name: 'Minute', value: parts[0] || '*', allowed: '0-59', meaning: 'Minute of hour' },
      { name: 'Hour', value: parts[1] || '*', allowed: '0-23', meaning: 'Hour of day' },
      { name: 'Day of Month', value: parts[2] || '*', allowed: '1-31', meaning: 'Day of month' },
      { name: 'Month', value: parts[3] || '*', allowed: '1-12', meaning: 'Month of year' },
      { name: 'Day of Week', value: parts[4] || '*', allowed: '0-6', meaning: 'Day of week (0=Sun)' }
    ];
  });

  readonly upcomingRuns = computed<ScheduledRun[]>(() => {
    if (!this.cronDescription().isValid) return [];
    const expr = this.cronInput().trim();
    const parts = expr.split(/\s+/).filter(p => p.length > 0);
    if (parts.length < 5 || parts.length > 6) return [];

    return this.calculateNextRuns(parts, 5);
  });

  onCronChange(val: string): void {
    this.cronInput.set(val);
  }

  applyPreset(e: Event): void {
    const select = e.target as HTMLSelectElement;
    if (select.value) {
      this.cronInput.set(select.value);
      this.toast.info(`Preset applied: ${select.value}`);
    }
    select.value = '';
  }

  clearAll(): void {
    this.cronInput.set('');
    this.toast.info('Cleared cron expression');
  }

  copyExpression(): void {
    const val = this.cronInput().trim();
    if (!val) return;
    navigator.clipboard.writeText(val).then(() => {
      this.toast.success('Cron expression copied to clipboard!');
    });
  }

  copyDescription(): void {
    const text = this.cronDescription().text;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.toast.success('Description copied to clipboard!');
    });
  }

  private calculateNextRuns(parts: string[], count: number): ScheduledRun[] {
    const isSixPart = parts.length === 6;
    const secPart = isSixPart ? parts[0] : '0';
    const minPart = isSixPart ? parts[1] : parts[0];
    const hourPart = isSixPart ? parts[2] : parts[1];
    const domPart = isSixPart ? parts[3] : parts[2];
    const monPart = isSixPart ? parts[4] : parts[3];
    const dowPart = isSixPart ? parts[5] : parts[4];

    const secAllowed = this.parseField(secPart, 0, 59);
    const minAllowed = this.parseField(minPart, 0, 59);
    const hourAllowed = this.parseField(hourPart, 0, 23);
    const domAllowed = this.parseField(domPart, 1, 31);
    const monAllowed = this.parseField(monPart, 1, 12);
    const dowAllowed = this.parseField(dowPart, 0, 6);

    const results: ScheduledRun[] = [];
    const now = new Date();
    // Start searching from next minute (or next second)
    const current = new Date(now.getTime());
    if (isSixPart) {
      current.setSeconds(current.getSeconds() + 1, 0);
    } else {
      current.setMinutes(current.getMinutes() + 1, 0, 0);
    }

    const stepSec = isSixPart ? 1 : 60;
    const maxIterations = 500000; // safety ceiling
    let iterations = 0;

    while (results.length < count && iterations++ < maxIterations) {
      const sec = current.getSeconds();
      const min = current.getMinutes();
      const hour = current.getHours();
      const dom = current.getDate();
      const mon = current.getMonth() + 1; // 1-12
      const dow = current.getDay(); // 0-6

      const secOk = secAllowed === null || secAllowed.has(sec);
      const minOk = minAllowed === null || minAllowed.has(min);
      const hourOk = hourAllowed === null || hourAllowed.has(hour);
      const domOk = domAllowed === null || domAllowed.has(dom);
      const monOk = monAllowed === null || monAllowed.has(mon);
      const dowOk = dowAllowed === null || dowAllowed.has(dow);

      if (secOk && minOk && hourOk && domOk && monOk && dowOk) {
        const runDate = new Date(current.getTime());
        results.push({
          date: runDate,
          formatted: this.formatDate(runDate),
          relativeTime: this.formatRelativeTime(runDate, now)
        });
      }

      current.setSeconds(current.getSeconds() + stepSec);
    }

    return results;
  }

  private parseField(field: string, min: number, max: number): Set<number> | null {
    if (field === '*' || field === '?') return null;

    const values = new Set<number>();
    const tokens = field.split(',');

    for (const token of tokens) {
      const trimmed = token.trim();
      if (!trimmed) continue;

      if (trimmed.includes('/')) {
        const [range, stepStr] = trimmed.split('/');
        const step = parseInt(stepStr, 10) || 1;
        let start = min;
        let end = max;
        if (range !== '*' && range !== '?') {
          if (range.includes('-')) {
            const [rStart, rEnd] = range.split('-').map(Number);
            start = rStart;
            end = rEnd;
          } else {
            start = parseInt(range, 10);
          }
        }
        for (let i = start; i <= end; i += step) {
          values.add(i);
        }
      } else if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(Number);
        for (let i = start; i <= end; i++) {
          values.add(i);
        }
      } else {
        const num = parseInt(trimmed, 10);
        if (!isNaN(num)) {
          values.add(num);
        }
      }
    }

    return values;
  }

  private formatDate(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[d.getDay()];
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const h = pad(d.getHours());
    const min = pad(d.getMinutes());
    const s = pad(d.getSeconds());
    return `${y}-${m}-${day} (${dayName}) ${h}:${min}:${s}`;
  }

  private formatRelativeTime(target: Date, base: Date): string {
    const diffMs = target.getTime() - base.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
    }
    if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
    }
    if (diffMin > 0) {
      return `in ${diffMin} minute${diffMin === 1 ? '' : 's'}`;
    }
    return `in ${diffSec} second${diffSec === 1 ? '' : 's'}`;
  }
}
