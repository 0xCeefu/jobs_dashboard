import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { UUID } from 'crypto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException({ message: 'User not found' });
    }
    const isPasswordMatch = await argon2.verify(user.password, password);
    if (isPasswordMatch) {
      const { password, hashedRefreshToken, ...result } = user;
      return result;
    }
    throw new UnauthorizedException({ message: 'Invalid credentials' });
  }

  async getJwtToken(user: any) {
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('secret.refreshToken'),
      expiresIn: '7d',
    });
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.usersService.setRefreshToken(user.id, hashedRefreshToken);
    return { accessToken, refreshToken };
  }

  async validateRefreshToken(email: string, refreshToken: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException({ message: 'Invalid refresh token' });
    }
    const isRefreshTokenValid = await argon2.verify(
      user.hashedRefreshToken,
      refreshToken,
    );
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException({ message: 'Invalid refresh token' });
    }
    const { password, hashedRefreshToken, ...result } = user;
    return result;
  }

  async handleOAuthLogin(oAuthUser: CreateUserDto) {
    const email = oAuthUser.email;
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      const { password, hashedRefreshToken, ...result } = existingUser;
      return result;
    }
    const newUser = await this.usersService.create(oAuthUser);
    return newUser;
  }

  async register(registerUserDto: RegisterUserDto) {
    const user = await this.usersService.create(registerUserDto);
    const token = await this.getJwtToken(user);
    return { ...user, ...token };
  }
}
