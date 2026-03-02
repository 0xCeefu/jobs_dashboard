import { IsEmail, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../enum/user.enum';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  role?: UserRole;
}
