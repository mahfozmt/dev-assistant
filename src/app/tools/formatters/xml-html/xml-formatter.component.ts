import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ActionToolbarComponent } from '../../../shared/components/action-toolbar.component';
import { SplitPaneComponent } from '../../../shared/components/split-pane.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-xml-formatter',
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
              XML / HTML Formatter
            </h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            Indent, format, validate tag matching, and minify XML, HTML, and SVG markup.
          </p>
        </div>

        <div class="flex items-center gap-2">
          @if (validationError()) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              XML Parse Warning
            </span>
          } @else if (inputContent().trim()) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Well-Formed
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
        downloadFilename="document.xml"
        (primaryAction)="formatXml()"
        (loadSample)="loadSample()"
        (clear)="clearAll()">
        
        <div class="flex items-center gap-2 flex-wrap">
          <div class="flex items-center bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md p-0.5 text-[11px]">
            <button
              type="button"
              (click)="indent.set('2'); formatXml()"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="indent() === '2' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              2 sp
            </button>
            <button
              type="button"
              (click)="indent.set('4'); formatXml()"
              class="px-2 py-0.5 rounded font-mono transition-colors"
              [ngClass]="indent() === '4' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              4 sp
            </button>
          </div>

          <button
            type="button"
            (click)="minifyXml()"
            class="px-2.5 py-1 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors border border-surface-200 dark:border-surface-700">
            Minify
          </button>
        </div>
      </app-action-toolbar>

      @if (validationError()) {
        <div class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-start gap-2.5">
          <lucide-icon name="circle-alert" class="w-4 h-4 shrink-0 mt-0.5"></lucide-icon>
          <div>
            <span class="font-semibold block">Parser Notice:</span>
            <p>{{ validationError() }}</p>
          </div>
        </div>
      }

      <!-- Split Pane -->
      <app-split-pane
        [title]="'XML / HTML Workspace'"
        inputLabel="Source Markup"
        outputLabel="Formatted Output"
        [inputMeta]="inputContent().length + ' chars • ' + lineCount(inputContent()) + ' lines'"
        [outputMeta]="outputContent().length + ' chars • ' + lineCount(outputContent()) + ' lines'"
        (swap)="swapPanes()">
        
        <div input-content class="h-full flex flex-col">
          <textarea
            class="w-full h-full min-h-[380px] bg-transparent font-mono text-xs p-2 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none leading-relaxed"
            placeholder="Paste XML or HTML markup here..."
            [ngModel]="inputContent()"
            (ngModelChange)="onInputChange($event)"
            spellcheck="false"></textarea>
        </div>

        <div output-content class="h-full flex flex-col">
          @if (outputContent()) {
            <pre class="w-full h-full min-h-[380px] overflow-auto font-mono text-xs p-2 text-surface-900 dark:text-surface-100 select-all leading-relaxed">{{ outputContent() }}</pre>
          } @else {
            <div class="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 text-surface-400 font-mono">
              <lucide-icon name="code-xml" class="w-7 h-7 opacity-25 mb-2"></lucide-icon>
              <p class="text-xs">Formatted XML/HTML markup will render here.</p>
            </div>
          }
        </div>
      </app-split-pane>

    </div>
  `
})
export class XmlFormatterComponent {
  private readonly toast = inject(ToastService);

  readonly indent = signal<'2' | '4'>('2');
  readonly validationError = signal<string | null>(null);

  readonly inputContent = signal<string>(
    `<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><soap:Header><AuthHeader><Token>token_xyz789</Token></AuthHeader></soap:Header><soap:Body><GetDeveloperDetails><DeveloperId>42</DeveloperId><Environment>lab.mahfozmt.com</Environment><Tools><Tool>JSON</Tool><Tool>SQL</Tool><Tool>XML</Tool></Tools></GetDeveloperDetails></soap:Body></soap:Envelope>`
  );
  readonly outputContent = signal<string>('');

  constructor() {
    this.formatXml();
  }

  onInputChange(val: string): void {
    this.inputContent.set(val);
  }

  formatXml(): void {
    const raw = this.inputContent().trim();
    if (!raw) {
      this.outputContent.set('');
      this.validationError.set(null);
      return;
    }

    try {
      const step = parseInt(this.indent(), 10);
      const formatted = this.prettyPrintXml(raw, step);
      this.outputContent.set(formatted);
      this.validate(raw);
    } catch (e: any) {
      this.toast.error('Formatting error');
    }
  }

  minifyXml(): void {
    const raw = this.inputContent().trim();
    if (!raw) return;

    const minified = raw
      .replace(/>\s+</g, '><')
      .replace(/\s{2,}/g, ' ')
      .trim();

    this.outputContent.set(minified);
    this.toast.info('XML minified');
  }

  private prettyPrintXml(xml: string, step: number): string {
    const PADDING = ' '.repeat(step);
    const reg = /(>)(<)(\/*)/g;
    let formatted = '';
    let pad = 0;

    xml = xml.replace(reg, '$1\r\n$2$3');
    const lines = xml.split('\r\n');

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue;

      let indent = 0;
      if (line.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (line.match(/^<\/\w/)) {
        if (pad !== 0) {
          pad -= 1;
        }
      } else if (line.match(/^<\w[^>]*[^\/]>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }

      formatted += PADDING.repeat(pad) + line + '\n';
      pad += indent;
    }

    return formatted.trim();
  }

  private validate(xml: string): void {
    if (typeof window !== 'undefined' && window.DOMParser) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'application/xml');
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        this.validationError.set(parseError.textContent?.substring(0, 200) || 'XML syntax warning');
      } else {
        this.validationError.set(null);
      }
    }
  }

  loadSample(): void {
    const sample = `<?xml version="1.0" encoding="utf-8"?><configuration><system.webServer><rewrite><rules><rule name="Angular SPA Rewrite" stopProcessing="true"><match url=".*" /><conditions logicalGrouping="MatchAll"><add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /><add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" /></conditions><action type="Rewrite" url="/" /></rule></rules></rewrite></system.webServer></configuration>`;
    this.inputContent.set(sample);
    this.formatXml();
    this.toast.info('Sample XML document loaded');
  }

  clearAll(): void {
    this.inputContent.set('');
    this.outputContent.set('');
    this.validationError.set(null);
    this.toast.info('Cleared');
  }

  swapPanes(): void {
    const temp = this.inputContent();
    this.inputContent.set(this.outputContent());
    this.outputContent.set(temp);
    this.formatXml();
  }

  lineCount(text: string): number {
    return text ? text.split('\n').length : 0;
  }
}
