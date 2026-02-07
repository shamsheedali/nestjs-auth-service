import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtConfig } from '../../../../config/jwt.config';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

/**
 * Service for generating and validating JWT tokens.
 * Handles both access tokens (short-lived) and refresh tokens (long-lived).
 */
@Injectable()
export class TokenService {
  private readonly jwtConfig: JwtConfig;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtConfig = this.configService.get<JwtConfig>('jwt')!;
  }

  /**
   * Generate an access token
   * @param userId User UUID
   * @param email User email
   * @param role User role
   * @returns JWT access token
   */
  async generateAccessToken(
    userId: string,
    email: string,
    role: string,
  ): Promise<string> {
    const payload: TokenPayload = {
      sub: userId,
      email,
      role,
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      secret: this.jwtConfig.secret,
      expiresIn: this.jwtConfig.expiresIn as any,
    });
  }

  /**
   * Generate a refresh token
   * @param userId User UUID
   * @param email User email
   * @param role User role
   * @returns JWT refresh token
   */
  async generateRefreshToken(
    userId: string,
    email: string,
    role: string,
  ): Promise<string> {
    const payload: TokenPayload = {
      sub: userId,
      email,
      role,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      secret: this.jwtConfig.refreshSecret,
      expiresIn: this.jwtConfig.refreshExpiresIn as any,
    });
  }

  /**
   * Verify and decode an access token
   * @param token JWT access token
   * @returns Decoded token payload
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verify(token, {
      secret: this.jwtConfig.secret,
    });
  }

  /**
   * Verify and decode a refresh token
   * @param token JWT refresh token
   * @returns Decoded token payload
   */
  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verify(token, {
      secret: this.jwtConfig.refreshSecret,
    });
  }

  /**
   * Calculate expiration date for refresh token
   * @returns Date when refresh token expires
   */
  getRefreshTokenExpiration(): Date {
    const expiresIn = this.jwtConfig.refreshExpiresIn;
    const days = parseInt(expiresIn.replace('d', ''));
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    return expirationDate;
  }
}
