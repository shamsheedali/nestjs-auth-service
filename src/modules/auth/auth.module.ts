import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RefreshToken } from './domain/entities/refresh-token.entity';
import { RefreshTokenRepository } from './infrastructure/persistence/refresh-token.repository';
import { EmailService } from './infrastructure/email/email.service';
import { EmailTemplateService } from './infrastructure/email/email-template.service';
import { AuthService } from './application/services/auth.service';
import { HashingService } from './application/services/hashing.service';
import { TokenService } from './application/services/token.service';
import { AuthController } from './presentation/controllers/auth.controller';
import { LocalStrategy } from './presentation/strategies/local.strategy';
import { JwtStrategy } from './presentation/strategies/jwt.strategy';
import { JwtRefreshStrategy } from './presentation/strategies/jwt-refresh.strategy';
import { UserModule } from '../user/user.module';

/**
 * Auth module encapsulating all authentication functionality.
 * Includes JWT strategies, token management, and email services.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret',
        signOptions: {
          expiresIn: (configService.get<string>('jwt.expiresIn') || '15m') as any,
        },
      }),
      inject: [ConfigService],
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    HashingService,
    TokenService,
    EmailService,
    EmailTemplateService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    {
      provide: 'IRefreshTokenRepository',
      useClass: RefreshTokenRepository,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
