import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SettingsComponent } from './settings/settings.component';
import { StudioComponent } from './studio/studio.component';

export const USER_MENU = [
  { name: 'Analytics', route: 'user/home', icon: 'home' },
  { name: 'Studio', route: 'user/studio', icon: 'shopping-cart' },
  { name: 'Reviews', route: '/user/profile', icon: 'user' },
  { name: 'Settings', route: 'settings', icon: 'user-cog' },
];

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  {
    path: 'studio',
    component: StudioComponent,
    data: {
      showLayout: false,
      randomHash: () =>
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15),
    },
  },
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
