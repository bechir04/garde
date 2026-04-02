import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LocationsModule } from './locations/locations.module';
import { CausesModule } from './causes/causes.module';
import { VehicleBrandsModule } from './vehicle-brands/vehicle-brands.module';
import { AccidentsModule } from './accidents/accidents.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ImportModule } from './import/import.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    LocationsModule,
    CausesModule,
    VehicleBrandsModule,
    AccidentsModule,
    AnalyticsModule,
    ImportModule,
    AuditModule,
  ],
})
export class AppModule {}
