import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async findAllGovernorates() {
    return this.prisma.governorate.findMany({ orderBy: { nameAr: 'asc' } });
  }

  async findCitiesByGovernorate(governorateId: number) {
    return this.prisma.city.findMany({
      where: { governorateId },
      orderBy: { nameAr: 'asc' },
    });
  }
}
