// Importa hooks de estado e efeito para atualizar a contagem regressiva
import { useState, useEffect } from 'react';

// Hook que calcula o tempo restante e o rótulo amigável de prazo de uma tarefa
export function useTaskTimer(deadline: string, status: string, thresholdHours = 12) {
  // Armazena o instante atual para recalcular o timer periodicamente
  const [now, setNow] = useState(new Date());

  // Configura atualização automática apenas para tarefas ainda pendentes próximas do prazo
  useEffect(() => {
    // Não inicia timer para tarefas já entregues ou marcadas como expiradas
    if (status === 'completed' || status === 'expired') return;

    // Calcula quantas horas faltam até o prazo final
    const diff = new Date(deadline).getTime() - new Date().getTime();
    const totalHours = diff / (1000 * 60 * 60);

    // Abaixo do limite crítico, atualiza a cada 1 minuto
    if (totalHours > 0 && totalHours <= thresholdHours) {
      const interval = setInterval(() => {
        setNow(new Date());
      }, 60000);
      return () => clearInterval(interval);
    }

    // Entre o limite crítico e 24 horas, atualiza a cada 1 hora
    if (totalHours > thresholdHours && totalHours <= 24) {
      const interval = setInterval(() => {
        setNow(new Date());
      }, 3600000);
      return () => clearInterval(interval);
    }
  }, [deadline, status, thresholdHours]);

  // Calcula diferença bruta em milissegundos até o prazo
  const diffTime = new Date(deadline).getTime() - now.getTime();
  // Converte a diferença para horas decimais
  const totalHours = diffTime / (1000 * 60 * 60);
  // Arredonda dias restantes para cima para exibição legível
  const daysLeft = Math.ceil(totalHours / 24);
  // Calcula horas inteiras restantes
  const hoursLeft = Math.floor(totalHours);
  // Calcula minutos inteiros restantes na hora atual
  const minsLeft = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

  // Define o rótulo de tempo conforme a proximidade do prazo
  let label = '';
  if (diffTime > 0) {
    // Menos de thresholdHours exibe horas e minutos exatos
    if (totalHours <= thresholdHours) {
      label = `${hoursLeft}h ${minsLeft}m restantes`;
    // Até 24h exibe contagem em horas
    } else if (totalHours <= 24) {
      label = `Faltam ${hoursLeft}h`;
    // Acima de 24h exibe contagem em dias
    } else {
      label = `Em ${daysLeft} dias`;
    }
  } else {
    // Usa o termo único "Expirado" alinhado ao vocabulário oficial do SUAP
    label = 'Expirado';
  }

  // Retorna rótulo formatado e valores numéricos para consumo nos componentes
  return {
    label,
    daysLeft,
    hoursLeft,
    minsLeft,
    totalHours,
  };
}
