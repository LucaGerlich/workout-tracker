
import { db } from '../db';
import { workoutSessionsTable } from '../db/schema';
import { type GetWorkoutSessionInput, type WorkoutSession } from '../schema';
import { eq } from 'drizzle-orm';

export const getWorkoutSession = async (input: GetWorkoutSessionInput): Promise<WorkoutSession> => {
  try {
    const result = await db.select()
      .from(workoutSessionsTable)
      .where(eq(workoutSessionsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      throw new Error(`Workout session with id ${input.id} not found`);
    }

    const session = result[0];
    return {
      ...session,
      // No numeric conversions needed - all fields are already proper types
    };
  } catch (error) {
    console.error('Get workout session failed:', error);
    throw error;
  }
};
