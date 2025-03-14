import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

export const USER_MENU = [
  { name: 'User Dashboard', route: '/user', icon: 'home' },
  { name: 'Profile', route: '/user/profile', icon: 'user' },
  { name: 'Orders', route: '/user/orders', icon: 'shopping-cart' },
];

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserRoutingModule {}
