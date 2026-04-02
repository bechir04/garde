import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    private audit;
    constructor(prisma: PrismaService, jwtService: JwtService, audit: AuditService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            username: string;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    refreshToken(token: string): Promise<{
        accessToken: string;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        createdAt: Date;
        username: string;
        fullName: string;
        role: import(".prisma/client").$Enums.UserRole;
    } | null>;
}
