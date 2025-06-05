
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workoutTemplatesTable } from '../db/schema';
import { getWorkoutTemplates } from '../handlers/get_workout_templates';

describe('getWorkoutTemplates', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no templates exist', async () => {
    const result = await getWorkoutTemplates();
    
    expect(result).toEqual([]);
  });

  it('should return all workout templates', async () => {
    // Create test templates
    const templates = await db.insert(workoutTemplatesTable)
      .values([
        {
          name: 'Upper Body Workout',
          description: 'Focus on upper body muscles'
        },
        {
          name: 'Lower Body Workout',
          description: 'Focus on lower body muscles'
        },
        {
          name: 'Full Body Workout',
          description: null
        }
      ])
      .returning()
      .execute();

    const result = await getWorkoutTemplates();

    expect(result).toHaveLength(3);
    
    // Check first template
    const upperBodyTemplate = result.find(t => t.name === 'Upper Body Workout');
    expect(upperBodyTemplate).toBeDefined();
    expect(upperBodyTemplate!.description).toEqual('Focus on upper body muscles');
    expect(upperBodyTemplate!.id).toBeDefined();
    expect(upperBodyTemplate!.created_at).toBeInstanceOf(Date);

    // Check template with null description
    const fullBodyTemplate = result.find(t => t.name === 'Full Body Workout');
    expect(fullBodyTemplate).toBeDefined();
    expect(fullBodyTemplate!.description).toBeNull();
    expect(fullBodyTemplate!.id).toBeDefined();
    expect(fullBodyTemplate!.created_at).toBeInstanceOf(Date);
  });

  it('should return templates ordered by creation time', async () => {
    // Create templates with slight delay to ensure different timestamps
    await db.insert(workoutTemplatesTable)
      .values({
        name: 'First Template',
        description: 'Created first'
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(workoutTemplatesTable)
      .values({
        name: 'Second Template',
        description: 'Created second'
      })
      .execute();

    const result = await getWorkoutTemplates();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Template');
    expect(result[1].name).toEqual('Second Template');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
