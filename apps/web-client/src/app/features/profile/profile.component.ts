import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <!-- App Shell Header -->
      <header class="border-b border-slate-800 bg-slate-900/60 sticky top-0 z-30">
        <div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shadow-inner">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                <path d="M8 7h8"/>
                <path d="M8 11h6"/>
              </svg>
            </div>
            <span class="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              Manhua Manager
              <span class="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">PRO</span>
            </span>
          </div>

          <div class="flex items-center gap-4">
            <a routerLink="/catalog" class="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Catálogo
            </a>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Sincronizado
            </span>
            <button
              (click)="logout()"
              class="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors min-h-[36px]"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <!-- Main Profile Content -->
      <main class="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          
          <!-- Profile Identity Header -->
          <div class="p-6 sm:p-8 border-b border-slate-800 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div class="relative">
              <!-- Real Avatar from Google or fallback with initials -->
              <img
                *ngIf="user()?.avatarUrl && !imgError()"
                [src]="user()?.avatarUrl"
                [alt]="user()?.displayName"
                referrerpolicy="no-referrer"
                crossorigin="anonymous"
                (error)="imgError.set(true)"
                class="w-20 h-20 rounded-full object-cover border-2 border-brand-500 shadow-lg shadow-brand-500/20"
              />
              <div
                *ngIf="!user()?.avatarUrl || imgError()"
                class="w-20 h-20 rounded-full bg-brand-950 border-2 border-brand-500/40 text-brand-300 flex items-center justify-center text-2xl font-bold select-none shadow-lg shadow-brand-500/10"
              >
                {{ getInitials(user()?.displayName) }}
              </div>

              <!-- Auth Provider Badge -->
              <div
                class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center shadow"
                [ngClass]="user()?.authProvider === 'google' ? 'bg-white' : 'bg-brand-500'"
                [title]="user()?.authProvider === 'google' ? 'Conta vinculada ao Google' : 'Conta por E-mail e Senha'"
              >
                <svg *ngIf="user()?.authProvider === 'google'" class="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <svg *ngIf="user()?.authProvider !== 'google'" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">{{ user()?.displayName }}</h2>
              <p class="text-sm text-slate-400 mt-0.5 truncate">{{ user()?.email }}</p>
              
              <div class="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-500/10 text-brand-300 border border-brand-500/30">
                  {{ user()?.role === 'admin' ? 'Administrador' : 'Leitor' }}
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                  Login via {{ user()?.authProvider }}
                </span>
              </div>
            </div>
          </div>

          <!-- Account Details Section -->
          <div class="p-6 sm:p-8 space-y-4">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Informações da Conta</h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="p-3.5 rounded-xl bg-dark-850 border border-slate-800/80">
                <span class="text-xs text-slate-400 block mb-1">Identificador Único (UUID)</span>
                <span class="font-mono text-xs text-slate-200 select-all break-all">{{ user()?.id }}</span>
              </div>

              <div class="p-3.5 rounded-xl bg-dark-850 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span class="text-xs text-slate-400 block mb-1">Nível de Acesso</span>
                  <span class="text-xs font-medium text-slate-200">Plano Padrão (Ilimitado)</span>
                </div>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">ATIVO</span>
              </div>
            </div>
          </div>

          <!-- Actions & Security -->
          <div class="p-6 sm:p-8 bg-slate-900/50 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              (click)="logout()"
              class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors min-h-[44px]"
            >
              Sair da Conta
            </button>

            <!-- Google Play Store Mandatory In-App Account Deletion -->
            <button
              (click)="showDeleteModal.set(true)"
              id="btnDeleteAccount"
              class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/60 border border-red-900/50 transition-colors min-h-[44px]"
            >
              Excluir Conta Definitivamente
            </button>
          </div>
        </div>
      </main>

      <!-- Modal de Confirmação de Exclusão (Mandatório Google Play) -->
      <div *ngIf="showDeleteModal()" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="max-w-md w-full bg-slate-900 border border-red-900/60 rounded-2xl p-6 shadow-2xl">
          <div class="text-center">
            <div class="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800/80 mx-auto flex items-center justify-center mb-4 text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 class="text-xl font-bold text-white mb-2">Excluir Conta Definitivamente?</h3>
            <p class="text-sm text-slate-400 mb-6 leading-relaxed">
              Esta ação é <strong class="text-red-300">irreversível</strong> e exigida pelas diretrizes de privacidade da Google Play Store. 
              Sua biblioteca de manhuas, capítulos lidos, favoritos e avaliações comunitárias serão permanentemente eliminados dos servidores.
            </p>

            <div class="flex gap-3">
              <button
                (click)="showDeleteModal.set(false)"
                [disabled]="deleting()"
                class="flex-1 py-2.5 px-4 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors text-sm min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                (click)="confirmDeleteAccount()"
                [disabled]="deleting()"
                id="btnConfirmDelete"
                class="flex-1 py-2.5 px-4 rounded-xl font-medium text-white bg-red-600 hover:bg-red-500 transition-colors text-sm disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2"
              >
                <svg *ngIf="deleting()" class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span *ngIf="!deleting()">Sim, Excluir</span>
                <span *ngIf="deleting()">Excluindo...</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.currentUser;
  showDeleteModal = signal(false);
  deleting = signal(false);
  imgError = signal(false);

  ngOnInit(): void {
    this.authService.fetchCurrentUser().subscribe({
      error: () => {}
    });
  }

  getInitials(name?: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
  }

  confirmDeleteAccount(): void {
    this.deleting.set(true);
    this.authService.deleteAccount().subscribe({
      next: () => {
        this.deleting.set(false);
        this.showDeleteModal.set(false);
      },
      error: () => {
        this.deleting.set(false);
        this.showDeleteModal.set(false);
      }
    });
  }
}
