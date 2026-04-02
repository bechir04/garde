"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccidentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let AccidentsService = class AccidentsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
        this.includeRelations = {
            governorate: true,
            city: true,
            cause: true,
            vehicleBrand1: true,
            vehicleBrand2: true,
            createdBy: { select: { id: true, fullName: true } },
        };
    }
    async findAll(query) {
        const { page = 1, limit = 20, search, governorateId, causeId, brandId, dateFrom, dateTo, sortBy = 'accidentDate', sortOrder = 'desc' } = query;
        const where = { deletedAt: null };
        if (governorateId)
            where.governorateId = governorateId;
        if (causeId)
            where.causeId = causeId;
        if (brandId) {
            where.OR = [{ vehicleBrand1Id: brandId }, { vehicleBrand2Id: brandId }];
        }
        if (dateFrom || dateTo) {
            where.accidentDate = {};
            if (dateFrom)
                where.accidentDate.gte = new Date(dateFrom);
            if (dateTo)
                where.accidentDate.lte = new Date(dateTo);
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
        const orderBy = {};
        const validSortFields = ['accidentDate', 'deathsCount', 'injuriesCount', 'createdAt'];
        if (validSortFields.includes(sortBy)) {
            orderBy[sortBy] = sortOrder;
        }
        else {
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
    async findOne(id) {
        const accident = await this.prisma.accident.findFirst({
            where: { id, deletedAt: null },
            include: this.includeRelations,
        });
        if (!accident)
            throw new common_1.NotFoundException('الحادث غير موجود');
        return accident;
    }
    async create(dto, userId) {
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
    async update(id, dto, userId) {
        await this.findOne(id);
        const data = { ...dto };
        if (dto.accidentDate)
            data.accidentDate = new Date(dto.accidentDate);
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
    async remove(id, userId) {
        await this.findOne(id);
        const result = await this.prisma.accident.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        await this.audit.log({ action: 'DELETE', entity: 'ACCIDENT', entityId: id, userId, details: { softDeleted: true } });
        return result;
    }
};
exports.AccidentsService = AccidentsService;
exports.AccidentsService = AccidentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], AccidentsService);
//# sourceMappingURL=accidents.service.js.map