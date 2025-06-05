
import { db } from '../db';
import { exercisesTable } from '../db/schema';
import { type UpdateExerciseInput, type Exercise } from '../schema';
import { eq } from 'drizzle-orm';

export const updateExercise = async (input: UpdateExerciseInput): Promise<Exercise> => {
  try {
    // Build update values object, only including provided fields
    const updateValues: any = {};
    
    if (input.name !== undefined) {
      updateValues.name = input.name;
    }
    if (input.category !== undefined) {
      updateValues.category = input.category;
    }
    if (input.sets !== undefined) {
      updateValues.sets = input.sets;
    }
    if (input.reps !== undefined) {
      updateValues.reps = input.reps;
    }
    if (input.weight !== undefined) {
      updateValues.weight = input.weight.toString(); // Convert number to string for numeric column
    }

    // Update exercise record
    const result = await db.update(exercisesTable)
      .set(updateValues)
      .where(eq(exercisesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Exercise with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const exercise = result[0];
    return {
      ...exercise,
      weight: parseFloat(exercise.weight) // Convert string back to number
    };
  } catch (error) {
    console.error('Exercise update failed:', error);
    throw error;
  }
};
