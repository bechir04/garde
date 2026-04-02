import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAccidentDto, UpdateAccidentDto, AccidentQueryDto } from './dto/accident.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AccidentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private readonly includeRelations = {
    governorate: true,
    city: true,
    cause: true,
    vehicleBrand1: true,
    vehicleBrand2: true,
    createdBy: { select: { id: true, fullName: true } },
  };

  async findAll(query: AccidentQueryDto) {
    const { page = 1, limit = 20, search, governorateId, causeId, brandId, dateFrom, dateTo, sortBy = 'accidentDate', sortOrder = 'desc' } = query;

    const where: Prisma.AccidentWhereInput = { deletedAt: null };

    if (governorateId) where.governorateId = governorateId;
    if (causeId) where.causeId = causeId;
    if (brandId) {
      where.OR = [{ vehicleBrand1Id: brandId }, { vehicleBrand2Id: brandId }];
    }
    if (dateFrom || dateTo) {
      where.accidentDate = {};
      if (dateFrom) (where.accidentDate as Prisma.DateTimeFilter).gte = new Date(dateFrom);
      if (dateTo) (where.accidentDate as Prisma.DateTimeFilter).lte = new Date(dateTo);
    }
    if (search) {
      where.AND = [
        {
          OR: [
            { route: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { governorate: { nameAr: { contains: search, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const orderBy: Prisma.AccidentOrderByWithRelationInput = {};
    const validSortFields = ['accidentDate', 'deathsCount', 'injuriesCount', 'createdAt'];
    if (validSortFields.includes(sortBy)) {
      (orderBy as Record<string, string>)[sortBy] = sortOrder;
    } else {
      orderBy.accidentDate = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.accident.findMany({
        where,
        include: this.includeRelations,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.accident.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const accident = await this.prisma.accident.findFirst({
      where: { id, deletedAt: null },
      include: this.includeRelations,
    });
    if (!accident) throw new NotFoundException('الحادث غير موجود');
    return accident;
  }

  async create(dto: CreateAccidentDto, userId: string) {
    const accident = await this.prisma.accident.create({
      data: {
        accidentDate: new Date(dto.accidentDate),
        accidentTime: dto.accidentTime,
        governorateId: dto.governorateId,
        cityId: dto.cityId,
        route: dto.route,
        kilometrePoint: dto.kilometrePoint,
        causeId: dto.causeId,
        vehicleBrand1Id: dto.vehicleBrand1Id,
        vehicleBrand2Id: dto.vehicleBrand2Id,
        deathsCount: dto.deathsCount,
        injuriesCount: dto.injuriesCount,
        description: dto.description,
        createdById: userId,
      },
      include: this.includeRelations,
    });

    await this.audit.log({
      action: 'CREATE', entity: 'ACCIDENT', entityId: accident.id, userId,
      details: { route: accident.route, accidentDate: dto.accidentDate, deathsCount: dto.deathsCount, injuriesCount: dto.injuriesCount },
    });
    return accident;
  }

  async update(id: string, dto: UpdateAccidentDto, userId: string) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.accidentDate) data.accidentDate = new Date(dto.accidentDate);

    const accident = await this.prisma.accident.update({
      where: { id },
      data,
      include: this.includeRelations,
    });

    await this.audit.log({
      action: 'UPDATE', entity: 'ACCIDENT', entityId: id, userId,
      details: { changedFields: Object.keys(dto) },
    });
    return accident;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id);
    const result = await this.prisma.accident.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.log({ action: 'DELETE', entity: 'ACCIDENT', entityId: id, userId, details: { softDeleted: true } });
    return result;
  }
}
