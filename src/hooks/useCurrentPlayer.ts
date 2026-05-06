import { useEffect, useState } from 'react';
import {
  getCurrentPlayer,
  subscribeCurrentPlayer,
} from '../state/currentPlayerState';

/**
 * Slug of the currently-playing video, or null if none. Re-renders the
 * subscribing component whenever a different player claims playback.
 */
export function useCurrentPlayer(): string | null {
  const [current, setCurrent] = useState<string | null>(() => getCurrentPlayer());
  useEffect(() => subscribeCurrentPlayer(setCurrent), []);
  return current;
}
