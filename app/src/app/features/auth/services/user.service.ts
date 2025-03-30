import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable, catchError, of } from 'rxjs';
import { User } from '../models/user.model';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.apiUrl;
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$: Observable<User | null> = this.userSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {}

  fetchUser(): void {
    this.http
      .get<User>(`${this.apiUrl}/me`)
      .pipe(
        catchError(() => {
          this.authService.destroySession();
          return of(null);
        })
      )
      .subscribe((user) => {
        this.userSubject.next(user);
      });
  }

  refreshUser(): void {
    this.fetchUser();
  }

  getUser(): User | null {
    return this.userSubject.value;
  }

  clearUser(): void {
    this.userSubject.next(null);
  }
}
