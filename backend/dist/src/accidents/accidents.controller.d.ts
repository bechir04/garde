import { AccidentsService } from './accidents.service';
import { CreateAccidentDto, UpdateAccidentDto, AccidentQueryDto } from './dto/accident.dto';
export declare class AccidentsController {
    private accidentsService;
    constructor(accidentsService: AccidentsService);
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
            kilometrePoint: import("@prisma/client/runtime/library").Decimal | null;
            causeId: number;
            vehicleBrand1Id: number | null;
            vehicleBrand2Id: number | null;
            deathsCount: number;
            injuriesCount: number;
            description: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
        kilometrePoint: import("@prisma/client/runtime/library").Decimal | null;
        causeId: number;
        vehicleBrand1Id: number | null;
        vehicleBrand2Id: number | null;
        deathsCount: number;
        injuriesCount: number;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
        kilometrePoint: import("@prisma/client/runtime/library").Decimal | null;
        causeId: number;
        vehicleBrand1Id: number | null;
        vehicleBrand2Id: number | null;
        deathsCount: number;
        injuriesCount: number;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
        kilometrePoint: import("@prisma/client/runtime/library").Decimal | null;
        causeId: number;
        vehicleBrand1Id: number | null;
        vehicleBrand2Id: number | null;
        deathsCount: number;
        injuriesCount: number;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
        kilometrePoint: import("@prisma/client/runtime/library").Decimal | null;
        causeId: number;
        vehicleBrand1Id: number | null;
        vehicleBrand2Id: number | null;
        deathsCount: number;
        injuriesCount: number;
        description: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        importJobId: string | null;
        createdById: string;
        deletedAt: Date | null;
    }>;
}
