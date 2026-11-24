// Importa Platform do React Native para diferenciar a exportação entre Web e Mobile
import { Platform } from 'react-native';
// Importa a API legacy do expo-file-system (compatível com cacheDirectory e writeAsStringAsync no SDK 57)
import * as FileSystem from 'expo-file-system/legacy';
// Importa o módulo expo-sharing para abrir o menu nativo de compartilhamento no Android/iOS
import * as Sharing from 'expo-sharing';
// Importa o tipo Task que descreve cada atividade acadêmica do SUAP
import { Task } from '@/types/task';

// Lista fixa dos 5 gatilhos de notificação (VALARM) conforme padrão RFC 5545
const ALARM_TRIGGERS = [
  // 7 dias antes do prazo
  '-P7D',
  // 3 dias antes do prazo
  '-P3D',
  // 24 horas (1 dia) antes do prazo
  '-P1D',
  // 6 horas antes do prazo
  '-PT6H',
  // 1 hora antes do prazo
  '-PT1H',
] as const;

// Formata um objeto Date para o padrão UTC exigido pela RFC 5545 (YYYYMMDDTHHMMSSZ)
function formatDateToICS(date: Date): string {
  // Obtém o ano em UTC com 4 dígitos
  const year = date.getUTCFullYear();
  // Obtém o mês em UTC (1 a 12) com zero à esquerda
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  // Obtém o dia do mês em UTC com zero à esquerda
  const day = String(date.getUTCDate()).padStart(2, '0');
  // Obtém a hora em UTC com zero à esquerda
  const hours = String(date.getUTCHours()).padStart(2, '0');
  // Obtém os minutos em UTC com zero à esquerda
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  // Obtém os segundos em UTC com zero à esquerda
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  // Retorna a string formatada com sufixo Z indicando fuso horário UTC
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

// Formata um objeto Date no padrão brasileiro legível (DD/MM/YYYY às HH:MM)
function formatDateBR(date: Date): string {
  // Extrai dia com zero à esquerda
  const day = String(date.getDate()).padStart(2, '0');
  // Extrai mês com zero à esquerda
  const month = String(date.getMonth() + 1).padStart(2, '0');
  // Extrai ano com 4 dígitos
  const year = date.getFullYear();
  // Extrai hora local com zero à esquerda
  const hours = String(date.getHours()).padStart(2, '0');
  // Extrai minutos locais com zero à esquerda
  const minutes = String(date.getMinutes()).padStart(2, '0');

  // Retorna data e hora formatadas em português
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

// Escapa caracteres especiais conforme especificação RFC 5545 (\, ;, , e quebras de linha)
function escapeICSText(text: string): string {
  // Aplica a sequência de substituições começando pela barra invertida para evitar escape duplo
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\r\n/g, '\\n')
    .replace(/\r/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

// Traduz o status técnico da tarefa no banco para um rótulo legível no calendário
function formatStatusLabel(status: Task['status']): string {
  // Mapeia cada status possível para português
  if (status === 'pending') return 'Pendente';
  if (status === 'expired') return 'Expirado';
  return 'Concluído';
}

// Extrai a pontuação da tarefa a partir do campo salvo ou automaticamente via Regex no título/enunciado
export function extractPoints(task: Task): string {
  // Verifica primeiro se o aluno preencheu manualmente o campo task.points
  if (task.points && task.points.trim().length > 0) {
    // Remove espaços excedentes nas extremidades
    const cleaned = task.points.trim();
    // Se contiver apenas número (inteiro ou decimal), acrescenta o sufixo ' pts'
    if (/^\d+(?:[.,]\d+)?$/.test(cleaned)) {
      return `${cleaned} pts`;
    }
    // Caso já possua unidade ou texto customizado, retorna como está
    return cleaned;
  }

  // Concatena título e descrição para buscar menções automáticas de pontuação
  const haystack = `${task.title || ''}\n${task.description || ''}`;

  // Primeiro tenta capturar padrões explícitos como "15 pontos", "10 pts", "2,5 pt"
  const explicitMatch = haystack.match(/(\d+(?:[.,]\d+)?)\s*(?:pontos?|pts?)/i);
  if (explicitMatch && explicitMatch[1]) {
    return `${explicitMatch[1]} pts`;
  }

  // Em seguida tenta capturar padrões como "vale 10" ou "valor: 15,0"
  const valueMatch = haystack.match(/val(?:e|or)[:\s]+(\d+(?:[.,]\d+)?)/i);
  if (valueMatch && valueMatch[1]) {
    return `${valueMatch[1]} pts`;
  }

  // Retorna fallback padronizado quando nenhuma pontuação é encontrada
  return 'Não informado';
}

// Gera o conteúdo completo do arquivo VCALENDAR (.ics) com descrição rica e 5 alarmes por evento
export function generateICSContent(tasks: Task[]): string {
  // Captura o instante atual para preencher o campo DTSTAMP obrigatório da RFC 5545
  const dtStamp = formatDateToICS(new Date());

  // Inicia o array de linhas com o cabeçalho padrão do calendário iCalendar
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SUAP Manager//Prazos SUAP//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Prazos SUAP',
    'X-WR-TIMEZONE:America/Sao_Paulo',
  ];

  // Percorre todas as tarefas recebidas para montar um bloco VEVENT completo para cada uma
  tasks.forEach((task) => {
    // Converte o prazo final da tarefa em objeto Date
    const endDate = new Date(task.deadline);
    // Ignora tarefas cuja data de prazo seja inválida para não corromper o .ics
    if (Number.isNaN(endDate.getTime())) return;

    // Calcula o horário de início como exatamente 1 hora antes do prazo final
    const startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
    // Usa o nome limpo da disciplina com fallback para o nome bruto
    const subjectName = task.clean_subject || task.subject;
    // Extrai a pontuação manual ou via Regex
    const points = extractPoints(task);
    // Verifica se há pontuação válida para incluir no título do evento
    const hasPoints = points !== 'Não informado';

    // Monta o título do evento com ou sem pontuação conforme disponibilidade
    const rawSummary = hasPoints
      ? `[${subjectName}] ${task.title} (${points})`
      : `[${subjectName}] ${task.title}`;
    // Escapa o resumo do evento conforme RFC 5545
    const summary = escapeICSText(rawSummary);

    // Formata o enunciado quebrando itens como a), b), c), d) em linhas separadas antes de escapar
    const enunciadoBase = task.description
      ? task.description.trim()
      : 'Nenhum enunciado fornecido.';
    // Insere quebra de linha antes de marcadores de alternativa/item (ex: a), b), c)) colados ao texto
    const enunciadoFormatado = enunciadoBase.replace(/([^\n])([a-z]\))/gi, '$1\n$2');

    // Traduz o status da tarefa e formata a data limite em formato brasileiro
    const statusTraduzido = formatStatusLabel(task.status);
    const dataFormatadaBR = formatDateBR(endDate);

    // Monta a descrição rica estruturada com ícones e quebras de linha legíveis
    const rawDescription = [
      `📚 Disciplina: ${subjectName}`,
      `🏆 Valor: ${points}`,
      `📌 Status: ${statusTraduzido}`,
      `⏰ Prazo final: ${dataFormatadaBR}`,
      '',
      '📝 Enunciado:',
      enunciadoFormatado,
      '',
      '🔗 Sincronizado via SUAPSync',
    ].join('\n');

    // Escapa toda a descrição convertendo \n em \\n e protegendo vírgulas/ponto-e-vírgula
    const description = escapeICSText(rawDescription);
    // Escapa o nome da disciplina para o campo CATEGORIES
    const category = escapeICSText(subjectName);
    // Monta o identificador único do evento usando suap_id (ou id como fallback)
    const uid = `${task.suap_id || task.id}@suapsync.app`;

    // Abre o bloco VEVENT com metadados completos, local e categoria
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${formatDateToICS(startDate)}`,
      `DTEND:${formatDateToICS(endDate)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'LOCATION:SUAP - IFMG',
      `CATEGORIES:${category}`
    );

    // Insere os 5 blocos VALARM (7d, 3d, 24h, 6h e 1h antes) dentro do evento
    ALARM_TRIGGERS.forEach((trigger) => {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:Lembrete de prazo: ${summary}`,
        `TRIGGER:${trigger}`,
        'END:VALARM'
      );
    });

    // Fecha o bloco do evento atual
    lines.push('END:VEVENT');
  });

  // Encerra o bloco principal do VCALENDAR
  lines.push('END:VCALENDAR');

  // Junta todas as linhas com CRLF (\r\n) conforme exigido pela RFC 5545
  return lines.join('\r\n');
}

// Exporta a lista de tarefas como arquivo prazos-suap.ics compatível com Web e Mobile
export async function exportTasksToICS(tasks: Task[]): Promise<void> {
  // Gera o conteúdo textual completo no padrão iCalendar
  const icsContent = generateICSContent(tasks);
  // Define o nome padronizado do arquivo exportado
  const fileName = 'prazos-suap.ics';

  // Fluxo específico para navegador (Expo Web) usando Blob e link temporário
  if (Platform.OS === 'web') {
    // Cria o Blob com MIME type oficial de calendário e codificação UTF-8
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    // Gera uma URL temporária em memória apontando para o Blob
    const blobUrl = URL.createObjectURL(blob);
    // Cria um elemento âncora invisível para disparar o download
    const anchor = document.createElement('a');
    // Associa a URL gerada ao atributo href do link
    anchor.href = blobUrl;
    // Define o nome do arquivo que será baixado pelo navegador
    anchor.download = fileName;
    // Anexa temporariamente ao corpo do documento para compatibilidade entre navegadores
    document.body.appendChild(anchor);
    // Simula o clique para iniciar o download imediatamente
    anchor.click();
    // Remove o elemento temporário do DOM
    document.body.removeChild(anchor);
    // Libera a URL de objeto da memória do navegador
    URL.revokeObjectURL(blobUrl);
    return;
  }

  // Fluxo para dispositivos móveis (Android / iOS) usando cache local + menu nativo de compartilhamento
  const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
  // Monta o caminho completo do arquivo no diretório de cache do dispositivo
  const fileUri = `${cacheDir}${fileName}`;

  // Grava o conteúdo .ics em UTF-8 no sistema de arquivos local
  await FileSystem.writeAsStringAsync(fileUri, icsContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Verifica se o compartilhamento nativo está disponível no dispositivo atual
  const canShare = await Sharing.isAvailableAsync();
  // Abre o menu nativo de compartilhamento para importar no app de calendário
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/calendar',
      dialogTitle: 'Importar no Google Agenda',
    });
  }
}
