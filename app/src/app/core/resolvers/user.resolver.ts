import { Injectable } from '@angular/core';
import { Resolve, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, filter, take, tap } from 'rxjs/operators';
import { UserService } from '../../features/auth/services/user.service';
import { User } from '../../features/auth/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserResolver implements Resolve<User | null> {
  constructor(private userService: UserService, private router: Router) {}

  resolve(): Observable<User | null> {
    const currentUser = this.userService.getUser();
    if (currentUser) {
      return of(currentUser);
    }

    this.userService.fetchUser();

    return this.userService.user$.pipe(
      filter((user) => !!user),
      take(1),
      tap((user) => {
        console.log('UserResolver: User loaded:', user);
      }),
      catchError((err) => {
        console.error('UserResolver: Error fetching user:', err);
        this.router.navigate(['/login']);
        return of(null);
      })
    );
  }
}
