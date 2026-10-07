import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FgaService } from '../fga/fga.service';

export interface UserDto {
  id: string;
  name: string;
  email: string;
  color: string;
}

export interface GroupDto {
  id: string;
  name: string;
  members: { type: 'user' | 'group'; id: string }[];
}

export interface FolderDto {
  id: string;
  name: string;
}

@Injectable()
export class DirectoryService {
  constructor(
    private readonly db: PrismaService,
    private readonly fga: FgaService,
  ) {}

  async listUsers(): Promise<UserDto[]> {
    return this.db.user.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, name: true, email: true, color: true },
    });
  }

  /** Group members come from OpenFGA tuples (single source of truth). */
  async listGroups(): Promise<GroupDto[]> {
    const groups = await this.db.group.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, name: true },
    });
    return Promise.all(
      groups.map(async (group) => {
        const tuples = await this.fga.listTuples('group', group.id);
        return {
          id: group.id,
          name: group.name,
          members: tuples
            .filter((tuple) => tuple.relation === 'member')
            .map((tuple) => ({
              type: tuple.subject.type === 'group' ? ('group' as const) : ('user' as const),
              id: tuple.subject.id,
            })),
        };
      }),
    );
  }

  async listFolders(): Promise<FolderDto[]> {
    return this.db.folder.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, name: true },
    });
  }
}
