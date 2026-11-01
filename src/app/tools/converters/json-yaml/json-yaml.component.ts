import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import * as yaml from 'js-yaml';
import { ActionToolbarComponent } from '../../../shared/components/action-toolbar.component';
import { SplitPaneComponent } from '../../../shared/components/split-pane.component';
import { ToastService } from '../../../core/services/toast.service';

type ConversionMode = 'json-to-yaml' | 'yaml-to-json';

@Component({
  selector: 'app-json-yaml',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    ActionToolbarComponent,
    SplitPaneComponent
  ],
  template: `
    <div class="flex-1 flex flex-col space-y-3.5 animate-in fade-in duration-100 max-w-6xl mx-auto w-full">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-800 gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-surface-400">Converters</span>
            <span class="text-surface-300 dark:text-surface-700">/</span>
            <h1 class="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">JSON ↔ YAML</h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Bidirectional conversion between JSON and YAML formats.</p>
        </div>
      </div>

      <!-- Toolbar -->
      <app-action-toolbar
        [primaryActionLabel]="'Convert'"
        primaryActionIcon="arrow-right-left"
        [hasSample]="false"
        [hasClear]="true"
        [hasCopy]="true"
        [hasDownload]="true"
        [copyContent]="outputContent()"
        [downloadContent]="outputContent()"
        [downloadFilename]="getDownloadFilename()"
        (primaryAction)="convert()"
        (clear)="clearAll()">
        
        <div class="flex items-center gap-1.5 flex-wrap">
          <!-- Mode Toggle -->
          <div class="flex items-center bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md p-0.5 text-[11px]">
            <button
              type="button"
              (click)="setMode('json-to-yaml')"
              class="px-2 py-0.5 rounded font-medium transition-colors"
              [ngClass]="mode() === 'json-to-yaml' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              JSON to YAML
            </button>
            <button
              type="button"
              (click)="setMode('yaml-to-json')"
              class="px-2 py-0.5 rounded font-medium transition-colors"
              [ngClass]="mode() === 'yaml-to-json' ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'">
              YAML to JSON
            </button>
          </div>

          <!-- Indent Size Selector -->
          <select 
            [ngModel]="indentSize()" 
            (ngModelChange)="indentSize.set($event); convert()"
            class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 text-[11px] rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500/50">
            <option [value]="2">2 Spaces</option>
            <option [value]="4">4 Spaces</option>
          </select>
          
          <button (click)="loadSample('docker')" class="px-2 py-1 text-xs text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 transition-colors">Docker</button>
          <button (click)="loadSample('k8s')" class="px-2 py-1 text-xs text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 transition-colors">K8s</button>
          <button (click)="loadSample('openapi')" class="px-2 py-1 text-xs text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 transition-colors">OpenAPI</button>
        </div>
      </app-action-toolbar>

      <!-- Error Banner -->
      @if (error()) {
        <div class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-start gap-2.5">
          <lucide-icon name="circle-alert" class="w-4 h-4 shrink-0 mt-0.5"></lucide-icon>
          <div>
            <span class="font-semibold block">Conversion Error:</span>
            <p>{{ error() }}</p>
          </div>
        </div>
      }

      <!-- Editor Split Pane -->
      <app-split-pane
        [title]="'Converter Workspace'"
        [inputLabel]="mode() === 'json-to-yaml' ? 'JSON Input' : 'YAML Input'"
        [outputLabel]="mode() === 'json-to-yaml' ? 'YAML Output' : 'JSON Output'"
        [inputMeta]="inputContent().length + ' chars'"
        [outputMeta]="outputContent().length + ' chars'"
        (swap)="swapPanes()">
        
        <div input-content class="h-full flex flex-col">
          <textarea
            class="w-full h-full min-h-[400px] bg-transparent font-mono text-xs p-2 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none leading-relaxed"
            placeholder="Paste input here..."
            [ngModel]="inputContent()"
            (ngModelChange)="onInputChange($event)"
            spellcheck="false"></textarea>
        </div>

        <div output-content class="h-full flex flex-col">
          @if (outputContent()) {
            <pre class="w-full h-full min-h-[400px] overflow-auto font-mono text-xs p-2 text-surface-900 dark:text-surface-100 select-all leading-relaxed">{{ outputContent() }}</pre>
          } @else {
            <div class="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-6 text-surface-400">
              <lucide-icon name="arrow-right-left" class="w-6 h-6 opacity-30 mb-2"></lucide-icon>
              <p class="text-xs">Output will appear here after conversion.</p>
            </div>
          }
        </div>
      </app-split-pane>
    </div>
  `
})
export class JsonYamlComponent {
  private readonly toast = inject(ToastService);

  readonly mode = signal<ConversionMode>('json-to-yaml');
  readonly inputContent = signal<string>('');
  readonly outputContent = signal<string>('');
  readonly indentSize = signal<number>(2);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadSample('docker');
  }

  setMode(newMode: ConversionMode): void {
    if (this.mode() !== newMode) {
      this.mode.set(newMode);
      const currentInput = this.inputContent();
      const currentOutput = this.outputContent();
      this.inputContent.set(currentOutput || '');
      this.outputContent.set(currentInput || '');
      this.convert();
    }
  }

  onInputChange(val: string): void {
    this.inputContent.set(val);
    this.convert();
  }

  convert(): void {
    const input = this.inputContent().trim();
    if (!input) {
      this.outputContent.set('');
      this.error.set(null);
      return;
    }

    try {
      if (this.mode() === 'json-to-yaml') {
        const obj = JSON.parse(input);
        const yml = yaml.dump(obj, { indent: Number(this.indentSize()) });
        this.outputContent.set(yml);
      } else {
        const obj = yaml.load(input);
        this.outputContent.set(JSON.stringify(obj, null, Number(this.indentSize())));
      }
      this.error.set(null);
    } catch (e: any) {
      this.error.set(e.message || 'Conversion failed');
      this.outputContent.set('');
    }
  }

  loadSample(type: 'docker' | 'k8s' | 'openapi'): void {
    let sample = '';
    if (type === 'docker') {
      sample = `version: '3.8'
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"`;
    } else if (type === 'k8s') {
      sample = `apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - name: nginx
    image: nginx:1.14.2
    ports:
    - containerPort: 80`;
    } else if (type === 'openapi') {
      sample = `openapi: 3.0.0
info:
  title: Sample API
  version: 0.1.9
paths: {}`;
    }
    
    if (this.mode() === 'yaml-to-json') {
      this.inputContent.set(sample);
    } else {
      this.inputContent.set(JSON.stringify(yaml.load(sample), null, 2));
    }
    
    this.convert();
    this.toast.info(`Loaded ${type} sample`);
  }

  clearAll(): void {
    this.inputContent.set('');
    this.outputContent.set('');
    this.error.set(null);
    this.toast.info('Cleared');
  }

  swapPanes(): void {
    const temp = this.inputContent();
    this.inputContent.set(this.outputContent());
    this.outputContent.set(temp);
    this.mode.update(m => m === 'json-to-yaml' ? 'yaml-to-json' : 'json-to-yaml');
    this.convert();
  }

  getDownloadFilename(): string {
    return this.mode() === 'json-to-yaml' ? 'converted.yaml' : 'converted.json';
  }
}
