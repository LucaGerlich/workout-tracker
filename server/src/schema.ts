
import { z } from 'zod';

// Exercise schema
export const exerciseSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string(),
  sets: z.number().int().nonnegative(),
  reps: z.number().int().nonnegative(),
  weight: z.number().nonnegative(),
  workout_session_id: z.number(),
  template_id: z.number().nullable(),
  created_at: z.coerce.date()
});

export type Exercise = z.infer<typeof exerciseSchema>;

// Workout session schema
export const workoutSessionSchema = z.object({
  id: z.number(),
  name: z.string(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date().nullable(),
  template_id: z.number().nullable(),
  created_at: z.coerce.date()
});

export type WorkoutSession = z.infer<typeof workoutSessionSchema>;

// Workout template schema
export const workoutTemplateSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type WorkoutTemplate = z.infer<typeof workoutTemplateSchema>;

// Template exercise schema (exercises in a template)
export const templateExerciseSchema = z.object({
  id: z.number(),
  template_id: z.number(),
  name: z.string(),
  category: z.string(),
  sets: z.number().int().nonnegative(),
  reps: z.number().int().nonnegative(),
  weight: z.number().nonnegative(),
  order_index: z.number().int().nonnegative(),
  created_at: z.coerce.date()
});

export type TemplateExercise = z.infer<typeof templateExerciseSchema>;

// Input schemas for creating
export const createWorkoutSessionInputSchema = z.object({
  name: z.string(),
  template_id: z.number().optional()
});

export type CreateWorkoutSessionInput = z.infer<typeof createWorkoutSessionInputSchema>;

export const createExerciseInputSchema = z.object({
  name: z.string(),
  category: z.string(),
  sets: z.number().int().nonnegative(),
  reps: z.number().int().nonnegative(),
  weight: z.number().nonnegative(),
  workout_session_id: z.number()
});

export type CreateExerciseInput = z.infer<typeof createExerciseInputSchema>;

export const createWorkoutTemplateInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional()
});

export type CreateWorkoutTemplateInput = z.infer<typeof createWorkoutTemplateInputSchema>;

export const createTemplateExerciseInputSchema = z.object({
  template_id: z.number(),
  name: z.string(),
  category: z.string(),
  sets: z.number().int().nonnegative(),
  reps: z.number().int().nonnegative(),
  weight: z.number().nonnegative(),
  order_index: z.number().int().nonnegative()
});

export type CreateTemplateExerciseInput = z.infer<typeof createTemplateExerciseInputSchema>;

// Update schemas
export const updateWorkoutSessionInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  end_time: z.coerce.date().optional()
});

export type UpdateWorkoutSessionInput = z.infer<typeof updateWorkoutSessionInputSchema>;

export const updateExerciseInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  category: z.string().optional(),
  sets: z.number().int().nonnegative().optional(),
  reps: z.number().int().nonnegative().optional(),
  weight: z.number().nonnegative().optional()
});

export type UpdateExerciseInput = z.infer<typeof updateExerciseInputSchema>;

// Query schemas
export const getWorkoutSessionInputSchema = z.object({
  id: z.number()
});

export type GetWorkoutSessionInput = z.infer<typeof getWorkoutSessionInputSchema>;

export const getWorkoutTemplateInputSchema = z.object({
  id: z.number()
});

export type GetWorkoutTemplateInput = z.infer<typeof getWorkoutTemplateInputSchema>;

export const deleteWorkoutSessionInputSchema = z.object({
  id: z.number()
});

export type DeleteWorkoutSessionInput = z.infer<typeof deleteWorkoutSessionInputSchema>;

export const deleteExerciseInputSchema = z.object({
  id: z.number()
});

export type DeleteExerciseInput = z.infer<typeof deleteExerciseInputSchema>;

export const deleteWorkoutTemplateInputSchema = z.object({
  id: z.number()
});

export type DeleteWorkoutTemplateInput = z.infer<typeof deleteWorkoutTemplateInputSchema>;
