
import { db } from '../db';
import { workoutTemplatesTable } from '../db/schema';
import { type DeleteWorkoutTemplateInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteWorkoutTemplate = async (input: DeleteWorkoutTemplateInput): Promise<{ success: boolean }> => {
  try {
    const result = await db.delete(workoutTemplatesTable)
      .where(eq(workoutTemplatesTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Workout template deletion failed:', error);
    throw error;
  }
};
