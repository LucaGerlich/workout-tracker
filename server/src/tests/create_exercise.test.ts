
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { exercisesTable, workoutSessionsTable } from '../db/schema';
import { type CreateExerciseInput } from '../schema';
import { createExercise } from '../handlers/create_exercise';
import { eq } from 'drizzle-orm';

describe('createExercise', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an exercise', async () => {
    // Create a workout session first (foreign key requirement)
    const sessionResult = await db.insert(workoutSessionsTable)
      .values({
        name: 'Test Workout Session'
      })
      .returning()
      .execute();

    const testInput: CreateExerciseInput = {
      name: 'Bench Press',
      category: 'Chest',
      sets: 3,
      reps: 10,
      weight: 135.5,
      workout_session_id: sessionResult[0].id
    };

    const result = await createExercise(testInput);

    // Basic field validation
    expect(result.name).toEqual('Bench Press');
    expect(result.category).toEqual('Chest');
    expect(result.sets).toEqual(3);
    expect(result.reps).toEqual(10);
    expect(result.weight).toEqual(135.5);
    expect(typeof result.weight).toBe('number');
    expect(result.workout_session_id).toEqual(sessionResult[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.template_id).toBeNull();
  });

  it('should save exercise to database', async () => {
    // Create a workout session first
    const sessionResult = await db.insert(workoutSessionsTable)
      .values({
        name: 'Test Workout Session'
      })
      .returning()
      .execute();

    const testInput: CreateExerciseInput = {
      name: 'Squat',
      category: 'Legs',
      sets: 4,
      reps: 8,
      weight: 225.0,
      workout_session_id: sessionResult[0].id
    };

    const result = await createExercise(testInput);

    // Query using proper drizzle syntax
    const exercises = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, result.id))
      .execute();

    expect(exercises).toHaveLength(1);
    expect(exercises[0].name).toEqual('Squat');
    expect(exercises[0].category).toEqual('Legs');
    expect(exercises[0].sets).toEqual(4);
    expect(exercises[0].reps).toEqual(8);
    expect(parseFloat(exercises[0].weight)).toEqual(225.0);
    expect(exercises[0].workout_session_id).toEqual(sessionResult[0].id);
    expect(exercises[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle decimal weights correctly', async () => {
    // Create a workout session first
    const sessionResult = await db.insert(workoutSessionsTable)
      .values({
        name: 'Test Workout Session'
      })
      .returning()
      .execute();

    const testInput: CreateExerciseInput = {
      name: 'Dumbbell Curl',
      category: 'Arms',
      sets: 3,
      reps: 12,
      weight: 22.5,
      workout_session_id: sessionResult[0].id
    };

    const result = await createExercise(testInput);

    expect(result.weight).toEqual(22.5);
    expect(typeof result.weight).toBe('number');

    // Verify in database
    const exercises = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, result.id))
      .execute();

    expect(parseFloat(exercises[0].weight)).toEqual(22.5);
  });

  it('should fail with invalid workout_session_id', async () => {
    const testInput: CreateExerciseInput = {
      name: 'Invalid Exercise',
      category: 'Test',
      sets: 1,
      reps: 1,
      weight: 1.0,
      workout_session_id: 99999 // Non-existent session
    };

    await expect(createExercise(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
