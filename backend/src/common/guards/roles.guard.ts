import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      return false;
    }
    // SUPER_ADMIN has absolute universal access to all routes without exception
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }
    // ADMIN has universal clinical & operational access, unless a route is strictly SUPER_ADMIN exclusive
    if (user.role === Role.ADMIN) {
      if (requiredRoles.length === 1 && requiredRoles[0] === Role.SUPER_ADMIN) {
        return false;
      }
      return true;
    }
    return requiredRoles.includes(user.role);
  }
}
