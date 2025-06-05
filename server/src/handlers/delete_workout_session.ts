
import { db } from '../db';
import { workoutSessionsTable, exercisesTable } from '../db/schema';
import { type DeleteWorkoutSessionInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteWorkoutSession = async (input: DeleteWorkoutSessionInput): Promise<{ success: boolean }> => {
  try {
    // First delete all exercises associated with this workout session
    await db.delete(exercisesTable)
      .where(eq(exercisesTable.workout_session_id, input.id))
      .execute();

    // Then delete the workout session
    const result = await db.delete(workoutSessionsTable)
      .where(eq(workoutSessionsTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Workout session deletion failed:', error);
    throw error;
  }
};
