import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthResponse, User } from '../models/user.model';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: 'user-uuid-1234',
    email: 'reader@example.com',
    displayName: 'Solo Reader',
    authProvider: 'email',
    role: 'reader'
  };

  const mockAuthResponse: AuthResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 900,
    user: mockUser
  };

  beforeEach(() => {
    localStorage.clear();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created and initial state unauthenticated', () => {
    expect(service).toBeTruthy();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  it('should login successfully and update signals and localStorage', () => {
    service.login({ email: 'reader@example.com', password: 'password123' }).subscribe(res => {
      expect(res).toEqual(mockAuthResponse);
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.currentUser()?.email).toBe('reader@example.com');
      expect(service.accessToken()).toBe('mock-access-token');
      expect(localStorage.getItem('mmp_access_token')).toBe('mock-access-token');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);
  });

  it('should authenticate with Google ID token', () => {
    service.loginWithGoogle('google-id-token-xyz').subscribe(res => {
      expect(res.user.email).toBe('reader@example.com');
      expect(service.isAuthenticated()).toBeTrue();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/google`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ idToken: 'google-id-token-xyz' });
    req.flush(mockAuthResponse);
  });

  it('should logout and clear localStorage and signals', () => {
    // Seed logged in state
    localStorage.setItem('mmp_access_token', 'token');
    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
    expect(service.accessToken()).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should call delete account and trigger logout', () => {
    service.deleteAccount().subscribe(() => {
      expect(service.isAuthenticated()).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users/me`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should fetch current user and update signal', () => {
    service.fetchCurrentUser().subscribe(user => {
      expect(user.email).toBe('reader@example.com');
      expect(service.currentUser()?.email).toBe('reader@example.com');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });
});
