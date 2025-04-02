import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class KeyboardService {
  private spaceKeyEnabledSubject = new BehaviorSubject<boolean>(true);
  public spaceKeyEnabled$: Observable<boolean> =
    this.spaceKeyEnabledSubject.asObservable();

  disableSpaceKey(): void {
    this.spaceKeyEnabledSubject.next(false);
  }

  enableSpaceKey(): void {
    this.spaceKeyEnabledSubject.next(true);
  }

  isSpaceKeyEnabled(): boolean {
    return this.spaceKeyEnabledSubject.getValue();
  }
}
