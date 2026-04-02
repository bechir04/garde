import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehicleBrandsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.vehicleBrand.findMany({ orderBy: { nameAr: 'asc' } });
  }

  async create(nameAr: string) {
    return this.prisma.vehicleBrand.create({
      data: { nameAr: nameAr.trim(), nameEn: nameAr.trim() },
    });
  }
}
