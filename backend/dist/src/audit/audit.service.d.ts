import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(data: {
        action: string;
        entity: string;
        entityId?: string;
        userId: string;
        details?: Record<string, unknown>;
    }): Promise<{
        id: string;
        action: string;
        entityType: string;
        entityId: string;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        userId: string;
    }>;
    findAll(query: {
        page?: number;
        limit?: number;
        userId?: string;
        action?: string;
        entity?: string;
    }): Promise<{
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
