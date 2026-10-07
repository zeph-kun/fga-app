import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
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
    private readonly db: DatabaseService,
    private readonly fga: FgaService,
  ) {}

  async listUsers(): Promise<UserDto[]> {
    const { rows } = await this.db.query<UserDto>('SELECT id, name, email, color FROM users ORDER BY id');
    return rows;
  }

  /** Group members come from OpenFGA tuples (single source of truth). */
  async listGroups(): Promise<GroupDto[]> {
    const { rows } = await this.db.query<{ id: string; name: string }>(
      'SELECT id, name FROM groups ORDER BY id',
    );
    const groups = await Promise.all(
      rows.map(async (group) => {
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
    return groups;
  }

  async listFolders(): Promise<FolderDto[]> {
    const { rows } = await this.db.query<FolderDto>('SELECT id, name FROM folders ORDER BY id');
    return rows;
  }
}
