import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SettingsComponent } from './settings/settings.component';
import { StudioComponent } from './studio/studio.component';

export const USER_MENU = [
  { name: 'Analytics', route: '/user', icon: 'home' },
  { name: 'Studio', route: '/dashboard/studio', icon: 'shopping-cart' },
  { name: 'Reviews', route: '/user/profile', icon: 'user' },
  { name: 'Settings', route: '/user/settings', icon: 'user-cog' },
];

const routes: Routes = [
  { path: 'analytics', component: HomeComponent },
  { path: 'studio', component: StudioComponent, data: { showLayout: false } },
  {
    path: 'settings',
    component: SettingsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserRoutingModule {}
