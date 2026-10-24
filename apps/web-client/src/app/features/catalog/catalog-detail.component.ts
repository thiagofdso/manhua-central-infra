import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { AuthService } from '../../core/auth/auth.service';
import { CanonicalManhua } from '../../core/models/catalog.model';

@Component({
  selector: 'app-catalog-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-dark-950 text-slate-100 pb-20">
      <!-- App Shell Header -->
      <header class="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center space-x-3">
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
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">PRO</span>
            </span>
          </div>

          <nav class="flex items-center space-x-4">
            <a routerLink="/catalog" class="text-sm text-slate-300 hover:text-white transition-colors">
              Catálogo
            </a>
            <ng-container *ngIf="isAuthenticated(); else loginLink">
              <a routerLink="/profile" class="text-sm text-slate-300 hover:text-white transition-colors">
                Perfil
              </a>
            </ng-container>
            <ng-template #loginLink>
              <a routerLink="/login" class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-colors min-h-[36px] flex items-center">
                Entrar
              </a>
            </ng-template>
          </nav>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <!-- Back Link Navigation -->
        <div class="mb-6">
          <a
            routerLink="/catalog"
            class="inline-flex items-center px-3.5 py-2 rounded-xl bg-dark-850 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs font-semibold border border-slate-800 min-h-[40px]"
          >
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao Catálogo
          </a>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="flex flex-col items-center justify-center py-24 text-slate-400">
          <div class="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mb-4"></div>
          <p class="text-sm font-medium">Carregando detalhes da obra...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error()" class="p-6 bg-red-950/50 border border-red-800/80 rounded-2xl text-center max-w-lg mx-auto">
          <p class="text-red-200 text-sm mb-4">{{ error() }}</p>
          <a routerLink="/catalog" class="inline-block px-4 py-2 bg-dark-850 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors border border-slate-800">
            Voltar ao Catálogo
          </a>
        </div>

        <!-- Detail Layout -->
        <div *ngIf="!loading() && manhua()" class="space-y-10">
          <!-- Hero Section -->
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row gap-8 items-start">
            <!-- Poster -->
            <div class="w-full sm:w-64 md:w-72 flex-shrink-0 mx-auto md:mx-0 aspect-[3/4] bg-dark-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative">
              <img
                *ngIf="manhua()?.coverUrl"
                [src]="manhua()?.coverUrl"
                [alt]="manhua()?.title"
                referrerpolicy="no-referrer"
                class="w-full h-full object-cover"
              />
              <div *ngIf="!manhua()?.coverUrl" class="w-full h-full flex items-center justify-center bg-dark-850 text-slate-500 font-bold">
                Sem Capa
              </div>
            </div>

            <!-- Details Content -->
            <div class="flex-1 flex flex-col justify-between">
              <div>
                <!-- Domain and Status Badges (Pills) -->
                <div class="flex flex-wrap items-center gap-2 mb-3">
                  <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-500/10 text-brand-300 border border-brand-500/25">
                    {{ manhua()?.primaryDomain }}
                  </span>
                  <span *ngIf="manhua()?.isHiatus" class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    Hiatus
                  </span>
                  <span *ngIf="!manhua()?.isHiatus" class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Em Publicação
                  </span>
                </div>

                <!-- Title -->
                <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {{ manhua()?.title }}
                </h1>

                <!-- Alternative Titles -->
                <p *ngIf="manhua()?.alternativeTitles" class="text-sm text-slate-400 mt-2 font-medium">
                  Títulos alternativos: <span class="text-slate-300">{{ manhua()?.alternativeTitles }}</span>
                </p>

                <!-- Metrics Row -->
                <div class="mt-6 flex flex-wrap items-center gap-4 py-4 px-5 bg-dark-950/80 rounded-2xl border border-slate-800/80">
                  <div class="flex items-center space-x-2">
                    <span class="text-amber-400 text-lg">★</span>
                    <div>
                      <div class="text-sm font-extrabold text-white">{{ manhua()?.bayesianRating?.toFixed(2) || '0.00' }}</div>
                      <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Score Bayesiano</div>
                    </div>
                  </div>

                  <div class="h-8 w-px bg-slate-800"></div>

                  <div>
                    <div class="text-sm font-extrabold text-white">{{ manhua()?.lastChapter || '—' }}</div>
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Último Capítulo</div>
                  </div>

                  <div class="h-8 w-px bg-slate-800"></div>

                  <div>
                    <div class="text-sm font-extrabold text-white">{{ (manhua()?.totalViews || 0).toLocaleString() }}</div>
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Visualizações</div>
                  </div>

                  <div class="h-8 w-px bg-slate-800"></div>

                  <div>
                    <div class="text-sm font-extrabold text-white">{{ (manhua()?.totalVotes || 0).toLocaleString() }}</div>
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Votos</div>
                  </div>
                </div>

                <!-- Synopsis -->
                <div class="mt-6">
                  <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Sinopse</h2>
                  <p class="text-sm text-slate-300 leading-relaxed whitespace-pre-line max-w-3xl">
                    {{ manhua()?.synopsis || 'Nenhuma sinopse cadastrada para esta obra.' }}
                  </p>
                </div>
              </div>

              <!-- Action Bar -->
              <div class="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  (click)="addToLibrary()"
                  [disabled]="addedToLibrary()"
                  class="px-6 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer flex items-center space-x-2 min-h-[44px]"
                  [ngClass]="addedToLibrary() ? 'bg-emerald-600 text-white cursor-default' : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25'"
                >
                  <svg *ngIf="!addedToLibrary()" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <svg *ngIf="addedToLibrary()" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{{ addedToLibrary() ? 'Na Minha Biblioteca' : '+ Adicionar à Biblioteca' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Chapters List Section -->
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-xl font-bold text-white tracking-tight">Capítulos Disponíveis</h2>
                <p class="text-xs text-slate-400 mt-0.5">Grade de episódios para leitura contínua</p>
              </div>
              <span class="text-xs px-3 py-1 bg-dark-850 text-slate-300 font-semibold rounded-full border border-slate-800">
                {{ chapters().length }} capítulos
              </span>
            </div>

            <!-- Chapters Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 max-h-96 overflow-y-auto pr-1">
              <div
                *ngFor="let ch of chapters()"
                class="p-2.5 bg-dark-850 border border-slate-800 hover:border-brand-500 hover:bg-brand-950/30 rounded-xl text-center text-xs font-semibold text-slate-200 hover:text-brand-300 transition-colors cursor-pointer min-h-[38px] flex items-center justify-center"
              >
                Cap. {{ ch }}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class CatalogDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private catalogService = inject(CatalogService);
  private authService = inject(AuthService);

  manhua = signal<CanonicalManhua | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  addedToLibrary = signal<boolean>(false);

  chapters = computed<number[]>(() => {
    const m = this.manhua();
    if (!m || !m.lastChapter || m.lastChapter < 1) {
      return [];
    }
    const list: number[] = [];
    for (let i = 1; i <= m.lastChapter; i++) {
      list.push(i);
    }
    return list;
  });

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.error.set('Slug da obra não especificado.');
      return;
    }
    this.loadDetail(slug);
  }

  loadDetail(slug: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.catalogService.getBySlug(slug).subscribe({
      next: (m) => {
        this.manhua.set(m);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Obra não encontrada no catálogo global.');
        this.loading.set(false);
      }
    });
  }

  addToLibrary(): void {
    this.addedToLibrary.set(true);
  }
}
