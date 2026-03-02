import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ query?: { next?: string } }>();
    const next = request.query?.next;

    if (typeof next === 'string' && next.startsWith('/')) {
      return { state: next };
    }

    return undefined;
  }
}
