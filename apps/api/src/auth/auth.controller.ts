import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Public } from './decorators/public.decorator';
import { LocalAuthGuard } from './guards/localAuth.guard';
import { AuthService } from './auth.service';
import { RefreshJwtGuard } from './guards/refreshJwt.guard';
import { GoogleOAuthGuard } from './guards/googleOauth.guard';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req): Promise<AuthResponseDto> {
    const user = req.user;
    const token = await this.authService.getJwtToken(user);
    return { ...user, ...token };
  }

  @Public()
  @Post('register')
  async register(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<AuthResponseDto> {
    return this.authService.register(registerUserDto);
  }

  @Public()
  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  async refresh(@Request() req): Promise<AuthResponseDto> {
    const user = req.user;
    const token = await this.authService.getJwtToken(user);
    return { ...user, ...token };
  }

  @Get('me')
  async me(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Public()
  @UseGuards(GoogleOAuthGuard)
  @Get('google/login')
  async googleLogin() {}

  @Public()
  @UseGuards(GoogleOAuthGuard)
  @Get('google/callback')
  async googleLoginCallback(
    @Request() req,
    @Query('state') state: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const user = req.user;
    const token = await this.authService.getJwtToken(user);
    const authPayload: AuthResponseDto = { ...user, ...token };

    const next = state && state.startsWith('/') ? state : '/';
    const payload = Buffer.from(JSON.stringify(authPayload), 'utf-8').toString(
      'base64url',
    );

    const webUrl = this.configService.get<string>('client.webUrl')!;
    const callbackUrl = new URL('/user/oauth/callback', webUrl);
    callbackUrl.searchParams.set('payload', payload);
    callbackUrl.searchParams.set('next', next);

    res.redirect(callbackUrl.toString());
  }
}
