
import { db } from '../db';
import { templateExercisesTable, workoutTemplatesTable } from '../db/schema';
import { type CreateTemplateExerciseInput, type TemplateExercise } from '../schema';
import { eq } from 'drizzle-orm';

export const createTemplateExercise = async (input: CreateTemplateExerciseInput): Promise<TemplateExercise> => {
  try {
    // Verify template exists first to prevent foreign key constraint violation
    const templateExists = await db.select()
      .from(workoutTemplatesTable)
      .where(eq(workoutTemplatesTable.id, input.template_id))
      .execute();

    if (templateExists.length === 0) {
      throw new Error(`Template with id ${input.template_id} not found`);
    }

    // Insert template exercise record
    const result = await db.insert(templateExercisesTable)
      .values({
        template_id: input.template_id,
        name: input.name,
        category: input.category,
        sets: input.sets,
        reps: input.reps,
        weight: input.weight.toString(), // Convert number to string for numeric column
        order_index: input.order_index
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const templateExercise = result[0];
    return {
      ...templateExercise,
      weight: parseFloat(templateExercise.weight) // Convert string back to number
    };
  } catch (error) {
    console.error('Template exercise creation failed:', error);
    throw error;
  }
};
