import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { UserService } from '../../../user/application/services/user.service';
import { HashingService } from './hashing.service';
import { TokenService } from './token.service';
import { EmailService } from '../../infrastructure/email/email.service';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { RegisterDto } from '../../presentation/dtos/register.dto';
import { LoginDto } from '../../presentation/dtos/login.dto';
import { AuthResponseDto } from '../../presentation/dtos/auth-response.dto';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import { EmailNotVerifiedException } from '../../domain/exceptions/email-not-verified.exception';
import { InvalidTokenException } from '../../domain/exceptions/invalid-token.exception';
import { TokenExpiredException } from '../../domain/exceptions/token-expired.exception';
import { UserNotFoundException } from '../../../user/domain/exceptions/user-not-found.exception';

/**
 * Core authentication service handling all auth-related business logic.
 * Manages registration, login, token refresh, password reset, and email verification.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user
   * @param registerDto Registration data
   * @returns Success message
   */
  /**
   * Register a new user
   * @param registerDto Registration data
   * @returns Success message
   */
  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { email, password, username } = registerDto;

    // Hash password
    const hashedPassword = await this.hashingService.hash(password);

    // Generate email verification token
    const emailVerificationToken = this.generateToken();

    // Create user
    const user = await this.userService.createUser({
      email,
      password: hashedPassword,
      username,
      emailVerificationToken,
      isEmailVerified: false,
    });

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        email,
        emailVerificationToken,
        username,
      );
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error.stack);
      // Don't throw error - user is created, they can request new verification email
    }

    this.logger.log(`User registered: ${user.id}`);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  // ... (verifyEmail and login methods unchanged in this block, but showing context)

  /**
   * Initiate password reset process
   * @param email User email
   * @returns Success message
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    // Find user (don't throw error if not found for security)
    const user = await this.userService.findByEmailOrNull(email);
    
    // Note: User requested to throw error if not found, but then decided to keep it secure.
    // Keeping generic message as per final instruction.
    if (!user) {
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate password reset token
    const resetToken = this.generateToken();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

    // Update user with reset token
    await this.userService.updateUser(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    // Send password reset email
    try {
      await this.emailService.sendPasswordResetEmail(
        email,
        resetToken,
        user.username,
      );
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error.stack);
    }

    this.logger.log(`Password reset requested for user: ${user.id}`);

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  /**
   * Reset user password with token
   * @param token Password reset token
   * @param newPassword New password
   * @returns Success message
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Find user by reset token
    const user = await this.userService.findByPasswordResetToken(token);

    // Check if token is expired
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new TokenExpiredException('Password reset token');
    }

    // Check if new password is same as old password
    const isSamePassword = await this.hashingService.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new InvalidCredentialsException('New password cannot be the same as the old password');
    }

    // Hash new password
    const hashedPassword = await this.hashingService.hash(newPassword);

    // Update user password and clear reset token
    await this.userService.updateUser(user.id, {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });

    // Invalidate all refresh tokens for security
    await this.refreshTokenRepository.deleteAllForUser(user.id);

    this.logger.log(`Password reset for user: ${user.id}`);

    return {
      message: 'Password reset successful. Please log in with your new password.',
    };
  }

  /**
   * Verify user email
   * @param token Email verification token
   * @returns Success message
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userService.verifyEmail(token);
    this.logger.log(`Email verified for user: ${user.id}`);

    return {
      message: 'Email verified successfully. You can now log in.',
    };
  }

  /**
   * Login user with email and password
   * @param loginDto Login credentials
   * @returns Auth response with tokens and user data
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userService.findByEmailOrNull(email);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    // Verify password
    const isPasswordValid = await this.hashingService.compare(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new EmailNotVerifiedException();
    }

    // Generate tokens
    const accessToken = await this.tokenService.generateAccessToken(
      user.id,
      user.email,
      user.role,
    );
    const refreshToken = await this.tokenService.generateRefreshToken(
      user.id,
      user.email,
      user.role,
    );

    // Store refresh token in database
    await this.refreshTokenRepository.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: this.tokenService.getRefreshTokenExpiration(),
    });

    this.logger.log(`User logged in: ${user.id}`);

    return new AuthResponseDto({
      accessToken,
      refreshToken,
      user: this.userService.toResponseDto(user),
    });
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken Refresh token
   * @returns New token pair
   */
  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify refresh token
    let payload;
    try {
      payload = await this.tokenService.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new InvalidTokenException('Refresh token');
    }

    // Check if refresh token exists in database
    const storedToken = await this.refreshTokenRepository.findByToken(refreshToken);
    if (!storedToken) {
      throw new InvalidTokenException('Refresh token');
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      await this.refreshTokenRepository.deleteByToken(refreshToken);
      throw new TokenExpiredException('Refresh token');
    }

    // Get user
    const user = await this.userService.findById(payload.sub);

    // Generate new tokens
    const newAccessToken = await this.tokenService.generateAccessToken(
      user.id,
      user.email,
      user.role,
    );
    const newRefreshToken = await this.tokenService.generateRefreshToken(
      user.id,
      user.email,
      user.role,
    );

    // Invalidate old refresh token and store new one (token rotation)
    await this.refreshTokenRepository.deleteByToken(refreshToken);
    await this.refreshTokenRepository.create({
      token: newRefreshToken,
      userId: user.id,
      expiresAt: this.tokenService.getRefreshTokenExpiration(),
    });

    this.logger.log(`Tokens refreshed for user: ${user.id}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user by invalidating refresh token
   * @param refreshToken Refresh token to invalidate
   * @returns Success message
   */
  async logout(refreshToken: string): Promise<{ message: string }> {
    await this.refreshTokenRepository.deleteByToken(refreshToken);
    this.logger.log('User logged out');

    return {
      message: 'Logged out successfully',
    };
  }

  /**
   * Validate user credentials (used by local strategy)
   * @param email User email
   * @param password User password
   * @returns User entity if valid
   */
  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmailOrNull(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.hashingService.compare(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Generate random token for email verification and password reset
   * @returns Random token string
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }
}
