import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from '../../application/services/token.service';
import { UserService } from '../../../user/application/services/user.service';

/**
 * JWT strategy for validating access tokens.
 * Extracts user from token payload and attaches to request.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'default-secret',
    });
  }

  async validate(payload: TokenPayload) {
    // Fetch fresh user data from database
    const user = await this.userService.findById(payload.sub);
    
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
