import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ImportComponent } from './import/import.component';

export const ADMIN_MENU = [
  { name: 'Dashboard', route: 'admin/dashboard', icon: 'dashboard' },
  { name: 'Import Data', route: 'admin/import', icon: 'download' },
];

const routes: Routes = [
  {
    path: 'dashboard',
    component: HomeComponent,
  },
  {
    path: 'import',
    component: ImportComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
