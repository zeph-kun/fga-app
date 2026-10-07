import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

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

export class CheckRequestDto {
  /** Permission check runs on behalf of an explicit user (playground feature). */
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  permission!: string;

  @IsString()
  @IsNotEmpty()
  namespace!: string;

  @IsString()
  @IsNotEmpty()
  objectId!: string;
}

/**
 * Tuple creation: the acting user is derived from the access token, never
 * from the request body.
 */
export class CreateTupleDto {
  @IsString()
  @IsNotEmpty()
  namespace!: string;

  @IsString()
  @IsNotEmpty()
  objectId!: string;

  @IsString()
  @IsNotEmpty()
  relation!: string;

  @ValidateNested()
  @Type(() => TupleSubjectDto)
  subject!: TupleSubjectDto;
}

/** OpenFGA identifies tuples by their key, not by an id. */
export class DeleteTupleDto extends CreateTupleDto {}
