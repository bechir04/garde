import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, username: true, fullName: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: { username: string; password: string; fullName: string; role: UserRole }) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        username: data.username,
        passwordHash,
        fullName: data.fullName,
        role: data.role,
      },
      select: { id: true, username: true, fullName: true, role: true },
    });
  }

  async update(id: string, data: { fullName?: string; role?: UserRole; isActive?: boolean; password?: string }) {
    const updateData: Record<string, unknown> = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.role) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, username: true, fullName: true, role: true, isActive: true },
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
      select: { id: true, username: true },
    });
  }
}
