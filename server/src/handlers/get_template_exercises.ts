
import { db } from '../db';
import { templateExercisesTable } from '../db/schema';
import { type TemplateExercise } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getTemplateExercises = async (templateId: number): Promise<TemplateExercise[]> => {
  try {
    const results = await db.select()
      .from(templateExercisesTable)
      .where(eq(templateExercisesTable.template_id, templateId))
      .orderBy(asc(templateExercisesTable.order_index))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(exercise => ({
      ...exercise,
      weight: parseFloat(exercise.weight)
    }));
  } catch (error) {
    console.error('Failed to get template exercises:', error);
    throw error;
  }
};
