import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'حدث خطأ غير متوقع في الخادم';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message;
      if (Array.isArray(message)) message = message.join(' | ');
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(`Prisma error ${exception.code}: ${exception.message}`);
      switch (exception.code) {
        case 'P2002':
          message = `قيمة مكررة: الحقل "${(exception.meta?.target as string[])?.join(', ')}" يجب أن يكون فريداً`;
          status = HttpStatus.CONFLICT;
          break;
        case 'P2003':
          message = `خطأ في الربط: المرجع "${exception.meta?.field_name}" غير موجود`;
          status = HttpStatus.BAD_REQUEST;
          break;
        case 'P2025':
          message = 'السجل المطلوب غير موجود';
          status = HttpStatus.NOT_FOUND;
          break;
        default:
          message = `خطأ في قاعدة البيانات (${exception.code}): ${exception.message}`;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.error(`Prisma validation error: ${exception.message}`);
      message = `خطأ في بيانات الطلب: ${exception.message.split('\n').pop()?.trim() ?? exception.message}`;
      status = HttpStatus.BAD_REQUEST;
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
      message = exception.message;
    }

    response.status(status).json({ statusCode: status, message });
  }
}
