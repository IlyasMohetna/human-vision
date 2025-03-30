import { Role } from '../enums/role';

export interface User {
  firstname: string;
  lastname: string;
  email: string;
  role: Role;
}
