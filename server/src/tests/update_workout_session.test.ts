
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workoutSessionsTable } from '../db/schema';
import { type UpdateWorkoutSessionInput } from '../schema';
import { updateWorkoutSession } from '../handlers/update_workout_session';
import { eq } from 'drizzle-orm';

describe('updateWorkoutSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update workout session name', async () => {
    // Create test session directly in database
    const createResult = await db.insert(workoutSessionsTable)
      .values({
        name: 'Test Session'
      })
      .returning()
      .execute();

    const session = createResult[0];

    const updateInput: UpdateWorkoutSessionInput = {
      id: session.id,
      name: 'Updated Session Name'
    };

    const result = await updateWorkoutSession(updateInput);

    expect(result.id).toEqual(session.id);
    expect(result.name).toEqual('Updated Session Name');
    expect(result.start_time).toBeInstanceOf(Date);
    expect(result.end_time).toBeNull();
    expect(result.template_id).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update workout session end_time', async () => {
    // Create test session directly in database
    const createResult = await db.insert(workoutSessionsTable)
      .values({
        name: 'Test Session'
      })
      .returning()
      .execute();

    const session = createResult[0];

    const endTime = new Date();
    const updateInput: UpdateWorkoutSessionInput = {
      id: session.id,
      end_time: endTime
    };

    const result = await updateWorkoutSession(updateInput);

    expect(result.id).toEqual(session.id);
    expect(result.name).toEqual('Test Session');
    expect(result.end_time).toBeInstanceOf(Date);
    expect(result.end_time?.getTime()).toEqual(endTime.getTime());
    expect(result.start_time).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    // Create test session directly in database
    const createResult = await db.insert(workoutSessionsTable)
      .values({
        name: 'Test Session'
      })
      .returning()
      .execute();

    const session = createResult[0];

    const endTime = new Date();
    const updateInput: UpdateWorkoutSessionInput = {
      id: session.id,
      name: 'Updated Session',
      end_time: endTime
    };

    const result = await updateWorkoutSession(updateInput);

    expect(result.id).toEqual(session.id);
    expect(result.name).toEqual('Updated Session');
    expect(result.end_time).toBeInstanceOf(Date);
    expect(result.end_time?.getTime()).toEqual(endTime.getTime());
    expect(result.start_time).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updates to database', async () => {
    // Create test session directly in database
    const createResult = await db.insert(workoutSessionsTable)
      .values({
        name: 'Test Session'
      })
      .returning()
      .execute();

    const session = createResult[0];

    const updateInput: UpdateWorkoutSessionInput = {
      id: session.id,
      name: 'Database Updated Session'
    };

    await updateWorkoutSession(updateInput);

    // Verify in database
    const sessions = await db.select()
      .from(workoutSessionsTable)
      .where(eq(workoutSessionsTable.id, session.id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].name).toEqual('Database Updated Session');
    expect(sessions[0].id).toEqual(session.id);
  });

  it('should throw error for non-existent workout session', async () => {
    const updateInput: UpdateWorkoutSessionInput = {
      id: 999,
      name: 'Non-existent Session'
    };

    await expect(updateWorkoutSession(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create test session directly in database
    const createResult = await db.insert(workoutSessionsTable)
      .values({
        name: 'Test Session'
      })
      .returning()
      .execute();

    const session = createResult[0];

    // Update only name
    const nameUpdateInput: UpdateWorkoutSessionInput = {
      id: session.id,
      name: 'Only Name Updated'
    };

    const nameResult = await updateWorkoutSession(nameUpdateInput);

    expect(nameResult.name).toEqual('Only Name Updated');
    expect(nameResult.end_time).toBeNull(); // Should remain unchanged

    // Update only end_time
    const endTime = new Date();
    const timeUpdateInput: UpdateWorkoutSessionInput = {
      id: session.id,
      end_time: endTime
    };

    const timeResult = await updateWorkoutSession(timeUpdateInput);

    expect(timeResult.name).toEqual('Only Name Updated'); // Should remain from previous update
    expect(timeResult.end_time).toBeInstanceOf(Date);
    expect(timeResult.end_time?.getTime()).toEqual(endTime.getTime());
  });
});
