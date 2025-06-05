
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { exercisesTable, workoutSessionsTable } from '../db/schema';
import { type UpdateExerciseInput, type CreateWorkoutSessionInput } from '../schema';
import { updateExercise } from '../handlers/update_exercise';
import { eq } from 'drizzle-orm';

describe('updateExercise', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an exercise with all fields', async () => {
    // Create a workout session first
    const sessionResult = await db.insert(workoutSessionsTable)
      .values({
        name: 'Test Session'
      })
      .returning()
      .execute();

    // Create an exercise to update
    const exerciseResult = await db.insert(exercisesTable)
      .values({
        name: 'Original Exercise',
        category: 'Strength',
        sets: 3,
        reps: 10,
        weight: '50.00',
        workout_session_id: sessionResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateExerciseInput = {
      id: exerciseResult[0].id,
      name: 'Updated Exercise',
      category: 'Cardio',
      sets: 4,
      reps: 12,
      weight: 60.5
    };

    const result = await updateExercise(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(exerciseResult[0].id);
    expect(result.name).toEqual('Updated Exercise');
    expect(result.category).toEqual('Cardio');
    expect(result.sets).toEqual(4);
    expect(result.reps).toEqual(12);
    expect(result.weight).toEqual(60.5);
    expect(typeof result.weight).toEqual('number');
    expect(result.workout_session_id).toEqual(sessionResult[0].id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create a workout session first
    const sessionResult = await db.insert(workoutSessionsTable)
      .values({
        name: 'Test Session'
      })
      .returning()
      .execute();

    // Create an exercise to update
    const exerciseResult = await db.insert(exercisesTable)
      .values({
        name: 'Original Exercise',
        category: 'Strength',
        sets: 3,
        reps: 10,
        weight: '50.00',
        workout_session_id: sessionResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateExerciseInput = {
      id: exerciseResult[0].id,
      name: 'Partially Updated Exercise',
      weight: 75.25
    };

    const result = await updateExercise(updateInput);

    // Verify updated fields
    expect(result.name).toEqual('Partially Updated Exercise');
    expect(result.weight).toEqual(75.25);
    
    // Verify unchanged fields
    expect(result.category).toEqual('Strength');
    expect(result.sets).toEqual(3);
    expect(result.reps).toEqual(10);
    expect(result.workout_session_id).toEqual(sessionResult[0].id);
  });

  it('should save updated exercise to database', async () => {
    // Create a workout session first
    const sessionResult = await db.insert(workoutSessionsTable)
      .values({
        name: 'Test Session'
      })
      .returning()
      .execute();

    // Create an exercise to update
    const exerciseResult = await db.insert(exercisesTable)
      .values({
        name: 'Original Exercise',
        category: 'Strength',
        sets: 3,
        reps: 10,
        weight: '50.00',
        workout_session_id: sessionResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateExerciseInput = {
      id: exerciseResult[0].id,
      name: 'Database Updated Exercise',
      sets: 5
    };

    await updateExercise(updateInput);

    // Query database to verify changes were persisted
    const exercises = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, exerciseResult[0].id))
      .execute();

    expect(exercises).toHaveLength(1);
    expect(exercises[0].name).toEqual('Database Updated Exercise');
    expect(exercises[0].sets).toEqual(5);
    expect(exercises[0].category).toEqual('Strength'); // Unchanged
    expect(parseFloat(exercises[0].weight)).toEqual(50.00); // Unchanged
  });

  it('should throw error for non-existent exercise', async () => {
    const updateInput: UpdateExerciseInput = {
      id: 999,
      name: 'Non-existent Exercise'
    };

    await expect(updateExercise(updateInput)).rejects.toThrow(/not found/i);
  });
});
