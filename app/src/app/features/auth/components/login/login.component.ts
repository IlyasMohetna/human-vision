import { Component } from '@angular/core';
import { AuthService } from '../../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  standalone: true,
  styleUrl: './login.component.css',
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessages: string[] = [];

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    this.authService
      .login({ email: this.email, password: this.password })
      .subscribe({
        next: (response) => {
          this.authService.storeToken(response.token);
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.errorMessages = error.error.errors;
        },
      });
  }
}
