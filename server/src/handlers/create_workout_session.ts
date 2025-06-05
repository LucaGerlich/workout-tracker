
import { db } from '../db';
import { workoutSessionsTable } from '../db/schema';
import { type CreateWorkoutSessionInput, type WorkoutSession } from '../schema';

export const createWorkoutSession = async (input: CreateWorkoutSessionInput): Promise<WorkoutSession> => {
  try {
    // Insert workout session record
    const result = await db.insert(workoutSessionsTable)
      .values({
        name: input.name,
        template_id: input.template_id || null
      })
      .returning()
      .execute();

    const workoutSession = result[0];
    return workoutSession;
  } catch (error) {
    console.error('Workout session creation failed:', error);
    throw error;
  }
};
