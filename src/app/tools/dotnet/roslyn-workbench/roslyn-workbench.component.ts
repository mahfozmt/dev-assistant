import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  ApiService,
  ConnectionStringInspectApiResponse,
  FormatTimezoneApiResponse,
  JsonToCSharpApiResponse,
  RoslynInspectApiResponse,
  TSqlAnalyzeApiResponse
} from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ToolRegistryService } from '../../../core/services/tool-registry.service';

export type WorkbenchTab = 'roslyn' | 'tsql' | 'connstr' | 'json2cs' | 'format-tz';

@Component({
  selector: 'app-roslyn-workbench',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <!-- Header with Runs on Server badge & Share button -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-surface-200 dark:border-surface-800">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200 dark:border-brand-800/50 shrink-0">
            <lucide-icon name="cpu" class="w-5 h-5"></lucide-icon>
          </div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-xl font-bold tracking-tight text-surface-900 dark:text-white">
                .NET 10 & Roslyn Server Workbench
              </h1>
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                title="Requests are processed statelessly by api.mahfozmt.com (.NET 10). Nothing is stored unless you click Share.">
                <span class="w-1.5 h-1.5 rounded-full" [ngClass]="api.isAvailable() === false ? 'bg-red-500' : 'bg-emerald-500'"></span>
                Runs on server (api.mahfozmt.com)
              </span>
            </div>
            <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">
              Real .NET 10 compiler & parser engines: Roslyn C#/IL/AST decompiler, ScriptDom T-SQL parser, SqlClient/Npgsql connection auditor, System.Text.Json generator, and TimeZoneInfo tester.
            </p>
          </div>
        </div>

        <!-- Share Link Controls -->
        <div class="flex flex-wrap items-center gap-2">
          <select
            [ngModel]="shareDays()"
            (ngModelChange)="shareDays.set(+$event)"
            aria-label="Share link expiration"
            class="px-2.5 py-1.5 text-xs rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-300">
            <option [value]="7">Expires in 7 days</option>
            <option [value]="30">Expires in 30 days</option>
          </select>

          <button
            type="button"
            (click)="createShareLink()"
            [disabled]="isSharing()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
            <lucide-icon name="share-2" class="w-3.5 h-3.5"></lucide-icon>
            <span>{{ isSharing() ? 'Creating link...' : 'Share Snippet' }}</span>
          </button>
        </div>
      </div>

      <!-- Friendly Offline Banner when API is unavailable -->
      @if (apiError()) {
        <div class="p-4 rounded-xl border border-amber-300 dark:border-amber-800/70 bg-amber-50/90 dark:bg-amber-950/30 flex items-start justify-between gap-3">
          <div class="flex items-start gap-2.5">
            <lucide-icon name="triangle-alert" class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"></lucide-icon>
            <div class="text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <p class="font-semibold">Server tool notice</p>
              <p>{{ apiError() }}</p>
            </div>
          </div>
          <button
            type="button"
            (click)="retryHealth()"
            class="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-500 shrink-0">
            Retry Connection
          </button>
        </div>
      }

      <!-- Share Link Created Banner -->
      @if (sharedUrl()) {
        <div class="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800/70 bg-emerald-50/90 dark:bg-emerald-950/30 flex flex-wrap items-center justify-between gap-3">
          <div class="text-xs text-emerald-900 dark:text-emerald-200 font-mono truncate">
            Share URL: <span class="font-bold">{{ sharedUrl() }}</span>
          </div>
          <button
            type="button"
            (click)="copyText(sharedUrl()!, 'Share link')"
            class="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500">
            Copy Link
          </button>
        </div>
      }

      <!-- Sub-tool Navigation Tabs -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          (click)="activeTab.set('roslyn')"
          class="px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
          [ngClass]="activeTab() === 'roslyn' ? 'bg-brand-600 text-white shadow-xs' : 'bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-800'">
          1. Roslyn C# / IL / AST
        </button>
        <button
          type="button"
          (click)="activeTab.set('tsql')"
          class="px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
          [ngClass]="activeTab() === 'tsql' ? 'bg-brand-600 text-white shadow-xs' : 'bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-800'">
          2. T-SQL ScriptDom Parser
        </button>
        <button
          type="button"
          (click)="activeTab.set('connstr')"
          class="px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
          [ngClass]="activeTab() === 'connstr' ? 'bg-brand-600 text-white shadow-xs' : 'bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-800'">
          3. Connection String Inspector
        </button>
        <button
          type="button"
          (click)="activeTab.set('json2cs')"
          class="px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
          [ngClass]="activeTab() === 'json2cs' ? 'bg-brand-600 text-white shadow-xs' : 'bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-800'">
          4. JSON to C# (System.Text.Json)
        </button>
        <button
          type="button"
          (click)="activeTab.set('format-tz')"
          class="px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
          [ngClass]="activeTab() === 'format-tz' ? 'bg-brand-600 text-white shadow-xs' : 'bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-800'">
          5. .NET Format & TimeZoneInfo
        </button>
      </div>

      <!-- TAB 1: ROSLYN WORKBENCH -->
      @if (activeTab() === 'roslyn') {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden flex flex-col">
            <div class="px-4 py-2.5 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between bg-surface-50/50 dark:bg-surface-800/40">
              <span class="text-xs font-semibold uppercase tracking-wider text-surface-500">C# Source (Max 20 KB • Compile-Only)</span>
              <div class="flex items-center gap-2">
                <select
                  [ngModel]="roslynOptLevel()"
                  (ngModelChange)="roslynOptLevel.set($event)"
                  aria-label="Optimization level"
                  class="px-2 py-1 text-xs rounded border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
                  <option value="Release">Release</option>
                  <option value="Debug">Debug</option>
                </select>
                <button
                  type="button"
                  (click)="runRoslynInspect()"
                  [disabled]="isLoading()"
                  class="px-3 py-1 text-xs font-medium rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-colors">
                  {{ isLoading() ? 'Compiling...' : 'Compile & Decompile' }}
                </button>
              </div>
            </div>
            <textarea
              [ngModel]="roslynCode()"
              (ngModelChange)="roslynCode.set($event)"
              rows="16"
              spellcheck="false"
              class="w-full flex-1 p-4 font-mono text-xs bg-transparent text-surface-900 dark:text-surface-100 focus:outline-none resize-y"></textarea>
          </div>

          <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden flex flex-col">
            <div class="px-4 py-2 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between bg-surface-50/50 dark:bg-surface-800/40">
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  (click)="roslynOutputView.set('lowered')"
                  class="px-2.5 py-1 text-xs rounded-md font-medium"
                  [ngClass]="roslynOutputView() === 'lowered' ? 'bg-brand-600 text-white' : 'text-surface-600 dark:text-surface-400'">
                  Lowered C#
                </button>
                <button
                  type="button"
                  (click)="roslynOutputView.set('il')"
                  class="px-2.5 py-1 text-xs rounded-md font-medium"
                  [ngClass]="roslynOutputView() === 'il' ? 'bg-brand-600 text-white' : 'text-surface-600 dark:text-surface-400'">
                  IL Disassembly
                </button>
                <button
                  type="button"
                  (click)="roslynOutputView.set('diagnostics')"
                  class="px-2.5 py-1 text-xs rounded-md font-medium"
                  [ngClass]="roslynOutputView() === 'diagnostics' ? 'bg-brand-600 text-white' : 'text-surface-600 dark:text-surface-400'">
                  Diagnostics ({{ roslynResult()?.diagnostics?.length || 0 }})
                </button>
              </div>
              @if (roslynResult()) {
                <span class="text-[11px] font-mono text-surface-400">{{ roslynResult()!.elapsedMs }} ms</span>
              }
            </div>

            <div class="p-4 flex-1 overflow-auto max-h-[420px]">
              @if (roslynOutputView() === 'lowered') {
                <pre class="font-mono text-xs text-surface-800 dark:text-surface-200 whitespace-pre-wrap">{{ roslynResult()?.loweredCSharp || '// Click "Compile & Decompile" to inspect lowered C# code.' }}</pre>
              } @else if (roslynOutputView() === 'il') {
                <pre class="font-mono text-xs text-surface-800 dark:text-surface-200 whitespace-pre-wrap">{{ roslynResult()?.ilCode || '// Click "Compile & Decompile" to inspect MSIL instructions.' }}</pre>
              } @else {
                @if ((roslynResult()?.diagnostics?.length || 0) === 0) {
                  <p class="text-xs text-emerald-600 dark:text-emerald-400 font-mono">Zero compiler errors or warnings.</p>
                } @else {
                  <div class="space-y-2">
                    @for (d of roslynResult()!.diagnostics; track $index) {
                      <div class="p-2.5 rounded-lg border border-surface-200 dark:border-surface-800 text-xs font-mono">
                        <span class="font-bold" [ngClass]="d.severity === 'Error' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'">
                          {{ d.id }} ({{ d.severity }}) L{{ d.line }}:{{ d.column }}
                        </span>
                        <p class="mt-1 text-surface-700 dark:text-surface-300">{{ d.message }}</p>
                      </div>
                    }
                  </div>
                }
              }
            </div>
          </div>
        </div>
      }

      <!-- TAB 2: T-SQL SCRIPTDOM PARSER & FORMATTER -->
      @if (activeTab() === 'tsql') {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden flex flex-col">
            <div class="px-4 py-2.5 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between bg-surface-50/50 dark:bg-surface-800/40">
              <span class="text-xs font-semibold uppercase tracking-wider text-surface-500">T-SQL Input (SQL Server ScriptDom)</span>
              <button
                type="button"
                (click)="runTSqlAnalyze()"
                [disabled]="isLoading()"
                class="px-3 py-1 text-xs font-medium rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-colors">
                {{ isLoading() ? 'Parsing...' : 'Parse & Format T-SQL' }}
              </button>
            </div>
            <textarea
              [ngModel]="tsqlInput()"
              (ngModelChange)="tsqlInput.set($event)"
              rows="14"
              spellcheck="false"
              class="w-full flex-1 p-4 font-mono text-xs bg-transparent text-surface-900 dark:text-surface-100 focus:outline-none resize-y"></textarea>
          </div>

          <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden flex flex-col">
            <div class="px-4 py-2.5 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between bg-surface-50/50 dark:bg-surface-800/40">
              <span class="text-xs font-semibold uppercase tracking-wider text-surface-500">Formatted T-SQL & Referenced Tables</span>
              @if (tsqlResult()) {
                <span class="text-xs font-mono" [ngClass]="tsqlResult()!.isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
                  {{ tsqlResult()!.isValid ? 'Valid T-SQL' : tsqlResult()!.errors.length + ' Syntax Error(s)' }}
                </span>
              }
            </div>
            <div class="p-4 space-y-4 overflow-auto max-h-[420px]">
              @if (tsqlResult()?.errors?.length) {
                <div class="space-y-1.5">
                  @for (err of tsqlResult()!.errors; track $index) {
                    <div class="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs font-mono text-red-700 dark:text-red-300">
                      Line {{ err.line }}, Col {{ err.column }} (Error {{ err.number }}): {{ err.message }}
                    </div>
                  }
                </div>
              }
              <pre class="font-mono text-xs text-surface-800 dark:text-surface-200 whitespace-pre-wrap">{{ tsqlResult()?.formattedSql || '// Click "Parse & Format T-SQL" to run Microsoft.SqlServer.TransactSql.ScriptDom.' }}</pre>

              @if (tsqlResult()?.referencedTables?.length) {
                <div class="pt-3 border-t border-surface-200 dark:border-surface-800">
                  <div class="text-xs font-semibold text-surface-500 mb-2">Referenced Tables ({{ tsqlResult()!.referencedTables.length }})</div>
                  <div class="flex flex-wrap gap-2">
                    @for (t of tsqlResult()!.referencedTables; track $index) {
                      <span class="px-2.5 py-1 rounded-md bg-surface-100 dark:bg-surface-800 text-xs font-mono text-surface-700 dark:text-surface-300">
                        {{ t.schema }}.{{ t.table }}{{ t.alias ? ' AS ' + t.alias : '' }} (L{{ t.startLine }})
                      </span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- TAB 3: CONNECTION STRING INSPECTOR -->
      @if (activeTab() === 'connstr') {
        <div class="space-y-4">
          <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs font-semibold uppercase tracking-wider text-surface-500">
                SQL Server / PostgreSQL Connection String (Parsed In-Memory • Zero Network Connections)
              </span>
              <button
                type="button"
                (click)="runConnStringInspect()"
                [disabled]="isLoading()"
                class="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-colors">
                {{ isLoading() ? 'Inspecting...' : 'Inspect & Audit' }}
              </button>
            </div>
            <input
              type="text"
              [ngModel]="connStringInput()"
              (ngModelChange)="connStringInput.set($event)"
              class="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 font-mono text-xs text-surface-900 dark:text-surface-100" />
          </div>

          @if (connStringResult(); as cs) {
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold uppercase tracking-wider text-surface-500">Parsed Settings ({{ cs.detectedProvider }})</span>
                  <span class="text-xs font-mono text-surface-400">{{ cs.settings.length }} keys</span>
                </div>
                <div class="divide-y divide-surface-100 dark:divide-surface-800">
                  @for (s of cs.settings; track s.key) {
                    <div class="py-2 flex items-start justify-between gap-4 text-xs">
                      <div>
                        <span class="font-mono font-semibold text-surface-900 dark:text-surface-100">{{ s.key }}</span>
                        <p class="text-[11px] text-surface-500">{{ s.description }}</p>
                      </div>
                      <span class="font-mono px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200 shrink-0">
                        {{ s.value }}
                      </span>
                    </div>
                  }
                </div>
              </div>

              <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 space-y-3">
                <span class="text-xs font-semibold uppercase tracking-wider text-surface-500">Security & Best-Practice Audit ({{ cs.warnings.length }})</span>
                @for (w of cs.warnings; track $index) {
                  <div class="p-3 rounded-lg border text-xs space-y-1"
                    [ngClass]="w.severity === 'error'
                      ? 'border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/30'
                      : w.severity === 'warning'
                        ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/30'
                        : 'border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/30'">
                    <div class="font-mono font-semibold">{{ w.key }} ({{ w.severity | uppercase }})</div>
                    <p class="text-surface-700 dark:text-surface-300">{{ w.message }}</p>
                    <p class="text-[11px] text-surface-500">Recommendation: {{ w.recommendation }}</p>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- TAB 4: JSON TO C# -->
      @if (activeTab() === 'json2cs') {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden flex flex-col">
            <div class="px-4 py-2.5 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between bg-surface-50/50 dark:bg-surface-800/40">
              <span class="text-xs font-semibold uppercase tracking-wider text-surface-500">JSON Payload</span>
              <button
                type="button"
                (click)="runJsonToCSharp()"
                [disabled]="isLoading()"
                class="px-3 py-1 text-xs font-medium rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-colors">
                {{ isLoading() ? 'Generating...' : 'Generate C# Models' }}
              </button>
            </div>
            <textarea
              [ngModel]="jsonToCsInput()"
              (ngModelChange)="jsonToCsInput.set($event)"
              rows="14"
              spellcheck="false"
              class="w-full flex-1 p-4 font-mono text-xs bg-transparent text-surface-900 dark:text-surface-100 focus:outline-none resize-y"></textarea>
          </div>

          <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden flex flex-col">
            <div class="px-4 py-2.5 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between bg-surface-50/50 dark:bg-surface-800/40">
              <span class="text-xs font-semibold uppercase tracking-wider text-surface-500">C# Output (System.Text.Json)</span>
              @if (jsonToCsResult()?.code) {
                <button
                  type="button"
                  (click)="copyText(jsonToCsResult()!.code, 'C# models')"
                  class="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                  Copy C#
                </button>
              }
            </div>
            <pre class="p-4 font-mono text-xs text-surface-800 dark:text-surface-200 whitespace-pre-wrap overflow-auto max-h-[420px]">{{ jsonToCsResult()?.code || '// Click "Generate C# Models" to create records with [JsonPropertyName] attributes.' }}</pre>
          </div>
        </div>
      }

      <!-- TAB 5: .NET FORMAT & TIMEZONE TESTER -->
      @if (activeTab() === 'format-tz') {
        <div class="space-y-4">
          <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label class="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">Sample Value</label>
              <input
                type="text"
                [ngModel]="formatRawValue()"
                (ngModelChange)="formatRawValue.set($event)"
                class="w-full px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 font-mono text-xs" />
            </div>
            <div>
              <label class="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">Format String (e.g. C2, N2, yyyy-MM-dd)</label>
              <input
                type="text"
                [ngModel]="formatPattern()"
                (ngModelChange)="formatPattern.set($event)"
                class="w-full px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 font-mono text-xs" />
            </div>
            <div>
              <label class="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">Timestamp (ISO-8601)</label>
              <input
                type="text"
                [ngModel]="timestampIso()"
                (ngModelChange)="timestampIso.set($event)"
                class="w-full px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 font-mono text-xs" />
            </div>
            <div>
              <button
                type="button"
                (click)="runFormatTimezone()"
                [disabled]="isLoading()"
                class="w-full px-3.5 py-2 text-xs font-medium rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-colors">
                {{ isLoading() ? 'Running...' : 'Evaluate on .NET 10' }}
              </button>
            </div>
          </div>

          @if (formatTzResult(); as ftz) {
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 space-y-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-surface-500">CultureInfo Formatting Results</span>
                <div class="divide-y divide-surface-100 dark:divide-surface-800">
                  @for (c of ftz.cultureResults; track c.culture) {
                    <div class="py-2 flex items-center justify-between text-xs">
                      <span class="font-mono text-surface-600 dark:text-surface-400">{{ c.culture }} ({{ c.displayName }})</span>
                      <span class="font-mono font-semibold text-surface-900 dark:text-surface-100">{{ c.formattedOutput }}</span>
                    </div>
                  }
                </div>
              </div>

              <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 space-y-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-surface-500">TimeZoneInfo Conversions (Windows ↔ IANA)</span>
                <div class="divide-y divide-surface-100 dark:divide-surface-800">
                  @for (tz of ftz.timeZoneResults; track tz.requestedId) {
                    <div class="py-2 text-xs space-y-0.5">
                      <div class="flex items-center justify-between">
                        <span class="font-mono font-semibold text-surface-900 dark:text-surface-100">{{ tz.ianaId || tz.resolvedId }} ({{ tz.utcOffset }})</span>
                        <span class="font-mono text-brand-600 dark:text-brand-400">{{ tz.formattedLocal }}</span>
                      </div>
                      <div class="text-[11px] font-mono text-surface-400">
                        Windows ID: {{ tz.windowsId || 'N/A' }} • IANA ID: {{ tz.ianaId || 'N/A' }}
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class RoslynWorkbenchComponent implements OnInit {
  readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly registry = inject(ToolRegistryService);
  private readonly route = inject(ActivatedRoute);

  readonly activeTab = signal<WorkbenchTab>('roslyn');
  readonly isLoading = signal<boolean>(false);
  readonly isSharing = signal<boolean>(false);
  readonly shareDays = signal<number>(7);
  readonly sharedUrl = signal<string | null>(null);
  readonly apiError = signal<string | null>(null);

  // Tab 1: Roslyn state
  readonly roslynCode = signal<string>(
    `using System;
using System.Linq;

public record OrderItem(string Sku, int Quantity, decimal UnitPrice);

public class OrderCalculator
{
    public decimal CalculateTotal(OrderItem[] items)
    {
        return items
            .Where(i => i.Quantity > 0)
            .Sum(i => i.Quantity * i.UnitPrice);
    }
}`
  );
  readonly roslynOptLevel = signal<'Release' | 'Debug'>('Release');
  readonly roslynOutputView = signal<'lowered' | 'il' | 'diagnostics'>('lowered');
  readonly roslynResult = signal<RoslynInspectApiResponse | null>(null);

  // Tab 2: T-SQL state
  readonly tsqlInput = signal<string>(
    `select u.Id, u.Email, o.OrderNumber, o.TotalAmount
from dbo.Users u
inner join sales.Orders o on u.Id = o.UserId
where u.IsActive = 1 and o.TotalAmount >= 100
order by o.CreatedAt desc;`
  );
  readonly tsqlResult = signal<TSqlAnalyzeApiResponse | null>(null);

  // Tab 3: Connection string state
  readonly connStringInput = signal<string>(
    'Server=sql.mahfozmt.com;Database=DevAssistantDb;User Id=app_user;Password=DemoPassword123!;TrustServerCertificate=True;Encrypt=False;'
  );
  readonly connStringResult = signal<ConnectionStringInspectApiResponse | null>(null);

  // Tab 4: JSON to C# state
  readonly jsonToCsInput = signal<string>(
    `{
  "project_id": "d363985e-b44f-487e-b4d9-d43fb936d645",
  "project_name": "DevAssistant",
  "is_active": true,
  "max_requests_per_min": 30,
  "tags": ["dotnet-10", "roslyn", "angular"]
}`
  );
  readonly jsonToCsResult = signal<JsonToCSharpApiResponse | null>(null);

  // Tab 5: Format & TimeZone state
  readonly formatRawValue = signal<string>('1234567.89');
  readonly formatPattern = signal<string>('C2');
  readonly timestampIso = signal<string>('2026-11-01T12:00:00Z');
  readonly formatTzResult = signal<FormatTimezoneApiResponse | null>(null);

  ngOnInit(): void {
    this.registry.recordToolVisit('roslyn-workbench');
    const snippetId = this.route.snapshot.queryParamMap.get('snippet');
    if (snippetId) {
      this.loadSharedSnippet(snippetId);
    }
  }

  async retryHealth(): Promise<void> {
    const ok = await this.api.checkHealth();
    if (ok) {
      this.apiError.set(null);
      this.toast.success('Connected to api.mahfozmt.com');
    } else {
      this.apiError.set(this.api.statusMessage());
    }
  }

  async runRoslynInspect(): Promise<void> {
    this.isLoading.set(true);
    this.apiError.set(null);
    try {
      const res = await this.api.inspectRoslyn({
        code: this.roslynCode(),
        optimizationLevel: this.roslynOptLevel()
      });
      this.roslynResult.set(res);
      if (!res.success && res.diagnostics.length > 0) {
        this.roslynOutputView.set('diagnostics');
      }
    } catch (err) {
      this.apiError.set(err instanceof Error ? err.message : 'Unable to reach api.mahfozmt.com');
    } finally {
      this.isLoading.set(false);
    }
  }

  async runTSqlAnalyze(): Promise<void> {
    this.isLoading.set(true);
    this.apiError.set(null);
    try {
      const res = await this.api.analyzeTSql({ sql: this.tsqlInput() });
      this.tsqlResult.set(res);
    } catch (err) {
      this.apiError.set(err instanceof Error ? err.message : 'Unable to reach api.mahfozmt.com');
    } finally {
      this.isLoading.set(false);
    }
  }

  async runConnStringInspect(): Promise<void> {
    this.isLoading.set(true);
    this.apiError.set(null);
    try {
      const res = await this.api.inspectConnectionString({ connectionString: this.connStringInput() });
      this.connStringResult.set(res);
    } catch (err) {
      this.apiError.set(err instanceof Error ? err.message : 'Unable to reach api.mahfozmt.com');
    } finally {
      this.isLoading.set(false);
    }
  }

  async runJsonToCSharp(): Promise<void> {
    this.isLoading.set(true);
    this.apiError.set(null);
    try {
      const res = await this.api.convertJsonToCSharp({
        json: this.jsonToCsInput(),
        rootTypeName: 'ProjectConfig',
        useRecords: true,
        useSystemTextJsonAttributes: true
      });
      this.jsonToCsResult.set(res);
    } catch (err) {
      this.apiError.set(err instanceof Error ? err.message : 'Unable to reach api.mahfozmt.com');
    } finally {
      this.isLoading.set(false);
    }
  }

  async runFormatTimezone(): Promise<void> {
    this.isLoading.set(true);
    this.apiError.set(null);
    try {
      const res = await this.api.testFormatAndTimeZone({
        rawValue: this.formatRawValue(),
        valueType: 'number',
        formatString: this.formatPattern(),
        timestampIso: this.timestampIso()
      });
      this.formatTzResult.set(res);
    } catch (err) {
      this.apiError.set(err instanceof Error ? err.message : 'Unable to reach api.mahfozmt.com');
    } finally {
      this.isLoading.set(false);
    }
  }

  async createShareLink(): Promise<void> {
    this.isSharing.set(true);
    this.apiError.set(null);
    try {
      const tab = this.activeTab();
      const content = JSON.stringify({
        tab,
        roslynCode: this.roslynCode(),
        tsqlInput: this.tsqlInput(),
        connStringInput: this.connStringInput(),
        jsonToCsInput: this.jsonToCsInput()
      });
      const created = await this.api.createSnippet({
        tool: 'roslyn-workbench',
        content,
        title: `Workbench (${tab})`,
        expiresInDays: this.shareDays()
      });
      const url = `${window.location.origin}/tools/dotnet/roslyn-workbench?snippet=${created.id}`;
      this.sharedUrl.set(url);
      this.toast.success(`Share link created (expires in ${this.shareDays()} days)`);
    } catch (err) {
      this.apiError.set(err instanceof Error ? err.message : 'Could not create share link');
    } finally {
      this.isSharing.set(false);
    }
  }

  async loadSharedSnippet(id: string): Promise<void> {
    try {
      const snippet = await this.api.getSnippet(id);
      const parsed = JSON.parse(snippet.content);
      if (parsed.tab) this.activeTab.set(parsed.tab);
      if (parsed.roslynCode) this.roslynCode.set(parsed.roslynCode);
      if (parsed.tsqlInput) this.tsqlInput.set(parsed.tsqlInput);
      if (parsed.connStringInput) this.connStringInput.set(parsed.connStringInput);
      if (parsed.jsonToCsInput) this.jsonToCsInput.set(parsed.jsonToCsInput);
      this.toast.info('Loaded shared snippet');
    } catch {
      this.apiError.set('Shared snippet was not found or has expired.');
    }
  }

  copyText(text: string, label: string): void {
    navigator.clipboard.writeText(text);
    this.toast.success(`${label} copied to clipboard`);
  }
}
