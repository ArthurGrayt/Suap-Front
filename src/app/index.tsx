import { useMemo, useState, useEffect } from 'react';
// Importa os componentes básicos nativos para montar a interface
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
// Os insets da safe area já são aplicados pelo Header e pelo BottomNavbar (mesmo padrão das outras telas)
// Importa ícones da biblioteca Expo
import BottomNavbar from '@/components/bottom-navbar';
import FilterModal from '@/components/filter-modal';
import StatCard from '@/components/stat-card';
import TaskCard from '@/components/task-card';
import { useTasks } from '@/hooks/useTasks';
import { formatDate, getDaysDifference, getWeekday } from '@/utils/date';
import Header from '@/components/header';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

// Componente principal da tela inicial "Central de Prazos"
export default function Index() {
  const router = useRouter();
  const { tasks, loading, error } = useTasks();

  const [userName, setUserName] = useState('');
  const [userCourse, setUserCourse] = useState('');
  const [userAvatar, setUserAvatar] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await supabase.from('user_preferences').select('full_name, course, avatar_url').limit(1).single();
        if (data) {
          if (data.full_name) {
            const parts = data.full_name.split(' ');
            setUserName(parts.slice(0, 2).join(' '));
          }
          setUserCourse(data.course || '');
          setUserAvatar(data.avatar_url || '');
        }
      } catch (err) {
        console.log("Erro ao buscar usuário na home:", err);
      }
    };
    fetchUser();
  }, []);

  // Estado para controlar a exibição do Bottom Sheet de Filtros
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [currentDisciplineIndex, setCurrentDisciplineIndex] = useState(0);

  const [feedTab, setFeedTab] = useState<'todas' | 'abertos' | 'historico'>('abertos');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('any');
  const [pointsFilter, setPointsFilter] = useState(10);

  const now = new Date();

  // Tarefas abertas: apenas as marcadas explicitamente como pending no banco
  const abertas = useMemo(() => tasks.filter(t => t.status === 'pending'), [tasks]);

  // Histórico: entregues ou expiradas (conforme o banco de dados)
  const historico = useMemo(() => tasks.filter(t => t.status === 'completed' || t.status === 'expired'), [tasks]);

  // Gera a lista dinâmica de disciplinas baseada na aba selecionada
  const disciplinas = useMemo(() => {
    let sourceList = tasks;
    if (feedTab === 'abertos') sourceList = abertas;
    else if (feedTab === 'historico') sourceList = historico;
    
    if (!sourceList || sourceList.length === 0) return [{ nome: 'Todas', count: 0 }];

    const map = new Map<string, number>();

    // Contagem
    sourceList.forEach(t => {
      const nomeDisciplina = t.clean_subject || t.subject;
      const current = map.get(nomeDisciplina) || 0;
      map.set(nomeDisciplina, current + 1);
    });

    const list = Array.from(map.entries()).map(([nome, count]) => ({ nome, count }));

    return [{ nome: 'Todas', count: sourceList.length }, ...list];
  }, [abertas, historico, feedTab]);

  // Função para avançar/voltar o pill
  const nextDiscipline = () => {
    setCurrentDisciplineIndex((prev) => (prev + 1) % disciplinas.length);
  };
  const prevDiscipline = () => {
    setCurrentDisciplineIndex((prev) => (prev - 1 + disciplinas.length) % disciplinas.length);
  };

  // Computa as estatísticas para os 3 Cards superiores
  const stats = useMemo(() => {
    let critico = 0;
    let atencao = 0;
    let emDia = 0;

    tasks.forEach(task => {
      if (task.status === 'completed') {
        emDia++;
      } else if (task.status === 'pending') {
        const days = getDaysDifference(task.deadline);
        if (days <= 1) {
          critico++;
        } else if (days <= 15) {
          atencao++;
        }
      }
    });

    return { critico, atencao, emDia };
  }, [tasks]);

  // Função utilitária para remover acentos
  const removeAccents = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  // Filtra as tarefas que aparecem no feed principal
  const displayedTasks = useMemo(() => {
    // 1. Inicia com a lista baseada na aba atual
    let list = tasks;
    if (feedTab === 'abertos') list = abertas;
    else if (feedTab === 'historico') list = historico;
    
    // 2. Aplica o filtro de disciplina
    const selected = disciplinas[currentDisciplineIndex];
    if (selected && selected.nome !== 'Todas') {
      list = list.filter(t => (t.clean_subject || t.subject) === selected.nome);
    }

    // 3. Aplica a Busca por Texto
    if (searchQuery.trim().length > 0) {
      const q = removeAccents(searchQuery.toLowerCase());
      list = list.filter(t => {
        const title = t.title ? removeAccents(t.title.toLowerCase()) : '';
        const desc = t.description ? removeAccents(t.description.toLowerCase()) : '';
        const subject = t.subject ? removeAccents(t.subject.toLowerCase()) : '';
        const clean = t.clean_subject ? removeAccents(t.clean_subject.toLowerCase()) : '';
        return title.includes(q) || desc.includes(q) || subject.includes(q) || clean.includes(q);
      });
    }

    // 4. Aplica o filtro de data (Modal)
    if (dateFilter === '7days') {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      list = list.filter(t => {
        const d = new Date(t.deadline);
        return d >= today && d <= nextWeek;
      });
    }

    // 5. Ordenação Específica
    if (feedTab === 'todas') {
      // Ordena por prazo decrescente (mais recentes/futuros primeiro)
      list = [...list].sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());
    }

    return list;
  }, [tasks, abertas, historico, feedTab, currentDisciplineIndex, disciplinas, searchQuery, dateFilter]);




  return (
    <View className="flex-1 bg-surface">

      <Header />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* BOAS-VINDAS */}
        <View className="px-4 pt-4 pb-2 bg-surface-container-low">
          <View className="flex-row gap-3 items-center justify-between">
            <View className="flex-row gap-3 items-center flex-1">
              <View className="w-12 h-12 rounded-full bg-surface-container-high items-center justify-center overflow-hidden">
                {userAvatar ? (
                  <Image source={{ uri: userAvatar }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <MaterialIcons name="person" size={26} color="#707971" />
                )}
              </View>
              <View className="flex-col flex-1 pr-2">
                <Text className="text-xl font-bold text-on-surface" numberOfLines={1}>{userName || 'Carregando...'}</Text>
                <Text className="text-xs text-on-surface-variant mt-1" numberOfLines={1}>
                  {userCourse ? `${userCourse} • IFMG` : 'Carregando curso...'}
                </Text>
              </View>
            </View>

            {/* Data e Dia da Semana */}
            <View className="flex-col items-end">
              <Text className="text-sm font-bold text-primary">{getWeekday()}</Text>
              <Text className="text-xs text-on-surface-variant mt-1">{formatDate(new Date().toISOString(), true)}</Text>
            </View>
          </View>

          {/* CARDS DE ESTATÍSTICAS RÁPIDAS */}
          <View className="flex-row gap-2 mt-6 mb-2">
            <StatCard
              title="Crítico"
              value={stats.critico}
              subtitle="&lt; 24h restantes"
              icon="local-fire-department"
              colorTitle="text-error"
              iconColor="#ba1a1a"
            />
            <StatCard
              title="Atenção"
              value={stats.atencao}
              subtitle="Nesta quinzena"
              icon="schedule"
              colorTitle="text-tertiary-container"
              iconColor="#005785"
            />
            <StatCard
              title="Em Dia"
              value={stats.emDia}
              subtitle="Seguro/Entregue"
              icon="check-circle"
              colorTitle="text-secondary"
              iconColor="#1b6d24"
            />
          </View>
        </View>

        {/* BARRA DE PESQUISA E FILTRO */}
        <View className="px-4 py-3 bg-surface flex-col gap-3 relative z-50">
          {/* Primeira Linha: Pesquisa (100%) */}
          <View className="w-full flex-row items-center bg-surface-container-lowest rounded-xl px-2 h-11 shadow-sm border border-surface-container">
            <MaterialIcons name="search" size={20} color="#707971" />
            <TextInput
              placeholder="Buscar tarefa, disciplina, enunciado..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 text-sm text-on-surface outline-none border-0 min-w-0"
              style={{ outlineStyle: 'none', minWidth: 0 } as any}
              placeholderTextColor="#707971"
            />
            <TouchableOpacity
              onPress={() => setIsFilterVisible(true)}
              className="p-1.5 ml-1 flex-shrink-0 outline-none rounded-lg active:bg-surface-container-high"
              style={{ outlineStyle: 'none' } as any}
            >
              <MaterialIcons name="tune" size={20} color="#195e38" />
            </TouchableOpacity>
          </View>

          {/* Segunda Linha: Disciplina (Esq) + Dropdown Abas (Dir) */}
          <View className="flex-row items-center justify-between z-40 gap-2">
            {/* Seletor de Disciplinas */}
            <View className="flex-row items-center bg-surface-container-low rounded-full px-1 h-9 shadow-sm flex-1">
              <TouchableOpacity
                onPress={prevDiscipline}
                className="w-7 h-7 items-center justify-center bg-transparent active:scale-90 outline-none"
                style={{ outlineStyle: 'none' } as any}
              >
                <MaterialIcons name="chevron-left" size={20} color="#111c2d" />
              </TouchableOpacity>

              <View className="flex-row items-center justify-center flex-1 px-1 gap-1">
                <Text
                  className="text-primary font-bold text-[11px] text-center flex-shrink"
                  numberOfLines={1}
                >
                  {disciplinas[currentDisciplineIndex]?.nome}
                </Text>
                {disciplinas[currentDisciplineIndex]?.count > 0 && (
                  <View className="bg-error px-1.5 py-0.5 rounded-full flex-shrink-0">
                    <Text className="text-white text-[9px] font-bold">
                      {disciplinas[currentDisciplineIndex]?.count}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={nextDiscipline}
                className="w-7 h-7 items-center justify-center bg-transparent active:scale-90 outline-none"
                style={{ outlineStyle: 'none' } as any}
              >
                <MaterialIcons name="chevron-right" size={20} color="#111c2d" />
              </TouchableOpacity>
            </View>

            {/* Dropdown de Abas */}
            <View className="relative">
              <TouchableOpacity
                onPress={() => setIsDropdownVisible(!isDropdownVisible)}
                className="flex-row items-center justify-between bg-surface-container-lowest border border-surface-container px-3 h-9 rounded-full shadow-sm w-[105px]"
              >
                <Text className="text-primary font-bold text-[11px] text-center flex-1">
                  {feedTab === 'abertos' ? 'Abertos' : feedTab === 'historico' ? 'Histórico' : 'Todas'}
                </Text>
                <MaterialIcons name={isDropdownVisible ? "arrow-drop-up" : "arrow-drop-down"} size={18} color="#195e38" />
              </TouchableOpacity>

              {/* Menu Flutuante */}
              {isDropdownVisible && (
                <View className="absolute top-10 right-0 bg-surface rounded-xl shadow-lg border border-surface-container w-32 py-1 z-50 elevation-5">
                  {(['todas', 'abertos', 'historico'] as const).map(tab => (
                    <TouchableOpacity
                      key={tab}
                      className="px-4 py-3 border-b border-surface-container-lowest last:border-0"
                      onPress={() => {
                        setFeedTab(tab);
                        setCurrentDisciplineIndex(0);
                        setIsDropdownVisible(false);
                      }}
                    >
                      <Text className={`text-sm ${feedTab === tab ? 'text-primary font-bold' : 'text-on-surface'}`}>
                        {tab === 'abertos' ? 'Abertos' : tab === 'historico' ? 'Histórico' : 'Todas'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* FEED PRINCIPAL */}
        <View className="px-4 mt-2 pb-6 flex-col z-0">



          {loading ? (
            <View className="py-10 items-center justify-center">
              <ActivityIndicator size="large" color="#195e38" />
              <Text className="text-on-surface-variant mt-4 font-medium">Buscando prazos do SUAP...</Text>
            </View>
          ) : error ? (
            <View className="py-10 items-center justify-center">
              <MaterialIcons name="error-outline" size={40} color="#ba1a1a" />
              <Text className="text-error mt-4 font-bold text-center">{error}</Text>
            </View>
          ) : displayedTasks.length === 0 ? (
            <View className="py-10 items-center justify-center">
              <MaterialIcons name="done-all" size={40} color="#195e38" />
              <Text className="text-on-surface-variant mt-4 font-bold text-center">
                {feedTab === 'abertos' ? 'Nenhum prazo aberto!' : feedTab === 'historico' ? 'Nenhum histórico encontrado.' : 'Nenhuma tarefa encontrada.'}
              </Text>
            </View>
          ) : (
            displayedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => router.push(`/task/${task.id}` as any)}
              />
            ))
          )}
        </View>

      </ScrollView>

      <BottomNavbar activeTab="prazos" />
      <FilterModal 
        visible={isFilterVisible} 
        onClose={() => setIsFilterVisible(false)} 
        initialDateFilter={dateFilter}
        initialPoints={pointsFilter}
        onApply={(newDateFilter, newPoints) => {
          setDateFilter(newDateFilter);
          setPointsFilter(newPoints);
          setIsFilterVisible(false);
        }}
      />

    </View>
  );
}
