import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './features/auth/services/auth.service';
import { UserService } from './features/auth/services/user.service';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'app';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    library: FaIconLibrary
  ) {
    library.addIconPacks(fas);
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.userService.fetchUser();
    }
  }
}
