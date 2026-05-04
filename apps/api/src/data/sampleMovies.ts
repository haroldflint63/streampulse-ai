import type { Movie } from '@streampulse/shared';

/**
 * Curated catalog using rock-solid free media sources:
 *  - Video: W3.org's media test server (CORS-friendly, range-request capable)
 *           with Google's GTV bucket as the secondary host.
 *  - Posters: Wikimedia Commons (proper movie posters).
 *  - Backdrops: Unsplash CDN (free, key-less, beautiful landscape stills).
 */
export const SAMPLE_MOVIES: Movie[] = [
  {
    id: 'sintel',
    title: 'Sintel',
    year: 2010,
    description:
      'A lone warrior journeys across a frozen wilderness in search of the dragon she once raised — a stunning Blender Foundation open movie.',
    posterUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Sintel_poster.jpg/400px-Sintel_poster.jpg',
    backdropUrl:
      'https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?auto=format&fit=crop&w=1600&q=80',
    streamUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    runtimeMinutes: 15,
    tags: ['Animation', 'Fantasy', 'Adventure'],
  },
  {
    id: 'big-buck-bunny',
    title: 'Big Buck Bunny',
    year: 2008,
    description:
      'A gentle giant rabbit takes peaceful revenge on three woodland bullies in this beloved open-source animated comedy.',
    posterUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big.Buck.Bunny.-.Opening.Screen.png/640px-Big.Buck.Bunny.-.Opening.Screen.png',
    backdropUrl:
      'https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=1600&q=80',
    streamUrl: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
    runtimeMinutes: 10,
    tags: ['Animation', 'Comedy', 'Family'],
  },
  {
    id: 'tears-of-steel',
    title: 'Tears of Steel',
    year: 2012,
    description:
      'A live-action sci-fi short set in a future Amsterdam under siege, blending visual effects with emotional storytelling.',
    posterUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Tears_of_Steel_poster.jpg/400px-Tears_of_Steel_poster.jpg',
    backdropUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    streamUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    runtimeMinutes: 12,
    tags: ['Sci-Fi', 'Drama'],
  },
  {
    id: 'elephants-dream',
    title: 'Elephants Dream',
    year: 2006,
    description:
      'Two characters explore a strange mechanical world in the very first Blender open movie — surreal, dreamlike, unforgettable.',
    posterUrl:
      'https://upload.wikimedia.org/wikipedia/commons/0/0c/Elephantsdream-poster.png',
    backdropUrl:
      'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1600&q=80',
    streamUrl: 'https://media.w3.org/2010/05/video/movie_300.mp4',
    runtimeMinutes: 11,
    tags: ['Animation', 'Surreal'],
  },
  {
    id: 'for-bigger-joyrides',
    title: 'For Bigger Joyrides',
    year: 2013,
    description:
      'A high-octane action reel filmed for the launch of Chromecast — pure adrenaline in 60 seconds.',
    posterUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
    backdropUrl:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80',
    streamUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    runtimeMinutes: 1,
    tags: ['Action', 'Short'],
  },
  {
    id: 'for-bigger-blazes',
    title: 'For Bigger Blazes',
    year: 2013,
    description:
      'Vivid color, dramatic lighting, fire — a cinematic short built to push the limits of streaming quality.',
    posterUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
    backdropUrl:
      'https://images.unsplash.com/photo-1547036967-23d11aacaee0?auto=format&fit=crop&w=1600&q=80',
    streamUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    runtimeMinutes: 1,
    tags: ['Drama', 'Short'],
  },
];
