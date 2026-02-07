import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Refresh guard.
 * Protects refresh token endpoints.
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
