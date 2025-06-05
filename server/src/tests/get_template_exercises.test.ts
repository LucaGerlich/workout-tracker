
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workoutTemplatesTable, templateExercisesTable } from '../db/schema';
import { getTemplateExercises } from '../handlers/get_template_exercises';
import { type CreateWorkoutTemplateInput, type CreateTemplateExerciseInput } from '../schema';

describe('getTemplateExercises', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return template exercises ordered by order_index', async () => {
    // Create workout template first
    const templateInput: CreateWorkoutTemplateInput = {
      name: 'Test Template',
      description: 'A template for testing'
    };

    const [template] = await db.insert(workoutTemplatesTable)
      .values(templateInput)
      .returning()
      .execute();

    // Create template exercises in different order
    const exercise1Input: CreateTemplateExerciseInput = {
      template_id: template.id,
      name: 'Push-ups',
      category: 'Bodyweight',
      sets: 3,
      reps: 10,
      weight: 0,
      order_index: 2
    };

    const exercise2Input: CreateTemplateExerciseInput = {
      template_id: template.id,
      name: 'Squats',
      category: 'Bodyweight',
      sets: 3,
      reps: 15,
      weight: 0,
      order_index: 1
    };

    const exercise3Input: CreateTemplateExerciseInput = {
      template_id: template.id,
      name: 'Bench Press',
      category: 'Strength',
      sets: 4,
      reps: 8,
      weight: 135.5,
      order_index: 3
    };

    await db.insert(templateExercisesTable)
      .values([
        {
          ...exercise1Input,
          weight: exercise1Input.weight.toString()
        },
        {
          ...exercise2Input,
          weight: exercise2Input.weight.toString()
        },
        {
          ...exercise3Input,
          weight: exercise3Input.weight.toString()
        }
      ])
      .execute();

    const result = await getTemplateExercises(template.id);

    expect(result).toHaveLength(3);
    
    // Should be ordered by order_index
    expect(result[0].name).toEqual('Squats');
    expect(result[0].order_index).toEqual(1);
    expect(result[1].name).toEqual('Push-ups');
    expect(result[1].order_index).toEqual(2);
    expect(result[2].name).toEqual('Bench Press');
    expect(result[2].order_index).toEqual(3);

    // Verify numeric conversion
    expect(typeof result[0].weight).toEqual('number');
    expect(typeof result[2].weight).toEqual('number');
    expect(result[2].weight).toEqual(135.5);

    // Verify all fields are present
    result.forEach(exercise => {
      expect(exercise.id).toBeDefined();
      expect(exercise.template_id).toEqual(template.id);
      expect(exercise.name).toBeDefined();
      expect(exercise.category).toBeDefined();
      expect(exercise.sets).toBeDefined();
      expect(exercise.reps).toBeDefined();
      expect(exercise.weight).toBeDefined();
      expect(exercise.order_index).toBeDefined();
      expect(exercise.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for template with no exercises', async () => {
    // Create workout template without exercises
    const templateInput: CreateWorkoutTemplateInput = {
      name: 'Empty Template',
      description: 'Template with no exercises'
    };

    const [template] = await db.insert(workoutTemplatesTable)
      .values(templateInput)
      .returning()
      .execute();

    const result = await getTemplateExercises(template.id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent template', async () => {
    const result = await getTemplateExercises(999);

    expect(result).toHaveLength(0);
  });

  it('should handle multiple templates correctly', async () => {
    // Create two templates
    const [template1] = await db.insert(workoutTemplatesTable)
      .values({ name: 'Template 1' })
      .returning()
      .execute();

    const [template2] = await db.insert(workoutTemplatesTable)
      .values({ name: 'Template 2' })
      .returning()
      .execute();

    // Add exercises to first template
    await db.insert(templateExercisesTable)
      .values([
        {
          template_id: template1.id,
          name: 'Exercise 1',
          category: 'Strength',
          sets: 3,
          reps: 10,
          weight: '100.0',
          order_index: 1
        },
        {
          template_id: template1.id,
          name: 'Exercise 2',
          category: 'Cardio',
          sets: 1,
          reps: 20,
          weight: '0.0',
          order_index: 2
        }
      ])
      .execute();

    // Add exercise to second template
    await db.insert(templateExercisesTable)
      .values({
        template_id: template2.id,
        name: 'Exercise 3',
        category: 'Flexibility',
        sets: 2,
        reps: 15,
        weight: '0.0',
        order_index: 1
      })
      .execute();

    const result1 = await getTemplateExercises(template1.id);
    const result2 = await getTemplateExercises(template2.id);

    expect(result1).toHaveLength(2);
    expect(result2).toHaveLength(1);
    
    expect(result1[0].name).toEqual('Exercise 1');
    expect(result1[1].name).toEqual('Exercise 2');
    expect(result2[0].name).toEqual('Exercise 3');

    // Verify template isolation
    expect(result1.every(ex => ex.template_id === template1.id)).toBe(true);
    expect(result2.every(ex => ex.template_id === template2.id)).toBe(true);
  });
});
