import { vi } from 'vitest';

// on fige la date du jour pour les tests de l'api : sinon les dates ecrites
// en dur (novembre 2026...) deviendraient "passees" et les tests casseraient
// pas pour les tests d'ecran (jsdom) : ca bloque les findBy de testing-library
if (typeof window === 'undefined') {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-20T12:00:00'));
}
