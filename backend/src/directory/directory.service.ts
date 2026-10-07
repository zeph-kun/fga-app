import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

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
  constructor(private readonly db: DatabaseService) {}

  async listUsers(): Promise<UserDto[]> {
    const { rows } = await this.db.query<UserDto>('SELECT id, name, email, color FROM users ORDER BY id');
    return rows;
  }

  async listGroups(): Promise<GroupDto[]> {
    const { rows: groupRows } = await this.db.query<{ id: string; name: string }>(
      'SELECT id, name FROM groups ORDER BY id',
    );
    const { rows: memberRows } = await this.db.query<{
      object_id: string;
      subject_type: string;
      subject_id: string;
    }>("SELECT object_id, subject_type, subject_id FROM relation_tuples WHERE namespace = 'group' AND relation = 'member' ORDER BY id");

    return groupRows.map((group) => ({
      id: group.id,
      name: group.name,
      members: memberRows
        .filter((m) => m.object_id === group.id)
        .map((m) => ({ type: m.subject_type as 'user' | 'group', id: m.subject_id })),
    }));
  }

  async listFolders(): Promise<FolderDto[]> {
    const { rows } = await this.db.query<FolderDto>('SELECT id, name FROM folders ORDER BY id');
    return rows;
  }
}
