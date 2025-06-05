
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { exercisesTable, workoutSessionsTable } from '../db/schema';
import { type DeleteExerciseInput, type CreateExerciseInput } from '../schema';
import { deleteExercise } from '../handlers/delete_exercise';
import { eq } from 'drizzle-orm';

describe('deleteExercise', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an exercise', async () => {
    // Create workout session first
    const sessionResult = await db.insert(workoutSessionsTable)
      .values({
        name: 'Test Session'
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    // Create exercise to delete
    const exerciseResult = await db.insert(exercisesTable)
      .values({
        name: 'Push Up',
        category: 'Bodyweight',
        sets: 3,
        reps: 10,
        weight: '0.00',
        workout_session_id: sessionId
      })
      .returning()
      .execute();

    const exerciseId = exerciseResult[0].id;

    const input: DeleteExerciseInput = {
      id: exerciseId
    };

    const result = await deleteExercise(input);

    expect(result.success).toBe(true);

    // Verify exercise is deleted from database
    const exercises = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, exerciseId))
      .execute();

    expect(exercises).toHaveLength(0);
  });

  it('should not fail when deleting non-existent exercise', async () => {
    const input: DeleteExerciseInput = {
      id: 999
    };

    const result = await deleteExercise(input);

    expect(result.success).toBe(true);
  });

  it('should remove exercise from database completely', async () => {
    // Create workout session first
    const sessionResult = await db.insert(workoutSessionsTable)
      .values({
        name: 'Test Session'
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    // Create multiple exercises
    const exerciseResults = await db.insert(exercisesTable)
      .values([
        {
          name: 'Push Up',
          category: 'Bodyweight',
          sets: 3,
          reps: 10,
          weight: '0.00',
          workout_session_id: sessionId
        },
        {
          name: 'Squat',
          category: 'Bodyweight',
          sets: 3,
          reps: 15,
          weight: '0.00',
          workout_session_id: sessionId
        }
      ])
      .returning()
      .execute();

    const exerciseToDeleteId = exerciseResults[0].id;
    const remainingExerciseId = exerciseResults[1].id;

    // Delete one exercise
    const result = await deleteExercise({ id: exerciseToDeleteId });

    expect(result.success).toBe(true);

    // Verify only the targeted exercise is deleted
    const allExercises = await db.select()
      .from(exercisesTable)
      .execute();

    expect(allExercises).toHaveLength(1);
    expect(allExercises[0].id).toBe(remainingExerciseId);
    expect(allExercises[0].name).toBe('Squat');
  });
});
