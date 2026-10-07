import { Controller, Get } from '@nestjs/common';
import { DirectoryService } from './directory.service';

@Controller()
export class DirectoryController {
  constructor(private readonly directory: DirectoryService) {}

  @Get('users')
  users() {
    return this.directory.listUsers();
  }

  @Get('groups')
  groups() {
    return this.directory.listGroups();
  }

  @Get('folders')
  folders() {
    return this.directory.listFolders();
  }
}
