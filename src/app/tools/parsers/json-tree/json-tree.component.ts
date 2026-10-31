import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ActionToolbarComponent } from '../../../shared/components/action-toolbar.component';
import { SplitPaneComponent } from '../../../shared/components/split-pane.component';
import { ToastService } from '../../../core/services/toast.service';

export interface TreeNode {
  key: string;
  value: any;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  path: string;
  expanded?: boolean;
  children?: TreeNode[];
}

@Component({
  selector: 'app-json-tree',
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
            <span class="text-xs font-mono text-surface-400">Parsers & Evaluators</span>
            <span class="text-surface-300 dark:text-surface-700">/</span>
            <h1 class="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">
              JSON Parser & Tree Viewer
            </h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            Visualize JSON structures as an interactive collapsible hierarchy with type badges and path copying.
          </p>
        </div>

        <div class="flex items-center gap-2">
          @if (parseError()) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Parse Error
            </span>
          } @else if (tree()) {
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Structured Tree
            </span>
          }
        </div>
      </div>

      <!-- Action Toolbar with Expand/Collapse All -->
      <app-action-toolbar
        [primaryActionLabel]="'Parse Tree'"
        primaryActionIcon="folder-tree"
        [hasSample]="true"
        [hasClear]="true"
        [hasCopy]="false"
        [hasDownload]="false"
        (primaryAction)="parseTree()"
        (loadSample)="loadSample()"
        (clear)="clearAll()">
        
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            (click)="toggleAll(true)"
            class="px-2 py-1 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors border border-surface-200 dark:border-surface-700">
            Expand All
          </button>
          <button
            type="button"
            (click)="toggleAll(false)"
            class="px-2 py-1 rounded-md text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors border border-surface-200 dark:border-surface-700">
            Collapse All
          </button>
        </div>
      </app-action-toolbar>

      <!-- Parse Error Banner -->
      @if (parseError()) {
        <div class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-start gap-2.5">
          <lucide-icon name="circle-alert" class="w-4 h-4 shrink-0 mt-0.5"></lucide-icon>
          <div>
            <span class="font-semibold block">JSON Parse Error:</span>
            <p>{{ parseError() }}</p>
          </div>
        </div>
      }

      <!-- Split Pane (Left: Text, Right: Tree) -->
      <app-split-pane
        [title]="'Tree Explorer'"
        inputLabel="Raw JSON"
        outputLabel="Interactive Hierarchy"
        [inputMeta]="inputContent().length + ' chars'"
        [allowSwap]="false">
        
        <div input-content class="h-full flex flex-col">
          <textarea
            class="w-full h-full min-h-[380px] bg-transparent font-mono text-xs p-2 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none resize-none leading-relaxed"
            placeholder="Paste JSON document here..."
            [ngModel]="inputContent()"
            (ngModelChange)="onInputChange($event)"
            spellcheck="false"></textarea>
        </div>

        <!-- Tree View Container -->
        <div output-content class="h-full flex flex-col overflow-auto p-2">
          @if (tree()) {
            <div class="space-y-1 font-mono text-xs">
              <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: tree() }"></ng-container>
            </div>
          } @else {
            <div class="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 text-surface-400 font-mono">
              <lucide-icon name="folder-tree" class="w-7 h-7 opacity-25 mb-2"></lucide-icon>
              <p class="text-xs">Tree nodes will render here.</p>
            </div>
          }
        </div>
      </app-split-pane>

      <!-- Recursive Node Template -->
      <ng-template #nodeTemplate let-node>
        <div class="select-none py-0.5">
          <div 
            class="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-surface-100 dark:hover:bg-surface-850 cursor-pointer group transition-colors"
            (click)="toggleNode(node)">
            
            <!-- Expand / Collapse chevron -->
            @if (node.type === 'object' || node.type === 'array') {
              <lucide-icon 
                [name]="node.expanded ? 'chevron-down' : 'chevron-right'" 
                class="w-3.5 h-3.5 text-surface-400 shrink-0">
              </lucide-icon>
            } @else {
              <span class="w-3.5 h-3.5 inline-block shrink-0"></span>
            }

            <!-- Key Name -->
            <span class="font-semibold text-surface-900 dark:text-surface-100 truncate">
              {{ node.key }}
            </span>
            <span class="text-surface-400">:</span>

            <!-- Value / Type Badge -->
            @switch (node.type) {
              @case ('object') {
                <span class="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono">
                  {{"{" + (node.children?.length || 0) + "}"}}
                </span>
              }
              @case ('array') {
                <span class="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono">
                  {{"[" + (node.children?.length || 0) + "]"}}
                </span>
              }
              @case ('string') {
                <span class="text-emerald-600 dark:text-emerald-400 truncate">
                  "{{ node.value }}"
                </span>
              }
              @case ('number') {
                <span class="text-amber-600 dark:text-amber-400">
                  {{ node.value }}
                </span>
              }
              @case ('boolean') {
                <span class="text-sky-600 dark:text-sky-400 font-semibold">
                  {{ node.value }}
                </span>
              }
              @case ('null') {
                <span class="text-rose-500 font-semibold italic">
                  null
                </span>
              }
            }

            <!-- Path copy button on hover -->
            <button
              type="button"
              (click)="copyPath(node.path, $event)"
              title="Copy path ({{ node.path }})"
              class="ml-auto opacity-0 group-hover:opacity-100 p-0.5 rounded text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 transition-opacity">
              <lucide-icon name="copy" class="w-3 h-3"></lucide-icon>
            </button>
          </div>

          <!-- Children -->
          @if (node.expanded && node.children && node.children.length > 0) {
            <div class="pl-4 ml-2 border-l border-surface-200 dark:border-surface-800 space-y-0.5">
              @for (child of node.children; track child.path) {
                <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: child }"></ng-container>
              }
            </div>
          }
        </div>
      </ng-template>

    </div>
  `
})
export class JsonTreeComponent {
  private readonly toast = inject(ToastService);

  readonly inputContent = signal<string>(JSON.stringify({
    application: "DevAssistant",
    platform: "lab.mahfozmt.com",
    active: true,
    releaseYear: 2026,
    author: {
      name: "Mahfozur Rahman",
      role: "Lead Engineer",
      skills: [".NET", "Angular", "Web Workers", "IIS"]
    },
    metrics: {
      speedScore: 99.8,
      privacyRating: "A+"
    }
  }, null, 2));

  readonly tree = signal<TreeNode | null>(null);
  readonly parseError = signal<string | null>(null);

  constructor() {
    this.parseTree();
  }

  onInputChange(val: string): void {
    this.inputContent.set(val);
    this.parseTree();
  }

  parseTree(): void {
    const raw = this.inputContent().trim();
    if (!raw) {
      this.tree.set(null);
      this.parseError.set(null);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      this.parseError.set(null);
      const rootNode = this.buildNode('root', parsed, '$');
      rootNode.expanded = true;
      this.tree.set(rootNode);
    } catch (e: any) {
      this.parseError.set(e.message || 'Invalid JSON syntax');
      this.tree.set(null);
    }
  }

  private buildNode(key: string, val: any, path: string): TreeNode {
    if (val === null) {
      return { key, value: null, type: 'null', path, expanded: false };
    }
    if (Array.isArray(val)) {
      return {
        key,
        value: val,
        type: 'array',
        path,
        expanded: true,
        children: val.map((item, index) => this.buildNode(`[${index}]`, item, `${path}[${index}]`))
      };
    }
    if (typeof val === 'object') {
      return {
        key,
        value: val,
        type: 'object',
        path,
        expanded: true,
        children: Object.keys(val).map(childKey => this.buildNode(childKey, val[childKey], `${path}.${childKey}`))
      };
    }
    const type = typeof val as 'string' | 'number' | 'boolean';
    return { key, value: val, type, path, expanded: false };
  }

  toggleNode(node: TreeNode): void {
    if (node.type === 'object' || node.type === 'array') {
      node.expanded = !node.expanded;
    }
  }

  toggleAll(expanded: boolean): void {
    const root = this.tree();
    if (root) {
      this.setExpandedRecursively(root, expanded);
    }
  }

  private setExpandedRecursively(node: TreeNode, expanded: boolean): void {
    if (node.type === 'object' || node.type === 'array') {
      node.expanded = expanded;
      node.children?.forEach(child => this.setExpandedRecursively(child, expanded));
    }
  }

  async copyPath(path: string, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(path);
      this.toast.success(`Copied path: ${path}`);
    } catch {
      this.toast.error('Failed to copy path');
    }
  }

  loadSample(): void {
    this.parseTree();
    this.toast.info('Sample loaded and parsed');
  }

  clearAll(): void {
    this.inputContent.set('');
    this.tree.set(null);
    this.parseError.set(null);
    this.toast.info('Cleared');
  }
}
