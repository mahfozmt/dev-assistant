import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { ToolDefinition } from '../../core/models/tool.model';
import { ActionToolbarComponent } from './action-toolbar.component';
import { SplitPaneComponent } from './split-pane.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-tool-placeholder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideAngularModule,
    ActionToolbarComponent,
    SplitPaneComponent
  ],
  template: `
    @if (tool) {
      <div class="flex-1 flex flex-col space-y-3.5 animate-in fade-in duration-100 max-w-6xl mx-auto w-full">
        
        <!-- Header & Breadcrumbs / Actions -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-800 gap-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono text-surface-400">{{ tool.categoryName }}</span>
              <span class="text-surface-300 dark:text-surface-700">/</span>
              <h1 class="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">
                {{ tool.name }}
              </h1>
            </div>
            <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              {{ tool.description }}
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Client Worker
            </span>

            <button
              type="button"
              class="px-2.5 py-1 rounded-md border border-surface-200 dark:border-surface-800 hover:bg-surface-100 dark:hover:bg-surface-850 text-xs text-surface-600 dark:text-surface-300 flex items-center gap-1.5 transition-colors"
              (click)="registry.toggleFavorite(tool.id)">
              <lucide-icon name="star" class="w-3.5 h-3.5" [class.fill-amber-500]="registry.isFavorite(tool.id)" [class.text-amber-500]="registry.isFavorite(tool.id)"></lucide-icon>
              <span>{{ registry.isFavorite(tool.id) ? 'Pinned' : 'Pin' }}</span>
            </button>
          </div>
        </div>

        <!-- Shared Action Toolbar -->
        <app-action-toolbar
          [primaryActionLabel]="'Transform'"
          primaryActionIcon="sparkles"
          [hasSample]="true"
          [hasClear]="true"
          [hasCopy]="true"
          [hasDownload]="true"
          [copyContent]="outputContent()"
          [downloadContent]="outputContent()"
          [downloadFilename]="tool.id + '-result.txt'"
          (primaryAction)="onProcess()"
          (loadSample)="onLoadSample()"
          (clear)="onClear()">
          
          <div class="flex items-center gap-2 text-xs text-surface-500 pl-2 font-mono text-[11px]">
            <span>Mode: Standard</span>
          </div>
        </app-action-toolbar>

        <!-- Split Pane Layout -->
        <app-split-pane
          [title]="tool.name"
          [subtitle]="'Editor'"
          inputLabel="Source Input"
          outputLabel="Formatted Output"
          [inputMeta]="inputContent().length + ' chars'"
          [outputMeta]="outputContent().length + ' chars'"
          (swap)="onSwap()">
          
          <!-- Input Pane -->
          <div input-content class="h-full flex flex-col">
            <textarea
              class="w-full h-full min-h-[340px] bg-transparent font-mono text-xs p-2 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none leading-relaxed"
              placeholder="Paste or type content here..."
              [ngModel]="inputContent()"
              (ngModelChange)="inputContent.set($event)"
              spellcheck="false"></textarea>
          </div>

          <!-- Output Pane -->
          <div output-content class="h-full flex flex-col">
            @if (outputContent()) {
              <pre class="w-full h-full min-h-[340px] overflow-auto font-mono text-xs p-2 text-surface-900 dark:text-surface-100 select-all leading-relaxed">{{ outputContent() }}</pre>
            } @else {
              <div class="h-full min-h-[340px] flex flex-col items-center justify-center text-center p-6 text-surface-400">
                <lucide-icon [name]="tool.icon" class="w-6 h-6 opacity-30 mb-2"></lucide-icon>
                <p class="text-xs">Output will appear here after clicking <span class="text-surface-900 dark:text-surface-200 font-medium">Transform</span> or <span class="text-surface-900 dark:text-surface-200 font-medium">Sample</span>.</p>
              </div>
            }
          </div>
        </app-split-pane>

        <!-- Tags & Info footer -->
        <div class="flex items-center justify-between text-xs text-surface-400 pt-1 font-mono text-[11px]">
          <div class="flex items-center gap-1.5 flex-wrap">
            @for (tag of tool.tags; track tag) {
              <span class="px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-850 text-surface-500 text-[10px]">
                #{{ tag }}
              </span>
            }
          </div>
          <span>DevAssistant • lab.mahfozmt.com</span>
        </div>

      </div>
    } @else {
      <div class="py-16 text-center space-y-3 font-mono">
        <h2 class="text-base font-bold">Tool Not Found</h2>
        <p class="text-xs text-surface-500">The requested tool path is not registered.</p>
        <a routerLink="/" class="inline-flex px-3 py-1.5 rounded-md bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 text-xs font-semibold">
          Return to Dashboard
        </a>
      </div>
    }
  `
})
export class ToolPlaceholderComponent {
  private readonly router = inject(Router);
  readonly registry = inject(ToolRegistryService);
  private readonly toast = inject(ToastService);

  readonly inputContent = signal<string>('{\n  "service": "DevAssistant",\n  "status": "active",\n  "offline": true\n}');
  readonly outputContent = signal<string>('');

  get tool(): ToolDefinition | undefined {
    const cleanUrl = this.router.url.split('?')[0].split('#')[0];
    return this.registry.getToolByRoute(cleanUrl);
  }

  onProcess(): void {
    if (!this.inputContent().trim()) {
      this.toast.warning('Input payload is empty');
      return;
    }
    this.outputContent.set(this.inputContent());
    this.toast.success('Processed payload locally');
  }

  onLoadSample(): void {
    this.inputContent.set('{\n  "name": "DevAssistant",\n  "environment": "lab.mahfozmt.com",\n  "features": ["json-formatter", "sql-formatter", "bcrypt", "jwt-debugger"]\n}');
    this.outputContent.set('');
    this.toast.info('Sample payload loaded');
  }

  onClear(): void {
    this.inputContent.set('');
    this.outputContent.set('');
    this.toast.info('Cleared');
  }

  onSwap(): void {
    const temp = this.inputContent();
    this.inputContent.set(this.outputContent());
    this.outputContent.set(temp);
    this.toast.info('Swapped panes');
  }
}
