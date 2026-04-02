import { Module } from '@nestjs/common';
import { AccidentsController } from './accidents.controller';
import { AccidentsService } from './accidents.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AccidentsController],
  providers: [AccidentsService],
  exports: [AccidentsService],
})
export class AccidentsModule {}
