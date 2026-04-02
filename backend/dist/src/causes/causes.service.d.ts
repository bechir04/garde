import { PrismaService } from '../prisma/prisma.service';
export declare class CausesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: number;
        nameAr: string;
        code: string;
    }[]>;
    create(nameAr: string): Promise<{
        id: number;
        nameAr: string;
        code: string;
    }>;
}
