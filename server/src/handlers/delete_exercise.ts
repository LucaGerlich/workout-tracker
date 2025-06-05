
import { db } from '../db';
import { exercisesTable } from '../db/schema';
import { type DeleteExerciseInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteExercise = async (input: DeleteExerciseInput): Promise<{ success: boolean }> => {
  try {
    const result = await db.delete(exercisesTable)
      .where(eq(exercisesTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Exercise deletion failed:', error);
    throw error;
  }
};
