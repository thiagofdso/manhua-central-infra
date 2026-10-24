import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { CanonicalManhua } from '../../core/models/catalog.model';

@Component({
  selector: 'app-catalog-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <!-- Top Bar -->
      <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a routerLink="/catalog" class="inline-flex items-center text-sm font-semibold text-slate-400 hover:text-white transition">
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao Catálogo
          </a>

          <div class="flex items-center space-x-3">
            <a routerLink="/catalog" class="text-sm text-slate-300 hover:text-white transition">Catálogo</a>
            <a routerLink="/profile" class="text-sm text-slate-300 hover:text-white transition">Perfil</a>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <!-- Loading State -->
        <div *ngIf="loading()" class="flex flex-col items-center justify-center py-24 text-slate-400">
          <div class="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p class="text-sm font-medium">Carregando detalhes da obra...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error()" class="p-6 bg-red-950/50 border border-red-800/80 rounded-2xl text-center max-w-lg mx-auto">
          <p class="text-red-200 text-sm mb-4">{{ error() }}</p>
          <a routerLink="/catalog" class="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition">
            Voltar ao Catálogo
          </a>
        </div>

        <!-- Detail Layout -->
        <div *ngIf="!loading() && manhua()" class="space-y-10">
          <!-- Hero Section -->
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row gap-8 items-start">
            <!-- Poster -->
            <div class="w-full sm:w-64 md:w-72 flex-shrink-0 mx-auto md:mx-0 aspect-[3/4] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative">
              <img
                *ngIf="manhua()?.coverUrl"
                [src]="manhua()?.coverUrl"
                [alt]="manhua()?.title"
                referrerpolicy="no-referrer"
                class="w-full h-full object-cover"
              />
              <div *ngIf="!manhua()?.coverUrl" class="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-500 font-bold">
                Sem Capa
              </div>
            </div>

            <!-- Details Content -->
            <div class="flex-1 flex flex-col justify-between">
              <div>
                <!-- Domain and Status Badges -->
                <div class="flex flex-wrap items-center gap-2 mb-3">
                  <span class="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-800 text-blue-400 border border-blue-500/20">
                    {{ manhua()?.primaryDomain }}
                  </span>
                  <span *ngIf="manhua()?.isHiatus" class="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Hiatus
                  </span>
                  <span *ngIf="!manhua()?.isHiatus" class="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Em Publicação
                  </span>
                </div>

                <!-- Title -->
                <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {{ manhua()?.title }}
                </h1>

                <!-- Alternative Titles -->
                <p *ngIf="manhua()?.alternativeTitles" class="text-sm text-slate-400 mt-2 font-medium">
                  Também conhecido como: <span class="text-slate-300">{{ manhua()?.alternativeTitles }}</span>
                </p>

                <!-- Metrics Row -->
                <div class="mt-6 flex flex-wrap items-center gap-4 py-4 px-5 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                  <div class="flex items-center space-x-2">
                    <span class="text-amber-400 text-lg">★</span>
                    <div>
                      <div class="text-sm font-black text-white">{{ manhua()?.bayesianRating?.toFixed(2) || '0.00' }}</div>
                      <div class="text-[10px] text-slate-500 uppercase tracking-wider">Score Bayesiano</div>
                    </div>
                  </div>

                  <div class="h-8 w-px bg-slate-800"></div>

                  <div>
                    <div class="text-sm font-black text-white">{{ manhua()?.lastChapter || '—' }}</div>
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider">Último Capítulo</div>
                  </div>

                  <div class="h-8 w-px bg-slate-800"></div>

                  <div>
                    <div class="text-sm font-black text-white">{{ (manhua()?.totalViews || 0).toLocaleString() }}</div>
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider">Visualizações</div>
                  </div>

                  <div class="h-8 w-px bg-slate-800"></div>

                  <div>
                    <div class="text-sm font-black text-white">{{ (manhua()?.totalVotes || 0).toLocaleString() }}</div>
                    <div class="text-[10px] text-slate-500 uppercase tracking-wider">Votos</div>
                  </div>
                </div>

                <!-- Synopsis -->
                <div class="mt-6">
                  <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Sinopse</h2>
                  <p class="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {{ manhua()?.synopsis || 'Nenhuma sinopse disponível para esta obra.' }}
                  </p>
                </div>
              </div>

              <!-- Action Bar -->
              <div class="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  (click)="addToLibrary()"
                  [disabled]="addedToLibrary()"
                  class="px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center space-x-2"
                  [ngClass]="addedToLibrary() ? 'bg-emerald-600 text-white cursor-default' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25'"
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
                <p class="text-xs text-slate-400 mt-0.5">Selecione um capítulo para iniciar a leitura vertical</p>
              </div>
              <span class="text-xs px-3 py-1 bg-slate-800 text-slate-300 font-semibold rounded-lg border border-slate-700">
                {{ chapters().length }} capítulos
              </span>
            </div>

            <!-- Chapters Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 max-h-96 overflow-y-auto pr-1">
              <div
                *ngFor="let ch of chapters()"
                class="p-2.5 bg-slate-950 border border-slate-800 hover:border-blue-500 hover:bg-blue-950/30 rounded-xl text-center text-xs font-semibold text-slate-200 hover:text-blue-400 transition cursor-pointer"
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
      error: (err) => {
        this.error.set('Obra não encontrada no catálogo global.');
        this.loading.set(false);
      }
    });
  }

  addToLibrary(): void {
    this.addedToLibrary.set(true);
  }
}
