
import { db } from '../db';
import { workoutSessionsTable } from '../db/schema';
import { type WorkoutSession } from '../schema';
import { desc } from 'drizzle-orm';

export const getWorkoutSessions = async (): Promise<WorkoutSession[]> => {
  try {
    const results = await db.select()
      .from(workoutSessionsTable)
      .orderBy(desc(workoutSessionsTable.created_at))
      .execute();

    return results.map(session => ({
      ...session,
      // No numeric conversions needed - all fields are already proper types
    }));
  } catch (error) {
    console.error('Failed to get workout sessions:', error);
    throw error;
  }
};
