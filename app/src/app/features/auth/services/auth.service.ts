import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private userService!: UserService;

  constructor(
    private http: HttpClient,
    private router: Router,
    private injector: Injector
  ) {}

  private get userServiceInstance(): UserService {
    if (!this.userService) {
      this.userService = this.injector.get(UserService);
    }
    return this.userService;
  }

  login(credentials: {
    email: string;
    password: string;
  }): Observable<{ token: string }> {
    return this.http
      .post<{ token: string }>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          this.storeToken(response.token);
          this.userServiceInstance.fetchUser();
        })
      );
  }

  logout(): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/auth/logout`, { withCredentials: true })
      .pipe(
        tap(() => {
          this.destroySession();
        })
      );
  }

  destroySession(): void {
    this.clearToken();
    this.userServiceInstance.clearUser();
    this.router.navigate(['/login']);
  }

  storeToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  clearToken(): void {
    localStorage.removeItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
