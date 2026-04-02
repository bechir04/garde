import { Controller, Post, Get, Param, Query, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ImportService } from './import.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('import')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OFFICER)
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Query('defaultGovernorateId') defaultGovernorateId?: string,
  ) {
    if (!file) throw new Error('الملف مطلوب');
    const govId = defaultGovernorateId ? parseInt(defaultGovernorateId, 10) : undefined;
    console.log('[Import] defaultGovernorateId received:', govId);
    return this.importService.parseExcel(file.buffer, file.originalname, userId, govId);
  }

  @Post(':id/commit')
  async commit(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.importService.commitJob(id, userId);
  }

  @Get('jobs')
  async getJobs() {
    return this.importService.getJobs();
  }

  @Get('jobs/:id/rows')
  async getJobRows(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.importService.getJobRows(id, page || 1, limit || 50);
  }

  @Get('template')
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.importService.generateTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=template_accidents.xlsx');
    res.send(buffer);
  }
}
