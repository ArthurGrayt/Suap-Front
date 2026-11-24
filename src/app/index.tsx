// Importa hooks de estado e memoização do React
import { useMemo, useState } from 'react';
// Importa componentes nativos, FlatList para performance e RefreshControl para pull-to-refresh
import { ActivityIndicator, FlatList, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
// Importa a barra de navegação inferior compartilhada
import BottomNavbar from '@/components/bottom-navbar';
// Importa o card de tarefa simplificado com alvo único
import TaskCard from '@/components/task-card';
// Importa o hook que busca as tarefas reais no Supabase e informa o último sync
import { useTasks } from '@/hooks/useTasks';
// Importa utilitários de formatação de data, hora e dia da semana
import { formatDate, formatTime, getWeekday } from '@/utils/date';
// Importa o cabeçalho institucional superior
import Header from '@/components/header';
// Importa o pacote de ícones MaterialIcons
import { MaterialIcons } from '@expo/vector-icons';
// Importa o roteador do Expo Router para abrir os detalhes da tarefa
import { useRouter } from 'expo-router';
// Importa o modelo único de urgência para filtros e contagens consistentes
import { getTaskUrgency, TaskUrgency } from '@/utils/task-status';

// Define os valores aceitos pelos chips de segmento de urgência na home
type UrgencyFilter = 'all' | Exclude<TaskUrgency, 'completed'>;

// Tela inicial de Prazos com chips de urgência e dropdowns preservados para disciplina e visualização
export default function Index() {
  // Instância do roteador para navegação aos detalhes da tarefa
  const router = useRouter();
  // Obtém tarefas, carregamento inicial, erro amigável, horário do sync e função de atualização
  const { tasks, loading, error, lastSyncedAt, refetch } = useTasks();

  // Estado que indica atualização manual via pull-to-refresh sem apagar a lista
  const [refreshing, setRefreshing] = useState(false);
  // Estado da disciplina selecionada no dropdown ('Todas' por padrão)
  const [selectedDiscipline, setSelectedDiscipline] = useState('Todas');
  // Estado do chip de segmento de urgência selecionado ('all' por padrão)
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all');

  // Estado da visualização selecionada no dropdown (Todas, Abertas ou Histórico)
  const [feedTab, setFeedTab] = useState<'todas' | 'abertas' | 'historico'>('abertas');
  // Controla se o modal do dropdown de visualização está aberto
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  // Controla se o modal do dropdown de disciplinas está aberto
  const [isDisciplineDropdownVisible, setIsDisciplineDropdownVisible] = useState(false);
  // Texto digitado na barra de pesquisa
  const [searchQuery, setSearchQuery] = useState('');

  // Tarefas abertas: apenas as marcadas como pending no banco
  const abertas = useMemo(() => tasks.filter((t) => t.status === 'pending'), [tasks]);

  // Histórico: tarefas concluídas ou expiradas
  const historico = useMemo(() => tasks.filter((t) => t.status === 'completed' || t.status === 'expired'), [tasks]);

  // Seleciona a base de tarefas da visualização escolhida no dropdown
  const baseTabTasks = useMemo(() => {
    if (feedTab === 'abertas') return abertas;
    if (feedTab === 'historico') return historico;
    return tasks;
  }, [tasks, abertas, historico, feedTab]);

  // Gera a lista completa de disciplinas com a contagem na visualização ativa
  const disciplinas = useMemo(() => {
    // Caso não exista nenhuma tarefa no banco, retorna apenas a opção Todas zerada
    if (!tasks || tasks.length === 0) return [{ nome: 'Todas', count: 0 }];

    // Mapa para armazenar todas as disciplinas únicas com contagem inicial zero
    const map = new Map<string, number>();

    // Garante que todas as disciplinas do banco apareçam no dropdown
    tasks.forEach((t) => {
      const nomeDisciplina = t.clean_subject || t.subject;
      if (!map.has(nomeDisciplina)) {
        map.set(nomeDisciplina, 0);
      }
    });

    // Soma as ocorrências na aba de visualização atualmente selecionada
    baseTabTasks.forEach((t) => {
      const nomeDisciplina = t.clean_subject || t.subject;
      const current = map.get(nomeDisciplina) || 0;
      map.set(nomeDisciplina, current + 1);
    });

    // Converte o mapa em array ordenado alfabeticamente em português
    const list = Array.from(map.entries())
      .map(([nome, count]) => ({ nome, count }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    // Retorna 'Todas' como primeira opção seguida das disciplinas
    return [{ nome: 'Todas', count: baseTabTasks.length }, ...list];
  }, [tasks, baseTabTasks]);

  // Calcula as contagens por urgência sobre a aba ativa respeitando a disciplina selecionada
  const urgencyCounts = useMemo(() => {
    // Filtra primeiro pela disciplina ativa para os chips mostrarem contagens coerentes
    const scoped =
      selectedDiscipline === 'Todas'
        ? baseTabTasks
        : baseTabTasks.filter((t) => (t.clean_subject || t.subject) === selectedDiscipline);

    // Inicializa contadores zerados
    const counts = { all: scoped.length, overdue: 0, today: 0, week: 0, later: 0 };

    // Classifica cada tarefa usando o utilitário compartilhado
    scoped.forEach((task) => {
      const urgency = getTaskUrgency(task);
      if (urgency === 'overdue') counts.overdue++;
      else if (urgency === 'today') counts.today++;
      else if (urgency === 'week') counts.week++;
      else if (urgency === 'later') counts.later++;
    });

    return counts;
  }, [baseTabTasks, selectedDiscipline]);

  // Define os 4 segmentos fixos de urgência sem rolagem horizontal para caber em qualquer tela
  const urgencySegments = useMemo(
    () =>
      [
        {
          // Segmento de tarefas expiradas com visual neutro apagado (sem destaque vermelho)
          key: 'overdue' as const,
          label: 'Expirados',
          count: urgencyCounts.overdue,
          activeBg: 'bg-on-surface-variant',
          activeText: 'text-on-primary',
          inactiveCountText: 'text-on-surface-variant',
        },
        {
          key: 'today' as const,
          label: 'Hoje',
          count: urgencyCounts.today,
          activeBg: 'bg-error',
          activeText: 'text-on-error',
          inactiveCountText: urgencyCounts.today > 0 ? 'text-error' : 'text-on-surface',
        },
        {
          key: 'week' as const,
          label: 'Semana',
          count: urgencyCounts.week,
          activeBg: 'bg-warning',
          activeText: 'text-on-primary',
          inactiveCountText: urgencyCounts.week > 0 ? 'text-warning' : 'text-on-surface',
        },
        {
          key: 'later' as const,
          label: 'Depois',
          count: urgencyCounts.later,
          activeBg: 'bg-primary-container',
          activeText: 'text-on-primary',
          inactiveCountText: 'text-primary',
        },
      ],
    [urgencyCounts]
  );

  // Remove acentos para permitir busca textual tolerante à digitação no celular
  const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  // Executa atualização silenciosa via pull-to-refresh mantendo a lista visível
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch(true);
    setRefreshing(false);
  };

  // Indica se há algum filtro ativo além da visualização padrão
  const hasActiveFilters =
    selectedDiscipline !== 'Todas' ||
    searchQuery.trim().length > 0 ||
    urgencyFilter !== 'all';

  // Limpa busca, disciplina e segmento de urgência mantendo a visualização atual
  const clearAllFilters = () => {
    setSelectedDiscipline('Todas');
    setSearchQuery('');
    setUrgencyFilter('all');
  };

  // Filtra e ordena as tarefas exibidas na FlatList
  const displayedTasks = useMemo(() => {
    // 1. Parte da lista correspondente ao dropdown de visualização selecionado
    let list = baseTabTasks;

    // 2. Aplica o chip de urgência selecionado sem trocar o dropdown silenciosamente
    if (urgencyFilter !== 'all') {
      list = list.filter((t) => getTaskUrgency(t) === urgencyFilter);
    }

    // 3. Aplica a disciplina selecionada no dropdown
    if (selectedDiscipline !== 'Todas') {
      list = list.filter((t) => (t.clean_subject || t.subject) === selectedDiscipline);
    }

    // 4. Aplica a busca textual sem acentos em título, descrição e disciplina
    if (searchQuery.trim().length > 0) {
      const q = removeAccents(searchQuery.toLowerCase());
      list = list.filter((t) => {
        const title = t.title ? removeAccents(t.title.toLowerCase()) : '';
        const desc = t.description ? removeAccents(t.description.toLowerCase()) : '';
        const subject = t.subject ? removeAccents(t.subject.toLowerCase()) : '';
        const clean = t.clean_subject ? removeAccents(t.clean_subject.toLowerCase()) : '';
        return title.includes(q) || desc.includes(q) || subject.includes(q) || clean.includes(q);
      });
    }

    // 5. Ordena sempre pelo prazo mais próximo primeiro, incluindo na visualização 'todas'
    return [...list].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [baseTabTasks, urgencyFilter, selectedDiscipline, searchQuery]);

  // Formata o texto do último sync com o SUAP para visibilidade de status
  const syncStatusLabel = lastSyncedAt
    ? `Atualizado às ${formatTime(lastSyncedAt)}`
    : loading
    ? 'Sincronizando...'
    : 'Aguardando sincronização';

  return (
    <View className="flex-1 bg-surface">
      {/* Cabeçalho institucional com título específico da tela */}
      <Header title="Prazos" />

      {/* Faixa superior fixa com data atual, último sync, busca, dropdowns preservados e chips de urgência */}
      <View className="bg-surface-container-low px-4 pt-3 pb-3 border-b border-surface-container gap-2.5">
        {/* Linha compacta de orientação temporal e visibilidade da última sincronização */}
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-bold text-on-surface">
            {getWeekday()}, {formatDate(new Date().toISOString(), true)}
          </Text>
          <View className="flex-row items-center gap-1">
            <MaterialIcons name="sync" size={14} color="#195e38" />
            <Text className="text-xs font-medium text-on-surface-variant">{syncStatusLabel}</Text>
          </View>
        </View>

        {/* Campo de pesquisa fora da FlatList para nunca perder foco do teclado ao digitar */}
        <View className="w-full flex-row items-center bg-surface-container-lowest rounded-xl px-3 h-11 border border-surface-container">
          <MaterialIcons name="search" size={20} color="#3d4a40" />
          <TextInput
            placeholder="Buscar tarefa, disciplina ou enunciado..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Buscar tarefa, disciplina ou enunciado"
            className="flex-1 ml-2 text-sm text-on-surface border-0 min-w-0"
            style={{ minWidth: 0 } as any}
            placeholderTextColor="#707971"
          />
          {/* Botão para limpar texto da pesquisa quando preenchido */}
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
              className="w-11 h-11 -mr-2 items-center justify-center rounded-lg active:bg-surface-container"
            >
              <MaterialIcons name="close" size={18} color="#3d4a40" />
            </TouchableOpacity>
          )}
        </View>

        {/* Linha de dropdowns preservada conforme solicitado: disciplinas à esquerda + visualização à direita */}
        <View className="flex-row items-center justify-between gap-2">
          {/* Dropdown de disciplinas */}
          <View className="relative flex-1 min-w-0">
            <TouchableOpacity
              onPress={() => {
                setIsDropdownVisible(false);
                setIsDisciplineDropdownVisible(!isDisciplineDropdownVisible);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Selecionar disciplina. Atual: ${selectedDiscipline}`}
              className="flex-row items-center justify-between bg-surface-container-lowest border border-surface-container px-3.5 min-h-[44px] rounded-full w-full"
            >
              {/* Nome da disciplina selecionada truncado quando longo */}
              <Text className="text-primary font-bold text-xs flex-1 mr-2" numberOfLines={1}>
                {selectedDiscipline}
              </Text>
              {/* Badge discreto com a contagem de tarefas da disciplina ativa */}
              {(disciplinas.find((d) => d.nome === selectedDiscipline)?.count ?? 0) > 0 && (
                <View className="bg-surface-container-high px-1.5 py-0.5 rounded-full mr-1 shrink-0">
                  <Text className="text-primary text-xs font-bold">
                    {disciplinas.find((d) => d.nome === selectedDiscipline)?.count}
                  </Text>
                </View>
              )}
              <MaterialIcons
                name={isDisciplineDropdownVisible ? 'arrow-drop-up' : 'arrow-drop-down'}
                size={20}
                color="#195e38"
              />
            </TouchableOpacity>
          </View>

          {/* Dropdown de visualização (Abertas, Histórico, Todas) com largura mínima flexível */}
          <View className="relative shrink-0">
            <TouchableOpacity
              onPress={() => {
                setIsDisciplineDropdownVisible(false);
                setIsDropdownVisible(!isDropdownVisible);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Selecionar visualização de tarefas. Atual: ${
                feedTab === 'abertas' ? 'Abertas' : feedTab === 'historico' ? 'Histórico' : 'Todas'
              }`}
              className="flex-row items-center justify-between bg-surface-container-lowest border border-surface-container px-3 min-h-[44px] rounded-full min-w-[108px]"
            >
              <Text className="text-primary font-bold text-xs text-center mr-1">
                {feedTab === 'abertas' ? 'Abertas' : feedTab === 'historico' ? 'Histórico' : 'Todas'}
              </Text>
              <MaterialIcons name={isDropdownVisible ? 'arrow-drop-up' : 'arrow-drop-down'} size={18} color="#195e38" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Barra segmentada fixa de 4 colunas para filtro de urgência sem cortes horizontais */}
        <View className="flex-row bg-surface-container rounded-xl p-1 gap-1">
          {urgencySegments.map((segment) => {
            // Verifica se este segmento está ativo no momento
            const isSelected = urgencyFilter === segment.key;
            return (
              // Tocar no segmento ativo limpa o filtro voltando para todas as tarefas
              <TouchableOpacity
                key={segment.key}
                onPress={() => setUrgencyFilter(isSelected ? 'all' : segment.key)}
                accessibilityRole="button"
                accessibilityLabel={
                  isSelected
                    ? `${segment.label}: ${segment.count} tarefas. Selecionado, toque para mostrar todas`
                    : `Filtrar por ${segment.label}: ${segment.count} tarefas`
                }
                accessibilityState={{ selected: isSelected }}
                className={`flex-1 min-h-[48px] px-1 py-1.5 rounded-lg items-center justify-center ${
                  isSelected
                    ? segment.activeBg
                    : segment.key === 'overdue'
                    ? 'bg-surface-container-low opacity-75'
                    : 'bg-surface-container-lowest'
                }`}
              >
                {/* Contagem numérica em destaque */}
                <Text
                  className={`text-sm font-bold leading-4 ${
                    isSelected ? segment.activeText : segment.inactiveCountText
                  }`}
                >
                  {segment.count}
                </Text>
                {/* Rótulo curto ajustado à largura da coluna sem quebrar nem cortar */}
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  className={`text-[11px] font-semibold mt-0.5 ${
                    isSelected ? segment.activeText : 'text-on-surface-variant'
                  }`}
                >
                  {segment.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Feed principal virtualizado com FlatList para melhor desempenho em aparelhos básicos */}
      {loading ? (
        // Indicador inicial de carregamento apenas no primeiro acesso
        <View className="flex-1 items-center justify-center px-4">
          <ActivityIndicator size="large" color="#195e38" />
          <Text className="text-on-surface-variant mt-4 font-medium">Buscando prazos do SUAP...</Text>
        </View>
      ) : error && tasks.length === 0 ? (
        // Estado de erro amigável com ação explícita para tentar novamente
        <View className="flex-1 items-center justify-center px-6">
          <MaterialIcons name="error-outline" size={40} color="#ba1a1a" />
          <Text className="text-error mt-4 font-bold text-center">{error}</Text>
          <TouchableOpacity
            onPress={() => refetch(false)}
            accessibilityRole="button"
            accessibilityLabel="Tentar carregar tarefas novamente"
            className="mt-4 px-5 py-3 bg-primary-container rounded-xl active:bg-primary"
          >
            <Text className="text-on-primary font-bold text-sm">Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayedTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#195e38']} tintColor="#195e38" />
          }
          ListHeaderComponent={
            error ? (
              // Banner não destrutivo caso uma atualização em segundo plano falhe mantendo os dados anteriores
              <View className="mb-3 p-3 rounded-xl bg-error-container flex-row items-center justify-between gap-2">
                <Text className="text-xs font-semibold text-on-error-container flex-1">{error}</Text>
                <TouchableOpacity
                  onPress={() => refetch(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Tentar atualizar novamente"
                  className="px-3 py-1.5 rounded-lg bg-error"
                >
                  <Text className="text-xs font-bold text-on-error">Atualizar</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => router.push(`/task/${item.id}` as any)}
            />
          )}
          ListEmptyComponent={
            // Diferencia filtro/busca sem resultado de lista realmente vazia
            <View className="flex-1 py-12 items-center justify-center px-4">
              <MaterialIcons
                name={hasActiveFilters ? 'search-off' : 'done-all'}
                size={40}
                color={hasActiveFilters ? '#3d4a40' : '#195e38'}
              />
              <Text className="text-on-surface-variant mt-4 font-bold text-center">
                {hasActiveFilters
                  ? 'Nenhuma tarefa encontrada para este filtro.'
                  : feedTab === 'abertas'
                  ? 'Nenhum prazo aberto!'
                  : feedTab === 'historico'
                  ? 'Nenhum histórico encontrado.'
                  : 'Nenhuma tarefa encontrada.'}
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity
                  onPress={clearAllFilters}
                  accessibilityRole="button"
                  accessibilityLabel="Limpar todos os filtros ativos"
                  className="mt-4 px-5 py-3 bg-surface-container-high rounded-xl active:bg-surface-container"
                >
                  <Text className="text-primary-container font-bold text-sm">Limpar filtros</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Barra de navegação inferior */}
      <BottomNavbar activeTab="prazos" />

      {/* Bottom Sheet Modal preservado para selecionar disciplinas */}
      <Modal
        visible={isDisciplineDropdownVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsDisciplineDropdownVisible(false)}
      >
        {/* Overlay semitransparente acessível que fecha o sheet ao tocar fora */}
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-end items-center"
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Fechar seleção de disciplinas"
          onPress={() => setIsDisciplineDropdownVisible(false)}
        >
          {/* Container do Bottom Sheet respeitando a largura máxima mobile */}
          <TouchableOpacity
            activeOpacity={1}
            className="w-full max-w-[400px] bg-surface rounded-t-[32px] p-6 pt-2 shadow-2xl"
            style={{ maxHeight: '70%' }}
          >
            {/* Indicador visual de arraste no topo do Bottom Sheet */}
            <View className="w-12 h-1.5 bg-surface-variant rounded-full self-center mb-5 mt-2" />

            {/* Cabeçalho do modal de seleção de disciplina em sentence case */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-on-surface">Selecionar disciplina</Text>
              <TouchableOpacity
                onPress={() => setIsDisciplineDropdownVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar seleção de disciplinas"
                className="w-11 h-11 bg-surface-container-high rounded-full items-center justify-center active:bg-surface-container"
              >
                <MaterialIcons name="close" size={20} color="#3d4a40" />
              </TouchableOpacity>
            </View>

            {/* Lista rolável com todas as disciplinas */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              {disciplinas.map((disc) => {
                const isSelected = selectedDiscipline === disc.nome;
                return (
                  <TouchableOpacity
                    key={disc.nome}
                    accessibilityRole="button"
                    accessibilityLabel={`Filtrar por ${disc.nome} (${disc.count} tarefas)`}
                    accessibilityState={{ selected: isSelected }}
                    className={`px-4 py-3.5 rounded-xl flex-row items-center justify-between mb-1.5 ${
                      isSelected ? 'bg-primary-container' : 'bg-surface-container-low active:bg-surface-container'
                    }`}
                    onPress={() => {
                      setSelectedDiscipline(disc.nome);
                      setIsDisciplineDropdownVisible(false);
                    }}
                  >
                    <Text
                      className={`flex-1 pr-3 text-sm font-semibold ${
                        isSelected ? 'text-on-primary' : 'text-on-surface'
                      }`}
                    >
                      {disc.nome}
                    </Text>
                    <View
                      className={`px-2.5 py-0.5 rounded-full shrink-0 ${
                        isSelected ? 'bg-primary' : 'bg-surface-container-high'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-on-primary' : 'text-primary'
                        }`}
                      >
                        {disc.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Sheet Modal preservado para selecionar a visualização de tarefas (Todas, Abertas, Histórico) */}
      <Modal
        visible={isDropdownVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        {/* Overlay semitransparente acessível que fecha o modal ao tocar fora */}
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-end items-center"
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Fechar filtro de visualização"
          onPress={() => setIsDropdownVisible(false)}
        >
          {/* Container do Bottom Sheet respeitando a largura máxima mobile */}
          <TouchableOpacity
            activeOpacity={1}
            className="w-full max-w-[400px] bg-surface rounded-t-[32px] p-6 pt-2 shadow-2xl"
          >
            {/* Indicador visual de arraste no topo do Bottom Sheet */}
            <View className="w-12 h-1.5 bg-surface-variant rounded-full self-center mb-5 mt-2" />

            {/* Cabeçalho do modal de seleção de visualização em sentence case */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-on-surface">Filtrar visualização</Text>
              <TouchableOpacity
                onPress={() => setIsDropdownVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar filtro de visualização"
                className="w-11 h-11 bg-surface-container-high rounded-full items-center justify-center active:bg-surface-container"
              >
                <MaterialIcons name="close" size={20} color="#3d4a40" />
              </TouchableOpacity>
            </View>

            {/* Lista de opções de visualização com contagem real de tarefas */}
            <View className="pb-4">
              {(
                [
                  { key: 'todas', label: 'Todas', count: tasks.length },
                  { key: 'abertas', label: 'Abertas', count: abertas.length },
                  { key: 'historico', label: 'Histórico', count: historico.length },
                ] as const
              ).map((option) => {
                const isSelected = feedTab === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    accessibilityRole="button"
                    accessibilityLabel={`Mostrar ${option.label} (${option.count} tarefas)`}
                    accessibilityState={{ selected: isSelected }}
                    className={`px-4 py-3.5 rounded-xl flex-row items-center justify-between mb-1.5 ${
                      isSelected ? 'bg-primary-container' : 'bg-surface-container-low active:bg-surface-container'
                    }`}
                    onPress={() => {
                      setFeedTab(option.key);
                      setIsDropdownVisible(false);
                    }}
                  >
                    <Text
                      className={`flex-1 pr-3 text-sm font-semibold ${
                        isSelected ? 'text-on-primary' : 'text-on-surface'
                      }`}
                    >
                      {option.label}
                    </Text>
                    <View
                      className={`px-2.5 py-0.5 rounded-full shrink-0 ${
                        isSelected ? 'bg-primary' : 'bg-surface-container-high'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-on-primary' : 'text-primary'
                        }`}
                      >
                        {option.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
