import type { Movie } from '@streampulse/shared';

const POSTER = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images';
const VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample';

export const SAMPLE_MOVIES: Movie[] = [
  {
    id: 'big-buck-bunny',
    title: 'Big Buck Bunny',
    year: 2008,
    description:
      'Blender Foundation open-movie comedy about a giant rabbit who turns the tables on three forest bullies.',
    posterUrl: `${POSTER}/BigBuckBunny.jpg`,
    streamUrl: `${VIDEO}/BigBuckBunny.mp4`,
    runtimeMinutes: 10,
    tags: ['Animation', 'Comedy'],
  },
  {
    id: 'elephants-dream',
    title: 'Elephants Dream',
    year: 2006,
    description:
      'The first Blender open movie — a surreal short about two characters in a strange mechanical world.',
    posterUrl: `${POSTER}/ElephantsDream.jpg`,
    streamUrl: `${VIDEO}/ElephantsDream.mp4`,
    runtimeMinutes: 11,
    tags: ['Animation', 'Surreal'],
  },
  {
    id: 'sintel',
    title: 'Sintel',
    year: 2010,
    description:
      'A young woman searches for her lost dragon companion across a vast frozen landscape.',
    posterUrl: `${POSTER}/Sintel.jpg`,
    streamUrl: `${VIDEO}/Sintel.mp4`,
    runtimeMinutes: 15,
    tags: ['Animation', 'Fantasy'],
  },
  {
    id: 'tears-of-steel',
    title: 'Tears of Steel',
    year: 2012,
    description:
      'A live-action sci-fi short blending visual effects, set in a future Amsterdam under siege.',
    posterUrl: `${POSTER}/TearsOfSteel.jpg`,
    streamUrl: `${VIDEO}/TearsOfSteel.mp4`,
    runtimeMinutes: 12,
    tags: ['Sci-Fi', 'Live action'],
  },
  {
    id: 'for-bigger-blazes',
    title: 'For Bigger Blazes',
    year: 2013,
    description: 'A vivid short reel built to show off streaming quality and color performance.',
    posterUrl: `${POSTER}/ForBiggerBlazes.jpg`,
    streamUrl: `${VIDEO}/ForBiggerBlazes.mp4`,
    runtimeMinutes: 1,
    tags: ['Short'],
  },
  {
    id: 'for-bigger-joyrides',
    title: 'For Bigger Joyrides',
    year: 2013,
    description: 'High-motion footage chosen to showcase encoder and network performance.',
    posterUrl: `${POSTER}/ForBiggerJoyrides.jpg`,
    streamUrl: `${VIDEO}/ForBiggerJoyrides.mp4`,
    runtimeMinutes: 1,
    tags: ['Short'],
  },
  {
    id: 'subaru-outback',
    title: 'Subaru Outback Review',
    year: 2013,
    description: 'A long-runtime road test reel with mixed indoor and outdoor scenes.',
    posterUrl: `${POSTER}/SubaruOutbackOnStreetAndDirt.jpg`,
    streamUrl: `${VIDEO}/SubaruOutbackOnStreetAndDirt.mp4`,
    runtimeMinutes: 10,
    tags: ['Auto', 'Review'],
  },
  {
    id: 'volkswagen-gti-review',
    title: 'Volkswagen GTI Review',
    year: 2013,
    description: 'A magazine-style car review with talking head, B-roll, and on-road footage.',
    posterUrl: `${POSTER}/VolkswagenGTIReview.jpg`,
    streamUrl: `${VIDEO}/VolkswagenGTIReview.mp4`,
    runtimeMinutes: 6,
    tags: ['Auto', 'Review'],
  },
];
