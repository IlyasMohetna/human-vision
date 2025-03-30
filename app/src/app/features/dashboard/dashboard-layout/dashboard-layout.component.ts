import { Component, OnInit } from '@angular/core';
import { UserRoutingModule } from '../user/user-routing.module';
import { SidebarComponent } from './sidebar/sidebar.component';
import {
  ActivatedRoute,
  ActivationEnd,
  NavigationEnd,
  Router,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-layout',
  imports: [CommonModule, UserRoutingModule, SidebarComponent],
  templateUrl: './dashboard-layout.component.html',
  styles: ``,
  standalone: true,
})
export class DashboardLayoutComponent {
  layout = true;
  showLayout = true;
  constructor(public router: Router, private route: ActivatedRoute) {
    this.router.events.subscribe((event) => {
      if (event instanceof ActivationEnd) {
        if (event.snapshot.data['showLayout'] !== undefined) {
          this.showLayout = event.snapshot.data['showLayout'];
        }
      }
    });
  }
}
