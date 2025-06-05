
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workoutSessionsTable, workoutTemplatesTable } from '../db/schema';
import { type CreateWorkoutSessionInput } from '../schema';
import { createWorkoutSession } from '../handlers/create_workout_session';
import { eq } from 'drizzle-orm';

describe('createWorkoutSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a workout session without template', async () => {
    const testInput: CreateWorkoutSessionInput = {
      name: 'Morning Workout'
    };

    const result = await createWorkoutSession(testInput);

    // Basic field validation
    expect(result.name).toEqual('Morning Workout');
    expect(result.template_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.start_time).toBeInstanceOf(Date);
    expect(result.end_time).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a workout session with template', async () => {
    // Create a workout template first
    const templateResult = await db.insert(workoutTemplatesTable)
      .values({
        name: 'Push Day Template',
        description: 'Upper body workout'
      })
      .returning()
      .execute();

    const template = templateResult[0];

    const testInput: CreateWorkoutSessionInput = {
      name: 'Push Day Session',
      template_id: template.id
    };

    const result = await createWorkoutSession(testInput);

    // Basic field validation
    expect(result.name).toEqual('Push Day Session');
    expect(result.template_id).toEqual(template.id);
    expect(result.id).toBeDefined();
    expect(result.start_time).toBeInstanceOf(Date);
    expect(result.end_time).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save workout session to database', async () => {
    const testInput: CreateWorkoutSessionInput = {
      name: 'Test Session'
    };

    const result = await createWorkoutSession(testInput);

    // Query using proper drizzle syntax
    const sessions = await db.select()
      .from(workoutSessionsTable)
      .where(eq(workoutSessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].name).toEqual('Test Session');
    expect(sessions[0].template_id).toBeNull();
    expect(sessions[0].start_time).toBeInstanceOf(Date);
    expect(sessions[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle invalid template_id gracefully', async () => {
    const testInput: CreateWorkoutSessionInput = {
      name: 'Invalid Template Session',
      template_id: 999999 // Non-existent template ID
    };

    // Should throw error due to foreign key constraint
    await expect(createWorkoutSession(testInput)).rejects.toThrow(/foreign key constraint/i);
  });
});
