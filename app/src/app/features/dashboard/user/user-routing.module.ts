import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

export const USER_MENU = [
  { name: 'Analytics', route: '/user', icon: 'home' },
  { name: 'Studio', route: '/user/orders', icon: 'shopping-cart' },
  { name: 'Reviews', route: '/user/profile', icon: 'user' },
  { name: 'Settings', route: '/user/settings', icon: 'user-cog' },
];

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserRoutingModule {}
