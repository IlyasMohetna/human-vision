import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

export const ADMIN_MENU = [
  { name: 'Admin Dashboard', route: '/admin', icon: 'dashboard' },
  { name: 'User Management', route: '/admin/users', icon: 'users' },
  { name: 'Reports', route: '/admin/reports', icon: 'chart' },
];

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
