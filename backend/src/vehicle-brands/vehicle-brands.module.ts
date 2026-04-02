import { Module } from '@nestjs/common';
import { VehicleBrandsController } from './vehicle-brands.controller';
import { VehicleBrandsService } from './vehicle-brands.service';

@Module({
  controllers: [VehicleBrandsController],
  providers: [VehicleBrandsService],
  exports: [VehicleBrandsService],
})
export class VehicleBrandsModule {}
