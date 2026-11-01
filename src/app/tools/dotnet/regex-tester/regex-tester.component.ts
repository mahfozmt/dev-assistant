import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService } from '../../../core/services/toast.service';

interface MatchGroup {
  index: number;
  name?: string;
  value: string;
}

interface RegexMatch {
  index: number;
  matchIndex: number;
  length: number;
  value: string;
  groups: MatchGroup[];
}

interface RegexPreset {
  name: string;
  pattern: string;
  flags: string;
  sample: string;
  description: string;
}

@Component({
  selector: 'app-regex-tester',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="flex-1 flex flex-col space-y-3.5 animate-in fade-in duration-100 max-w-7xl mx-auto w-full">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-800 gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-surface-400">.NET & Developer Utilities</span>
            <span class="text-surface-300 dark:text-surface-700">/</span>
            <h1 class="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">Regex Tester & Explainer</h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Test regular expressions in real time with capture groups, visual match highlighting, and replacement.</p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <div class="relative">
            <select
              (change)="applyPreset($event)"
              class="px-2.5 py-1.5 text-xs font-medium text-surface-700 dark:text-surface-300 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 rounded-lg transition-colors border-none focus:ring-1 focus:ring-brand-500 cursor-pointer">
              <option value="" disabled selected>Presets & Cheatsheet...</option>
              @for (preset of presets; track preset.name) {
                <option [value]="preset.name">{{ preset.name }}</option>
              }
            </select>
          </div>
          <button
            type="button"
            (click)="clearAll()"
            class="px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors flex items-center gap-1.5">
            <lucide-icon name="trash-2" class="w-3.5 h-3.5"></lucide-icon>
            <span>Clear</span>
          </button>
        </div>
      </div>

      <!-- Regex Input Bar -->
      <div class="p-3 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div class="flex-1 flex items-center bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-1.5 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/20">
          <span class="text-sm font-mono text-surface-400 select-none mr-2">/</span>
          <input
            type="text"
            [ngModel]="pattern()"
            (ngModelChange)="onPatternChange($event)"
            placeholder="Enter regex pattern (e.g. ([a-zA-Z0-9_.-]+)@([a-zA-Z0-9-]+)\.([a-zA-Z.]+))..."
            class="flex-1 bg-transparent font-mono text-xs text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none"
            spellcheck="false" />
          <span class="text-sm font-mono text-surface-400 select-none ml-2">/</span>
        </div>

        <!-- Flag Toggles -->
        <div class="flex items-center gap-1 bg-surface-50 dark:bg-surface-900 p-1 rounded-lg border border-surface-200 dark:border-surface-700 self-start sm:self-auto">
          @for (flag of availableFlags; track flag.letter) {
            <button
              type="button"
              (click)="toggleFlag(flag.letter)"
              [title]="flag.name + ' (' + flag.letter + ')'"
              [ngClass]="activeFlags().includes(flag.letter)
                ? 'bg-brand-500 text-white'
                : 'text-surface-600 dark:text-surface-400'"
              class="w-7 h-7 flex items-center justify-center font-mono text-xs font-semibold rounded-md transition-colors hover:bg-surface-200/60 dark:hover:bg-surface-800">
              {{ flag.letter }}
            </button>
          }
        </div>
      </div>

      <!-- Error Banner if Regex is Invalid -->
      @if (regexError()) {
        <div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
          <lucide-icon name="circle-alert" class="w-4 h-4 shrink-0"></lucide-icon>
          <span><strong>Invalid Regular Expression:</strong> {{ regexError() }}</span>
        </div>
      }

      <!-- Main Columns: Test String + Results -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        
        <!-- Left Column: Test String & Highlighting -->
        <div class="flex flex-col border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden min-h-[400px]">
          <div class="h-9 px-3.5 bg-surface-50/90 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500 shrink-0">
            <span class="font-medium text-surface-700 dark:text-surface-300">Test String</span>
            <div class="flex items-center gap-2">
              <span class="text-[11px] text-surface-400 font-mono">{{ matches().length }} match{{ matches().length === 1 ? '' : 'es' }}</span>
              <button
                type="button"
                (click)="toggleHighlightMode()"
                class="px-2 py-0.5 rounded text-[10px] font-medium border"
                [ngClass]="showHighlights() 
                  ? 'bg-brand-50 border-brand-300 text-brand-600 dark:bg-brand-950/40 dark:border-brand-800 dark:text-brand-400' 
                  : 'bg-surface-50 border-surface-200 text-surface-500 dark:bg-surface-850 dark:border-surface-700 dark:text-surface-400'">
                {{ showHighlights() ? 'Highlight ON' : 'Highlight OFF' }}
              </button>
            </div>
          </div>

          <div class="flex-1 relative flex flex-col">
            @if (showHighlights() && matches().length > 0 && !regexError()) {
              <!-- Highlighted Backdrop -->
              <div
                class="p-3.5 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all select-none overflow-y-auto max-h-[220px] bg-surface-50/50 dark:bg-surface-900/30 border-b border-surface-200 dark:border-surface-800"
                [innerHTML]="highlightedText()"></div>
            }

            <textarea
              class="w-full flex-1 p-3.5 bg-transparent font-mono text-xs leading-relaxed text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none"
              placeholder="Paste or type test text here to test against the pattern..."
              [ngModel]="testText()"
              (ngModelChange)="onTestTextChange($event)"
              spellcheck="false"></textarea>
          </div>
        </div>

        <!-- Right Column: Tabs (Matches / Replacement / Explanation) -->
        <div class="flex flex-col border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden min-h-[400px]">
          <!-- Tab Navigation -->
          <div class="h-9 px-2 bg-surface-50/90 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs shrink-0">
            <div class="flex items-center space-x-1">
              <button
                type="button"
                (click)="activeTab.set('matches')"
                class="px-3 py-1 rounded-md text-xs font-medium transition-colors"
                [class.bg-white]="activeTab() === 'matches'"
                [class.dark:bg-surface-800]="activeTab() === 'matches'"
                [class.text-surface-900]="activeTab() === 'matches'"
                [class.dark:text-surface-100]="activeTab() === 'matches'"
                [class.shadow-xs]="activeTab() === 'matches'"
                [class.text-surface-500]="activeTab() !== 'matches'">
                Matches ({{ matches().length }})
              </button>
              <button
                type="button"
                (click)="activeTab.set('replace')"
                class="px-3 py-1 rounded-md text-xs font-medium transition-colors"
                [class.bg-white]="activeTab() === 'replace'"
                [class.dark:bg-surface-800]="activeTab() === 'replace'"
                [class.text-surface-900]="activeTab() === 'replace'"
                [class.dark:text-surface-100]="activeTab() === 'replace'"
                [class.shadow-xs]="activeTab() === 'replace'"
                [class.text-surface-500]="activeTab() !== 'replace'">
                Replace
              </button>
              <button
                type="button"
                (click)="activeTab.set('cheatsheet')"
                class="px-3 py-1 rounded-md text-xs font-medium transition-colors"
                [class.bg-white]="activeTab() === 'cheatsheet'"
                [class.dark:bg-surface-800]="activeTab() === 'cheatsheet'"
                [class.text-surface-900]="activeTab() === 'cheatsheet'"
                [class.dark:text-surface-100]="activeTab() === 'cheatsheet'"
                [class.shadow-xs]="activeTab() === 'cheatsheet'"
                [class.text-surface-500]="activeTab() !== 'cheatsheet'">
                Quick Reference
              </button>
            </div>

            @if (activeTab() === 'matches' && matches().length > 0) {
              <button
                type="button"
                (click)="copyMatchesJson()"
                class="px-2 py-1 text-[11px] font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 transition-colors flex items-center gap-1">
                <lucide-icon name="copy" class="w-3 h-3"></lucide-icon>
                <span>Copy JSON</span>
              </button>
            }
          </div>

          <!-- Tab 1: Match List & Captured Groups -->
          @if (activeTab() === 'matches') {
            <div class="flex-1 p-3.5 overflow-y-auto space-y-3">
              @if (matches().length === 0) {
                <div class="h-full flex flex-col items-center justify-center text-center p-8 text-surface-400">
                  <lucide-icon name="regex" class="w-8 h-8 mb-2 opacity-50"></lucide-icon>
                  <p class="text-xs">No matches found for the current pattern and flags.</p>
                </div>
              } @else {
                @for (m of matches(); track m.index) {
                  <div class="border border-surface-200 dark:border-surface-800 rounded-lg p-2.5 bg-surface-50/50 dark:bg-surface-900/30 text-xs">
                    <div class="flex items-center justify-between pb-1.5 border-b border-surface-200/60 dark:border-surface-800/60 mb-2">
                      <div class="flex items-center gap-2">
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                          Match {{ m.matchIndex + 1 }}
                        </span>
                        <span class="text-[11px] text-surface-400 font-mono">Index {{ m.index }}–{{ m.index + m.length }} ({{ m.length }} chars)</span>
                      </div>
                      <button
                        type="button"
                        (click)="copyText(m.value)"
                        class="p-1 rounded text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
                        title="Copy match value">
                        <lucide-icon name="copy" class="w-3.5 h-3.5"></lucide-icon>
                      </button>
                    </div>

                    <div class="font-mono text-xs bg-white dark:bg-surface-950 p-2 rounded border border-surface-200 dark:border-surface-800 text-surface-900 dark:text-surface-100 break-all mb-2">
                      {{ m.value }}
                    </div>

                    <!-- Groups if any -->
                    @if (m.groups.length > 0) {
                      <div class="space-y-1 mt-2">
                        <span class="text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Capture Groups</span>
                        <div class="grid grid-cols-1 gap-1">
                          @for (grp of m.groups; track grp.index) {
                            <div class="flex items-center gap-2 text-[11px] font-mono bg-surface-100 dark:bg-surface-800/50 px-2 py-1 rounded">
                              <span class="text-brand-600 dark:text-brand-400 font-semibold">{{ grp.name ? grp.name : 'Group ' + grp.index }}:</span>
                              <span class="text-surface-900 dark:text-surface-100 truncate">{{ grp.value }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              }
            </div>
          }

          <!-- Tab 2: Replace Simulator -->
          @if (activeTab() === 'replace') {
            <div class="flex-1 p-3.5 flex flex-col gap-3">
              <div>
                <label class="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Replacement Pattern (e.g. <code class="font-mono text-brand-500">[$1]</code> or <code class="font-mono text-brand-500">REDACTED</code>)
                </label>
                <input
                  type="text"
                  [ngModel]="replacementPattern()"
                  (ngModelChange)="onReplacementChange($event)"
                  placeholder="Enter replacement string..."
                  class="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 text-xs font-mono text-surface-900 dark:text-surface-100 focus:outline-none focus:border-brand-500">
              </div>

              <div class="flex-1 flex flex-col border border-surface-200 dark:border-surface-800 rounded-lg overflow-hidden bg-white dark:bg-surface-950">
                <div class="h-8 px-3 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500">
                  <span class="font-medium text-surface-700 dark:text-surface-300">Replaced Output</span>
                  <button
                    type="button"
                    (click)="copyText(replacedOutput())"
                    [disabled]="!replacedOutput()"
                    class="text-[11px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 disabled:opacity-50">
                    <lucide-icon name="copy" class="w-3 h-3"></lucide-icon>
                    <span>Copy Result</span>
                  </button>
                </div>
                <textarea
                  readonly
                  class="w-full flex-1 p-3 bg-surface-50/50 dark:bg-surface-900/30 font-mono text-xs leading-relaxed text-surface-900 dark:text-surface-100 focus:outline-none resize-none"
                  [value]="replacedOutput()"></textarea>
              </div>
            </div>
          }

          <!-- Tab 3: Quick Reference / Cheatsheet -->
          @if (activeTab() === 'cheatsheet') {
            <div class="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
              <div class="grid grid-cols-2 gap-2 text-[11px]">
                <div class="border border-surface-200 dark:border-surface-800 rounded-lg p-2 bg-surface-50/50 dark:bg-surface-900/30">
                  <span class="font-mono font-bold text-brand-600 dark:text-brand-400">\\d</span>
                  <p class="text-surface-500 mt-0.5">Any digit (0-9)</p>
                </div>
                <div class="border border-surface-200 dark:border-surface-800 rounded-lg p-2 bg-surface-50/50 dark:bg-surface-900/30">
                  <span class="font-mono font-bold text-brand-600 dark:text-brand-400">\\w</span>
                  <p class="text-surface-500 mt-0.5">Word character [a-zA-Z0-9_]</p>
                </div>
                <div class="border border-surface-200 dark:border-surface-800 rounded-lg p-2 bg-surface-50/50 dark:bg-surface-900/30">
                  <span class="font-mono font-bold text-brand-600 dark:text-brand-400">\\s</span>
                  <p class="text-surface-500 mt-0.5">Whitespace character</p>
                </div>
                <div class="border border-surface-200 dark:border-surface-800 rounded-lg p-2 bg-surface-50/50 dark:bg-surface-900/30">
                  <span class="font-mono font-bold text-brand-600 dark:text-brand-400">^ / $</span>
                  <p class="text-surface-500 mt-0.5">Start / End of line or string</p>
                </div>
                <div class="border border-surface-200 dark:border-surface-800 rounded-lg p-2 bg-surface-50/50 dark:bg-surface-900/30">
                  <span class="font-mono font-bold text-brand-600 dark:text-brand-400">+ / * / ?</span>
                  <p class="text-surface-500 mt-0.5">1+, 0+, or 0-1 occurrences</p>
                </div>
                <div class="border border-surface-200 dark:border-surface-800 rounded-lg p-2 bg-surface-50/50 dark:bg-surface-900/30">
                  <span class="font-mono font-bold text-brand-600 dark:text-brand-400">(?&lt;name&gt;...)</span>
                  <p class="text-surface-500 mt-0.5">Named capture group</p>
                </div>
              </div>
            </div>
          }

        </div>
      </div>
    </div>
  `
})
export class RegexTesterComponent {
  private readonly toast = inject(ToastService);

  readonly pattern = signal<string>('([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+)\\.([a-zA-Z0-9-.]+)');
  readonly activeFlags = signal<string>('g');
  readonly testText = signal<string>(
    'Contact our team at support@devassistant.io or sales-desk@company.org.\nYou can also reach out to john.doe@sample.co.uk for inquiries.'
  );
  readonly replacementPattern = signal<string>('[$1 at $2]');
  readonly showHighlights = signal<boolean>(true);
  readonly activeTab = signal<'matches' | 'replace' | 'cheatsheet'>('matches');

  readonly availableFlags = [
    { letter: 'g', name: 'Global' },
    { letter: 'i', name: 'Ignore Case' },
    { letter: 'm', name: 'Multiline' },
    { letter: 's', name: 'Dot All' },
    { letter: 'u', name: 'Unicode' }
  ];

  readonly presets: RegexPreset[] = [
    {
      name: 'Email Address',
      pattern: '([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+)\\.([a-zA-Z0-9-.]+)',
      flags: 'g',
      sample: 'Contact support@devassistant.io or john.doe@company.com.',
      description: 'Matches standard email addresses and captures user, domain, and TLD.'
    },
    {
      name: 'IPv4 Address',
      pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
      flags: 'g',
      sample: 'Router addresses: 192.168.1.1, 10.0.0.1, and public IP 172.217.16.206.',
      description: 'Matches valid IPv4 addresses in dotted quad notation.'
    },
    {
      name: 'UUID / GUID',
      pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
      flags: 'g',
      sample: 'Entity ID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11 generated at runtime.',
      description: 'Matches canonical 36-character hyphenated UUIDs.'
    },
    {
      name: 'URL / Website',
      pattern: 'https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)',
      flags: 'g',
      sample: 'Visit https://lab.mahfozmt.com or http://github.com/mahfozmt/dev-assistant today.',
      description: 'Matches HTTP and HTTPS URLs.'
    },
    {
      name: 'ISO 8601 Date',
      pattern: '\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])(?:T(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|[+-][01]\\d:[0-5]\\d)?)?\\b',
      flags: 'g',
      sample: 'Created on 2026-11-01T12:00:00Z and modified on 2026-11-02.',
      description: 'Matches ISO dates with optional time and timezone offsets.'
    },
    {
      name: 'Hex Color Code',
      pattern: '#(?:[0-9a-fA-F]{3,4}){1,2}\\b',
      flags: 'g',
      sample: 'Colors: #ffffff, #000, #3b82f6, and #10b98180 with alpha.',
      description: 'Matches 3, 4, 6, or 8-digit hex color representations.'
    }
  ];

  readonly regexError = computed(() => {
    const pat = this.pattern();
    if (!pat) return null;
    try {
      new RegExp(pat, this.activeFlags());
      return null;
    } catch (e: any) {
      return e.message || 'Invalid pattern syntax';
    }
  });

  readonly matches = computed<RegexMatch[]>(() => {
    const pat = this.pattern();
    const text = this.testText();
    const flags = this.activeFlags();

    if (!pat || !text || this.regexError()) return [];

    try {
      const isGlobal = flags.includes('g');
      const reg = new RegExp(pat, flags);
      const results: RegexMatch[] = [];

      if (!isGlobal) {
        const match = reg.exec(text);
        if (match) {
          const groups: MatchGroup[] = [];
          for (let i = 1; i < match.length; i++) {
            groups.push({ index: i, value: match[i] });
          }
          if (match.groups) {
            for (const [key, val] of Object.entries(match.groups)) {
              groups.push({ index: -1, name: key, value: val });
            }
          }
          results.push({
            index: match.index,
            matchIndex: 0,
            length: match[0].length,
            value: match[0],
            groups
          });
        }
        return results;
      }

      let match: RegExpExecArray | null;
      let count = 0;
      // Guard against infinite loop if matching empty string
      while ((match = reg.exec(text)) !== null) {
        const groups: MatchGroup[] = [];
        for (let i = 1; i < match.length; i++) {
          groups.push({ index: i, value: match[i] });
        }
        if (match.groups) {
          for (const [key, val] of Object.entries(match.groups)) {
            groups.push({ index: -1, name: key, value: val });
          }
        }

        results.push({
          index: match.index,
          matchIndex: count++,
          length: match[0].length,
          value: match[0],
          groups
        });

        if (match[0].length === 0) {
          reg.lastIndex++;
        }
        if (count > 2000) break; // safeguard
      }

      return results;
    } catch {
      return [];
    }
  });

  readonly replacedOutput = computed(() => {
    const pat = this.pattern();
    const text = this.testText();
    const rep = this.replacementPattern();
    const flags = this.activeFlags();

    if (!pat || this.regexError()) return text;
    try {
      const reg = new RegExp(pat, flags);
      return text.replace(reg, rep);
    } catch {
      return text;
    }
  });

  readonly highlightedText = computed(() => {
    const text = this.testText();
    const mList = this.matches();
    if (!text || mList.length === 0) return this.escapeHtml(text);

    let html = '';
    let lastIdx = 0;

    mList.forEach((m, idx) => {
      // Add text before match
      if (m.index > lastIdx) {
        html += this.escapeHtml(text.substring(lastIdx, m.index));
      }

      const colorClass = idx % 2 === 0
        ? 'bg-amber-300/80 dark:bg-amber-500/40 text-amber-950 dark:text-amber-100'
        : 'bg-emerald-300/80 dark:bg-emerald-500/40 text-emerald-950 dark:text-emerald-100';

      html += `<mark class="px-0.5 rounded ${colorClass} font-semibold">${this.escapeHtml(m.value)}</mark>`;
      lastIdx = m.index + m.length;
    });

    if (lastIdx < text.length) {
      html += this.escapeHtml(text.substring(lastIdx));
    }

    return html;
  });

  onPatternChange(val: string): void {
    this.pattern.set(val);
  }

  onTestTextChange(val: string): void {
    this.testText.set(val);
  }

  onReplacementChange(val: string): void {
    this.replacementPattern.set(val);
  }

  toggleFlag(letter: string): void {
    const cur = this.activeFlags();
    if (cur.includes(letter)) {
      this.activeFlags.set(cur.replace(letter, ''));
    } else {
      this.activeFlags.set(cur + letter);
    }
  }

  toggleHighlightMode(): void {
    this.showHighlights.update(v => !v);
  }

  applyPreset(e: Event): void {
    const select = e.target as HTMLSelectElement;
    const selected = this.presets.find(p => p.name === select.value);
    if (selected) {
      this.pattern.set(selected.pattern);
      this.activeFlags.set(selected.flags);
      this.testText.set(selected.sample);
      this.toast.info(`Applied preset: ${selected.name}`);
    }
    select.value = '';
  }

  clearAll(): void {
    this.pattern.set('');
    this.testText.set('');
    this.toast.info('Cleared regex and test string');
  }

  copyText(text: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.toast.success('Copied to clipboard!');
    });
  }

  copyMatchesJson(): void {
    const json = JSON.stringify(this.matches(), null, 2);
    this.copyText(json);
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
