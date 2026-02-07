import { User } from '../entities/user.entity';

/**
 * Repository interface for User entity operations.
 * Defines the contract for user data access layer.
 */
export interface IUserRepository {
  /**
   * Create a new user
   * @param user Partial user data
   * @returns Created user entity
   */
  create(user: Partial<User>): Promise<User>;

  /**
   * Find user by ID
   * @param id User UUID
   * @returns User entity or null if not found
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email address
   * @param email User email
   * @returns User entity or null if not found
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by email verification token
   * @param token Email verification token
   * @returns User entity or null if not found
   */
  findByEmailVerificationToken(token: string): Promise<User | null>;

  /**
   * Find user by password reset token
   * @param token Password reset token
   * @returns User entity or null if not found
   */
  findByPasswordResetToken(token: string): Promise<User | null>;

  /**
   * Update user data
   * @param id User UUID
   * @param data Partial user data to update
   * @returns Updated user entity
   */
  update(id: string, data: Partial<User>): Promise<User>;

  /**
   * Soft delete user
   * @param id User UUID
   */
  delete(id: string): Promise<void>;
}
