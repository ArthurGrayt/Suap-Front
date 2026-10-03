import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Task } from '../types/task';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Busca as tarefas e as ordena pela data de entrega (mais próximas primeiro)
      const { data, error: supabaseError } = await supabase
        .from('tasks')
        .select('*')
        .order('deadline', { ascending: true });

      if (supabaseError) {
        throw supabaseError;
      }

      setTasks(data as Task[] || []);
    } catch (err: any) {
      console.error("Erro ao buscar tarefas:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { tasks, loading, error, refetch: fetchTasks };
}
