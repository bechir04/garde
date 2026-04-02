import { PrismaService } from '../prisma/prisma.service';
export declare class LocationsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAllGovernorates(): Promise<{
        id: number;
        nameAr: string;
        code: string;
    }[]>;
    findCitiesByGovernorate(governorateId: number): Promise<{
        id: number;
        nameAr: string;
        governorateId: number;
    }[]>;
}
