
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

import {
  createWorkoutSessionInputSchema,
  getWorkoutSessionInputSchema,
  updateWorkoutSessionInputSchema,
  deleteWorkoutSessionInputSchema,
  createExerciseInputSchema,
  updateExerciseInputSchema,
  deleteExerciseInputSchema,
  createWorkoutTemplateInputSchema,
  getWorkoutTemplateInputSchema,
  deleteWorkoutTemplateInputSchema,
  createTemplateExerciseInputSchema
} from './schema';

import { createWorkoutSession } from './handlers/create_workout_session';
import { getWorkoutSessions } from './handlers/get_workout_sessions';
import { getWorkoutSession } from './handlers/get_workout_session';
import { updateWorkoutSession } from './handlers/update_workout_session';
import { deleteWorkoutSession } from './handlers/delete_workout_session';
import { createExercise } from './handlers/create_exercise';
import { getExercises } from './handlers/get_exercises';
import { updateExercise } from './handlers/update_exercise';
import { deleteExercise } from './handlers/delete_exercise';
import { createWorkoutTemplate } from './handlers/create_workout_template';
import { getWorkoutTemplates } from './handlers/get_workout_templates';
import { getWorkoutTemplate } from './handlers/get_workout_template';
import { deleteWorkoutTemplate } from './handlers/delete_workout_template';
import { createTemplateExercise } from './handlers/create_template_exercise';
import { getTemplateExercises } from './handlers/get_template_exercises';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Workout Session endpoints
  createWorkoutSession: publicProcedure
    .input(createWorkoutSessionInputSchema)
    .mutation(({ input }) => createWorkoutSession(input)),
  
  getWorkoutSessions: publicProcedure
    .query(() => getWorkoutSessions()),
  
  getWorkoutSession: publicProcedure
    .input(getWorkoutSessionInputSchema)
    .query(({ input }) => getWorkoutSession(input)),
  
  updateWorkoutSession: publicProcedure
    .input(updateWorkoutSessionInputSchema)
    .mutation(({ input }) => updateWorkoutSession(input)),
  
  deleteWorkoutSession: publicProcedure
    .input(deleteWorkoutSessionInputSchema)
    .mutation(({ input }) => deleteWorkoutSession(input)),

  // Exercise endpoints
  createExercise: publicProcedure
    .input(createExerciseInputSchema)
    .mutation(({ input }) => createExercise(input)),
  
  getExercises: publicProcedure
    .input(z.object({ workoutSessionId: z.number() }))
    .query(({ input }) => getExercises(input.workoutSessionId)),
  
  updateExercise: publicProcedure
    .input(updateExerciseInputSchema)
    .mutation(({ input }) => updateExercise(input)),
  
  deleteExercise: publicProcedure
    .input(deleteExerciseInputSchema)
    .mutation(({ input }) => deleteExercise(input)),

  // Workout Template endpoints
  createWorkoutTemplate: publicProcedure
    .input(createWorkoutTemplateInputSchema)
    .mutation(({ input }) => createWorkoutTemplate(input)),
  
  getWorkoutTemplates: publicProcedure
    .query(() => getWorkoutTemplates()),
  
  getWorkoutTemplate: publicProcedure
    .input(getWorkoutTemplateInputSchema)
    .query(({ input }) => getWorkoutTemplate(input)),
  
  deleteWorkoutTemplate: publicProcedure
    .input(deleteWorkoutTemplateInputSchema)
    .mutation(({ input }) => deleteWorkoutTemplate(input)),

  // Template Exercise endpoints
  createTemplateExercise: publicProcedure
    .input(createTemplateExerciseInputSchema)
    .mutation(({ input }) => createTemplateExercise(input)),
  
  getTemplateExercises: publicProcedure
    .input(z.object({ templateId: z.number() }))
    .query(({ input }) => getTemplateExercises(input.templateId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
