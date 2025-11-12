import { Injectable, signal } from '@angular/core';
@Injectable({
  providedIn: 'root',
})
/**
 * Service to manage interaction locks, preventing conflicting resize with drag operations.
 */
export class InteractionLockService {
  isResizing = signal(false);
  startResizing() {
    this.isResizing.set(true);
  }
  stopResizing() {
    this.isResizing.set(false);
  }
}
