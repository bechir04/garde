import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LocationsService } from './locations.service';

@Controller('locations')
@UseGuards(AuthGuard('jwt'))
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  @Get('governorates')
  findAllGovernorates() {
    return this.locationsService.findAllGovernorates();
  }

  @Get('cities')
  findCities(@Query('governorateId') governorateId: number) {
    return this.locationsService.findCitiesByGovernorate(governorateId);
  }
}
