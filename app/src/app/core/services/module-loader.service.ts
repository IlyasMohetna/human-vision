import { Injectable } from '@angular/core';
import { UserService } from '../../features/auth/services/user.service';
import { Role } from '../../features/auth/enums/role';

@Injectable({
  providedIn: 'root',
})
export class ModuleLoaderService {
  constructor(private userService: UserService) {}

  loadModuleForRole() {
    const user = this.userService.getUser();
    console.log('ModuleLoaderService - Current user:', user);

    if (user && user.role === Role.Admin) {
      return import('../../features/dashboard/admin/admin.module').then(
        (m) => m.AdminModule
      );
    } else {
      return import('../../features/dashboard/user/user.module').then(
        (m) => m.UserModule
      );
    }
  }
}
