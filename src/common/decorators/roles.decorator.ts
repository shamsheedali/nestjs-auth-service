import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/user/domain/entities/user.entity';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route.
 * Use with RolesGuard.
 * 
 * @example
 * @Roles(UserRole.ADMIN)
 * @Get('admin-only')
 * async adminRoute() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
