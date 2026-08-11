import { IsIn, IsOptional } from 'class-validator';

/**
 * Ch.18.11/RM-NOT-010 : consultation du centre d'activités, filtrable par statut de lecture ou
 * (nouveau) par archivage — `archived` permet de consulter les activités archivées séparément du
 * flux principal, sans jamais les supprimer.
 */
export class ListNotificationsQueryDto {
  @IsOptional()
  @IsIn(['all', 'unread', 'archived'])
  filter?: 'all' | 'unread' | 'archived';
}
