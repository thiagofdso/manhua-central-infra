export interface CanonicalManhua {
  id: number;
  slug: string;
  title: string;
  alternativeTitles?: string;
  synopsis?: string;
  coverUrl?: string;
  primaryDomain: string;
  urlTemplate: string;
  lastChapter?: number;
  updateDay?: number;
  isHiatus: boolean;
  bayesianRating: number;
  totalVotes: number;
  totalViews: number;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogFilter {
  query?: string;
  domain?: string;
  updateDay?: number;
  isHiatus?: boolean;
  sortBy?: 'views' | 'rating' | 'title' | 'updated';
  page?: number;
  pageSize?: number;
}

export interface CatalogResponse {
  items: CanonicalManhua[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
