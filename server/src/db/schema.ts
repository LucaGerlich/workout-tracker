
import { serial, text, pgTable, timestamp, numeric, integer, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const workoutTemplatesTable = pgTable('workout_templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const workoutSessionsTable = pgTable('workout_sessions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  start_time: timestamp('start_time').defaultNow().notNull(),
  end_time: timestamp('end_time'),
  template_id: integer('template_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  templateFk: foreignKey({
    columns: [table.template_id],
    foreignColumns: [workoutTemplatesTable.id],
  }),
}));

export const exercisesTable = pgTable('exercises', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  sets: integer('sets').notNull(),
  reps: integer('reps').notNull(),
  weight: numeric('weight', { precision: 8, scale: 2 }).notNull(),
  workout_session_id: integer('workout_session_id').notNull(),
  template_id: integer('template_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  workoutSessionFk: foreignKey({
    columns: [table.workout_session_id],
    foreignColumns: [workoutSessionsTable.id],
  }),
  templateFk: foreignKey({
    columns: [table.template_id],
    foreignColumns: [workoutTemplatesTable.id],
  }),
}));

export const templateExercisesTable = pgTable('template_exercises', {
  id: serial('id').primaryKey(),
  template_id: integer('template_id').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  sets: integer('sets').notNull(),
  reps: integer('reps').notNull(),
  weight: numeric('weight', { precision: 8, scale: 2 }).notNull(),
  order_index: integer('order_index').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  templateFk: foreignKey({
    columns: [table.template_id],
    foreignColumns: [workoutTemplatesTable.id],
  }),
}));

// Relations
export const workoutTemplatesRelations = relations(workoutTemplatesTable, ({ many }) => ({
  workoutSessions: many(workoutSessionsTable),
  templateExercises: many(templateExercisesTable),
}));

export const workoutSessionsRelations = relations(workoutSessionsTable, ({ one, many }) => ({
  template: one(workoutTemplatesTable, {
    fields: [workoutSessionsTable.template_id],
    references: [workoutTemplatesTable.id],
  }),
  exercises: many(exercisesTable),
}));

export const exercisesRelations = relations(exercisesTable, ({ one }) => ({
  workoutSession: one(workoutSessionsTable, {
    fields: [exercisesTable.workout_session_id],
    references: [workoutSessionsTable.id],
  }),
  template: one(workoutTemplatesTable, {
    fields: [exercisesTable.template_id],
    references: [workoutTemplatesTable.id],
  }),
}));

export const templateExercisesRelations = relations(templateExercisesTable, ({ one }) => ({
  template: one(workoutTemplatesTable, {
    fields: [templateExercisesTable.template_id],
    references: [workoutTemplatesTable.id],
  }),
}));

// Export all tables
export const tables = {
  workoutTemplates: workoutTemplatesTable,
  workoutSessions: workoutSessionsTable,
  exercises: exercisesTable,
  templateExercises: templateExercisesTable,
};
