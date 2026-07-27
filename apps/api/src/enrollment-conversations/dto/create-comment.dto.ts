import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Ch.19.3 : les commentaires sont exclusivement textuels dans la Version 1 (RM-COM-008). */
export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body!: string;
}
