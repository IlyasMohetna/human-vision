import { Component } from '@angular/core';
import { UserRoutingModule } from '../user/user-routing.module';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard-layout',
  imports: [UserRoutingModule, SidebarComponent],
  templateUrl: './dashboard-layout.component.html',
  styles: ``,
  standalone: true,
})
export class DashboardLayoutComponent {}
