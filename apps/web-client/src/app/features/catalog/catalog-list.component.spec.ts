import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { CatalogListComponent } from './catalog-list.component';
import { CatalogService } from '../../core/services/catalog.service';
import { AuthService } from '../../core/auth/auth.service';
import { CatalogResponse } from '../../core/models/catalog.model';

describe('CatalogListComponent', () => {
  let component: CatalogListComponent;
  let fixture: ComponentFixture<CatalogListComponent>;
  let mockCatalogService: jasmine.SpyObj<CatalogService>;

  const mockResponse: CatalogResponse = {
    items: [
      {
        id: 1,
        slug: 'overgeared',
        title: 'Overgeared',
        primaryDomain: 'asurascans.com',
        urlTemplate: 'https://asurascans.com/comics/overgeared/chapter/{chapter}',
        lastChapter: 344,
        isHiatus: false,
        bayesianRating: 9.52,
        totalVotes: 1450,
        totalViews: 280000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        slug: 'almighty-pig',
        title: 'Almighty Pig Slaughtering Knife',
        primaryDomain: 'ravenscans.org',
        urlTemplate: 'https://ravenscans.org/knife-chapter-{chapter}/',
        lastChapter: 66,
        isHiatus: false,
        bayesianRating: 8.70,
        totalVotes: 340,
        totalViews: 78000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    total: 2,
    page: 1,
    pageSize: 20,
    totalPages: 1
  };

  beforeEach(async () => {
    mockCatalogService = jasmine.createSpyObj('CatalogService', ['getCatalog']);
    mockCatalogService.getCatalog.and.returnValue(of(mockResponse));

    await TestBed.configureTestingModule({
      imports: [CatalogListComponent],
      providers: [
        provideRouter([]),
        { provide: CatalogService, useValue: mockCatalogService },
        { provide: AuthService, useValue: { isAuthenticated: () => false, currentUser: signal(null) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load catalog items on init', () => {
    expect(component).toBeTruthy();
    expect(mockCatalogService.getCatalog).toHaveBeenCalled();
    expect(component.manhuas().length).toBe(2);
    expect(component.manhuas()[0].title).toBe('Overgeared');
  });

  it('should filter by domain when domain button is clicked', () => {
    component.onDomainChange('asurascans.com');
    expect(component.selectedDomain()).toBe('asurascans.com');
    expect(mockCatalogService.getCatalog).toHaveBeenCalledWith(jasmine.objectContaining({
      domain: 'asurascans.com'
    }));
  });

  it('should update search query and reload catalog', () => {
    component.onSearchInput('pig');
    expect(component.searchQuery()).toBe('pig');
    expect(mockCatalogService.getCatalog).toHaveBeenCalledWith(jasmine.objectContaining({
      query: 'pig'
    }));
  });
});
