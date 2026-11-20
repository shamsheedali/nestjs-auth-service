import { RefreshToken } from '../entities/refresh-token.entity';

/**
 * Repository interface for RefreshToken entity operations.
 * Defines the contract for refresh token data access layer.
 */
export interface IRefreshTokenRepository {
  /**
   * Create a new refresh token
   * @param token Partial refresh token data
   * @returns Created refresh token entity
   */
  create(token: Partial<RefreshToken>): Promise<RefreshToken>;

  /**
   * Find refresh token by token string
   * @param token Token string
   * @returns RefreshToken entity or null if not found
   */
  findByToken(token: string): Promise<RefreshToken | null>;

  /**
   * Delete refresh token by token string
   * @param token Token string
   */
  deleteByToken(token: string): Promise<void>;

  /**
   * Delete all refresh tokens for a specific user
   * @param userId User UUID
   */
  deleteAllForUser(userId: string): Promise<void>;

  /**
   * Delete all expired refresh tokens
   */
  deleteExpired(): Promise<void>;
}
