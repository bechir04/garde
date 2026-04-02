import { UsersService } from './users.service';
import { UserRole } from '@prisma/client';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        username: string;
        fullName: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
    }[]>;
    create(body: {
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
    update(id: string, body: {
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
