import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../../services/auth.service';

interface MenuItem {
  name: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styles: ``,
})
export class SidebarComponent implements OnInit {
  isOpen = false;
  darkMode = false;
  currentUrl = '';

  menuItems: MenuItem[] = [
    { name: 'Dashboard Home', route: '/dashboard' },
    { name: 'Settings', route: '/dashboard/settings' },
  ];

  constructor(private authService: AuthService, private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl = event.urlAfterRedirects || event.url;
      });
  }

  ngOnInit() {
    this.isOpen = window.innerWidth >= 768;

    this.currentUrl = this.router.url;

    this.darkMode =
      localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    this.applyTheme();
  }

  toggleSidebar() {
    this.isOpen = !this.isOpen;
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', this.darkMode.toString());
    this.applyTheme();
  }

  logout() {
    this.authService.clearToken();
    this.router.navigate(['/login']);
  }

  private applyTheme() {
    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  isActive(route: string): boolean {
    if (
      route === '/dashboard' &&
      (this.currentUrl === '/dashboard' ||
        this.currentUrl === '/dashboard/home')
    ) {
      return true;
    }

    if (route !== '/dashboard' && this.currentUrl.startsWith(route)) {
      return true;
    }

    return false;
  }
}
