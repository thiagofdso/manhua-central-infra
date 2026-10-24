import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { ProfileComponent } from './features/profile/profile.component';
import { CatalogListComponent } from './features/catalog/catalog-list.component';
import { CatalogDetailComponent } from './features/catalog/catalog-detail.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'catalog', pathMatch: 'full' },
  { path: 'catalog', component: CatalogListComponent },
  { path: 'catalog/:slug', component: CatalogDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'catalog' }
];
