import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../auth/services/auth.service';
import { UserService } from '../../../auth/services/user.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { User } from '../../../auth/models/user.model';
import { ADMIN_MENU } from '../../admin/admin-routing.module';
import { USER_MENU } from '../../user/user-routing.module';
import { Role } from '../../../auth/enums/role';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  standalone: true,
  imports: [RouterModule, CommonModule, FontAwesomeModule],
})
export class SidebarComponent implements OnInit {
  isOpen = false;
  currentUrl = '';
  user$: Observable<User | null>;
  darkMode$: Observable<boolean>;
  private menuItemsSubject = new BehaviorSubject<
    { name: string; route: string; icon: string }[]
  >([]);
  menuItems$ = this.menuItemsSubject.asObservable();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private themeService: ThemeService,
    private router: Router
  ) {
    this.user$ = this.userService.user$;
    this.darkMode$ = this.themeService.darkMode$;

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl =
          (event as NavigationEnd).urlAfterRedirects || this.router.url;
      });
  }

  ngOnInit() {
    this.isOpen = window.innerWidth >= 768;

    this.user$.subscribe((user) => {
      if (user) {
        this.setMenuByRole(user.role);
      }
    });
  }

  setMenuByRole(role: Role) {
    switch (role) {
      case Role.Admin:
        this.menuItemsSubject.next(ADMIN_MENU);
        break;
      case Role.User:
        this.menuItemsSubject.next(USER_MENU);
        break;
      default:
        this.menuItemsSubject.next([]);
        break;
    }
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }

  logout() {
    this.authService.logout().subscribe();
  }

  toggleSidebar() {
    this.isOpen = !this.isOpen;
  }

  isActive(route: string): boolean {
    return this.currentUrl.startsWith(route);
  }
}
