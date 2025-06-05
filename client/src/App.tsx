
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import type { 
  WorkoutSession, 
  Exercise, 
  WorkoutTemplate, 
  TemplateExercise,
  CreateWorkoutSessionInput,
  CreateExerciseInput,
  CreateWorkoutTemplateInput,
  CreateTemplateExerciseInput,
  UpdateWorkoutSessionInput
} from '../../server/src/schema';

function App() {
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [activeExercises, setActiveExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restInterval, setRestInterval] = useState<number | null>(null);

  // Form states
  const [sessionForm, setSessionForm] = useState<CreateWorkoutSessionInput>({
    name: '',
    template_id: undefined
  });
  const [exerciseForm, setExerciseForm] = useState<CreateExerciseInput>({
    name: '',
    category: '',
    sets: 1,
    reps: 10,
    weight: 0,
    workout_session_id: 0
  });
  const [templateForm, setTemplateForm] = useState<CreateWorkoutTemplateInput>({
    name: '',
    description: null
  });
  const [templateExerciseForm, setTemplateExerciseForm] = useState<CreateTemplateExerciseInput>({
    template_id: 0,
    name: '',
    category: '',
    sets: 1,
    reps: 10,
    weight: 0,
    order_index: 0
  });

  // Dialog states
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showTemplateExerciseDialog, setShowTemplateExerciseDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>([]);

  const loadActiveExercises = useCallback(async (sessionId: number) => {
    try {
      const exercises = await trpc.getExercises.query({ workoutSessionId: sessionId });
      setActiveExercises(exercises);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    }
  }, []);

  const loadWorkoutSessions = useCallback(async () => {
    try {
      const sessions = await trpc.getWorkoutSessions.query();
      setWorkoutSessions(sessions);
      
      // Find active session (no end_time)
      const activeSessionFromDb = sessions.find((session: WorkoutSession) => !session.end_time);
      if (activeSessionFromDb) {
        setActiveSession(activeSessionFromDb);
        await loadActiveExercises(activeSessionFromDb.id);
      }
    } catch (error) {
      console.error('Failed to load workout sessions:', error);
    }
  }, [loadActiveExercises]);

  const loadWorkoutTemplates = useCallback(async () => {
    try {
      const templates = await trpc.getWorkoutTemplates.query();
      setWorkoutTemplates(templates);
    } catch (error) {
      console.error('Failed to load workout templates:', error);
    }
  }, []);

  const loadTemplateExercises = useCallback(async (templateId: number) => {
    try {
      const exercises = await trpc.getTemplateExercises.query({ templateId });
      setTemplateExercises(exercises);
    } catch (error) {
      console.error('Failed to load template exercises:', error);
    }
  }, []);

  useEffect(() => {
    loadWorkoutSessions();
    loadWorkoutTemplates();
  }, [loadWorkoutSessions, loadWorkoutTemplates]);

  useEffect(() => {
    return () => {
      if (restInterval) {
        clearInterval(restInterval);
      }
    };
  }, [restInterval]);

  const startWorkoutSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newSession = await trpc.createWorkoutSession.mutate(sessionForm);
      
      // If template selected, add exercises from template
      if (sessionForm.template_id) {
        const templateExercises = await trpc.getTemplateExercises.query({ templateId: sessionForm.template_id });
        for (const templateExercise of templateExercises) {
          await trpc.createExercise.mutate({
            name: templateExercise.name,
            category: templateExercise.category,
            sets: templateExercise.sets,
            reps: templateExercise.reps,
            weight: templateExercise.weight,
            workout_session_id: newSession.id
          });
        }
      }

      setActiveSession(newSession);
      await loadActiveExercises(newSession.id);
      await loadWorkoutSessions();
      setSessionForm({ name: '', template_id: undefined });
      setShowSessionDialog(false);
    } catch (error) {
      console.error('Failed to start workout session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const endWorkoutSession = async () => {
    if (!activeSession) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateWorkoutSessionInput = {
        id: activeSession.id,
        end_time: new Date()
      };
      await trpc.updateWorkoutSession.mutate(updateData);
      setActiveSession(null);
      setActiveExercises([]);
      await loadWorkoutSessions();
    } catch (error) {
      console.error('Failed to end workout session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    setIsLoading(true);
    try {
      const exerciseData = {
        ...exerciseForm,
        workout_session_id: activeSession.id
      };
      await trpc.createExercise.mutate(exerciseData);
      await loadActiveExercises(activeSession.id);
      setExerciseForm({
        name: '',
        category: '',
        sets: 1,
        reps: 10,
        weight: 0,
        workout_session_id: 0
      });
      setShowExerciseDialog(false);
    } catch (error) {
      console.error('Failed to add exercise:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createWorkoutTemplate.mutate(templateForm);
      await loadWorkoutTemplates();
      setTemplateForm({ name: '', description: null });
      setShowTemplateDialog(false);
    } catch (error) {
      console.error('Failed to create template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTemplateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setIsLoading(true);
    try {
      const exerciseData = {
        ...templateExerciseForm,
        template_id: selectedTemplate.id,
        order_index: templateExercises.length
      };
      await trpc.createTemplateExercise.mutate(exerciseData);
      await loadTemplateExercises(selectedTemplate.id);
      setTemplateExerciseForm({
        template_id: 0,
        name: '',
        category: '',
        sets: 1,
        reps: 10,
        weight: 0,
        order_index: 0
      });
      setShowTemplateExerciseDialog(false);
    } catch (error) {
      console.error('Failed to add template exercise:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startRestTimer = (seconds: number = 60) => {
    if (restInterval) {
      clearInterval(restInterval);
    }
    
    setRestTimer(seconds);
    const interval = window.setInterval(() => {
      setRestTimer((prev: number | null) => {
        if (prev === null || prev <= 1) {
          if (restInterval) clearInterval(restInterval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    setRestInterval(interval);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (start: Date, end: Date | null) => {
    const endTime = end || new Date();
    const duration = Math.floor((endTime.getTime() - start.getTime()) / 1000 / 60);
    return `${duration} min`;
  };

  const categoryColors: Record<string, string> = {
    'Strength': 'bg-blue-500',
    'Cardio': 'bg-red-500',
    'Plyometrics': 'bg-green-500',
    'Flexibility': 'bg-purple-500',
    'Other': 'bg-gray-500'
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">💪 Workout Tracker</h1>
        {activeSession && (
          <Badge variant="secondary" className="text-lg px-4 py-2">
            🏃‍♂️ Active Session: {activeSession.name}
          </Badge>
        )}
      </div>

      {restTimer && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">⏱️ Rest Timer</h3>
              <div className="text-4xl font-bold text-orange-600 mb-2">{restTimer}s</div>
              <Progress value={(60 - restTimer) / 60 * 100} className="w-full max-w-md mx-auto" />
              <Button 
                variant="outline" 
                onClick={() => {
                  if (restInterval) clearInterval(restInterval);
                  setRestTimer(null);
                }}
                className="mt-2"
              >
                Skip Rest
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="workout" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workout">🏋️ Active Workout</TabsTrigger>
          <TabsTrigger value="history">📊 History</TabsTrigger>
          <TabsTrigger value="templates">📋 Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="workout" className="space-y-6">
          {!activeSession ? (
            <Card>
              <CardHeader>
                <CardTitle>Start a New Workout</CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full">
                      🚀 Start Workout Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start New Workout Session</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={startWorkoutSession} className="space-y-4">
                      <Input
                        placeholder="Workout name (e.g., Morning Push Day)"
                        value={sessionForm.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setSessionForm((prev: CreateWorkoutSessionInput) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                      <Select
                        value={sessionForm.template_id?.toString() || 'none'}
                        onValueChange={(value) =>
                          setSessionForm((prev: CreateWorkoutSessionInput) => ({
                            ...prev,
                            template_id: value === 'none' ? undefined : parseInt(value)
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose template (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No template</SelectItem>
                          {workoutTemplates.map((template: WorkoutTemplate) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? 'Starting...' : 'Start Workout'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{activeSession.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Started at {formatTime(activeSession.start_time)} • Duration: {formatDuration(activeSession.start_time, null)}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">🏁 End Workout</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>End Workout Session?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to end this workout session? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={endWorkoutSession} disabled={isLoading}>
                          {isLoading ? 'Ending...' : 'End Workout'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardHeader>
              </Card>

              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Exercises ({activeExercises.length})</h2>
                <Dialog open={showExerciseDialog} onOpenChange={setShowExerciseDialog}>
                  <DialogTrigger asChild>
                    <Button>➕ Add Exercise</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Exercise</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={addExercise} className="space-y-4">
                      <Input
                        placeholder="Exercise name (e.g., Bench Press)"
                        value={exerciseForm.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setExerciseForm((prev: CreateExerciseInput) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                      <Select
                        value={exerciseForm.category}
                        onValueChange={(value) =>
                          setExerciseForm((prev: CreateExerciseInput) => ({ ...prev, category: value }))
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Strength">💪 Strength</SelectItem>
                          <SelectItem value="Cardio">❤️ Cardio</SelectItem>
                          <SelectItem value="Plyometrics">⚡ Plyometrics</SelectItem>
                          <SelectItem value="Flexibility">🧘 Flexibility</SelectItem>
                          <SelectItem value="Other">🏃 Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Sets</label>
                          <Input
                            type="number"
                            value={exerciseForm.sets}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setExerciseForm((prev: CreateExerciseInput) => ({ ...prev, sets: parseInt(e.target.value) || 1 }))
                            }
                            min="1"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Reps</label>
                          <Input
                            type="number"
                            value={exerciseForm.reps}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setExerciseForm((prev: CreateExerciseInput) => ({ ...prev, reps: parseInt(e.target.value) || 1 }))
                            }
                            min="1"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                          <Input
                            type="number"
                            step="0.5"
                            value={exerciseForm.weight}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setExerciseForm((prev: CreateExerciseInput) => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))
                            }
                            min="0"
                            required
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? 'Adding...' : 'Add Exercise'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {activeExercises.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No exercises yet. Add your first exercise to get started! 💪</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {activeExercises.map((exercise: Exercise) => (
                    <Card key={exercise.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold">{exercise.name}</h3>
                            <Badge 
                              className={`${categoryColors[exercise.category] || categoryColors.Other} text-white mt-1`}
                            >
                              {exercise.category}
                            </Badge>
                          </div>
                          <Button
                            onClick={() => startRestTimer(60)}
                            size="sm"
                            variant="outline"
                          >
                            ⏱️ Start Rest Timer
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold">{exercise.sets}</p>
                            <p className="text-sm text-muted-foreground">Sets</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{exercise.reps}</p>
                            <p className="text-sm text-muted-foreground">Reps</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{exercise.weight}kg</p>
                            <p className="text-sm text-muted-foreground">Weight</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Workout History</h2>
          </div>

          {workoutSessions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No workout sessions yet. Start your first workout! 🚀</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {workoutSessions
                .filter((session: WorkoutSession) => session.end_time)
                .sort((a: WorkoutSession, b: WorkoutSession) => 
                  new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
                )
                .map((session: WorkoutSession) => (
                  <Card key={session.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{session.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {session.start_time.toLocaleDateString()} • {formatTime(session.start_time)} - {session.end_time ? formatTime(session.end_time) : 'Ongoing'}
                          </p>
                        </div>
                        {session.end_time && (
                          <Badge variant="secondary">
                            Duration: {formatDuration(session.start_time, session.end_time)}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Workout Templates</h2>
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <DialogTrigger asChild>
                <Button>➕ Create Template</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Workout Template</DialogTitle>
                </DialogHeader>
                <form onSubmit={createTemplate} className="space-y-4">
                  <Input
                    placeholder="Template name (e.g., Push Day Routine)"
                    value={templateForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTemplateForm((prev: CreateWorkoutTemplateInput) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={templateForm.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTemplateForm((prev: CreateWorkoutTemplateInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                  />
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Creating...' : 'Create Template'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {workoutTemplates.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No templates yet. Create your first workout template! 📋</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {workoutTemplates.map((template: WorkoutTemplate) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader 
                    onClick={() => {
                      setSelectedTemplate(template);
                      loadTemplateExercises(template.id);
                    }}
                  >
                    <CardTitle>{template.name}</CardTitle>
                    {template.description && (
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Created: {template.created_at.toLocaleDateString()}
                    </p>
                  </CardHeader>
                  
                  {selectedTemplate?.id === template.id && (
                    <CardContent>
                      <Separator className="mb-4" />
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold">Exercises</h4>
                        <Dialog open={showTemplateExerciseDialog} onOpenChange={setShowTemplateExerciseDialog}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">Add Exercise</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Exercise to Template</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={addTemplateExercise} className="space-y-4">
                              <Input
                                placeholder="Exercise name"
                                value={templateExerciseForm.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setTemplateExerciseForm((prev: CreateTemplateExerciseInput) => ({ ...prev, name: e.target.value }))
                                }
                                required
                              />
                              <Select
                                value={templateExerciseForm.category}
                                onValueChange={(value) =>
                                  setTemplateExerciseForm((prev: CreateTemplateExerciseInput) => ({ ...prev, category: value }))
                                }
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Strength">💪 Strength</SelectItem>
                                  <SelectItem value="Cardio">❤️ Cardio</SelectItem>
                                  <SelectItem value="Plyometrics">⚡ Plyometrics</SelectItem>
                                  <SelectItem value="Flexibility">🧘 Flexibility</SelectItem>
                                  <SelectItem value="Other">🏃 Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium mb-1">Sets</label>
                                  <Input
                                    type="number"
                                    value={templateExerciseForm.sets}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setTemplateExerciseForm((prev: CreateTemplateExerciseInput) => ({ ...prev, sets: parseInt(e.target.value) || 1 }))
                                    }
                                    min="1"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Reps</label>
                                  <Input
                                    type="number"
                                    value={templateExerciseForm.reps}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setTemplateExerciseForm((prev: CreateTemplateExerciseInput) => ({ ...prev, reps: parseInt(e.target.value) || 1 }))
                                    }
                                    min="1"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                                  <Input
                                    type="number"
                                    step="0.5"
                                    value={templateExerciseForm.weight}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setTemplateExerciseForm((prev: CreateTemplateExerciseInput) => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))
                                    }
                                    min="0"
                                    required
                                  />
                                </div>
                              </div>
                              <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading ? 'Adding...' : 'Add Exercise'}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      {templateExercises.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No exercises in this template yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {templateExercises
                            .sort((a: TemplateExercise, b: TemplateExercise) => a.order_index - b.order_index)
                            .map((exercise: TemplateExercise) => (
                              <div key={exercise.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                <div>
                                
                                  <p className="font-medium">{exercise.name}</p>
                                  
                                  <Badge 
                                    className={`${categoryColors[exercise.category] || categoryColors.Other} text-white`}
                                  >
                                    {exercise.category}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {exercise.sets} × {exercise.reps} @ {exercise.weight}kg
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
