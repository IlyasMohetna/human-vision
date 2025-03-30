import { Injectable } from '@angular/core';
import { CanLoad, Route, UrlSegment, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { UserService } from '../../features/auth/services/user.service';
import { Role } from '../../features/auth/enums/role';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanLoad {
  constructor(private userService: UserService, private router: Router) {}

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> {
    const requiredRole = route.data?.['role'] as Role;

    console.log('RoleGuard: Checking role', requiredRole);

    if (!requiredRole) {
      console.error('No role specified for route', route);
      return of(false);
    }

    const currentUser = this.userService.getUser();

    // If we already have the user, check the role
    if (currentUser) {
      console.log(
        `RoleGuard: User exists, role=${currentUser.role}, required=${requiredRole}`
      );
      const hasAccess = currentUser.role === requiredRole;
      if (!hasAccess) {
        this.navigateByRole(currentUser.role);
      }
      return of(hasAccess);
    }

    // Otherwise subscribe to user$ to get the user once it's loaded
    return this.userService.user$.pipe(
      take(1),
      map((user) => {
        if (!user) {
          console.log('RoleGuard: No user, redirecting to login');
          this.router.navigate(['/login']);
          return false;
        }

        console.log(
          `RoleGuard: Got user, role=${user.role}, required=${requiredRole}`
        );
        const hasAccess = user.role === requiredRole;
        if (!hasAccess) {
          this.navigateByRole(user.role);
        }
        return hasAccess;
      })
    );
  }

  private navigateByRole(role: Role): void {
    // Redirect to the appropriate module based on user's actual role
    if (role === Role.Admin) {
      this.router.navigate(['/dashboard/admin']);
    } else {
      this.router.navigate(['/dashboard/user']);
    }
  }
}
