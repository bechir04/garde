import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccidentsService } from './accidents.service';
import { CreateAccidentDto, UpdateAccidentDto, AccidentQueryDto } from './dto/accident.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('accidents')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AccidentsController {
  constructor(private accidentsService: AccidentsService) {}

  @Get()
  findAll(@Query() query: AccidentQueryDto) {
    return this.accidentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accidentsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  create(@Body() dto: CreateAccidentDto, @CurrentUser('id') userId: string) {
    return this.accidentsService.create(dto, userId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  update(@Param('id') id: string, @Body() dto: UpdateAccidentDto, @CurrentUser('id') userId: string) {
    return this.accidentsService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.accidentsService.remove(id, userId);
  }
}
