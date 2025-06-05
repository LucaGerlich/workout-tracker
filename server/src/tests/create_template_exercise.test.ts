
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { templateExercisesTable, workoutTemplatesTable } from '../db/schema';
import { type CreateTemplateExerciseInput, type CreateWorkoutTemplateInput } from '../schema';
import { createTemplateExercise } from '../handlers/create_template_exercise';
import { eq } from 'drizzle-orm';

describe('createTemplateExercise', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create a template first
  const createTestTemplate = async (): Promise<number> => {
    const templateInput: CreateWorkoutTemplateInput = {
      name: 'Test Template',
      description: 'A template for testing'
    };

    const result = await db.insert(workoutTemplatesTable)
      .values({
        name: templateInput.name,
        description: templateInput.description
      })
      .returning()
      .execute();

    return result[0].id;
  };

  it('should create a template exercise', async () => {
    const templateId = await createTestTemplate();

    const testInput: CreateTemplateExerciseInput = {
      template_id: templateId,
      name: 'Bench Press',
      category: 'Chest',
      sets: 3,
      reps: 10,
      weight: 135.5,
      order_index: 1
    };

    const result = await createTemplateExercise(testInput);

    // Basic field validation
    expect(result.template_id).toEqual(templateId);
    expect(result.name).toEqual('Bench Press');
    expect(result.category).toEqual('Chest');
    expect(result.sets).toEqual(3);
    expect(result.reps).toEqual(10);
    expect(result.weight).toEqual(135.5);
    expect(typeof result.weight).toEqual('number');
    expect(result.order_index).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save template exercise to database', async () => {
    const templateId = await createTestTemplate();

    const testInput: CreateTemplateExerciseInput = {
      template_id: templateId,
      name: 'Squat',
      category: 'Legs',
      sets: 4,
      reps: 8,
      weight: 225.75,
      order_index: 2
    };

    const result = await createTemplateExercise(testInput);

    // Query database to verify record was saved
    const templateExercises = await db.select()
      .from(templateExercisesTable)
      .where(eq(templateExercisesTable.id, result.id))
      .execute();

    expect(templateExercises).toHaveLength(1);
    const savedExercise = templateExercises[0];
    expect(savedExercise.template_id).toEqual(templateId);
    expect(savedExercise.name).toEqual('Squat');
    expect(savedExercise.category).toEqual('Legs');
    expect(savedExercise.sets).toEqual(4);
    expect(savedExercise.reps).toEqual(8);
    expect(parseFloat(savedExercise.weight)).toEqual(225.75);
    expect(savedExercise.order_index).toEqual(2);
    expect(savedExercise.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when template does not exist', async () => {
    const testInput: CreateTemplateExerciseInput = {
      template_id: 999, // Non-existent template ID
      name: 'Deadlift',
      category: 'Back',
      sets: 5,
      reps: 5,
      weight: 315.0,
      order_index: 3
    };

    await expect(createTemplateExercise(testInput)).rejects.toThrow(/template.*not found/i);
  });

  it('should handle decimal weights correctly', async () => {
    const templateId = await createTestTemplate();

    const testInput: CreateTemplateExerciseInput = {
      template_id: templateId,
      name: 'Dumbbell Press',
      category: 'Chest',
      sets: 3,
      reps: 12,
      weight: 45.25,
      order_index: 4
    };

    const result = await createTemplateExercise(testInput);

    expect(result.weight).toEqual(45.25);
    expect(typeof result.weight).toEqual('number');

    // Verify in database
    const savedExercise = await db.select()
      .from(templateExercisesTable)
      .where(eq(templateExercisesTable.id, result.id))
      .execute();

    expect(parseFloat(savedExercise[0].weight)).toEqual(45.25);
  });
});
