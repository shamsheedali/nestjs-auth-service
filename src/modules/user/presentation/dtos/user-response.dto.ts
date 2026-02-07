import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../user/domain/entities/user.entity';

export class UserResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User UUID',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({ example: 'johndoe', description: 'User username' })
  username: string;

  @ApiProperty({ example: true, description: 'Is email verified' })
  isEmailVerified: boolean;

  @ApiProperty({
    example: 'user',
    enum: UserRole,
    description: 'User role',
  })
  role: UserRole;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Account creation timestamp',
  })
  createdAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
