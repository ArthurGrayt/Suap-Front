import { useState, useEffect } from 'react';

export function useTaskTimer(deadline: string, status: string, thresholdHours = 12) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (status === 'completed' || status === 'expired') return;

    const diff = new Date(deadline).getTime() - new Date().getTime();
    const totalHours = diff / (1000 * 60 * 60);

    if (totalHours > 0 && totalHours <= thresholdHours) {
      // Menos de thresholdHours: contagem regressiva minuto a minuto
      const interval = setInterval(() => {
        setNow(new Date());
      }, 60000); // 1 minuto
      return () => clearInterval(interval);
    } else if (totalHours > thresholdHours && totalHours <= 24) {
      // Entre thresholdHours e 24h: atualiza a cada 1 hora
      const interval = setInterval(() => {
        setNow(new Date());
      }, 3600000); // 1 hora
      return () => clearInterval(interval);
    }
  }, [deadline, status, thresholdHours]);

  const diffTime = new Date(deadline).getTime() - now.getTime();
  const totalHours = diffTime / (1000 * 60 * 60);
  const daysLeft = Math.ceil(totalHours / 24);
  const hoursLeft = Math.floor(totalHours);
  const minsLeft = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

  let label = '';
  if (diffTime > 0) {
    if (totalHours <= thresholdHours) {
      label = `${hoursLeft}h ${minsLeft}m restantes`;
    } else if (totalHours <= 24) {
      label = `Faltam ${hoursLeft}h`;
    } else {
      label = `Em ${daysLeft} dias`;
    }
  } else {
    label = 'Atrasado';
  }

  return {
    label,
    daysLeft,
    hoursLeft,
    minsLeft,
    totalHours
  };
}
