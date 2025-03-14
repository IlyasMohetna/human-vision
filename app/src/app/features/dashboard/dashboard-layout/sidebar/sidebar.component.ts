import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../auth/services/auth.service';
import { UserService } from '../../../auth/services/user.service';
import { Observable } from 'rxjs';
import { User } from '../../../auth/models/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  imports: [RouterModule, CommonModule],
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  isOpen = false;
  darkMode = false;
  currentUrl = '';
  user$: Observable<User | null>;

  menuItems = [
    { name: 'Dashboard Home', route: '/dashboard', icon: 'home' },
    { name: 'Settings', route: '/dashboard/settings', icon: 'settings' },
  ];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {
    this.user$ = this.userService.user$;

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl =
          (event as NavigationEnd).urlAfterRedirects || this.router.url;
      });
  }

  ngOnInit() {
    this.isOpen = window.innerWidth >= 768;

    this.darkMode =
      localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    this.applyTheme();
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', this.darkMode.toString());
    this.applyTheme();
  }

  logout() {
    this.authService.logout().subscribe();
  }

  toggleSidebar() {
    this.isOpen = !this.isOpen;
  }

  private applyTheme() {
    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  isActive(route: string): boolean {
    return this.currentUrl.startsWith(route);
  }
}
