import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { jwtDecode } from 'jwt-decode';
import { ToastService } from '../../../core/services/toast.service';

interface JwtPart {
  type: 'header' | 'payload' | 'signature';
  raw: string;
  decoded: any;
  colorClass: string;
  textClass: string;
}

@Component({
  selector: 'app-jwt',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule
  ],
  template: `
    <div class="flex-1 flex flex-col space-y-3.5 animate-in fade-in duration-100 max-w-6xl mx-auto w-full">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-800 gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-surface-400">Crypto & Security</span>
            <span class="text-surface-300 dark:text-surface-700">/</span>
            <h1 class="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">JWT Debugger & Inspector</h1>
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Decode and inspect JSON Web Tokens locally.</p>
        </div>

        <div class="flex gap-2">
           <button (click)="loadSample('auth0')" class="px-3 py-1.5 rounded-md bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-xs font-medium text-surface-700 dark:text-surface-300 transition-colors border border-surface-200 dark:border-surface-700">Auth0</button>
           <button (click)="loadSample('firebase')" class="px-3 py-1.5 rounded-md bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-xs font-medium text-surface-700 dark:text-surface-300 transition-colors border border-surface-200 dark:border-surface-700">Firebase</button>
           <button (click)="clearAll()" class="px-3 py-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-medium transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-800">Clear</button>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="flex flex-col lg:flex-row gap-4 h-full min-h-[500px]">

        <!-- Encoded Input (Left) -->
        <div class="flex-1 flex flex-col border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden">
          <div class="h-9 px-3 bg-surface-50/90 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-surface-500 shrink-0">
            <span class="font-medium text-surface-700 dark:text-surface-300">Encoded JWT</span>
          </div>

          <div class="flex-1 p-3 relative font-mono text-sm leading-relaxed overflow-auto whitespace-pre-wrap break-all focus-within:ring-2 focus-within:ring-brand-500/50">
            <!-- Invisible textarea for actual input -->
            <textarea
              class="absolute inset-0 w-full h-full opacity-0 resize-none z-10 cursor-text"
              [ngModel]="token()"
              (ngModelChange)="onTokenChange($event)"
              spellcheck="false"></textarea>

            <!-- Colored overlay for syntax highlighting -->
            <div class="relative z-0 pointer-events-none w-full h-full">
              @if (!token()) {
                <span class="text-surface-400">Paste a JWT here...</span>
              } @else if (error()) {
                <span class="text-rose-500">{{ token() }}</span>
              } @else {
                <span class="text-rose-600 dark:text-rose-400">{{ parts()[0].raw }}</span>
                <span class="text-surface-900 dark:text-surface-100">.</span>
                <span class="text-purple-600 dark:text-purple-400">{{ parts()[1].raw }}</span>
                <span class="text-surface-900 dark:text-surface-100">.</span>
                <span class="text-blue-600 dark:text-blue-400">{{ parts()[2].raw }}</span>
              }
            </div>
          </div>
        </div>

        <!-- Decoded Output (Right) -->
        <div class="flex-1 flex flex-col gap-4">

          <!-- Error Banner -->
          @if (error()) {
            <div class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-start gap-2.5">
              <lucide-icon name="circle-alert" class="w-4 h-4 shrink-0 mt-0.5"></lucide-icon>
              <div>
                <span class="font-semibold block">Invalid Token:</span>
                <p>{{ error() }}</p>
              </div>
            </div>
          }

          <!-- Expiration Status -->
          @if (expirationStatus() && !error()) {
             <div class="p-3 rounded-xl border flex items-center gap-3 text-xs"
               [ngClass]="isExpired() ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'">
               <lucide-icon [name]="isExpired() ? 'clock-3' : 'check-circle-2'" class="w-5 h-5 shrink-0"></lucide-icon>
               <div>
                 <span class="font-bold block">{{ isExpired() ? 'Token Expired' : 'Token Active' }}</span>
                 <span class="opacity-80">{{ expirationStatus() }}</span>
               </div>
             </div>
          }

          <!-- Decoded Header -->
          <div class="flex flex-col border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden flex-1 min-h-[150px]">
            <div class="h-9 px-3 bg-rose-500/10 dark:bg-rose-500/5 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-rose-700 dark:text-rose-400 shrink-0">
              <span class="font-bold">HEADER</span>
              <span class="opacity-70 font-mono text-[10px]">Algorithm & Token Type</span>
            </div>
            <pre class="flex-1 p-3 overflow-auto font-mono text-xs text-surface-900 dark:text-surface-100 m-0">{{ headerJson() }}</pre>
          </div>

          <!-- Decoded Payload -->
          <div class="flex flex-col border border-surface-200 dark:border-surface-800 rounded-xl bg-white dark:bg-surface-950 shadow-xs overflow-hidden flex-[2] min-h-[250px]">
            <div class="h-9 px-3 bg-purple-500/10 dark:bg-purple-500/5 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between text-xs text-purple-700 dark:text-purple-400 shrink-0">
              <span class="font-bold">PAYLOAD</span>
              <span class="opacity-70 font-mono text-[10px]">Data & Claims</span>
            </div>
            <pre class="flex-1 p-3 overflow-auto font-mono text-xs text-surface-900 dark:text-surface-100 m-0">{{ payloadJson() }}</pre>
          </div>

        </div>
      </div>
    </div>
  `
})
export class JwtComponent {
  private readonly toast = inject(ToastService);

  readonly token = signal<string>('');
  readonly error = signal<string | null>(null);

  readonly parts = signal<JwtPart[]>([]);
  readonly headerJson = signal<string>('{\n\n}');
  readonly payloadJson = signal<string>('{\n\n}');

  readonly isExpired = signal<boolean>(false);
  readonly expirationStatus = signal<string | null>(null);

  constructor() {
    this.loadSample('auth0');
  }

  onTokenChange(val: string): void {
    this.token.set(val.trim());
    this.decode();
  }

  decode(): void {
    const t = this.token();
    if (!t) {
      this.clearState();
      return;
    }

    const segments = t.split('.');
    if (segments.length !== 3) {
      this.error.set('A JWT must have exactly 3 parts separated by dots.');
      this.clearState(false);
      return;
    }

    try {
      // Decode Header manually since jwt-decode defaults to payload
      const headerStr = atob(segments[0].replace(/-/g, '+').replace(/_/g, '/'));
      const headerObj = JSON.parse(headerStr);

      const payloadObj = jwtDecode(t);

      this.parts.set([
        { type: 'header', raw: segments[0], decoded: headerObj, colorClass: 'text-rose-600', textClass: '' },
        { type: 'payload', raw: segments[1], decoded: payloadObj, colorClass: 'text-purple-600', textClass: '' },
        { type: 'signature', raw: segments[2], decoded: null, colorClass: 'text-blue-600', textClass: '' }
      ]);

      this.headerJson.set(JSON.stringify(headerObj, null, 2));
      this.payloadJson.set(JSON.stringify(payloadObj, null, 2));

      this.checkExpiration(payloadObj as any);
      this.error.set(null);
    } catch (e: any) {
      this.error.set('Failed to decode token. It may be malformed.');
      this.clearState(false);
    }
  }

  private checkExpiration(payload: { exp?: number, iat?: number }): void {
    if (!payload || !payload.exp) {
      this.expirationStatus.set(null);
      return;
    }

    const expDate = new Date(payload.exp * 1000);
    const now = new Date();

    this.isExpired.set(now > expDate);

    if (this.isExpired()) {
      this.expirationStatus.set(`Expired on ${expDate.toLocaleString()}`);
    } else {
      // rough relative time calculation
      const diffMs = expDate.getTime() - now.getTime();
      const diffMins = Math.round(diffMs / 60000);
      if (diffMins < 60) {
        this.expirationStatus.set(`Expires in ${diffMins} minutes (${expDate.toLocaleString()})`);
      } else {
        const diffHours = Math.round(diffMins / 60);
        this.expirationStatus.set(`Expires in ${diffHours} hours (${expDate.toLocaleString()})`);
      }
    }
  }

  clearState(clearToken = true): void {
    if (clearToken) this.token.set('');
    this.parts.set([]);
    this.headerJson.set('{\n\n}');
    this.payloadJson.set('{\n\n}');
    this.expirationStatus.set(null);
  }

  clearAll(): void {
    this.clearState(true);
    this.error.set(null);
    this.toast.info('Cleared');
  }

  loadSample(type: 'auth0' | 'firebase'): void {
    // These are dummy JWTs for structural demonstration
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "dummy-key-id" }));

    let payload = '';
    const now = Math.floor(Date.now() / 1000);

    if (type === 'auth0') {
      payload = btoa(JSON.stringify({
        iss: "https://auth0.example.com/",
        sub: "auth0|123456",
        aud: ["https://api.example.com", "https://auth0.example.com/userinfo"],
        iat: now - 3600,
        exp: now + 3600, // Valid for 1 hour from now
        scope: "openid profile email"
      }));
    } else {
      payload = btoa(JSON.stringify({
        iss: "https://securetoken.google.com/dummy-project",
        sub: "user-abc-123",
        aud: "dummy-project",
        iat: now - 86400,
        exp: now - 3600, // Expired 1 hour ago
        auth_time: now - 86400,
        user_id: "user-abc-123",
        email: "test@example.com"
      }));
    }

    const signature = "dummy-signature-bytes-xyz-123";
    this.token.set(`${header}.${payload}.${signature}`);
    this.decode();
    this.toast.info(`Loaded ${type} sample`);
  }
}
