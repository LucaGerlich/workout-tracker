
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workoutTemplatesTable } from '../db/schema';
import { type DeleteWorkoutTemplateInput, type CreateWorkoutTemplateInput } from '../schema';
import { deleteWorkoutTemplate } from '../handlers/delete_workout_template';
import { eq } from 'drizzle-orm';

// Test data
const testTemplate: CreateWorkoutTemplateInput = {
  name: 'Test Template',
  description: 'A template for testing deletion'
};

const testInput: DeleteWorkoutTemplateInput = {
  id: 1
};

describe('deleteWorkoutTemplate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing workout template', async () => {
    // Create template first
    const created = await db.insert(workoutTemplatesTable)
      .values({
        name: testTemplate.name,
        description: testTemplate.description
      })
      .returning()
      .execute();

    const templateId = created[0].id;

    // Delete the template
    const result = await deleteWorkoutTemplate({ id: templateId });

    expect(result.success).toBe(true);

    // Verify template was deleted
    const templates = await db.select()
      .from(workoutTemplatesTable)
      .where(eq(workoutTemplatesTable.id, templateId))
      .execute();

    expect(templates).toHaveLength(0);
  });

  it('should succeed even when deleting non-existent template', async () => {
    // Try to delete non-existent template
    const result = await deleteWorkoutTemplate({ id: 999 });

    expect(result.success).toBe(true);
  });

  it('should handle multiple templates correctly', async () => {
    // Create multiple templates
    const template1 = await db.insert(workoutTemplatesTable)
      .values({
        name: 'Template 1',
        description: 'First template'
      })
      .returning()
      .execute();

    const template2 = await db.insert(workoutTemplatesTable)
      .values({
        name: 'Template 2',
        description: 'Second template'
      })
      .returning()
      .execute();

    // Delete only the first template
    const result = await deleteWorkoutTemplate({ id: template1[0].id });

    expect(result.success).toBe(true);

    // Verify first template was deleted
    const deletedTemplate = await db.select()
      .from(workoutTemplatesTable)
      .where(eq(workoutTemplatesTable.id, template1[0].id))
      .execute();

    expect(deletedTemplate).toHaveLength(0);

    // Verify second template still exists
    const remainingTemplate = await db.select()
      .from(workoutTemplatesTable)
      .where(eq(workoutTemplatesTable.id, template2[0].id))
      .execute();

    expect(remainingTemplate).toHaveLength(1);
    expect(remainingTemplate[0].name).toEqual('Template 2');
  });
});
