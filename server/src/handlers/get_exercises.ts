
import { db } from '../db';
import { exercisesTable } from '../db/schema';
import { type Exercise } from '../schema';
import { eq } from 'drizzle-orm';

export const getExercises = async (workoutSessionId: number): Promise<Exercise[]> => {
  try {
    const results = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.workout_session_id, workoutSessionId))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(exercise => ({
      ...exercise,
      weight: parseFloat(exercise.weight) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to get exercises:', error);
    throw error;
  }
};
