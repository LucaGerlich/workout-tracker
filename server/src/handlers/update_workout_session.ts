
import { db } from '../db';
import { workoutSessionsTable } from '../db/schema';
import { type UpdateWorkoutSessionInput, type WorkoutSession } from '../schema';
import { eq } from 'drizzle-orm';

export const updateWorkoutSession = async (input: UpdateWorkoutSessionInput): Promise<WorkoutSession> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<{
      name: string;
      end_time: Date;
    }> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.end_time !== undefined) {
      updateData.end_time = input.end_time;
    }

    // Update workout session record
    const result = await db.update(workoutSessionsTable)
      .set(updateData)
      .where(eq(workoutSessionsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Workout session with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Workout session update failed:', error);
    throw error;
  }
};
