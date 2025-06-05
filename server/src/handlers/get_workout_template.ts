
import { db } from '../db';
import { workoutTemplatesTable } from '../db/schema';
import { type GetWorkoutTemplateInput, type WorkoutTemplate } from '../schema';
import { eq } from 'drizzle-orm';

export const getWorkoutTemplate = async (input: GetWorkoutTemplateInput): Promise<WorkoutTemplate> => {
  try {
    const result = await db.select()
      .from(workoutTemplatesTable)
      .where(eq(workoutTemplatesTable.id, input.id))
      .execute();

    if (result.length === 0) {
      throw new Error(`Workout template with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Get workout template failed:', error);
    throw error;
  }
};
