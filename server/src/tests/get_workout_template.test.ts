
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workoutTemplatesTable } from '../db/schema';
import { type GetWorkoutTemplateInput } from '../schema';
import { getWorkoutTemplate } from '../handlers/get_workout_template';

describe('getWorkoutTemplate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a workout template by id', async () => {
    // Create a test template
    const insertResult = await db.insert(workoutTemplatesTable)
      .values({
        name: 'Test Template',
        description: 'A template for testing'
      })
      .returning()
      .execute();

    const testInput: GetWorkoutTemplateInput = {
      id: insertResult[0].id
    };

    const result = await getWorkoutTemplate(testInput);

    expect(result.id).toEqual(insertResult[0].id);
    expect(result.name).toEqual('Test Template');
    expect(result.description).toEqual('A template for testing');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should get a workout template with null description', async () => {
    // Create a test template with null description
    const insertResult = await db.insert(workoutTemplatesTable)
      .values({
        name: 'Template Without Description',
        description: null
      })
      .returning()
      .execute();

    const testInput: GetWorkoutTemplateInput = {
      id: insertResult[0].id
    };

    const result = await getWorkoutTemplate(testInput);

    expect(result.id).toEqual(insertResult[0].id);
    expect(result.name).toEqual('Template Without Description');
    expect(result.description).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when template does not exist', async () => {
    const testInput: GetWorkoutTemplateInput = {
      id: 999
    };

    await expect(getWorkoutTemplate(testInput)).rejects.toThrow(/not found/i);
  });
});
