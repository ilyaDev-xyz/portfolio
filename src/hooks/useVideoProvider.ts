import { useEffect, useState } from 'react';
import {
  getVideoProvider,
  setVideoProvider,
  subscribeVideoProvider,
  type VideoProvider,
} from '../state/videoProviderState';

/**
 * React-bound view of the global video-provider preference.
 * Returns [provider, setter]; the setter writes to localStorage and broadcasts
 * to every other useVideoProvider() consumer in the tree.
 */
export function useVideoProvider(): readonly [VideoProvider, (p: VideoProvider) => void] {
  const [provider, setLocal] = useState<VideoProvider>(() => getVideoProvider());
  useEffect(() => subscribeVideoProvider(setLocal), []);
  return [provider, setVideoProvider] as const;
}
