import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: { action: string; entity: string; entityId?: string; userId: string; details?: Record<string, unknown> }) {
    return this.prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entity,
        entityId: data.entityId ?? 'system',
        userId: data.userId,
        details: data.details as any,
      },
    });
  }

  async findAll(query: { page?: number; limit?: number; userId?: string; action?: string; entity?: string }) {
    const pageNum = Math.max(1, parseInt(String(query.page ?? 1)));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20))));
    const { userId, action, entity } = query;

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entityType = entity;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { fullName: true, username: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
  }
}
