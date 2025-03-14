import { inject } from '@angular/core';
import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { AuthService } from '../../features/auth/services/auth.service';
import { Observable, catchError, throwError } from 'rxjs';

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  try {
    const authService = inject(AuthService);
    const token = authService.getToken();

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error('[AuthInterceptor] Error injecting AuthService:', error);
  }

  return next(req).pipe(
    catchError((error) => {
      console.error('[AuthInterceptor] HTTP Request Failed:', error);
      return throwError(() => error);
    })
  );
}
