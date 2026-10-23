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
    <div class="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-600">
            Criar Conta
          </h1>
          <p class="text-slate-400 mt-2 text-sm">Junte-se à comunidade Manhua Manager Pro</p>
        </div>

        <div *ngIf="errorMessage()" class="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-sm">
          {{ errorMessage() }}
        </div>

        <form (ngSubmit)="onSubmit()" #regForm="ngForm" class="space-y-5">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Nome de Exibição</label>
            <input
              type="text"
              name="displayName"
              [(ngModel)]="displayName"
              required
              minlength="2"
              class="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
              placeholder="Seu Apelido"
            />
          </div>

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
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Senha (mínimo 8 caracteres)</label>
            <input
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              minlength="8"
              class="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading() || !regForm.form.valid"
            class="w-full py-3.5 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-900/20 text-sm"
          >
            <span *ngIf="!loading()">Criar Minha Conta</span>
            <span *ngIf="loading()">Criando conta...</span>
          </button>
        </form>

        <p class="text-center text-sm text-slate-400 mt-6">
          Já possui conta?
          <a routerLink="/login" class="text-violet-400 hover:text-violet-300 font-semibold underline underline-offset-4 ml-1">
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
