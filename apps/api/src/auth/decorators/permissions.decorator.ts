import { SetMetadata } from '@nestjs/common';

/** Permissions au format [RESOURCE]_[ACTION] (Ch.2.9, ex. GRP_CREATE) — voir Annexe I. */
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
