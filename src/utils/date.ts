export function getDaysDifference(deadline: string): number {
  const now = new Date();
  const date = new Date(deadline);
  const diffTime = date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getHoursDifference(deadline: string): number {
  const now = new Date();
  const date = new Date(deadline);
  const diffTime = date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60));
}

export function getBrazilDate(dateString?: string): Date {
  const date = dateString ? new Date(dateString) : new Date();
  return new Date(date.getTime() - (3 * 60 * 60 * 1000));
}

export function isToday(dateString: string): boolean {
  const brazilNow = getBrazilDate();
  const brazilTarget = getBrazilDate(dateString);
  return brazilNow.getUTCDate() === brazilTarget.getUTCDate() &&
         brazilNow.getUTCMonth() === brazilTarget.getUTCMonth() &&
         brazilNow.getUTCFullYear() === brazilTarget.getUTCFullYear();
}

export function isTomorrow(dateString: string): boolean {
  const brazilNow = getBrazilDate();
  const brazilTarget = getBrazilDate(dateString);
  
  const tomorrow = new Date(brazilNow);
  tomorrow.setUTCDate(brazilNow.getUTCDate() + 1);

  return tomorrow.getUTCDate() === brazilTarget.getUTCDate() &&
         tomorrow.getUTCMonth() === brazilTarget.getUTCMonth() &&
         tomorrow.getUTCFullYear() === brazilTarget.getUTCFullYear();
}

export function formatDate(dateString: string, includeYear = false): string {
  const brazilTime = getBrazilDate(dateString);
  const day = String(brazilTime.getUTCDate()).padStart(2, '0');
  const month = String(brazilTime.getUTCMonth() + 1).padStart(2, '0');
  if (includeYear) {
    return `${day}/${month}/${brazilTime.getUTCFullYear()}`;
  }
  return `${day}/${month}`;
}

export function getWeekday(dateString?: string): string {
  const brazilTime = getBrazilDate(dateString);
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[brazilTime.getUTCDay()];
}

export function formatTime(dateString: string): string {
  const brazilTime = getBrazilDate(dateString);
  const hour = String(brazilTime.getUTCHours()).padStart(2, '0');
  const minute = String(brazilTime.getUTCMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}
