import { Component, inject, signal } from '@angular/core';
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
            <img
              [src]="user()?.avatarUrl || 'https://ui-avatars.com/api/?name=' + (user()?.displayName || 'User') + '&background=7c3aed&color=fff'"
              [alt]="user()?.displayName"
              class="w-20 h-20 rounded-full object-cover border-2 border-violet-500 shadow-md shadow-violet-500/20"
            />
            <span
              class="absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-slate-900"
              [ngClass]="user()?.authProvider === 'google' ? 'bg-amber-400' : 'bg-emerald-400'"
              [title]="user()?.authProvider === 'google' ? 'Autenticado via Google' : 'Autenticado via Email'"
            ></span>
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
export class ProfileComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.currentUser;
  showDeleteModal = signal(false);
  deleting = signal(false);

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
