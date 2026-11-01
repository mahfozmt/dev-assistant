import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ActionToolbarComponent } from '../../../shared/components/action-toolbar.component';
import { SplitPaneComponent } from '../../../shared/components/split-pane.component';
import { ToastService } from '../../../core/services/toast.service';

export type IndentOption = '2' | '4' | 'tab';

@Component({
  selector: 'app-css-formatter',
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
              CSS / SCSS Formatter
            </h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            Beautify, indent, alphabetize properties, validate brackets, and minify CSS/SCSS stylesheets.
          </p>
        </div>

        <!-- Validation Status Badge -->
        <div class="flex items-center gap-2">
          @if (validationError()) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              CSS Syntax Warning
            </span>
          } @else if (inputContent().trim()) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Valid Braces
            </span>
          }
        </div>
      </div>

      <!-- Action Toolbar -->
      <app-action-toolbar
        [primaryActionLabel]="'Beautify'"
        primaryActionIcon="sparkles"
        [hasSample]="true"
        [hasClear]="true"
        [hasCopy]="true"
        [hasDownload]="true"
        [copyContent]="outputContent()"
        [downloadContent]="outputContent()"
        downloadFilename="styles.css"
        (primaryAction)="formatCss()"
        (loadSample)="loadSample()"
        (clear)="clearAll()">
        
        <div class="flex items-center gap-1.5 flex-wrap">
          <!-- Indent selector -->
          <div class="flex items-center bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md p-0.5 text-[11px]">
            <button
              type="button"
              (click)="indent.set('2'); formatCss()"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="indent() === '2' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              2 sp
            </button>
            <button
              type="button"
              (click)="indent.set('4'); formatCss()"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="indent() === '4' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              4 sp
            </button>
            <button
              type="button"
              (click)="indent.set('tab'); formatCss()"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="indent() === 'tab' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              Tab
            </button>
          </div>

          <!-- Alphabetize Properties Toggle -->
          <button
            type="button"
            (click)="toggleSortProperties()"
            class="px-2.5 py-1 rounded-md text-xs font-medium transition-colors border"
            [ngClass]="sortProperties() 
              ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/30' 
              : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'">
            {{ sortProperties() ? '✓ Alphabetized Props' : 'Alphabetize Props' }}
          </button>

          <!-- Minify CSS button -->
          <button
            type="button"
            (click)="minifyCss()"
            title="Minify stylesheet (removes comments and whitespace)"
            class="px-2.5 py-1 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors border border-surface-200 dark:border-surface-700">
            Minify
          </button>
        </div>
      </app-action-toolbar>

      <!-- Syntax Error Banner -->
      @if (validationError()) {
        <div class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-start gap-2.5">
          <lucide-icon name="circle-alert" class="w-4 h-4 shrink-0 mt-0.5"></lucide-icon>
          <div>
            <span class="font-semibold block">CSS Validation Warning:</span>
            <p>{{ validationError() }}</p>
          </div>
        </div>
      }

      <!-- Split Pane -->
      <app-split-pane
        [title]="'CSS / SCSS Workspace'"
        inputLabel="Raw Stylesheet"
        outputLabel="Formatted Stylesheet"
        [inputMeta]="inputContent().length + ' chars • ' + lineCount(inputContent()) + ' lines'"
        [outputMeta]="outputContent().length + ' chars • ' + lineCount(outputContent()) + ' lines'"
        (swap)="swapPanes()">
        
        <div input-content class="h-full flex flex-col">
          <textarea
            class="w-full h-full min-h-[380px] bg-transparent font-mono text-xs p-2 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none leading-relaxed"
            placeholder="Paste raw CSS or SCSS code here..."
            [ngModel]="inputContent()"
            (ngModelChange)="onInputChange($event)"
            spellcheck="false"></textarea>
        </div>

        <div output-content class="h-full flex flex-col">
          @if (outputContent()) {
            <pre class="w-full h-full min-h-[380px] overflow-auto font-mono text-xs p-2 text-surface-900 dark:text-surface-100 select-all leading-relaxed">{{ outputContent() }}</pre>
          } @else {
            <div class="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 text-surface-400 font-mono">
              <lucide-icon name="palette" class="w-7 h-7 opacity-25 mb-2"></lucide-icon>
              <p class="text-xs">Formatted CSS will render here.</p>
              <button
                type="button"
                (click)="loadSample()"
                class="mt-2 text-xs text-brand-500 hover:underline">
                Load sample stylesheet
              </button>
            </div>
          }
        </div>
      </app-split-pane>

    </div>
  `
})
export class CssFormatterComponent {
  private readonly toast = inject(ToastService);

  readonly indent = signal<IndentOption>('2');
  readonly sortProperties = signal<boolean>(false);
  readonly validationError = signal<string | null>(null);

  readonly inputContent = signal<string>(
`.container {
  display: flex;
  margin: 0 auto;
  padding: 16px;
  background-color: #ffffff;
  z-index: 10;
  color: #1a202c;
  border-radius: 8px;
}
.header > h1 {
  font-size: 24px;
  line-height: 1.5;
  font-weight: bold;
}
@media (max-width: 768px) {
  .container {
    flex-direction: column;
    padding: 8px;
  }
}`
  );
  readonly outputContent = signal<string>('');

  constructor() {
    this.formatCss();
  }

  onInputChange(val: string): void {
    this.inputContent.set(val);
    this.validate(val);
  }

  toggleSortProperties(): void {
    this.sortProperties.update(v => !v);
    this.formatCss();
  }

  formatCss(): void {
    const raw = this.inputContent().trim();
    if (!raw) {
      this.outputContent.set('');
      this.validationError.set(null);
      return;
    }

    this.validate(raw);
    const indentStr = this.indent() === 'tab' ? '\t' : ' '.repeat(parseInt(this.indent(), 10));
    const formatted = this.beautifyCss(raw, indentStr, this.sortProperties());
    this.outputContent.set(formatted);
  }

  minifyCss(): void {
    const raw = this.inputContent().trim();
    if (!raw) return;

    this.validate(raw);
    const minified = this.stripAndMinify(raw);
    this.outputContent.set(minified);
    this.toast.info('CSS minified');
  }

  private validate(css: string): void {
    let openCount = 0;
    let inComment = false;
    let inString: string | null = null;

    for (let i = 0; i < css.length; i++) {
      const ch = css[i];
      const next = css[i + 1];

      if (inComment) {
        if (ch === '*' && next === '/') {
          inComment = false;
          i++;
        }
        continue;
      }

      if (inString) {
        if (ch === inString && css[i - 1] !== '\\') {
          inString = null;
        }
        continue;
      }

      if (ch === '/' && next === '*') {
        inComment = true;
        i++;
        continue;
      }

      if (ch === '"' || ch === "'") {
        inString = ch;
        continue;
      }

      if (ch === '{') {
        openCount++;
      } else if (ch === '}') {
        openCount--;
        if (openCount < 0) {
          this.validationError.set('Unexpected closing brace "}" without matching opening brace.');
          return;
        }
      }
    }

    if (inComment) {
      this.validationError.set('Unclosed comment block (/* ... */).');
      return;
    }

    if (openCount > 0) {
      this.validationError.set(`Unclosed brace detected (${openCount} unclosed block${openCount > 1 ? 's' : ''}).`);
      return;
    }

    this.validationError.set(null);
  }

  private beautifyCss(css: string, indent: string, alphabetize: boolean): string {
    // Preserve string literals and comments or clean excess spacing
    let cleaned = css
      .replace(/\r\n/g, '\n')
      .replace(/\/\*[\s\S]*?\*\//g, comment => `\n${comment.trim()}\n`) // preserve comments
      .replace(/\s+/g, ' ')
      .replace(/\s*{\s*/g, ' {\n')
      .replace(/;\s*/g, ';\n')
      .replace(/\s*}\s*/g, '\n}\n');

    const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let indentLevel = 0;
    const formattedLines: string[] = [];
    let currentRuleProperties: string[] = [];
    let insideRuleset = false;

    for (const line of lines) {
      if (line === '}') {
        if (insideRuleset && currentRuleProperties.length > 0) {
          if (alphabetize) {
            currentRuleProperties.sort((a, b) => a.localeCompare(b));
          }
          for (const prop of currentRuleProperties) {
            formattedLines.push(indent.repeat(indentLevel) + prop);
          }
          currentRuleProperties = [];
        }
        indentLevel = Math.max(0, indentLevel - 1);
        formattedLines.push(indent.repeat(indentLevel) + '}');
        insideRuleset = false;
        continue;
      }

      if (line.endsWith('{')) {
        formattedLines.push(indent.repeat(indentLevel) + line);
        indentLevel++;
        insideRuleset = true;
        currentRuleProperties = [];
        continue;
      }

      // Check if it's a property declaration (has ':' and ends with ';')
      if (insideRuleset && line.includes(':') && (line.endsWith(';') || line.endsWith('}'))) {
        const cleanProp = line.replace(/:\s*/, ': ').replace(/;$/, '') + ';';
        currentRuleProperties.push(cleanProp);
      } else {
        formattedLines.push(indent.repeat(indentLevel) + line);
      }
    }

    return formattedLines.join('\n').trim();
  }

  private stripAndMinify(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
      .replace(/\s+/g, ' ')             // collapse whitespace
      .replace(/\s*([\{\}:;,>+~])\s*/g, '$1') // remove space around delimiters
      .replace(/;}/g, '}')              // remove trailing semicolon
      .replace(/(?<=[:\s])0(?:px|em|rem|%|pt)\b/g, '0') // collapse zero units
      .trim();
  }

  loadSample(): void {
    const sample = `/* DevAssistant Workspace Stylesheet */
.card-terminal {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  border-radius: 0.5rem;
  display: flex;
  background-color: #0f172a;
  border: 1px solid #334155;
  color: #f8fafc;
  flex-direction: column;
}
.btn-primary {
  cursor: pointer;
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  border: 0px solid transparent;
  color: #ffffff;
  transition: all 0.2s ease-in-out;
}
@media (min-width: 1024px) {
  .card-terminal {
    max-width: 800px;
    margin: 2rem auto;
  }
}`;
    this.inputContent.set(sample);
    this.formatCss();
    this.toast.info('Loaded sample CSS');
  }

  clearAll(): void {
    this.inputContent.set('');
    this.outputContent.set('');
    this.validationError.set(null);
    this.toast.info('Cleared CSS workspace');
  }

  swapPanes(): void {
    const temp = this.inputContent();
    this.inputContent.set(this.outputContent());
    this.outputContent.set(temp);
    this.formatCss();
  }

  lineCount(text: string): number {
    return text ? text.split('\n').length : 0;
  }
}
