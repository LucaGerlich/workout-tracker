
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workoutSessionsTable, workoutTemplatesTable } from '../db/schema';
import { getWorkoutSessions } from '../handlers/get_workout_sessions';

describe('getWorkoutSessions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no sessions exist', async () => {
    const result = await getWorkoutSessions();
    expect(result).toEqual([]);
  });

  it('should return all workout sessions', async () => {
    // Create test sessions - insert them separately to control created_at ordering
    const firstInsert = await db.insert(workoutSessionsTable)
      .values({
        name: 'Morning Workout',
        start_time: new Date('2024-01-01T08:00:00Z'),
        end_time: new Date('2024-01-01T09:00:00Z')
      })
      .returning()
      .execute();

    // Wait to ensure different created_at times
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondInsert = await db.insert(workoutSessionsTable)
      .values({
        name: 'Evening Workout',
        start_time: new Date('2024-01-01T18:00:00Z'),
        end_time: null
      })
      .returning()
      .execute();

    const result = await getWorkoutSessions();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Evening Workout'); // Most recent first due to ordering
    expect(result[0].start_time).toBeInstanceOf(Date);
    expect(result[0].end_time).toBeNull();
    expect(result[0].template_id).toBeNull();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();

    expect(result[1].name).toEqual('Morning Workout');
    expect(result[1].start_time).toBeInstanceOf(Date);
    expect(result[1].end_time).toBeInstanceOf(Date);
  });

  it('should return sessions ordered by created_at descending', async () => {
    // Create sessions with specific timestamps
    const firstSession = await db.insert(workoutSessionsTable)
      .values({
        name: 'First Session',
        start_time: new Date('2024-01-01T08:00:00Z')
      })
      .returning()
      .execute();

    // Wait a bit to ensure different created_at times
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondSession = await db.insert(workoutSessionsTable)
      .values({
        name: 'Second Session',
        start_time: new Date('2024-01-01T18:00:00Z')
      })
      .returning()
      .execute();

    const result = await getWorkoutSessions();

    expect(result).toHaveLength(2);
    // Most recently created should be first
    expect(result[0].name).toEqual('Second Session');
    expect(result[1].name).toEqual('First Session');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle sessions with template_id', async () => {
    // Create a workout template first to satisfy foreign key constraint
    const template = await db.insert(workoutTemplatesTable)
      .values({
        name: 'Test Template',
        description: 'A test template'
      })
      .returning()
      .execute();

    await db.insert(workoutSessionsTable)
      .values({
        name: 'Template Workout',
        start_time: new Date('2024-01-01T08:00:00Z'),
        template_id: template[0].id
      })
      .execute();

    const result = await getWorkoutSessions();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Template Workout');
    expect(result[0].template_id).toEqual(template[0].id);
  });
});
