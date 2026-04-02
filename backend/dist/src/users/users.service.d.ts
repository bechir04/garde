import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        username: string;
        fullName: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
    }[]>;
    create(data: {
        username: string;
        password: string;
        fullName: string;
        role: UserRole;
    }): Promise<{
        id: string;
        username: string;
        fullName: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    update(id: string, data: {
        fullName?: string;
        role?: UserRole;
        isActive?: boolean;
        password?: string;
    }): Promise<{
        id: string;
        username: string;
        fullName: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
    }>;
}
