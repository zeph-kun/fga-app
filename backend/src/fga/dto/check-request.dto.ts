import { IsNotEmpty, IsString } from 'class-validator';

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
