
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workoutSessionsTable, exercisesTable } from '../db/schema';
import { type DeleteWorkoutSessionInput, type CreateWorkoutSessionInput, type CreateExerciseInput } from '../schema';
import { deleteWorkoutSession } from '../handlers/delete_workout_session';
import { eq } from 'drizzle-orm';

const testSessionInput: CreateWorkoutSessionInput = {
  name: 'Test Workout Session'
};

const testExerciseInput: CreateExerciseInput = {
  name: 'Push-ups',
  category: 'Bodyweight',
  sets: 3,
  reps: 10,
  weight: 0,
  workout_session_id: 0 // Will be set after creating session
};

describe('deleteWorkoutSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a workout session', async () => {
    // Create a workout session to delete
    const sessionResult = await db.insert(workoutSessionsTable)
      .values({
        name: testSessionInput.name
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;
    const deleteInput: DeleteWorkoutSessionInput = { id: sessionId };

    const result = await deleteWorkoutSession(deleteInput);

    expect(result.success).toBe(true);

    // Verify session was deleted
    const sessions = await db.select()
      .from(workoutSessionsTable)
      .where(eq(workoutSessionsTable.id, sessionId))
      .execute();

    expect(sessions).toHaveLength(0);
  });

  it('should delete associated exercises when deleting workout session', async () => {
    // Create a workout session
    const sessionResult = await db.insert(workoutSessionsTable)
      .values({
        name: testSessionInput.name
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    // Create exercises associated with the session
    await db.insert(exercisesTable)
      .values([
        {
          name: 'Push-ups',
          category: 'Bodyweight',
          sets: 3,
          reps: 10,
          weight: '0',
          workout_session_id: sessionId
        },
        {
          name: 'Squats',
          category: 'Bodyweight',
          sets: 3,
          reps: 15,
          weight: '0',
          workout_session_id: sessionId
        }
      ])
      .execute();

    const deleteInput: DeleteWorkoutSessionInput = { id: sessionId };
    const result = await deleteWorkoutSession(deleteInput);

    expect(result.success).toBe(true);

    // Verify session was deleted
    const sessions = await db.select()
      .from(workoutSessionsTable)
      .where(eq(workoutSessionsTable.id, sessionId))
      .execute();

    expect(sessions).toHaveLength(0);

    // Verify associated exercises were deleted
    const exercises = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.workout_session_id, sessionId))
      .execute();

    expect(exercises).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent workout session', async () => {
    const deleteInput: DeleteWorkoutSessionInput = { id: 999 };

    const result = await deleteWorkoutSession(deleteInput);

    expect(result.success).toBe(false);
  });

  it('should handle deletion of session with no exercises', async () => {
    // Create a workout session without exercises
    const sessionResult = await db.insert(workoutSessionsTable)
      .values({
        name: testSessionInput.name
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;
    const deleteInput: DeleteWorkoutSessionInput = { id: sessionId };

    const result = await deleteWorkoutSession(deleteInput);

    expect(result.success).toBe(true);

    // Verify session was deleted
    const sessions = await db.select()
      .from(workoutSessionsTable)
      .where(eq(workoutSessionsTable.id, sessionId))
      .execute();

    expect(sessions).toHaveLength(0);
  });
});
