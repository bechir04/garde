import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CausesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.accidentCause.findMany({ orderBy: { nameAr: 'asc' } });
  }

  async create(nameAr: string) {
    const code = `CUSTOM_${Date.now()}`;
    return this.prisma.accidentCause.create({ data: { nameAr: nameAr.trim(), code } });
  }
}
