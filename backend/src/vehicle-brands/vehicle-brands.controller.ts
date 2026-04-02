import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VehicleBrandsService } from './vehicle-brands.service';

@Controller('vehicle-brands')
@UseGuards(AuthGuard('jwt'))
export class VehicleBrandsController {
  constructor(private vehicleBrandsService: VehicleBrandsService) {}

  @Get()
  findAll() {
    return this.vehicleBrandsService.findAll();
  }

  @Post()
  create(@Body('nameAr') nameAr: string) {
    return this.vehicleBrandsService.create(nameAr);
  }
}
