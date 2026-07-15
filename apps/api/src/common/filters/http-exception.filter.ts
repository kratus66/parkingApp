import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || exception.name;
      } else {
        message = exceptionResponse;
        error = exception.name;
      }
    } else if (exception instanceof QueryFailedError) {
      // (H15/Sprint D) Traducir errores de PostgreSQL a códigos HTTP con sentido,
      // en vez de exponer un 500 con el QueryFailedError crudo.
      const pgCode = (exception as any).code as string | undefined;
      switch (pgCode) {
        case '23505': // unique_violation
          status = HttpStatus.CONFLICT;
          error = 'Conflict';
          message = 'El registro ya existe (viola una restricción de unicidad)';
          break;
        case '23503': // foreign_key_violation
          status = HttpStatus.CONFLICT;
          error = 'Conflict';
          message = 'La operación referencia un registro inexistente o en uso';
          break;
        case '22P02': // invalid_text_representation (p. ej. UUID malformado)
          status = HttpStatus.BAD_REQUEST;
          error = 'BadRequest';
          message = 'Formato de dato inválido en la solicitud';
          break;
        case '23502': // not_null_violation
          status = HttpStatus.BAD_REQUEST;
          error = 'BadRequest';
          message = 'Falta un campo obligatorio';
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          error = 'DatabaseError';
          message = 'Error de base de datos';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
