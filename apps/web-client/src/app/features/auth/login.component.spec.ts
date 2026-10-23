import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/auth/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthResponse } from '../../core/models/user.model';
import { provideRouter } from '@angular/router';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  const mockResponse: AuthResponse = {
    accessToken: 'token',
    refreshToken: 'refresh',
    expiresIn: 900,
    user: {
      id: 'uuid-1',
      email: 'test@example.com',
      displayName: 'Test',
      authProvider: 'email',
      role: 'reader'
    }
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'loginWithGoogle', 'isAuthenticated']);
    authServiceSpy.isAuthenticated.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create login component', () => {
    expect(component).toBeTruthy();
  });

  it('should submit login credentials successfully and navigate to profile', () => {
    authServiceSpy.login.and.returnValue(of(mockResponse));

    component.email = 'test@example.com';
    component.password = 'password123';
    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(router.navigate).toHaveBeenCalledWith(['/profile']);
  });

  it('should display error message when login fails', () => {
    authServiceSpy.login.and.returnValue(throwError(() => ({
      error: { error: 'Credenciais inválidas' }
    })));

    component.email = 'test@example.com';
    component.password = 'wrong';
    component.onSubmit();

    expect(component.errorMessage()).toBe('Credenciais inválidas');
    expect(component.loading()).toBeFalse();
  });
});
