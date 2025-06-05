
import { db } from '../db';
import { exercisesTable } from '../db/schema';
import { type CreateExerciseInput, type Exercise } from '../schema';

export const createExercise = async (input: CreateExerciseInput): Promise<Exercise> => {
  try {
    // Insert exercise record
    const result = await db.insert(exercisesTable)
      .values({
        name: input.name,
        category: input.category,
        sets: input.sets,
        reps: input.reps,
        weight: input.weight.toString(), // Convert number to string for numeric column
        workout_session_id: input.workout_session_id
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const exercise = result[0];
    return {
      ...exercise,
      weight: parseFloat(exercise.weight), // Convert string back to number
      template_id: exercise.template_id
    };
  } catch (error) {
    console.error('Exercise creation failed:', error);
    throw error;
  }
};
