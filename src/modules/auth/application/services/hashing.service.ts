import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/**
 * Service for hashing and comparing passwords using Argon2.
 * Argon2 is the winner of the Password Hashing Competition and is
 * more secure than bcrypt against GPU-based attacks.
 */
@Injectable()
export class HashingService {
  /**
   * Hash a password using Argon2id
   * @param password Plain text password
   * @returns Hashed password
   */
  async hash(password: string): Promise<string> {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });
  }

  /**
   * Compare a plain text password with a hashed password
   * @param password Plain text password
   * @param hash Hashed password
   * @returns True if passwords match, false otherwise
   */
  async compare(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      return false;
    }
  }
}
