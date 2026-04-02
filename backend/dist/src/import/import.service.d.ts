import { PrismaService } from '../prisma/prisma.service';
export declare class ImportService {
    private prisma;
    constructor(prisma: PrismaService);
    parseExcel(buffer: Buffer, fileName: string, userId: string, defaultGovernorateId?: number): Promise<{
        importJobId: string;
        totalRows: number;
        validRows: number;
        invalidRows: number;
        preview: {
            rowNumber: number;
            isValid: boolean;
            errors: string[];
            data: {
                accidentDate?: string;
                accidentTime?: string;
                governorateId?: number;
                cityId?: number;
                route?: string;
                kilometrePoint?: number;
                causeId?: number;
                vehicleBrand1Id?: number;
                vehicleBrand2Id?: number;
                deathsCount?: number;
                injuriesCount?: number;
                description?: string;
            };
        }[];
    }>;
    commitJob(importJobId: string, userId: string): Promise<{
        committed: number;
        total: number;
    }>;
    getJobs(): Promise<({
        createdBy: {
            fullName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        createdById: string;
        fileName: string;
        totalRows: number;
        validRows: number;
        invalidRows: number;
        status: import(".prisma/client").$Enums.ImportJobStatus;
    })[]>;
    getJobRows(jobId: string, page?: number, limit?: number): Promise<{
        data: {
            id: string;
            createdAt: Date;
            importJobId: string;
            isValid: boolean;
            accidentId: string | null;
            rowNumber: number;
            rawData: import("@prisma/client/runtime/library").JsonValue;
            errors: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    generateTemplate(): Promise<Buffer>;
}
