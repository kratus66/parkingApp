import { PartialType } from '@nestjs/swagger';
import { CreateTicketTemplateDto } from './create-ticket-template.dto';

export class UpdateTicketTemplateDto extends PartialType(CreateTicketTemplateDto) {}
