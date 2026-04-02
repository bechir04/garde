import { Response } from 'express';
import { ImportService } from './import.service';
export declare class ImportController {
    private importService;
    constructor(importService: ImportService);
    upload(file: Express.Multer.File, userId: string, defaultGovernorateId?: string): Promise<{
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
    commit(id: string, userId: string): Promise<{
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
    getJobRows(id: string, page?: number, limit?: number): Promise<{
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
    downloadTemplate(res: Response): Promise<void>;
}
