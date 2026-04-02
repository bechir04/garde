import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAccidentDto, UpdateAccidentDto, AccidentQueryDto } from './dto/accident.dto';
import { Prisma } from '@prisma/client';
export declare class AccidentsService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private readonly includeRelations;
    findAll(query: AccidentQueryDto): Promise<{
        data: ({
            governorate: {
                id: number;
                nameAr: string;
                code: string;
            };
            city: {
                id: number;
                nameAr: string;
                governorateId: number;
            } | null;
            cause: {
                id: number;
                nameAr: string;
                code: string;
            };
            vehicleBrand1: {
                id: number;
                nameAr: string;
                nameEn: string;
            } | null;
            vehicleBrand2: {
                id: number;
                nameAr: string;
                nameEn: string;
            } | null;
            createdBy: {
                id: string;
                fullName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            governorateId: number;
            accidentDate: Date;
            accidentTime: string;
            cityId: number | null;
            route: string | null;
            kilometrePoint: Prisma.Decimal | null;
            causeId: number;
            vehicleBrand1Id: number | null;
            vehicleBrand2Id: number | null;
            deathsCount: number;
            injuriesCount: number;
            description: string | null;
            metadata: Prisma.JsonValue | null;
            importJobId: string | null;
            createdById: string;
            deletedAt: Date | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        governorate: {
            id: number;
            nameAr: string;
            code: string;
        };
        city: {
            id: number;
            nameAr: string;
            governorateId: number;
        } | null;
        cause: {
            id: number;
            nameAr: string;
            code: string;
        };
        vehicleBrand1: {
            id: number;
            nameAr: string;
            nameEn: string;
        } | null;
        vehicleBrand2: {
            id: number;
            nameAr: string;
            nameEn: string;
        } | null;
        createdBy: {
            id: string;
            fullName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        governorateId: number;
        accidentDate: Date;
        accidentTime: string;
        cityId: number | null;
        route: string | null;
        kilometrePoint: Prisma.Decimal | null;
        causeId: number;
        vehicleBrand1Id: number | null;
        vehicleBrand2Id: number | null;
        deathsCount: number;
        injuriesCount: number;
        description: string | null;
        metadata: Prisma.JsonValue | null;
        importJobId: string | null;
        createdById: string;
        deletedAt: Date | null;
    }>;
    create(dto: CreateAccidentDto, userId: string): Promise<{
        governorate: {
            id: number;
            nameAr: string;
            code: string;
        };
        city: {
            id: number;
            nameAr: string;
            governorateId: number;
        } | null;
        cause: {
            id: number;
            nameAr: string;
            code: string;
        };
        vehicleBrand1: {
            id: number;
            nameAr: string;
            nameEn: string;
        } | null;
        vehicleBrand2: {
            id: number;
            nameAr: string;
            nameEn: string;
        } | null;
        createdBy: {
            id: string;
            fullName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        governorateId: number;
        accidentDate: Date;
        accidentTime: string;
        cityId: number | null;
        route: string | null;
        kilometrePoint: Prisma.Decimal | null;
        causeId: number;
        vehicleBrand1Id: number | null;
        vehicleBrand2Id: number | null;
        deathsCount: number;
        injuriesCount: number;
        description: string | null;
        metadata: Prisma.JsonValue | null;
        importJobId: string | null;
        createdById: string;
        deletedAt: Date | null;
    }>;
    update(id: string, dto: UpdateAccidentDto, userId: string): Promise<{
        governorate: {
            id: number;
            nameAr: string;
            code: string;
        };
        city: {
            id: number;
            nameAr: string;
            governorateId: number;
        } | null;
        cause: {
            id: number;
            nameAr: string;
            code: string;
        };
        vehicleBrand1: {
            id: number;
            nameAr: string;
            nameEn: string;
        } | null;
        vehicleBrand2: {
            id: number;
            nameAr: string;
            nameEn: string;
        } | null;
        createdBy: {
            id: string;
            fullName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        governorateId: number;
        accidentDate: Date;
        accidentTime: string;
        cityId: number | null;
        route: string | null;
        kilometrePoint: Prisma.Decimal | null;
        causeId: number;
        vehicleBrand1Id: number | null;
        vehicleBrand2Id: number | null;
        deathsCount: number;
        injuriesCount: number;
        description: string | null;
        metadata: Prisma.JsonValue | null;
        importJobId: string | null;
        createdById: string;
        deletedAt: Date | null;
    }>;
    remove(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        governorateId: number;
        accidentDate: Date;
        accidentTime: string;
        cityId: number | null;
        route: string | null;
        kilometrePoint: Prisma.Decimal | null;
        causeId: number;
        vehicleBrand1Id: number | null;
        vehicleBrand2Id: number | null;
        deathsCount: number;
        injuriesCount: number;
        description: string | null;
        metadata: Prisma.JsonValue | null;
        importJobId: string | null;
        createdById: string;
        deletedAt: Date | null;
    }>;
}
