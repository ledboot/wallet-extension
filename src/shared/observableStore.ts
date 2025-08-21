import { EventEmitter } from 'eventemitter3';

export class ObservableStore<T> extends EventEmitter {
  private _state: T;

  constructor(initState: T) {
    super();
    if (initState === undefined) {
      // Typecast/default state: Preserve existing behavior
      this._state = {} as unknown as T;
    } else {
      this._state = initState;
    }
  }

  getState(): T {
    return this._state;
  }

  putState(newState: T): void {
    this._putState(newState);
    this.emit('update', newState);
  }

  updateState(partialState: Partial<T>): void {
    if (partialState && typeof partialState === 'object') {
      const state = this.getState();
      this.putState({ ...state, ...partialState });
      // if not object, use new value
    } else {
      this.putState(partialState);
    }
  }

  subscribe(listener: (state: T) => void): void {
    this.on('update', listener);
  }

  unsubscribe(handler: (state: T) => void): void {
    this.removeListener('update', handler);
  }

  protected _putState(newState: T): void {
    this._state = newState;
  }
}
