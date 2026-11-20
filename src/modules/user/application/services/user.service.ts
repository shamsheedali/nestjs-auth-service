import { Injectable, Inject, Logger } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { EmailAlreadyExistsException } from '../../domain/exceptions/email-already-exists.exception';
import { UserResponseDto } from '../../presentation/dtos/user-response.dto';

/**
 * Service handling user-related business logic.
 * Manages user CRUD operations and profile management.
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Create a new user
   * @param userData Partial user data
   * @returns Created user entity
   * @throws EmailAlreadyExistsException if email already exists
   */
  async createUser(userData: Partial<User>): Promise<User> {
    // Check if email already exists
    if (!userData.email) {
      throw new Error('Email is required');
    }
    
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new EmailAlreadyExistsException(userData.email);
    }

    const user = await this.userRepository.create(userData);
    this.logger.log(`User created with ID: ${user.id}`);
    return user;
  }

  /**
   * Find user by ID
   * @param id User UUID
   * @returns User entity
   * @throws UserNotFoundException if user not found
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundException(id);
    }
    return user;
  }

  /**
   * Find user by email
   * @param email User email
   * @returns User entity
   * @throws UserNotFoundException if user not found
   */
  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UserNotFoundException(email);
    }
    return user;
  }

  /**
   * Find user by email (returns null if not found)
   * @param email User email
   * @returns User entity or null
   */
  async findByEmailOrNull(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  /**
   * Update user data
   * @param id User UUID
   * @param data Partial user data
   * @returns Updated user entity
   */
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const user = await this.userRepository.update(id, data);
    this.logger.log(`User updated: ${id}`);
    return user;
  }

  /**
   * Verify user email
   * @param token Email verification token
   * @returns Updated user entity
   * @throws UserNotFoundException if token is invalid
   */
  async verifyEmail(token: string): Promise<User> {
    const user = await this.userRepository.findByEmailVerificationToken(token);
    if (!user) {
      throw new UserNotFoundException();
    }

    return await this.userRepository.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: undefined,
    });
  }

  /**
   * Find user by password reset token
   * @param token Password reset token
   * @returns User entity
   * @throws UserNotFoundException if token is invalid
   */
  async findByPasswordResetToken(token: string): Promise<User> {
    const user = await this.userRepository.findByPasswordResetToken(token);
    if (!user) {
      throw new UserNotFoundException();
    }
    return user;
  }

  /**
   * Convert User entity to UserResponseDto
   * @param user User entity
   * @returns UserResponseDto
   */
  /**
   * Convert User entity to UserResponseDto
   * @param user User entity
   * @returns UserResponseDto
   */
  toResponseDto(user: User): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      email: user.email,
      username: user.username,
      isEmailVerified: user.isEmailVerified,
      role: user.role,
      createdAt: user.createdAt,
    });
  }
}
