import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CatalogService } from './catalog.service';
import { CatalogResponse, CanonicalManhua } from '../models/catalog.model';

describe('CatalogService', () => {
  let service: CatalogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CatalogService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(CatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch catalog with query params', () => {
    const mockResponse: CatalogResponse = {
      items: [
        {
          id: 1,
          slug: 'overgeared',
          title: 'Overgeared',
          primaryDomain: 'asurascans.com',
          urlTemplate: 'https://asurascans.com/comics/overgeared/chapter/{chapter}',
          isHiatus: false,
          bayesianRating: 9.5,
          totalVotes: 100,
          totalViews: 5000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1
    };

    service.getCatalog({ query: 'over', domain: 'asurascans.com', page: 1, pageSize: 20 }).subscribe((res: CatalogResponse) => {
      expect(res.total).toBe(1);
      expect(res.items[0].title).toBe('Overgeared');
    });

    const req = httpMock.expectOne(req =>
      req.url === '/api/catalog' &&
      req.params.get('q') === 'over' &&
      req.params.get('domain') === 'asurascans.com'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch a single manhua by slug', () => {
    const mockManhua: CanonicalManhua = {
      id: 1,
      slug: 'overgeared',
      title: 'Overgeared',
      primaryDomain: 'asurascans.com',
      urlTemplate: 'https://asurascans.com/comics/overgeared/chapter/{chapter}',
      isHiatus: false,
      bayesianRating: 9.5,
      totalVotes: 100,
      totalViews: 5000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    service.getBySlug('overgeared').subscribe((res: CanonicalManhua) => {
      expect(res.slug).toBe('overgeared');
      expect(res.title).toBe('Overgeared');
    });

    const req = httpMock.expectOne('/api/catalog/overgeared');
    expect(req.request.method).toBe('GET');
    req.flush(mockManhua);
  });
});
