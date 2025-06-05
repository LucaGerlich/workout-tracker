
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workoutTemplatesTable } from '../db/schema';
import { type CreateWorkoutTemplateInput } from '../schema';
import { createWorkoutTemplate } from '../handlers/create_workout_template';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateWorkoutTemplateInput = {
  name: 'Push Day Template',
  description: 'Upper body push exercises'
};

const testInputWithoutDescription: CreateWorkoutTemplateInput = {
  name: 'Pull Day Template'
};

describe('createWorkoutTemplate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a workout template with description', async () => {
    const result = await createWorkoutTemplate(testInput);

    expect(result.name).toEqual('Push Day Template');
    expect(result.description).toEqual('Upper body push exercises');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a workout template without description', async () => {
    const result = await createWorkoutTemplate(testInputWithoutDescription);

    expect(result.name).toEqual('Pull Day Template');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save workout template to database', async () => {
    const result = await createWorkoutTemplate(testInput);

    const templates = await db.select()
      .from(workoutTemplatesTable)
      .where(eq(workoutTemplatesTable.id, result.id))
      .execute();

    expect(templates).toHaveLength(1);
    expect(templates[0].name).toEqual('Push Day Template');
    expect(templates[0].description).toEqual('Upper body push exercises');
    expect(templates[0].created_at).toBeInstanceOf(Date);
  });

  it('should save workout template with null description to database', async () => {
    const result = await createWorkoutTemplate(testInputWithoutDescription);

    const templates = await db.select()
      .from(workoutTemplatesTable)
      .where(eq(workoutTemplatesTable.id, result.id))
      .execute();

    expect(templates).toHaveLength(1);
    expect(templates[0].name).toEqual('Pull Day Template');
    expect(templates[0].description).toBeNull();
    expect(templates[0].created_at).toBeInstanceOf(Date);
  });
});
