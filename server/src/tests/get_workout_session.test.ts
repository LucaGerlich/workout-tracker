
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workoutSessionsTable, workoutTemplatesTable } from '../db/schema';
import { type GetWorkoutSessionInput } from '../schema';
import { getWorkoutSession } from '../handlers/get_workout_session';

// Test input
const testInput: GetWorkoutSessionInput = {
  id: 1
};

describe('getWorkoutSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a workout session', async () => {
    // Create prerequisite template
    const templateResult = await db.insert(workoutTemplatesTable)
      .values({
        name: 'Test Template',
        description: 'A template for testing'
      })
      .returning()
      .execute();

    // Create test session
    const sessionResult = await db.insert(workoutSessionsTable)
      .values({
        name: 'Test Session',
        template_id: templateResult[0].id
      })
      .returning()
      .execute();

    const result = await getWorkoutSession({ id: sessionResult[0].id });

    // Basic field validation
    expect(result.id).toEqual(sessionResult[0].id);
    expect(result.name).toEqual('Test Session');
    expect(result.template_id).toEqual(templateResult[0].id);
    expect(result.start_time).toBeInstanceOf(Date);
    expect(result.end_time).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should get a workout session without template', async () => {
    // Create test session without template
    const sessionResult = await db.insert(workoutSessionsTable)
      .values({
        name: 'No Template Session',
        template_id: null
      })
      .returning()
      .execute();

    const result = await getWorkoutSession({ id: sessionResult[0].id });

    expect(result.id).toEqual(sessionResult[0].id);
    expect(result.name).toEqual('No Template Session');
    expect(result.template_id).toBeNull();
    expect(result.start_time).toBeInstanceOf(Date);
    expect(result.end_time).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when workout session not found', async () => {
    await expect(getWorkoutSession({ id: 999 })).rejects.toThrow(/not found/i);
  });
});
