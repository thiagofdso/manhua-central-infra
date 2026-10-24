import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-950 p-6 flex flex-col items-center">
      <div class="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl mt-10">
        
        <!-- Header Profile -->
        <div class="flex items-center space-x-6 pb-8 border-b border-slate-800">
          <div class="relative">
            <!-- Foto real do Google (com referrerpolicy no-referrer obrigatório para CDN da Google) -->
            <img
              *ngIf="user()?.avatarUrl && !imgError()"
              [src]="user()?.avatarUrl"
              [alt]="user()?.displayName"
              referrerpolicy="no-referrer"
              crossorigin="anonymous"
              (error)="imgError.set(true)"
              class="w-20 h-20 rounded-full object-cover border-2 border-violet-500 shadow-md shadow-violet-500/20"
            />
            <div
              *ngIf="!user()?.avatarUrl || imgError()"
              class="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-purple-800 border-2 border-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-violet-500/20 select-none"
            >
              {{ getInitials(user()?.displayName) }}
            </div>

            <!-- Badge indicativo do provedor (com ícone do Google quando aplicável) -->
            <div
              class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center shadow"
              [ngClass]="user()?.authProvider === 'google' ? 'bg-white' : 'bg-emerald-500'"
              [title]="user()?.authProvider === 'google' ? 'Conta vinculada ao Google' : 'Conta por E-mail e Senha'"
            >
              <!-- Ícone Google G quando autenticado via Google -->
              <svg *ngIf="user()?.authProvider === 'google'" class="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <!-- Ícone de Check para e-mail tradicional -->
              <svg *ngIf="user()?.authProvider !== 'google'" class="w-3.5 h-3.5 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </div>

          <div>
            <h2 class="text-2xl font-bold text-white">{{ user()?.displayName }}</h2>
            <p class="text-sm text-slate-400">{{ user()?.email }}</p>
            <div class="mt-2 flex items-center space-x-2">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-950 text-violet-300 border border-violet-800">
                {{ user()?.role === 'admin' ? 'Administrador' : 'Leitor' }}
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 capitalize">
                Login via {{ user()?.authProvider }}
              </span>
            </div>
          </div>
        </div>

        <!-- Details Section -->
        <div class="py-6 space-y-4">
          <div class="flex justify-between items-center text-sm py-2">
            <span class="text-slate-400">Identificador da Conta:</span>
            <span class="font-mono text-xs text-slate-300 bg-slate-800 px-2 py-1 rounded">{{ user()?.id }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="pt-6 border-t border-slate-800 flex flex-col space-y-4">
          <button
            (click)="logout()"
            class="w-full py-3 px-4 rounded-xl font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-[0.99] transition-all text-sm"
          >
            Sair da Conta
          </button>

          <!-- Google Play Store Mandatory In-App Account Deletion -->
          <button
            (click)="showDeleteModal.set(true)"
            id="btnDeleteAccount"
            class="w-full py-3 px-4 rounded-xl font-medium text-red-400 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 active:scale-[0.99] transition-all text-sm"
          >
            Excluir Conta Definitivamente
          </button>
        </div>
      </div>

      <!-- Modal de Confirmação de Exclusão (Mandatório Play Store) -->
      <div *ngIf="showDeleteModal()" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="max-w-md w-full bg-slate-900 border border-red-900/60 rounded-2xl p-6 shadow-2xl">
          <div class="text-center">
            <div class="w-12 h-12 rounded-full bg-red-950 border border-red-700 mx-auto flex items-center justify-center mb-4 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 class="text-xl font-bold text-white mb-2">Excluir Conta Definitivamente?</h3>
            <p class="text-sm text-slate-400 mb-6">
              Esta ação é <strong>irreversível</strong> e exigida pelas diretrizes de privacidade da Google Play Store. 
              Sua biblioteca de manhuas, capítulos lidos, favoritos e avaliações comunitárias serão permanentemente eliminados dos servidores.
            </p>

            <div class="flex space-x-3">
              <button
                (click)="showDeleteModal.set(false)"
                [disabled]="deleting()"
                class="flex-1 py-3 px-4 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                (click)="confirmDeleteAccount()"
                [disabled]="deleting()"
                id="btnConfirmDelete"
                class="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
              >
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
