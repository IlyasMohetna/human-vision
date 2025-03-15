import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SettingsComponent } from './settings/settings.component';

export const USER_MENU = [
  { name: 'Analytics', route: '/user', icon: 'home' },
  { name: 'Studio', route: '/user/orders', icon: 'shopping-cart' },
  { name: 'Reviews', route: '/user/profile', icon: 'user' },
  { name: 'Settings', route: '/user/settings', icon: 'user-cog' },
];

const routes: Routes = [
  { path: 'home', component: HomeComponent, data: { showLayout: true } },
  {
    path: 'settings',
    component: SettingsComponent,
    data: { showLayout: false },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserRoutingModule {}
