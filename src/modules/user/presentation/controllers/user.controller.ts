import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { UserService } from '../../application/services/user.service';
import { UserRole } from '../../domain/entities/user.entity';
import { UserResponseDto } from '../dtos/user-response.dto';

/**
 * User controller for user-related endpoints.
 * Handles user profile and user management operations.
 */
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get current user profile (alternative endpoint to /auth/me)
   */
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyProfile(@CurrentUser() user: any): Promise<UserResponseDto> {
    const fullUser = await this.userService.findById(user.id);
    return this.userService.toResponseDto(fullUser);
  }

  /**
   * Get user by ID (admin only)
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@CurrentUser() user: any): Promise<UserResponseDto> {
    const foundUser = await this.userService.findById(user.id);
    return this.userService.toResponseDto(foundUser);
  }
}
