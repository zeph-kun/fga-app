import { Controller, Get, Req } from '@nestjs/common';
import { DocumentsService, DocumentWithPermissionsDto } from './documents.service';
import { RequestWithUser } from '../auth/jwt-auth.guard';

@Controller()
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  /**
   * Documents visible by the *authenticated* user. Identity comes from the
   * access token; there is no userId parameter to forge.
   */
  @Get('documents')
  list(@Req() request: RequestWithUser): Promise<DocumentWithPermissionsDto[]> {
    return this.documents.listForUser(request.user.id);
  }
}
