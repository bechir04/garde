import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
interface JwtPayload {
    sub: string;
    username: string;
    role: string;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: JwtPayload): Promise<{
        id: string;
        username: string;
        role: import(".prisma/client").$Enums.UserRole;
        fullName: string;
    }>;
}
export {};
