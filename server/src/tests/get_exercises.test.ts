
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workoutSessionsTable, exercisesTable } from '../db/schema';
import { getExercises } from '../handlers/get_exercises';

describe('getExercises', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return exercises for a workout session', async () => {
    // Create workout session first
    const sessionResult = await db.insert(workoutSessionsTable)
      .values({
        name: 'Test Workout'
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    // Create test exercises
    await db.insert(exercisesTable)
      .values([
        {
          name: 'Push-ups',
          category: 'Bodyweight',
          sets: 3,
          reps: 15,
          weight: '0.00',
          workout_session_id: sessionId
        },
        {
          name: 'Bench Press',
          category: 'Strength',
          sets: 4,
          reps: 10,
          weight: '135.50',
          workout_session_id: sessionId
        }
      ])
      .execute();

    const exercises = await getExercises(sessionId);

    expect(exercises).toHaveLength(2);
    
    // Verify first exercise
    const pushUps = exercises.find(e => e.name === 'Push-ups');
    expect(pushUps).toBeDefined();
    expect(pushUps!.category).toEqual('Bodyweight');
    expect(pushUps!.sets).toEqual(3);
    expect(pushUps!.reps).toEqual(15);
    expect(pushUps!.weight).toEqual(0);
    expect(typeof pushUps!.weight).toBe('number');
    expect(pushUps!.workout_session_id).toEqual(sessionId);

    // Verify second exercise
    const benchPress = exercises.find(e => e.name === 'Bench Press');
    expect(benchPress).toBeDefined();
    expect(benchPress!.category).toEqual('Strength');
    expect(benchPress!.sets).toEqual(4);
    expect(benchPress!.reps).toEqual(10);
    expect(benchPress!.weight).toEqual(135.5);
    expect(typeof benchPress!.weight).toBe('number');
    expect(benchPress!.workout_session_id).toEqual(sessionId);
  });

  it('should return empty array for workout session with no exercises', async () => {
    // Create workout session with no exercises
    const sessionResult = await db.insert(workoutSessionsTable)
      .values({
        name: 'Empty Workout'
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    const exercises = await getExercises(sessionId);

    expect(exercises).toHaveLength(0);
    expect(exercises).toEqual([]);
  });

  it('should return only exercises for specified workout session', async () => {
    // Create two workout sessions
    const sessionResults = await db.insert(workoutSessionsTable)
      .values([
        { name: 'Workout A' },
        { name: 'Workout B' }
      ])
      .returning()
      .execute();

    const sessionAId = sessionResults[0].id;
    const sessionBId = sessionResults[1].id;

    // Create exercises for both sessions
    await db.insert(exercisesTable)
      .values([
        {
          name: 'Exercise A1',
          category: 'Strength',
          sets: 3,
          reps: 10,
          weight: '100.00',
          workout_session_id: sessionAId
        },
        {
          name: 'Exercise A2',
          category: 'Cardio',
          sets: 1,
          reps: 20,
          weight: '0.00',
          workout_session_id: sessionAId
        },
        {
          name: 'Exercise B1',
          category: 'Flexibility',
          sets: 2,
          reps: 15,
          weight: '5.00',
          workout_session_id: sessionBId
        }
      ])
      .execute();

    const exercisesA = await getExercises(sessionAId);
    const exercisesB = await getExercises(sessionBId);

    // Verify session A exercises
    expect(exercisesA).toHaveLength(2);
    expect(exercisesA.every(e => e.workout_session_id === sessionAId)).toBe(true);
    expect(exercisesA.map(e => e.name).sort()).toEqual(['Exercise A1', 'Exercise A2']);

    // Verify session B exercises
    expect(exercisesB).toHaveLength(1);
    expect(exercisesB[0].workout_session_id).toEqual(sessionBId);
    expect(exercisesB[0].name).toEqual('Exercise B1');
  });
});
