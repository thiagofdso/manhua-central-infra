import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse, LoginRequest, RegisterRequest, GoogleAuthRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = environment.apiUrl;
  private readonly ACCESS_TOKEN_KEY = 'mmp_access_token';
  private readonly REFRESH_TOKEN_KEY = 'mmp_refresh_token';
  private readonly USER_KEY = 'mmp_user';

  // Reactive state via Angular Signals
  readonly currentUser = signal<User | null>(this.getStoredUser());
  readonly accessToken = signal<string | null>(this.getStoredToken(this.ACCESS_TOKEN_KEY));
  readonly refreshToken = signal<string | null>(this.getStoredToken(this.REFRESH_TOKEN_KEY));
  readonly isAuthenticated = computed(() => !!this.currentUser());

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, data).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    const payload: GoogleAuthRequest = { idToken };
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/google`, payload).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  refresh(): Observable<AuthResponse> {
    const currentRefresh = this.refreshToken();
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/refresh`, { refreshToken: currentRefresh }).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.router.navigate(['/login']);
  }

  deleteAccount(): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/users/me`).pipe(
      tap(() => this.logout())
    );
  }

  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/users/me`).pipe(
      tap(user => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
  }

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));

    this.accessToken.set(response.accessToken);
    this.refreshToken.set(response.refreshToken);
    this.currentUser.set(response.user);
  }

  private getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private getStoredToken(key: string): string | null {
    return localStorage.getItem(key);
  }
}
