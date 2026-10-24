import { Component, inject, signal, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-600">
            Manhua Manager Pro
          </h1>
          <p class="text-slate-400 mt-2 text-sm">Entre na sua conta para sincronizar suas leituras</p>
        </div>

        <div *ngIf="errorMessage()" class="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-sm">
          {{ errorMessage() }}
        </div>

        <!-- Google One Tap / Button Container -->
        <div class="mb-6">
          <div id="googleBtn" class="flex justify-center w-full min-h-[44px]"></div>
        </div>

        <div class="relative flex items-center justify-center my-6">
          <div class="border-t border-slate-800 w-full"></div>
          <span class="bg-slate-900 px-3 text-xs text-slate-500 uppercase tracking-wider">ou com email</span>
          <div class="border-t border-slate-800 w-full"></div>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="space-y-5">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">E-mail</label>
            <input
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              class="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Senha</label>
            <input
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              class="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading() || !loginForm.form.valid"
            class="w-full py-3.5 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-900/20 text-sm"
          >
            <span *ngIf="!loading()">Entrar na Conta</span>
            <span *ngIf="loading()">Entrando...</span>
          </button>
        </form>

        <p class="text-center text-sm text-slate-400 mt-6">
          Não tem uma conta?
          <a routerLink="/register" class="text-violet-400 hover:text-violet-300 font-semibold underline underline-offset-4 ml-1">
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/profile']);
    }
  }

  ngAfterViewInit(): void {
    this.initGoogleAuth();
  }

  initGoogleAuth(): void {
    const setupGoogle = () => {
      if (typeof google !== 'undefined' && google?.accounts?.id && environment.googleClientId) {
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => this.handleGoogleCredential(response)
        });

        const btnContainer = document.getElementById('googleBtn');
        if (btnContainer) {
          google.accounts.id.renderButton(btnContainer, {
            theme: 'filled_black',
            size: 'large',
            width: 380,
            text: 'signin_with',
            shape: 'pill'
          });
        }
      }
    };

    if (typeof google === 'undefined' || !google?.accounts?.id) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (typeof google !== 'undefined' && google?.accounts?.id) {
          clearInterval(interval);
          setupGoogle();
        } else if (attempts > 30) {
          clearInterval(interval);
        }
      }, 100);
    } else {
      setupGoogle();
    }
  }

  handleGoogleCredential(response: { credential?: string }): void {
    if (!response?.credential) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.loginWithGoogle(response.credential).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Falha ao autenticar com Google');
      }
    });
  }

  onSubmit(): void {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.error;
        if (msg === 'invalid email or password') {
          this.errorMessage.set('Email ou senha inválidos');
        } else {
          this.errorMessage.set(msg || 'Email ou senha inválidos');
        }
      }
    });
  }
}
