import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private darkModeSubject = new BehaviorSubject<boolean>(
    localStorage.getItem('darkMode') === 'true'
  );
  darkMode$ = this.darkModeSubject.asObservable();

  constructor() {
    this.applyTheme();
  }

  toggleDarkMode(): void {
    const newDarkMode = !this.darkModeSubject.value;
    this.darkModeSubject.next(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    this.applyTheme();
  }

  private applyTheme() {
    if (this.darkModeSubject.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
