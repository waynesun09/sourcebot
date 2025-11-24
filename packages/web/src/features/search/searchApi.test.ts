import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dateUtils from './dateUtils';

describe('searchApi temporal parameter handling', () => {
    describe('date utility integration', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        describe('toDbDate conversion', () => {
            it('should convert ISO date strings to Date objects', () => {
                const result = dateUtils.toDbDate('2024-01-01');
                expect(result).toBeInstanceOf(Date);
                expect(result?.toISOString()).toBe('2024-01-01T00:00:00.000Z');
            });

            it('should convert relative dates to Date objects', () => {
                vi.useFakeTimers();
                vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));

                const result = dateUtils.toDbDate('30 days ago');
                expect(result).toBeInstanceOf(Date);

                vi.useRealTimers();
            });

            it('should handle undefined gracefully', () => {
                const result = dateUtils.toDbDate(undefined);
                expect(result).toBeUndefined();
            });

            it('should handle empty string gracefully', () => {
                const result = dateUtils.toDbDate('');
                expect(result).toBeUndefined();
            });
        });

        describe('date range validation scenarios', () => {
            it('should accept valid date ranges', () => {
                const error = dateUtils.validateDateRange('2024-01-01', '2024-12-31');
                expect(error).toBeNull();
            });

            it('should reject invalid date ranges', () => {
                const error = dateUtils.validateDateRange('2024-12-31', '2024-01-01');
                expect(error).not.toBeNull();
                expect(error).toContain('since');
                expect(error).toContain('until');
            });

            it('should validate relative date ranges', () => {
                vi.useFakeTimers();
                vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));

                const error = dateUtils.validateDateRange('30 days ago', 'yesterday');
                expect(error).toBeNull();

                vi.useRealTimers();
            });

            it('should detect invalid relative date ranges', () => {
                vi.useFakeTimers();
                vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));

                const error = dateUtils.validateDateRange('yesterday', '30 days ago');
                expect(error).not.toBeNull();

                vi.useRealTimers();
            });
        });

        describe('temporal parameter edge cases', () => {
            it('should handle missing since parameter', () => {
                const dbDate = dateUtils.toDbDate(undefined);
                expect(dbDate).toBeUndefined();
            });

            it('should handle missing until parameter', () => {
                const dbDate = dateUtils.toDbDate(undefined);
                expect(dbDate).toBeUndefined();
            });

            it('should handle both parameters missing', () => {
                const sinceDate = dateUtils.toDbDate(undefined);
                const untilDate = dateUtils.toDbDate(undefined);
                expect(sinceDate).toBeUndefined();
                expect(untilDate).toBeUndefined();
            });
        });
    });

    describe('Prisma query construction with temporal filters', () => {
        it('should construct valid date range for Prisma query', () => {
            const since = '2024-01-01';
            const until = '2024-12-31';

            const sinceDate = dateUtils.toDbDate(since);
            const untilDate = dateUtils.toDbDate(until);

            const whereClause = {
                indexedAt: {
                    gte: sinceDate,
                    lte: untilDate,
                },
            };

            expect(whereClause.indexedAt.gte).toBeInstanceOf(Date);
            expect(whereClause.indexedAt.lte).toBeInstanceOf(Date);
            expect(whereClause.indexedAt.gte!.getTime()).toBeLessThan(
                whereClause.indexedAt.lte!.getTime()
            );
        });

        it('should handle only since parameter', () => {
            const since = '2024-01-01';

            const sinceDate = dateUtils.toDbDate(since);
            const untilDate = dateUtils.toDbDate(undefined);

            const whereClause = {
                indexedAt: {
                    gte: sinceDate,
                    lte: untilDate,
                },
            };

            expect(whereClause.indexedAt.gte).toBeInstanceOf(Date);
            expect(whereClause.indexedAt.lte).toBeUndefined();
        });

        it('should handle only until parameter', () => {
            const since = undefined;
            const until = '2024-12-31';

            const sinceDate = dateUtils.toDbDate(since);
            const untilDate = dateUtils.toDbDate(until);

            const whereClause = {
                indexedAt: {
                    gte: sinceDate,
                    lte: untilDate,
                },
            };

            expect(whereClause.indexedAt.gte).toBeUndefined();
            expect(whereClause.indexedAt.lte).toBeInstanceOf(Date);
        });

        it('should construct Prisma query with relative dates', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));

            const since = '30 days ago';
            const until = 'yesterday';

            const sinceDate = dateUtils.toDbDate(since);
            const untilDate = dateUtils.toDbDate(until);

            expect(sinceDate).toBeInstanceOf(Date);
            expect(untilDate).toBeInstanceOf(Date);
            expect(sinceDate!.toISOString()).toBe('2024-05-16T12:00:00.000Z');
            expect(untilDate!.toISOString()).toBe('2024-06-14T12:00:00.000Z');

            vi.useRealTimers();
        });
    });

    describe('repository filtering logic', () => {
        it('should filter repositories by indexedAt timestamp', () => {
            const repos = [
                { id: 1, name: 'repo1', indexedAt: new Date('2024-01-15') },
                { id: 2, name: 'repo2', indexedAt: new Date('2024-06-01') },
                { id: 3, name: 'repo3', indexedAt: new Date('2024-12-01') },
            ];

            const since = dateUtils.toDbDate('2024-05-01');
            const until = dateUtils.toDbDate('2024-11-01');

            const filtered = repos.filter((repo) => {
                if (!repo.indexedAt) return false;
                if (since && repo.indexedAt < since) return false;
                if (until && repo.indexedAt > until) return false;
                return true;
            });

            expect(filtered).toHaveLength(1);
            expect(filtered[0].id).toBe(2);
        });

        it('should return empty array when no repos match date range', () => {
            const repos = [
                { id: 1, name: 'repo1', indexedAt: new Date('2020-01-01') },
                { id: 2, name: 'repo2', indexedAt: new Date('2021-01-01') },
            ];

            const since = dateUtils.toDbDate('2024-01-01');
            const until = dateUtils.toDbDate('2024-12-31');

            const filtered = repos.filter((repo) => {
                if (!repo.indexedAt) return false;
                if (since && repo.indexedAt < since) return false;
                if (until && repo.indexedAt > until) return false;
                return true;
            });

            expect(filtered).toHaveLength(0);
        });

        it('should handle repos without indexedAt timestamp', () => {
            const repos = [
                { id: 1, name: 'repo1', indexedAt: new Date('2024-06-01') },
                { id: 2, name: 'repo2', indexedAt: null },
                { id: 3, name: 'repo3', indexedAt: undefined },
            ];

            const since = dateUtils.toDbDate('2024-01-01');

            const filtered = repos.filter((repo) => {
                if (!repo.indexedAt) return false;
                if (since && repo.indexedAt < since) return false;
                return true;
            });

            expect(filtered).toHaveLength(1);
            expect(filtered[0].id).toBe(1);
        });
    });

    describe('real-world scenarios', () => {
        it('should handle "last 30 days" user query', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));

            const userInput = '30 days ago';
            const parsedDate = dateUtils.toDbDate(userInput);

            expect(parsedDate).toBeInstanceOf(Date);
            expect(parsedDate?.toISOString()).toBe('2024-05-16T12:00:00.000Z');

            vi.useRealTimers();
        });

        it('should handle "since last week" user query', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));

            const userInput = 'last week';
            const parsedDate = dateUtils.toDbDate(userInput);

            expect(parsedDate).toBeInstanceOf(Date);
            expect(parsedDate?.toISOString()).toBe('2024-06-08T12:00:00.000Z');

            vi.useRealTimers();
        });

        it('should handle "before yesterday" user query', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));

            const userInput = 'yesterday';
            const parsedDate = dateUtils.toDbDate(userInput);

            expect(parsedDate).toBeInstanceOf(Date);
            expect(parsedDate?.toISOString()).toBe('2024-06-14T12:00:00.000Z');

            vi.useRealTimers();
        });

        it('should handle explicit ISO date range', () => {
            const since = '2024-01-01';
            const until = '2024-03-31';

            const sinceDate = dateUtils.toDbDate(since);
            const untilDate = dateUtils.toDbDate(until);
            const validationError = dateUtils.validateDateRange(since, until);

            expect(sinceDate).toBeInstanceOf(Date);
            expect(untilDate).toBeInstanceOf(Date);
            expect(validationError).toBeNull();
            expect(sinceDate!.getTime()).toBeLessThan(untilDate!.getTime());
        });

        it('should prevent user from providing inverted date range', () => {
            const since = '2024-12-31';
            const until = '2024-01-01';

            const validationError = dateUtils.validateDateRange(since, until);

            expect(validationError).not.toBeNull();
            expect(validationError).toContain('since');
            expect(validationError).toContain('until');
            expect(validationError).toContain('before');
        });
    });
});
