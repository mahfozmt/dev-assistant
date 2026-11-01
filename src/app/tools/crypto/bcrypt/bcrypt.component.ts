import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import * as bcrypt from 'bcryptjs';
import { ToastService } from '../../../core/services/toast.service';

type BcryptMode = 'generate' | 'verify';

@Component({
  selector: 'app-bcrypt',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    // ActionToolbarComponent
  ],
  template: `
    <div class="flex-1 flex flex-col space-y-3.5 animate-in fade-in duration-100 max-w-6xl mx-auto w-full">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-800 gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-surface-400">Crypto & Security</span>
            <span class="text-surface-300 dark:text-surface-700">/</span>
            <h1 class="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">BCrypt Generator & Verifier</h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Generate BCrypt hashes or verify passwords against existing hashes.</p>
        </div>
      </div>

      <!-- Main Panel -->
      <div class="flex flex-col border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden">
        
        <!-- Tabs -->
        <div class="flex border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/40">
          <button
            type="button"
            (click)="setMode('generate')"
            class="flex-1 py-2.5 text-xs font-medium transition-colors border-b-2"
            [ngClass]="mode() === 'generate' ? 'text-brand-600 dark:text-brand-400 border-brand-500' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 border-transparent hover:bg-surface-100/50 dark:hover:bg-surface-800/50'">
            <div class="flex items-center justify-center gap-2">
              <lucide-icon name="key-round" class="w-4 h-4"></lucide-icon>
              Hash Generator
            </div>
          </button>
          <button
            type="button"
            (click)="setMode('verify')"
            class="flex-1 py-2.5 text-xs font-medium transition-colors border-b-2"
            [ngClass]="mode() === 'verify' ? 'text-brand-600 dark:text-brand-400 border-brand-500' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 border-transparent hover:bg-surface-100/50 dark:hover:bg-surface-800/50'">
            <div class="flex items-center justify-center gap-2">
              <lucide-icon name="shield-check" class="w-4 h-4"></lucide-icon>
              Password Verifier
            </div>
          </button>
        </div>

        <div class="p-6">
          @if (mode() === 'generate') {
            <div class="space-y-6">
              <!-- Generate Section -->
              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">Plain Text Password</label>
                  <input
                    type="text"
                    [ngModel]="plainText()"
                    (ngModelChange)="plainText.set($event)"
                    placeholder="Enter password to hash..."
                    class="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-mono">
                </div>

                <div>
                  <label class="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">Salt Rounds: {{ saltRounds() }}</label>
                  <input
                    type="range"
                    min="4"
                    max="14"
                    [ngModel]="saltRounds()"
                    (ngModelChange)="saltRounds.set($event)"
                    class="w-full accent-brand-500">
                  <p class="text-[10px] text-surface-500 mt-1">Higher salt rounds = more secure but slower to compute.</p>
                </div>

                <div class="flex justify-end pt-2">
                  <button
                    type="button"
                    (click)="generateHash()"
                    [disabled]="isBusy()"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 text-xs font-semibold rounded-lg hover:bg-surface-800 dark:hover:bg-white transition-colors disabled:opacity-50">
                    <lucide-icon name="zap" class="w-4 h-4"></lucide-icon>
                    {{ isBusy() ? 'Generating...' : 'Generate Hash' }}
                  </button>
                </div>
              </div>

              <!-- Output Result -->
              @if (hashResult()) {
                <div class="pt-6 border-t border-surface-200 dark:border-surface-800">
                  <label class="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">BCrypt Hash Output</label>
                  <div class="flex items-center gap-2">
                    <input
                      type="text"
                      [ngModel]="hashResult()"
                      readonly
                      class="flex-1 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-900 dark:text-surface-100 focus:outline-none font-mono">
                    <button
                      type="button"
                      (click)="copyHash()"
                      class="px-3 py-2 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg transition-colors border border-surface-200 dark:border-surface-700">
                      <lucide-icon name="copy" class="w-4 h-4"></lucide-icon>
                    </button>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="space-y-6">
              <!-- Verify Section -->
              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">Plain Text Password</label>
                  <input
                    type="text"
                    [ngModel]="verifyPlainText()"
                    (ngModelChange)="verifyPlainText.set($event)"
                    placeholder="Enter password..."
                    class="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-mono">
                </div>

                <div>
                  <label class="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">BCrypt Hash</label>
                  <input
                    type="text"
                    [ngModel]="verifyHash()"
                    (ngModelChange)="verifyHash.set($event)"
                    placeholder="e.g. $2a$10$..."
                    class="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-mono">
                </div>

                <div class="flex justify-end pt-2">
                  <button
                    type="button"
                    (click)="verify()"
                    [disabled]="isBusy()"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 text-xs font-semibold rounded-lg hover:bg-surface-800 dark:hover:bg-white transition-colors disabled:opacity-50">
                    <lucide-icon name="shield-question" class="w-4 h-4"></lucide-icon>
                    {{ isBusy() ? 'Verifying...' : 'Verify Match' }}
                  </button>
                </div>
              </div>

              <!-- Verification Verdict -->
              @if (matchVerdict() !== null) {
                <div class="pt-6 border-t border-surface-200 dark:border-surface-800">
                  @if (matchVerdict()) {
                    <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
                      <div class="p-2 bg-emerald-500/20 rounded-full">
                        <lucide-icon name="check-circle-2" class="w-6 h-6"></lucide-icon>
                      </div>
                      <div>
                        <span class="font-bold text-sm block">Password Matches Hash</span>
                        <span class="text-xs opacity-80">The plain text password correctly evaluates to the provided BCrypt hash.</span>
                      </div>
                    </div>
                  } @else {
                    <div class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 flex items-center gap-3">
                      <div class="p-2 bg-rose-500/20 rounded-full">
                        <lucide-icon name="x-circle" class="w-6 h-6"></lucide-icon>
                      </div>
                      <div>
                        <span class="font-bold text-sm block">Password Mismatch</span>
                        <span class="text-xs opacity-80">The plain text password does not match the provided BCrypt hash.</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class BcryptComponent {
  private readonly toast = inject(ToastService);

  readonly mode = signal<BcryptMode>('generate');
  readonly isBusy = signal<boolean>(false);
  
  // Generate state
  readonly plainText = signal<string>('');
  readonly saltRounds = signal<number>(10);
  readonly hashResult = signal<string>('');

  // Verify state
  readonly verifyPlainText = signal<string>('');
  readonly verifyHash = signal<string>('');
  readonly matchVerdict = signal<boolean | null>(null);

  setMode(m: BcryptMode): void {
    this.mode.set(m);
    this.matchVerdict.set(null);
  }

  async generateHash(): Promise<void> {
    if (!this.plainText()) {
      this.toast.warning('Please enter a plain text password');
      return;
    }
    
    this.isBusy.set(true);
    
    // Use setTimeout to allow UI to update to "Busy" state before heavy sync computation
    setTimeout(() => {
      try {
        const salt = bcrypt.genSaltSync(Number(this.saltRounds()));
        const hash = bcrypt.hashSync(this.plainText(), salt);
        this.hashResult.set(hash);
        this.toast.success('BCrypt hash generated');
      } catch (e) {
        this.toast.error('Failed to generate hash');
      } finally {
        this.isBusy.set(false);
      }
    }, 50);
  }

  async verify(): Promise<void> {
    if (!this.verifyPlainText() || !this.verifyHash()) {
      this.toast.warning('Please provide both password and hash to verify');
      return;
    }

    this.isBusy.set(true);

    setTimeout(() => {
      try {
        const match = bcrypt.compareSync(this.verifyPlainText(), this.verifyHash());
        this.matchVerdict.set(match);
      } catch (e) {
        // compareSync can throw if hash is malformed
        this.matchVerdict.set(false);
        this.toast.error('Invalid BCrypt hash format');
      } finally {
        this.isBusy.set(false);
      }
    }, 50);
  }

  async copyHash(): Promise<void> {
    const text = this.hashResult();
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        this.toast.success('Hash copied to clipboard');
      } catch {
        this.toast.error('Failed to copy to clipboard');
      }
    }
  }
}
