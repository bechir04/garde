import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CausesService } from './causes.service';

@Controller('causes')
@UseGuards(AuthGuard('jwt'))
export class CausesController {
  constructor(private causesService: CausesService) {}

  @Get()
  findAll() {
    return this.causesService.findAll();
  }

  @Post()
  create(@Body('nameAr') nameAr: string) {
    return this.causesService.create(nameAr);
  }
}
