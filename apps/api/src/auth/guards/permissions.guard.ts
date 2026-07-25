import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';

/** Le Super Administrateur possède "l'ensemble des droits" (Ch.3.3) et contourne ce contrôle. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const user: AuthenticatedUser = context.switchToHttp().getRequest().user;
    if (user.roles.includes('SUPER_ADMIN')) {
      return true;
    }

    const granted = user.administratorPermissions ?? [];
    return required.every((permission) => granted.includes(permission));
  }
}
