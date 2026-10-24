import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { CanonicalManhua, CatalogFilter } from '../../core/models/catalog.model';

@Component({
  selector: 'app-catalog-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <!-- Navbar / Top Header -->
      <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <span class="text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent tracking-tight">
              MANHUA CENTRAL
            </span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              Pro v3.0
            </span>
          </div>

          <nav class="flex items-center space-x-4">
            <a routerLink="/catalog" routerLinkActive="text-blue-400 font-semibold" class="text-sm text-slate-300 hover:text-white transition">
              Catálogo
            </a>
            <a routerLink="/profile" routerLinkActive="text-blue-400 font-semibold" class="text-sm text-slate-300 hover:text-white transition">
              Perfil
            </a>
          </nav>
        </div>
      </header>

      <!-- Main Container -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <!-- Hero Title Section -->
        <div class="mb-8">
          <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Catálogo Canônico Global
          </h1>
          <p class="mt-2 text-slate-400 text-sm sm:text-base max-w-2xl">
            Explore manhuas, manhwas e webtoons sincronizados diretamente com as fontes mais rápidas.
          </p>
        </div>

        <!-- Filter & Search Bar -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-8 shadow-xl">
          <div class="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <!-- Search Input -->
            <div class="relative flex-1">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearchInput($event)"
                placeholder="Pesquisar por título, título alternativo..."
                class="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
              />
            </div>

            <!-- Sort Select -->
            <div class="flex items-center space-x-2">
              <label for="sortSelect" class="text-xs text-slate-400 font-medium whitespace-nowrap">Ordenar por:</label>
              <select
                id="sortSelect"
                [ngModel]="selectedSort()"
                (ngModelChange)="onSortChange($event)"
                aria-label="Ordenar por"
                class="bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="updated">Mais Recentes</option>
                <option value="views">Mais Visualizados</option>
                <option value="rating">Melhor Avaliados</option>
                <option value="title">Título (A-Z)</option>
              </select>
            </div>
          </div>

          <!-- Domain Filter Badges -->
          <div class="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1">
            <span class="text-xs text-slate-500 font-semibold uppercase tracking-wider mr-1">Fonte:</span>
            <button
              type="button"
              (click)="onDomainChange('')"
              [class]="selectedDomain() === '' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Todos ({{ total() }})
            </button>
            <button
              type="button"
              (click)="onDomainChange('asurascans.com')"
              [class]="selectedDomain() === 'asurascans.com' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Asura Scans
            </button>
            <button
              type="button"
              (click)="onDomainChange('ravenscans.org')"
              [class]="selectedDomain() === 'ravenscans.org' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              RavenScans
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="flex flex-col items-center justify-center py-20 text-slate-400">
          <div class="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p class="text-sm font-medium">Carregando catálogo...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error()" class="p-4 bg-red-950/50 border border-red-800/80 rounded-xl text-red-200 text-sm mb-6 flex items-center justify-between">
          <span>{{ error() }}</span>
          <button (click)="loadCatalog()" class="text-xs bg-red-800/60 hover:bg-red-700 px-3 py-1 rounded-md font-semibold transition">
            Tentar novamente
          </button>
        </div>

        <!-- Catalog Grid -->
        <div *ngIf="!loading() && manhuas().length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          <div
            *ngFor="let item of manhuas()"
            class="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 hover:shadow-2xl hover:shadow-blue-500/5 transition flex flex-col"
          >
            <!-- Poster / Cover Image -->
            <div class="relative aspect-[3/4] bg-slate-950 overflow-hidden">
              <img
                *ngIf="item.coverUrl"
                [src]="item.coverUrl"
                [alt]="item.title"
                loading="lazy"
                referrerpolicy="no-referrer"
                class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div *ngIf="!item.coverUrl" class="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-500 text-sm font-semibold">
                Sem Capa
              </div>

              <!-- Badges Overlay -->
              <div class="absolute top-2 left-2 flex flex-col gap-1 items-start">
                <span *ngIf="item.isHiatus" class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-rose-500/90 text-white shadow">
                  Hiatus
                </span>
                <span *ngIf="item.lastChapter" class="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-600/90 text-white shadow">
                  Cap. {{ item.lastChapter }}
                </span>
              </div>

              <!-- Rating Badge -->
              <div *ngIf="item.bayesianRating > 0" class="absolute bottom-2 right-2 px-2 py-0.5 text-[11px] font-extrabold rounded-md bg-slate-950/80 backdrop-blur text-amber-400 border border-amber-400/30 flex items-center gap-1 shadow">
                <span>★</span> {{ item.bayesianRating.toFixed(1) }}
              </div>
            </div>

            <!-- Content Area -->
            <div class="p-3.5 sm:p-4 flex flex-col flex-1 justify-between">
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {{ item.primaryDomain }}
                </span>
                <h3 class="text-sm font-bold text-white group-hover:text-blue-400 transition line-clamp-2 mt-0.5">
                  {{ item.title }}
                </h3>
                <p *ngIf="item.alternativeTitles" class="text-xs text-slate-400 line-clamp-1 mt-1">
                  {{ item.alternativeTitles }}
                </p>
              </div>

              <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <a
                  [routerLink]="['/catalog', item.slug]"
                  class="flex-1 text-center py-1.5 px-2 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition"
                >
                  Detalhes
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading() && manhuas().length === 0" class="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 text-2xl">
            🔍
          </div>
          <h3 class="text-lg font-bold text-white">Nenhuma obra encontrada</h3>
          <p class="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Não encontramos nenhum manhua correspondente aos filtros ou termo de busca "{{ searchQuery() }}".
          </p>
          <button
            type="button"
            (click)="resetFilters()"
            class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>

        <!-- Pagination Controls -->
        <div *ngIf="!loading() && totalPages() > 1" class="mt-10 flex items-center justify-between border-t border-slate-800 pt-6">
          <p class="text-xs sm:text-sm text-slate-400">
            Página <span class="font-semibold text-white">{{ page() }}</span> de <span class="font-semibold text-white">{{ totalPages() }}</span> (Total: {{ total() }} obras)
          </p>

          <div class="flex items-center space-x-2">
            <button
              type="button"
              [disabled]="page() <= 1"
              (click)="onPageChange(page() - 1)"
              class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Anterior
            </button>
            <button
              type="button"
              [disabled]="page() >= totalPages()"
              (click)="onPageChange(page() + 1)"
              class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Próximo
            </button>
          </div>
        </div>
      </main>
    </div>
  `
})
export class CatalogListComponent implements OnInit {
  private catalogService = inject(CatalogService);

  manhuas = signal<CanonicalManhua[]>([]);
  total = signal<number>(0);
  page = signal<number>(1);
  pageSize = signal<number>(20);
  totalPages = signal<number>(1);
  searchQuery = signal<string>('');
  selectedDomain = signal<string>('');
  selectedSort = signal<string>('updated');
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.loading.set(true);
    this.error.set(null);

    const filter: CatalogFilter = {
      query: this.searchQuery(),
      domain: this.selectedDomain() || undefined,
      sortBy: this.selectedSort() as any,
      page: this.page(),
      pageSize: this.pageSize()
    };

    this.catalogService.getCatalog(filter).subscribe({
      next: (res) => {
        this.manhuas.set(res.items);
        this.total.set(res.total);
        this.page.set(res.page);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Falha ao carregar catálogo. Por favor, verifique a conexão com o servidor.');
        this.loading.set(false);
      }
    });
  }

  onSearchInput(query: string): void {
    this.searchQuery.set(query);
    this.page.set(1);
    this.loadCatalog();
  }

  onDomainChange(domain: string): void {
    this.selectedDomain.set(domain);
    this.page.set(1);
    this.loadCatalog();
  }

  onSortChange(sort: string): void {
    this.selectedSort.set(sort);
    this.page.set(1);
    this.loadCatalog();
  }

  onPageChange(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages()) {
      this.page.set(newPage);
      this.loadCatalog();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedDomain.set('');
    this.selectedSort.set('updated');
    this.page.set(1);
    this.loadCatalog();
  }
}
