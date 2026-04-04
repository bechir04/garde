import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('summary')
  getSummary(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('governorateId') governorateId?: string,
    @Query('cityId') cityId?: string,
  ) {
    return this.analyticsService.getSummary({
      dateFrom,
      dateTo,
      governorateId: governorateId ? parseInt(governorateId, 10) : undefined,
      cityId: cityId ? parseInt(cityId, 10) : undefined,
    });
  }

  @Get('by-governorate')
  getByGovernorate(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('governorateId') governorateId?: string,
    @Query('cityId') cityId?: string,
  ) {
    return this.analyticsService.getByGovernorate({
      dateFrom,
      dateTo,
      governorateId: governorateId ? parseInt(governorateId, 10) : undefined,
      cityId: cityId ? parseInt(cityId, 10) : undefined,
    });
  }

  @Get('by-city')
  getByCity(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('governorateId') governorateId?: string,
    @Query('cityId') cityId?: string,
  ) {
    return this.analyticsService.getByCity({
      dateFrom,
      dateTo,
      governorateId: governorateId ? parseInt(governorateId, 10) : undefined,
      cityId: cityId ? parseInt(cityId, 10) : undefined,
    });
  }

  @Get('by-cause')
  getByCause(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('governorateId') governorateId?: string,
    @Query('cityId') cityId?: string,
  ) {
    return this.analyticsService.getByCause({
      dateFrom,
      dateTo,
      governorateId: governorateId ? parseInt(governorateId, 10) : undefined,
      cityId: cityId ? parseInt(cityId, 10) : undefined,
    });
  }

  @Get('by-brand')
  getByBrand(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('governorateId') governorateId?: string,
    @Query('cityId') cityId?: string,
  ) {
    return this.analyticsService.getByBrand({
      dateFrom,
      dateTo,
      governorateId: governorateId ? parseInt(governorateId, 10) : undefined,
      cityId: cityId ? parseInt(cityId, 10) : undefined,
    });
  }

  @Get('by-month')
  getByMonth(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('governorateId') governorateId?: string,
    @Query('cityId') cityId?: string,
  ) {
    return this.analyticsService.getByMonth({
      dateFrom,
      dateTo,
      governorateId: governorateId ? parseInt(governorateId, 10) : undefined,
      cityId: cityId ? parseInt(cityId, 10) : undefined,
    });
  }

  @Get('by-hour')
  getByHour(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('governorateId') governorateId?: string,
    @Query('cityId') cityId?: string,
  ) {
    return this.analyticsService.getByHour({
      dateFrom,
      dateTo,
      governorateId: governorateId ? parseInt(governorateId, 10) : undefined,
      cityId: cityId ? parseInt(cityId, 10) : undefined,
    });
  }

  @Get('top-routes')
  getTopRoutes(
    @Query('limit') limit?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('governorateId') governorateId?: string,
    @Query('cityId') cityId?: string,
  ) {
    return this.analyticsService.getTopRoutes(limit || 10, {
      dateFrom,
      dateTo,
      governorateId: governorateId ? parseInt(governorateId, 10) : undefined,
      cityId: cityId ? parseInt(cityId, 10) : undefined,
    });
  }

  @Get('insights')
  getInsights() {
    return this.analyticsService.getInsights();
  }

  @Get('intelligence')
  getIntelligence(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('governorateId') governorateId?: string,
  ) {
    return this.analyticsService.getIntelligence({
      dateFrom,
      dateTo,
      governorateId: governorateId ? parseInt(governorateId, 10) : undefined,
    });
  }
}
