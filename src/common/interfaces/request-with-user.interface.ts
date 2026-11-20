import { Request } from 'express';

/**
 * Extended Express Request interface with user property.
 * User is attached by Passport JWT strategy after authentication.
 */
export interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}
