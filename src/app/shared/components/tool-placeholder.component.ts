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
      <div class="flex-1 flex flex-col space-y-4 animate-in fade-in duration-200">
        
        <!-- Header & Breadcrumbs / Actions -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-800 gap-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                <lucide-icon [name]="tool.icon" class="w-4 h-4"></lucide-icon>
              </div>
              <h1 class="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100">
                {{ tool.name }}
              </h1>
              <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500">
                {{ tool.categoryName }}
              </span>
            </div>
            <p class="text-xs sm:text-sm text-surface-500 dark:text-surface-400">
              {{ tool.description }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 text-xs font-medium text-surface-700 dark:text-surface-300 flex items-center gap-1.5 transition-colors"
              (click)="registry.toggleFavorite(tool.id)">
              <lucide-icon name="star" class="w-3.5 h-3.5" [class.fill-amber-500]="registry.isFavorite(tool.id)" [class.text-amber-500]="registry.isFavorite(tool.id)"></lucide-icon>
              <span>{{ registry.isFavorite(tool.id) ? 'Favorited' : 'Favorite' }}</span>
            </button>
          </div>
        </div>

        <!-- Shared Action Toolbar -->
        <app-action-toolbar
          [primaryActionLabel]="'Process / Run'"
          primaryActionIcon="sparkles"
          [hasSample]="true"
          [hasClear]="true"
          [hasCopy]="true"
          [hasDownload]="true"
          [copyContent]="outputContent()"
          [downloadContent]="outputContent()"
          [downloadFilename]="tool.id + '-output.txt'"
          (primaryAction)="onProcess()"
          (loadSample)="onLoadSample()"
          (clear)="onClear()">
          <!-- Tool specific badges or options slot -->
          <div class="flex items-center gap-1.5 text-xs text-surface-500 pl-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="font-mono text-[11px]">Client Worker Ready</span>
          </div>
        </app-action-toolbar>

        <!-- Split Pane Layout -->
        <app-split-pane
          [title]="tool.name"
          [subtitle]="'Interactive Shell'"
          inputLabel="Raw Input Payload"
          outputLabel="Transformed Result"
          [inputMeta]="inputContent().length + ' chars'"
          [outputMeta]="outputContent().length + ' chars'"
          (swap)="onSwap()">
          
          <!-- Input Pane -->
          <div input-content class="h-full flex flex-col">
            <textarea
              class="w-full h-full min-h-[300px] bg-transparent font-mono text-xs sm:text-sm p-2 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none"
              placeholder="Paste or enter input here..."
              [ngModel]="inputContent()"
              (ngModelChange)="inputContent.set($event)"></textarea>
          </div>

          <!-- Output Pane -->
          <div output-content class="h-full flex flex-col">
            @if (outputContent()) {
              <pre class="w-full h-full min-h-[300px] overflow-auto font-mono text-xs sm:text-sm p-2 text-surface-900 dark:text-surface-100 select-all">{{ outputContent() }}</pre>
            } @else {
              <div class="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-surface-400">
                <lucide-icon [name]="tool.icon" class="w-8 h-8 opacity-40 mb-2"></lucide-icon>
                <p class="text-xs">Enter input and click <span class="font-semibold text-brand-500">Process</span> or <span class="font-semibold text-brand-500">Sample</span> to view results.</p>
              </div>
            }
          </div>
        </app-split-pane>

        <!-- Tags & Info footer -->
        <div class="flex items-center justify-between text-xs text-surface-400 pt-1">
          <div class="flex items-center gap-1.5 flex-wrap">
            @for (tag of tool.tags; track tag) {
              <span class="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-[11px]">
                #{{ tag }}
              </span>
            }
          </div>
          <span class="font-mono text-[11px] text-surface-500">DevAssistant • Client-Side</span>
        </div>

      </div>
    } @else {
      <div class="py-16 text-center space-y-3">
        <h2 class="text-xl font-bold">Tool Not Found</h2>
        <p class="text-sm text-surface-500">The requested tool route could not be found.</p>
        <a routerLink="/" class="inline-flex px-4 py-2 rounded-lg bg-brand-500 text-white text-xs font-semibold">
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

  readonly inputContent = signal<string>('{\n  "name": "DevAssistant",\n  "status": "ready",\n  "phase": 1,\n  "offline": true\n}');
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
    // Echo formatted placeholder demonstration
    this.outputContent.set(this.inputContent());
    this.toast.success('Payload processed');
  }

  onLoadSample(): void {
    this.inputContent.set('{\n  "service": "DevAssistant",\n  "environment": "lab.mahfozmt.com",\n  "version": "1.0.0",\n  "capabilities": ["formatters", "parsers", "diff", "converters", "crypto", "dotnet"]\n}');
    this.outputContent.set('');
    this.toast.info('Sample data loaded');
  }

  onClear(): void {
    this.inputContent.set('');
    this.outputContent.set('');
    this.toast.info('Workspace cleared');
  }

  onSwap(): void {
    const temp = this.inputContent();
    this.inputContent.set(this.outputContent());
    this.outputContent.set(temp);
    this.toast.info('Input and output panes swapped');
  }
}
