import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import type { UUID } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException({
        message: 'User with this email already exists',
      });
    }
    const user = this.userRepository.create(createUserDto);
    await this.userRepository.save(user);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  async findAll(query: any) {
    const limit = Math.max(parseInt(query.limit, 10) || 10, 1);
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const [rawUsers, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      order: { username: 'ASC' },
    });

    const items = rawUsers.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    }));

    return {
      items,
      page,
      limit,
      total,
      hasMore: skip + items.length < total,
    };
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    return user;
  }

  async findOne(id: UUID) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException({ message: 'User not found' });
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  async update(id: UUID, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException({ message: 'User not found' });
    }
    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);
    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
    };
  }

  async remove(id: UUID) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException({ message: 'User not found' });
    }
    await this.userRepository.remove(user);
    return { message: 'User removed successfully' };
  }

  async setRefreshToken(id: UUID, hashedRefreshToken: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException({ message: 'User not found' });
    }
    user.hashedRefreshToken = hashedRefreshToken;
    await this.userRepository.save(user);
  }
}
