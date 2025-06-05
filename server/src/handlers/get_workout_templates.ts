
import { db } from '../db';
import { workoutTemplatesTable } from '../db/schema';
import { type WorkoutTemplate } from '../schema';

export const getWorkoutTemplates = async (): Promise<WorkoutTemplate[]> => {
  try {
    const results = await db.select()
      .from(workoutTemplatesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get workout templates:', error);
    throw error;
  }
};
