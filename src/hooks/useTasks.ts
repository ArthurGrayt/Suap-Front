// Importa os hooks useState, useEffect e useCallback do React para gerenciar busca e ciclo de vida
import { useState, useEffect, useCallback } from 'react';
// Importa o cliente configurado do Supabase para comunicação com o banco de dados
import { supabase } from '../lib/supabase';
// Importa a interface que define o formato dos dados de uma tarefa
import { Task } from '../types/task';

// Converte erros técnicos de rede ou do Supabase em mensagens claras para o estudante
function mapTasksErrorMessage(err: unknown): string {
  // Extrai o texto bruto da exceção para inspecionar o motivo da falha
  const rawMessage =
    typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message?: unknown }).message || '')
      : '';

  // Identifica falhas de conectividade ou timeout de rede
  if (/network|fetch|timeout|failed to fetch|connection/i.test(rawMessage)) {
    return 'Sem conexão com a internet. Verifique sua rede e tente novamente.';
  }

  // Retorna fallback genérico amigável sem expor detalhes internos do servidor
  return 'Não foi possível carregar as tarefas do SUAP. Tente novamente.';
}

// Hook personalizado que fornece a lista de tarefas reais do banco, controle de carga e último sync
export function useTasks() {
  // Estado local para armazenar a lista de tarefas carregadas do Supabase
  const [tasks, setTasks] = useState<Task[]>([]);
  // Estado de carregamento inicializado como true até a conclusão da primeira busca
  const [loading, setLoading] = useState(true);
  // Estado para armazenar mensagens amigáveis de erro durante a busca
  const [error, setError] = useState<string | null>(null);
  // Armazena o carimbo ISO da última sincronização bem-sucedida
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Função assíncrona responsável por consultar as tarefas no Supabase (silent evita ocultar a lista no refresh)
  const fetchTasks = useCallback(async (silent = false) => {
    try {
      // Ativa o spinner principal apenas na carga inicial ou retry explícito, preservando a lista no pull-to-refresh
      if (!silent) {
        setLoading(true);
      }
      // Limpa qualquer erro anterior antes de tentar novamente
      setError(null);

      // Busca as tarefas ordenadas pela data de entrega (mais próximas primeiro)
      const { data, error: supabaseError } = await supabase
        .from('tasks')
        .select('*')
        .order('deadline', { ascending: true });

      // Lança exceção caso o Supabase retorne algum erro
      if (supabaseError) {
        throw supabaseError;
      }

      // Atualiza o estado com as tarefas retornadas ou lista vazia
      setTasks((data as Task[]) || []);
      // Registra o horário exato desta sincronização bem-sucedida
      setLastSyncedAt(new Date().toISOString());
    } catch (err: unknown) {
      // Registra o erro técnico no console apenas para depuração
      console.error('Erro ao buscar tarefas:', err);
      // Salva mensagem amigável em PT-BR no estado para exibição segura ao estudante
      setError(mapTasksErrorMessage(err));
    } finally {
      // Desativa o indicador de carga inicial caso estivesse ativo
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  // Efeito executado na montagem do componente para buscar os dados iniciais de forma assíncrona
  useEffect(() => {
    let active = true;
    const loadInitial = async () => {
      try {
        // Busca as tarefas ordenadas pela data de entrega (mais próximas primeiro)
        const { data, error: supabaseError } = await supabase
          .from('tasks')
          .select('*')
          .order('deadline', { ascending: true });

        if (!active) return;
        if (supabaseError) throw supabaseError;

        // Atualiza o estado com as tarefas retornadas ou lista vazia
        setTasks((data as Task[]) || []);
        setError(null);
        setLastSyncedAt(new Date().toISOString());
      } catch (err: unknown) {
        if (!active) return;
        console.error('Erro ao buscar tarefas:', err);
        setError(mapTasksErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    };
    loadInitial();
    return () => {
      active = false;
    };
  }, []);

  // Retorna a lista de tarefas, status de carga, erro amigável, último sync e função de atualização
  return { tasks, loading, error, lastSyncedAt, refetch: fetchTasks };
}
