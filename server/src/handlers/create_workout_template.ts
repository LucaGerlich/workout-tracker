
import { db } from '../db';
import { workoutTemplatesTable } from '../db/schema';
import { type CreateWorkoutTemplateInput, type WorkoutTemplate } from '../schema';

export const createWorkoutTemplate = async (input: CreateWorkoutTemplateInput): Promise<WorkoutTemplate> => {
  try {
    const result = await db.insert(workoutTemplatesTable)
      .values({
        name: input.name,
        description: input.description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Workout template creation failed:', error);
    throw error;
  }
};
