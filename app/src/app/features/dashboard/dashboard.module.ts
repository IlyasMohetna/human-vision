import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';
import { SettingsComponent } from './user/settings/settings.component';
import { HomeComponent } from './user/home/home.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    DashboardLayoutComponent,
    SettingsComponent,
    HomeComponent,
  ],
})
export class DashboardModule {}
