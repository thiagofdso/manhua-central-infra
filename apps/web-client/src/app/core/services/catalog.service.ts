import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CanonicalManhua, CatalogFilter, CatalogResponse } from '../models/catalog.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/catalog';

  getCatalog(filter?: CatalogFilter): Observable<CatalogResponse> {
    let params = new HttpParams();

    if (filter) {
      if (filter.query) {
        params = params.set('q', filter.query);
      }
      if (filter.domain) {
        params = params.set('domain', filter.domain);
      }
      if (filter.updateDay !== undefined && filter.updateDay !== null) {
        params = params.set('update_day', filter.updateDay.toString());
      }
      if (filter.isHiatus !== undefined && filter.isHiatus !== null) {
        params = params.set('is_hiatus', filter.isHiatus.toString());
      }
      if (filter.sortBy) {
        params = params.set('sort', filter.sortBy);
      }
      if (filter.page) {
        params = params.set('page', filter.page.toString());
      }
      if (filter.pageSize) {
        params = params.set('page_size', filter.pageSize.toString());
      }
    }

    return this.http.get<CatalogResponse>(this.baseUrl, { params });
  }

  getBySlug(slug: string): Observable<CanonicalManhua> {
    return this.http.get<CanonicalManhua>(`${this.baseUrl}/${encodeURIComponent(slug)}`);
  }
}
