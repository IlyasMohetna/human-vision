import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

export const USER_MENU = [
  { name: 'Analytics', route: '/user', icon: 'chart-pie' },
  { name: 'Studio', route: '/user/orders', icon: 'desktop' },
  { name: 'Reviews', route: '/user/profile', icon: 'magnifying-glass' },
  { name: 'Settings', route: '/user/settings', icon: 'gear' },
];

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserRoutingModule {}
