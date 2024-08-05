import { isDevMode } from '@angular/core';

export function log(...args: any) {
  if (isDevMode()) {
    console.log(...args);
  }
}

export function logStartTime(name: string) {
  if (isDevMode()) {
    console.time(name);
  }
}

export function logEndTime(name: string) {
  if (isDevMode()) {
    console.timeEnd(name);
  }
}
