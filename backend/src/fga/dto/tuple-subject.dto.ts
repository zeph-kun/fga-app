import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class TupleSubjectDto {
  @IsIn(['user', 'group', 'object'])
  type!: 'user' | 'group' | 'object';

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  id!: string;

  @IsOptional()
  @IsString()
  namespace?: string;

  @IsOptional()
  @IsString()
  relation?: string;
}
