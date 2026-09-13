import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Avenant 01, Ch. A.3.3 : `POST /public/invitations/:token/accept` sert à la fois le cas 1 (nouveau
 * Parent, visiteur anonyme) et le cas 2 (Parent déjà connecté, simple ajout d'enfant). La route est
 * `@Public()` (jamais bloquée si l'appelant n'a pas de session), mais quand un jeton Bearer valide
 * est fourni, on veut tout de même connaître l'utilisateur courant pour distinguer les deux cas.
 *
 * Variante de `JwtAuthGuard` qui réutilise la même stratégie passport 'jwt' (déjà enregistrée
 * globalement par `AuthModule`/`JwtStrategy`) mais ne lève jamais d'exception : `req.user` est
 * renseigné si le jeton est valide, laissé `undefined` sinon (jeton absent ou invalide) — la requête
 * n'est jamais bloquée par ce guard.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(_err: unknown, user: unknown): TUser {
    return (user || undefined) as TUser;
  }
}
