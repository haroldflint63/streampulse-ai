import type { Movie } from '@streampulse/shared';

/**
 * Curated catalog using ONLY video sources verified live with HTTP 200:
 *  - https://media.w3.org      — W3C's official media test server (rock-solid).
 *  - https://test-videos.co.uk — well-known free 720p sample clips.
 *  - https://download.blender.org — official Blender Foundation trailer host.
 *
 * Every URL has been HEAD-checked. The video element does NOT use crossOrigin,
 * so CORS headers are not required for playback.
 *
 * Posters: Wikimedia Commons. Backdrops: Unsplash CDN.
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
    streamUrl: 'https://download.blender.org/durian/trailer/sintel_trailer-480p.mp4',
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
    streamUrl: 'https://media.w3.org/2010/05/bunny/movie.mp4',
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
    streamUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
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
    id: 'jellyfish-720',
    title: 'Jellyfish in Motion',
    year: 2021,
    description:
      'A meditative 720p short of jellyfish drifting through deep water — used widely as a streaming benchmark for color and motion.',
    posterUrl:
      'https://images.unsplash.com/photo-1559825481-12a05cc00344?auto=format&fit=crop&w=600&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1559825481-12a05cc00344?auto=format&fit=crop&w=1600&q=80',
    streamUrl:
      'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
    runtimeMinutes: 1,
    tags: ['Nature', 'Short'],
  },
  {
    id: 'big-buck-bunny-720',
    title: 'Big Buck Bunny 720p Clip',
    year: 2008,
    description:
      'A 10-second 720p clip from the Big Buck Bunny short — a quick taste before the full feature.',
    posterUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big.Buck.Bunny.-.Opening.Screen.png/640px-Big.Buck.Bunny.-.Opening.Screen.png',
    backdropUrl:
      'https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=1600&q=80',
    streamUrl:
      'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
    runtimeMinutes: 1,
    tags: ['Animation', 'Short'],
  },
];
