import type { FastifyInstance } from 'fastify';
import { fetchMovies } from '../services/tmdb.js';
import { embed, cosine } from '../services/cohere.js';

/** Cache embeddings per process lifetime — descriptions don't change. */
const embedCache = new Map<string, number[]>();

async function getEmbedding(id: string, text: string): Promise<number[]> {
  const cached = embedCache.get(id);
  if (cached) return cached;
  const { vector } = await embed(text);
  embedCache.set(id, vector);
  return vector;
}

export function registerMoviesRoute(app: FastifyInstance): void {
  app.get('/movies', async () => {
    const movies = await fetchMovies();
    return { movies };
  });

  app.get<{ Params: { id: string } }>('/movies/:id', async (req, reply) => {
    const movies = await fetchMovies();
    const movie = movies.find((m) => m.id === req.params.id);
    if (!movie) {
      reply.code(404);
      return { error: 'not found' };
    }
    return { movie };
  });

  /**
   * "Because you watched X" — Cohere-powered similarity ranking, with a
   * deterministic pseudo-embedding fallback so this endpoint always returns
   * something useful.
   */
  app.get<{ Params: { id: string } }>('/movies/:id/similar', async (req, reply) => {
    const movies = await fetchMovies();
    const seed = movies.find((m) => m.id === req.params.id);
    if (!seed) {
      reply.code(404);
      return { error: 'not found' };
    }
    const seedVec = await getEmbedding(seed.id, `${seed.title}. ${seed.description}. tags: ${seed.tags.join(', ')}`);

    const scored = await Promise.all(
      movies
        .filter((m) => m.id !== seed.id)
        .map(async (m) => {
          const v = await getEmbedding(m.id, `${m.title}. ${m.description}. tags: ${m.tags.join(', ')}`);
          return { movie: m, score: cosine(seedVec, v) };
        }),
    );
    scored.sort((a, b) => b.score - a.score);
    return { similar: scored.slice(0, 6).map((s) => ({ ...s.movie, _score: s.score })) };
  });
}
