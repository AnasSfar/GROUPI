import { IsIn, IsOptional } from 'class-validator';

/** Ch.18.11 : consultation du centre d'activités, filtrable par statut de lecture. */
export class ListNotificationsQueryDto {
  @IsOptional()
  @IsIn(['all', 'unread'])
  filter?: 'all' | 'unread';
}
