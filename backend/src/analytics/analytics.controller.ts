import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('summary')
  getSummary() {
    return this.analyticsService.getSummary();
  }

  @Get('by-governorate')
  getByGovernorate() {
    return this.analyticsService.getByGovernorate();
  }

  @Get('by-cause')
  getByCause() {
    return this.analyticsService.getByCause();
  }

  @Get('by-brand')
  getByBrand() {
    return this.analyticsService.getByBrand();
  }

  @Get('by-month')
  getByMonth() {
    return this.analyticsService.getByMonth();
  }

  @Get('by-hour')
  getByHour() {
    return this.analyticsService.getByHour();
  }

  @Get('top-routes')
  getTopRoutes(@Query('limit') limit?: number) {
    return this.analyticsService.getTopRoutes(limit || 10);
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
