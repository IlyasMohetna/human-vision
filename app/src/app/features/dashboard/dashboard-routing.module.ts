import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';
import { UserResolver } from '../../core/resolvers/user.resolver';
import { RoleGuard } from '../../core/guards/role.guard';
import { Role } from '../auth/enums/role';

const routes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    resolve: { user: UserResolver },
    children: [
      {
        path: 'admin',
        loadChildren: () =>
          import('./admin/admin.module').then((m) => m.AdminModule),
        canLoad: [RoleGuard],
        data: { role: Role.Admin },
      },
      {
        path: 'user',
        loadChildren: () =>
          import('./user/user.module').then((m) => m.UserModule),
        canLoad: [RoleGuard],
        data: { role: Role.User },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
