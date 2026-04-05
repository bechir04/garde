import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() body: { username: string; password: string; fullName: string; role: UserRole }) {
    return this.usersService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: { fullName?: string; role?: UserRole; isActive?: boolean; password?: string }) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
