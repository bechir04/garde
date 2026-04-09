import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
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

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body('nameAr') nameAr: string) {
    return this.vehicleBrandsService.update(id, nameAr);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleBrandsService.delete(id);
  }
}
