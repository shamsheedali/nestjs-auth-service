import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '../../application/services/auth.service';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { VerifyEmailDto } from '../dtos/verify-email.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { Public } from '../../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { UserService } from '../../../user/application/services/user.service';
import { Throttle } from '@nestjs/throttler';

/**
 * Authentication controller handling all auth-related endpoints.
 * Includes registration, login, token management, and password reset.
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  /**
   * Register a new user account
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully. Verification email sent.',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  /**
   * Verify user email with token
   */
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 404, description: 'Invalid verification token' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await this.authService.verifyEmail(verifyEmailDto.token);
  }

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address via link' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  async verifyEmailLink(@Query('token') token: string, @Res() res: Response): Promise<void> {
    await this.authService.verifyEmail(token);
    const html = `
      <html>
        <head>
          <title>Email Verified</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; }
            .card { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
            h1 { color: #10b981; }
            p { color: #6b7280; }
            a { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Email Verified!</h1>
            <p>Your email has been successfully verified.</p>
            <p>You can now close this window and login to the application.</p>
          </div>
        </body>
      </html>
    `;
    res.header('Content-Type', 'text/html');
    res.send(html);
  }

  /**
   * Login with email and password
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Email not verified' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<AuthResponseDto, 'refreshToken'>> {
    const authResponse = await this.authService.login(loginDto);
    
    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', authResponse.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: 'strict',
      path: '/api/v1/auth', // Scope to auth routes
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return response without refresh token in body
    const { refreshToken, ...response } = authResponse;
    return response;
  }

  /**
   * Refresh access token using refresh token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: RefreshTokenDto, 
  ) {
    const refreshToken = req.cookies?.refreshToken || body.refreshToken;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    // Set new refresh token in cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: tokens.accessToken };
  }

  /**
   * Logout user by invalidating refresh token
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: RefreshTokenDto,
  ) {
    const refreshToken = req.cookies?.refreshToken || body.refreshToken;

    if (refreshToken) {
        await this.authService.logout(refreshToken);
    }
    
    // Clear cookie
    res.clearCookie('refreshToken', {
      path: '/api/v1/auth',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * Request password reset email
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent if account exists',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto.email);
  }

  /**
   * Reset password with token
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
  }

  @Public()
  @Get('reset-password')
  @ApiOperation({ summary: 'Show reset password form' })
  @ApiResponse({ status: 200, description: 'Reset password form' })
  async resetPasswordForm(@Query('token') token: string, @Res() res: Response): Promise<void> {
    const html = `
      <html>
        <head>
          <title>Reset Password</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; }
            .card { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
            h1 { color: #333; margin-bottom: 20px; text-align: center; font-size: 24px; }
            form { display: flex; flex-direction: column; gap: 20px; }
            .form-group { display: flex; flex-direction: column; gap: 8px; }
            label { font-size: 14px; color: #666; font-weight: 500; }
            input { padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; transition: border-color 0.2s; }
            input:focus { border-color: #4f46e5; outline: none; }
            button { padding: 12px; background: #4f46e5; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
            button:hover { background: #4338ca; }
            button:disabled { background: #9ca3af; cursor: not-allowed; }
            #message { margin-top: 15px; text-align: center; font-size: 14px; min-height: 20px; }
            .success { color: #10b981; }
            .error { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Reset Password</h1>
            <form id="resetForm" onsubmit="return false;">
              <input type="hidden" id="token" value="${token}">
              <div class="form-group">
                <label for="password">New Password</label>
                <input type="password" id="password" placeholder="Enter new password" required minlength="8">
              </div>
              <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input type="password" id="confirmPassword" placeholder="Confirm new password" required minlength="8">
              </div>
              <button type="submit" id="submitBtn">Reset Password</button>
            </form>
            <div id="message"></div>
            
            <script>
              const form = document.getElementById('resetForm');
              const messageDiv = document.getElementById('message');
              const submitBtn = document.getElementById('submitBtn');
              
              form.addEventListener('submit', async (e) => {
                e.preventDefault();
                messageDiv.textContent = '';
                messageDiv.className = '';
                
                const token = document.getElementById('token').value;
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                if (password !== confirmPassword) {
                  showMessage('Passwords do not match', 'error');
                  return;
                }
                
                if (password.length < 8) {
                  showMessage('Password must be at least 8 characters long', 'error');
                  return;
                }
                
                // Disable button
                submitBtn.disabled = true;
                submitBtn.textContent = 'Resetting...';
                
                try {
                  const response = await fetch('/api/v1/auth/reset-password', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Accept': 'application/json'
                    },
                    body: JSON.stringify({ token, password })
                  });
                  
                  const data = await response.json();
                  
                  if (response.ok) {
                    showMessage('Password reset successful! Redirecting to login...', 'success');
                    form.reset();
                    // Optional: You could redirect here if you had a login page
                    // setTimeout(() => window.location.href = '/login', 2000);
                  } else {
                    showMessage(data.message || 'Failed to reset password', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Reset Password';
                  }
                } catch (error) {
                  console.error('Error:', error);
                  showMessage('An error occurred. Please try again.', 'error');
                  submitBtn.disabled = false;
                  submitBtn.textContent = 'Reset Password';
                }
              });
              
              function showMessage(text, type) {
                messageDiv.textContent = text;
                messageDiv.className = type;
              }
            </script>
          </div>
        </body>
      </html>
    `;
    res.header('Content-Type', 'text/html');
    res.send(html);
  }

  /**
   * Get current authenticated user
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: any) {
    const fullUser = await this.userService.findById(user.id);
    return this.userService.toResponseDto(fullUser);
  }
}
