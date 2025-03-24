import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

export const ADMIN_MENU = [
  { name: 'Dashboard', route: 'admin/dashboard', icon: 'dashboard' },
];

const routes: Routes = [
  {
    path: 'dashboard',
    component: HomeComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
