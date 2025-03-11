import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';
import { SettingsComponent } from './settings/settings.component';

@NgModule({
  imports: [
    CommonModule,
    DashboardRoutingModule,
    DashboardComponent,
    SidebarMenuComponent,
    SettingsComponent,
  ],
})
export class DashboardModule {}
