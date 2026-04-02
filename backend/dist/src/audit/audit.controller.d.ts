import { AuditService } from './audit.service';
export declare class AuditController {
    private auditService;
    constructor(auditService: AuditService);
    findAll(page?: number, limit?: number, userId?: string, action?: string, entity?: string): Promise<{
        data: ({
            user: {
                username: string;
                fullName: string;
            };
        } & {
            id: string;
            action: string;
            entityType: string;
            entityId: string;
            details: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            userId: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
