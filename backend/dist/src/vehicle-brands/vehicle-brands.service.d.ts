import { PrismaService } from '../prisma/prisma.service';
export declare class VehicleBrandsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: number;
        nameAr: string;
        nameEn: string;
    }[]>;
    create(nameAr: string): Promise<{
        id: number;
        nameAr: string;
        nameEn: string;
    }>;
}
