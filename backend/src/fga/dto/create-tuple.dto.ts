import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { TupleSubjectDto } from './tuple-subject.dto';

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
