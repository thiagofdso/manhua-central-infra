import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-[#090d16]">
      <div class="max-w-md w-full mb-4">
        <a routerLink="/catalog" class="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar ao Catálogo
        </a>
      </div>
      <div class="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 mb-3 shadow-inner">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              <path d="M8 7h8"/>
              <path d="M8 11h6"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
            <span>Criar Conta</span>
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">PRO</span>
          </h1>
          <p class="text-slate-400 mt-1.5 text-sm">Junte-se à comunidade Manhua Manager Pro</p>
        </div>

        <div *ngIf="errorMessage()" class="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-sm flex items-start gap-3">
          <svg class="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>{{ errorMessage() }}</span>
        </div>

        <form (ngSubmit)="onSubmit()" #regForm="ngForm" class="space-y-4">
          <div>
            <label for="displayNameInput" class="block text-xs font-medium text-slate-300 mb-1.5">Nome de Exibição</label>
            <input
              id="displayNameInput"
              type="text"
              name="displayName"
              [(ngModel)]="displayName"
              required
              minlength="2"
              autocomplete="name"
              class="w-full px-3.5 py-2.5 rounded-xl bg-dark-850 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              placeholder="Seu Apelido"
            />
          </div>

          <div>
            <label for="regEmailInput" class="block text-xs font-medium text-slate-300 mb-1.5">E-mail</label>
            <input
              id="regEmailInput"
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              autocomplete="email"
              class="w-full px-3.5 py-2.5 rounded-xl bg-dark-850 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label for="regPasswordInput" class="block text-xs font-medium text-slate-300 mb-1.5">Senha (mínimo 8 caracteres)</label>
            <input
              id="regPasswordInput"
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              minlength="8"
              autocomplete="new-password"
              class="w-full px-3.5 py-2.5 rounded-xl bg-dark-850 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading() || !regForm.form.valid"
            class="w-full py-3 px-4 rounded-xl font-medium text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm min-h-[44px] flex items-center justify-center gap-2"
          >
            <svg *ngIf="loading()" class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span *ngIf="!loading()">Criar Minha Conta</span>
            <span *ngIf="loading()">Criando conta...</span>
          </button>
        </form>

        <p class="text-center text-sm text-slate-400 mt-6">
          Já possui conta?
          <a routerLink="/login" class="text-brand-400 hover:text-brand-300 font-medium transition-colors ml-1">
            Entrar
          </a>
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  displayName = '';
  email = '';
  password = '';
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/profile']);
    }
  }

  onSubmit(): void {
    if (!this.email || !this.password || !this.displayName) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.register({
      displayName: this.displayName,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Erro ao realizar cadastro');
      }
    });
  }
}
