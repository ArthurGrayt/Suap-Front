// Importa React e hooks de estado, efeito e referência para controle do timer
import React, { useEffect, useRef, useState } from 'react';
// Importa componentes nativos de interface, modal e indicador de carregamento
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// Importa ícones vetoriais do lucide-react-native para o visual do Paywall
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Crown,
  Link2,
  QrCode,
  ShieldCheck,
  X,
} from 'lucide-react-native';
// Importa o gradiente linear do Expo para acabamentos em verde esmeralda profundo
import { LinearGradient } from 'expo-linear-gradient';
// Importa o hook global do contexto de assinatura PRO
import { usePremium } from '@/contexts/PremiumContext';
// Importa o cliente Supabase para buscar as tarefas reais na exportação do Google Agenda
import { supabase } from '@/lib/supabase';
// Importa o utilitário de geração e download do arquivo .ics
import { exportTasksToICS } from '@/lib/icsGenerator';
// Importa o tipo Task para tipar os registros retornados pelo Supabase
import { Task } from '@/types/task';
// Importa o alerta multiplataforma para informar eventuais erros de exportação
import { showAlert } from '@/utils/dialog';
// Importa os ícones vetoriais das plataformas externas conectáveis
import {
  GoogleCalendarIcon,
  NotionIcon,
  ObsidianIcon,
  TrelloIcon,
} from '@/components/IntegrationIcons';

// Lista fixa de benefícios exibidos no Paywall do Modo PRO
const PRO_BENEFITS = [
  // Benefício 1: integrações diretas com calendário e organização
  'Exportação direta para Google Agenda, Trello, Notion e Obsidian.',
  // Benefício 2: regras de alerta ilimitadas
  'Regras ilimitadas de notificações personalizadas.',
  // Benefício 3: alertas prioritários para prazos críticos
  'Alertas inteligentes de alta prioridade para prazos críticos (< 24h).',
  // Benefício 4: histórico completo e métricas
  'Histórico completo de entregas e métricas de desempenho.',
];

// Catálogo das plataformas externas exibidas no Paywall e na tela de boas-vindas
const EXTERNAL_PLATFORMS = [
  {
    // Identificador único da integração com Google Agenda
    id: 'google-calendar',
    // Nome oficial exibido ao usuário
    name: 'Google Agenda',
    // Descrição concisa para a tela de conexão pós-assinatura
    description: 'Sincronize prazos direto no seu calendário',
    // Única plataforma habilitada e acesa nesta demonstração
    enabled: true,
    // Componente de ícone vetorial da plataforma
    Icon: GoogleCalendarIcon,
  },
  {
    // Identificador único da integração com Trello
    id: 'trello',
    // Nome oficial exibido ao usuário
    name: 'Trello',
    // Descrição concisa para a tela de conexão
    description: 'Crie cartões automáticos por disciplina',
    // Desabilitada e apagada nesta fase da demonstração
    enabled: false,
    // Componente de ícone vetorial da plataforma
    Icon: TrelloIcon,
  },
  {
    // Identificador único da integração com Notion
    id: 'notion',
    // Nome oficial exibido ao usuário
    name: 'Notion',
    // Descrição concisa para a tela de conexão
    description: 'Envie tarefas para sua base acadêmica',
    // Desabilitada e apagada nesta fase da demonstração
    enabled: false,
    // Componente de ícone vetorial da plataforma
    Icon: NotionIcon,
  },
  {
    // Identificador único da integração com Obsidian
    id: 'obsidian',
    // Nome oficial exibido ao usuário
    name: 'Obsidian',
    // Descrição concisa para a tela de conexão
    description: 'Exporte notas e prazos em Markdown',
    // Desabilitada e apagada nesta fase da demonstração
    enabled: false,
    // Componente de ícone vetorial da plataforma
    Icon: ObsidianIcon,
  },
] as const;

// Modal editorial reformulado de assinatura (Paywall) e boas-vindas do Modo PRO
export default function PremiumModal() {
  // Consome estado de visibilidade, fechamento e ativação do contexto global
  const { isPaywallVisible, closePaywall, activatePremium } = usePremium();

  // Estado da forma de pagamento selecionada na simulação (Pix padrão)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  // Estado que indica se o pagamento simulado de 1.5s está em andamento
  const [isProcessing, setIsProcessing] = useState(false);
  // Estado que alterna o modal para a tela de boas-vindas e seleção de app externo
  const [isSuccess, setIsSuccess] = useState(false);
  // Estado que registra a conexão/exportação concluída do Google Agenda
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  // Estado que indica se a geração e exportação do arquivo .ics está em andamento
  const [isExporting, setIsExporting] = useState(false);
  // Referência para o timeout da simulação garantindo limpeza no unmount
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpa qualquer timeout pendente caso o modal seja desmontado
  useEffect(() => {
    // Retorna função de limpeza executada ao desmontar o componente
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Fecha o modal e restaura o estado interno para novas demonstrações
  const handleClose = () => {
    // Bloqueia fechamento acidental durante o processamento simulado ou exportação .ics
    if (isProcessing || isExporting) return;
    // Oculta o modal no contexto global
    closePaywall();
    // Reseta os estados locais para futuras aberturas
    setIsSuccess(false);
    setIsGoogleConnected(false);
    setPaymentMethod('pix');
  };

  // Busca as tarefas pendentes/expiradas no Supabase e exporta o arquivo prazos-suap.ics
  const handleConnectGoogleCalendar = async () => {
    // Evita múltiplos cliques simultâneos durante a exportação
    if (isExporting) return;
    // Ativa o estado de carregamento no botão do Google Agenda
    setIsExporting(true);

    try {
      // Consulta todas as tarefas pendentes e expiradas na tabela tasks do Supabase
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .in('status', ['pending', 'expired']);

      // Lança exceção caso ocorra falha na consulta ao banco
      if (error) {
        throw error;
      }

      // Garante array tipado de tarefas para enviar ao gerador .ics
      const tasksToExport = (data as Task[]) || [];
      // Gera e dispara o download (Web) ou compartilhamento nativo (Mobile) do arquivo .ics
      await exportTasksToICS(tasksToExport);
      // Marca o card do Google Agenda como conectado e exibe o banner de instruções
      setIsGoogleConnected(true);
    } catch (err) {
      // Registra o erro no console para depuração
      console.error('Erro ao exportar tarefas para .ics:', err);
      // Informa o usuário de forma amigável em Web e Mobile
      showAlert('Erro na exportação', 'Não foi possível gerar o arquivo de calendário. Tente novamente.');
    } finally {
      // Encerra o estado de carregamento independentemente do resultado
      setIsExporting(false);
    }
  };

  // Inicia o fluxo de simulação de pagamento de 1.5 segundos ao clicar no CTA
  const handleSubscribe = () => {
    // Evita disparos duplicados enquanto já está carregando
    if (isProcessing) return;
    // Ativa o indicador de carregamento no botão principal
    setIsProcessing(true);

    // Conclui a simulação após 1.5 segundos (1500ms)
    timerRef.current = setTimeout(() => {
      // Atualiza o estado global ativando o Modo PRO
      activatePremium();
      // Finaliza o carregamento
      setIsProcessing(false);
      // Abre a tela de boas-vindas para conectar um aplicativo externo
      setIsSuccess(true);
    }, 1500);
  };

  // Renderiza o modal com dimensões ajustadas para caber integralmente sem scroll ou cortes
  return (
    <Modal
      visible={isPaywallVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      {/* Backdrop escuro translúcido centralizando o modal dentro da moldura do app */}
      <View className="flex-1 bg-black/60 justify-center items-center px-4 py-3">
        {/* Superfície principal em marfim limpo com borda sutil e sombra profunda */}
        <View className="w-full max-w-[364px] bg-[#FAFBF9] rounded-[28px] overflow-hidden shadow-2xl border border-[#064E3B]/15">
          {isSuccess ? (
            // =====================================================================
            // TELA DE BOAS-VINDAS PÓS-ASSINATURA (CONEXÃO DE APP EXTERNO)
            // =====================================================================
            <View className="flex-col">
              {/* Cabeçalho celebratório em gradiente verde-esmeralda profundo */}
              <LinearGradient
                colors={['#022C22', '#064E3B', '#0F5132']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 16 }}
              >
                {/* Linha superior com selo PRO ATIVO e botão fechar */}
                <View className="flex-row items-center justify-between mb-2.5">
                  <View className="flex-row items-center gap-1.5 bg-[#F59E0B]/15 border border-[#F59E0B]/40 px-2.5 py-0.5 rounded-full">
                    <Crown size={11} color="#FCD34D" />
                    <Text className="text-[10px] font-bold text-[#FDE68A] tracking-widest uppercase">
                      MODO PRO ATIVO
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleClose}
                    accessibilityRole="button"
                    accessibilityLabel="Fechar tela de boas-vindas"
                    className="w-7 h-7 rounded-full bg-white/10 items-center justify-center"
                  >
                    <X size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                {/* Bloco de boas-vindas com ícone de check em destaque */}
                <View className="flex-row items-center gap-3">
                  <View className="w-11 h-11 rounded-2xl bg-[#10B981]/20 border border-[#6EE7B7]/40 items-center justify-center shrink-0">
                    <CheckCircle2 size={24} color="#6EE7B7" strokeWidth={2.2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-extrabold text-white tracking-tight">
                      Bem-vindo ao Modo PRO!
                    </Text>
                    <Text className="text-[11px] text-white/80 mt-0.5 leading-4">
                      Assinatura confirmada. Escolha um app externo para conectar agora.
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Faixa dourada hairline separando o hero do conteúdo */}
              <View className="h-[2px] bg-[#F59E0B]/40 w-full" />

              {/* Lista de plataformas externas (somente Google Agenda aceso e interativo) */}
              <View className="px-4 pt-3.5 pb-3 flex-col gap-2">
                {/* Subtítulo editorial da lista */}
                <Text className="text-[10px] font-bold text-[#4B5563] uppercase tracking-widest mb-0.5">
                  Aplicativos disponíveis
                </Text>

                {EXTERNAL_PLATFORMS.map((platform) => {
                  // Extrai o componente SVG da plataforma
                  const PlatformIcon = platform.Icon;
                  // Verifica se o Google Agenda está conectado pelo usuário
                  const isConnected = platform.enabled && isGoogleConnected;

                  return (
                    // Linha individual de integração com contraste claro entre ativo e apagado
                    <TouchableOpacity
                      key={platform.id}
                      disabled={!platform.enabled || isExporting}
                      onPress={() => {
                        // Dispara a exportação real em .ics para o Google Agenda (inclusive re-download)
                        if (platform.enabled) {
                          handleConnectGoogleCalendar();
                        }
                      }}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !platform.enabled || isExporting, selected: isConnected }}
                      accessibilityLabel={
                        platform.enabled
                          ? isConnected
                            ? `Baixar novamente arquivo do ${platform.name}`
                            : `Conectar ${platform.name}`
                          : `${platform.name} disponível em breve`
                      }
                      className={`p-2.5 rounded-2xl border flex-row items-center gap-3 ${
                        platform.enabled
                          ? isConnected
                            ? 'bg-[#ECFDF5] border-[#064E3B] shadow-sm'
                            : 'bg-white border-[#064E3B]/30 shadow-sm'
                          : 'bg-[#F3F4F6]/80 border-[#E5E7EB] opacity-45'
                      }`}
                    >
                      {/* Recipiente circular/squircle do ícone */}
                      <View
                        className={`w-10 h-10 rounded-xl items-center justify-center shrink-0 ${
                          platform.enabled
                            ? 'bg-[#FAFBF9] border border-[#064E3B]/15'
                            : 'bg-white/70 border border-[#E5E7EB]'
                        }`}
                      >
                        <PlatformIcon size={22} />
                      </View>

                      {/* Nome e descrição da integração */}
                      <View className="flex-1 min-w-0">
                        <Text
                          className={`text-[13px] font-bold ${
                            platform.enabled ? 'text-[#0F172A]' : 'text-[#6B7280]'
                          }`}
                          numberOfLines={1}
                        >
                          {platform.name}
                        </Text>
                        <Text className="text-[10.5px] text-[#6B7280] mt-0.5" numberOfLines={1}>
                          {platform.enabled && isConnected
                            ? 'Toque novamente para baixar outro .ics'
                            : platform.description}
                        </Text>
                      </View>

                      {/* Ação à direita: loading, Conectar/Conectado ✓ para o ativo ou selo Em breve */}
                      {platform.enabled ? (
                        isExporting ? (
                          <View className="flex-row items-center justify-center bg-[#064E3B]/10 border border-[#064E3B]/25 px-3 py-1.5 rounded-full shrink-0 min-w-[78px]">
                            <ActivityIndicator size="small" color="#064E3B" />
                          </View>
                        ) : isConnected ? (
                          <View className="flex-row items-center gap-1 bg-[#064E3B] px-2.5 py-1.5 rounded-full shrink-0">
                            <Check size={12} color="#ffffff" strokeWidth={3} />
                            <Text className="text-[10.5px] font-bold text-white">Conectado ✓</Text>
                          </View>
                        ) : (
                          <View className="flex-row items-center gap-1 bg-[#064E3B]/10 border border-[#064E3B]/25 px-2.5 py-1.5 rounded-full shrink-0">
                            <Link2 size={12} color="#064E3B" />
                            <Text className="text-[10.5px] font-bold text-[#064E3B]">Conectar</Text>
                          </View>
                        )
                      ) : (
                        <View className="bg-[#E5E7EB] px-2 py-1 rounded-full shrink-0">
                          <Text className="text-[9.5px] font-bold text-[#6B7280]">Em breve</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Banner discreto com instrução de importação após baixar o arquivo prazos-suap.ics */}
                {isGoogleConnected && (
                  <View className="mt-1 bg-[#ECFDF5] border border-[#064E3B]/25 rounded-xl px-3 py-2.5 flex-row items-start gap-2">
                    <View className="mt-0.5">
                      <CheckCircle2 size={14} color="#064E3B" />
                    </View>
                    <Text className="flex-1 text-[10.5px] text-[#064E3B] leading-[15px] font-medium">
                      Arquivo prazos-suap.ics baixado! No Google Agenda (PC), vá em Configurações &gt; Importar e exportar.
                    </Text>
                  </View>
                )}
              </View>

              {/* Rodapé com botão de conclusão */}
              <View className="px-4 pt-2 pb-4 bg-[#F2F6F3] border-t border-[#064E3B]/10">
                <TouchableOpacity
                  onPress={handleClose}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel="Continuar para o aplicativo"
                  className="w-full h-11 bg-[#064E3B] rounded-xl flex-row items-center justify-center gap-1.5 shadow-md"
                >
                  <Text className="text-white font-bold text-sm">
                    {isGoogleConnected ? 'Concluir e ir para o app' : 'Continuar'}
                  </Text>
                  <ArrowRight size={15} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // =====================================================================
            // TELA DE OFERTA E CHECKOUT DO MODO PRO (EDITORIAL SEM SCROLL)
            // =====================================================================
            <View className="flex-col">
              {/* Hero superior em gradiente verde-esmeralda profundo com acento dourado */}
              <LinearGradient
                colors={['#022C22', '#064E3B', '#0F5132']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 15 }}
              >
                {/* Topo com eyebrow SUAP PRO e botão fechar */}
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-1.5 bg-[#F59E0B]/15 border border-[#F59E0B]/40 px-2.5 py-0.5 rounded-full">
                    <Crown size={11} color="#FCD34D" />
                    <Text className="text-[9.5px] font-extrabold text-[#FDE68A] tracking-widest uppercase">
                      SUAP PRO
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={isProcessing}
                    accessibilityRole="button"
                    accessibilityLabel="Fechar janela de assinatura PRO"
                    className="w-7 h-7 rounded-full bg-white/10 items-center justify-center"
                  >
                    <X size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                {/* Título editorial e subtítulo com alto contraste */}
                <Text className="text-[17px] font-extrabold text-white tracking-tight leading-5">
                  Evolua sua rotina acadêmica
                </Text>
                <Text className="text-[11px] text-white/80 mt-1 leading-4">
                  Conecte o SUAP às suas ferramentas favoritas e nunca mais perca um prazo.
                </Text>
              </LinearGradient>

              {/* Faixa dourada sutil separando o hero da superfície editorial */}
              <View className="h-[2px] bg-[#F59E0B]/45 w-full" />

              {/* Superfície unificada sem cards aninhados: plataformas + vantagens */}
              <View className="px-4 pt-3 pb-3 flex-col gap-3">
                {/* Vitrine limpa das 4 plataformas conectáveis */}
                <View className="flex-row justify-between gap-2">
                  {EXTERNAL_PLATFORMS.map((platform) => {
                    // Extrai o componente de ícone SVG de cada plataforma
                    const PlatformIcon = platform.Icon;
                    return (
                      <View key={platform.id} className="flex-1 items-center">
                        {/* Moldura squircle leve para o logo do app */}
                        <View className="w-10 h-10 rounded-2xl bg-white border border-[#064E3B]/10 shadow-sm items-center justify-center">
                          <PlatformIcon size={20} />
                        </View>
                        {/* Nome do aplicativo abaixo do ícone */}
                        <Text
                          className="text-[9.5px] font-semibold text-[#1F2937] mt-1 text-center leading-3"
                          numberOfLines={2}
                        >
                          {platform.name}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Divisória hairline sutil substituindo bordas pesadas de cards */}
                <View className="h-px bg-[#064E3B]/10 w-full" />

                {/* Lista editorial de vantagens diretamente sobre a superfície */}
                <View className="flex-col gap-2">
                  {PRO_BENEFITS.map((benefit, index) => (
                    // Item individual com ícone verde esmeralda alinhado à primeira linha
                    <View key={index} className="flex-row items-start gap-2">
                      <View className="mt-[1px]">
                        <CheckCircle2 size={14} color="#064E3B" strokeWidth={2.3} />
                      </View>
                      <Text className="flex-1 text-[11px] text-[#1F2937] leading-[15px] font-medium">
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Dock de checkout integrado: preço + seletor segmentado + CTA + segurança */}
              <View className="px-4 pt-3 pb-3.5 bg-[#F2F6F3] border-t border-[#064E3B]/10 flex-col gap-2.5">
                {/* Linha de preço com hierarquia clara e legenda lateral */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-baseline">
                    <Text className="text-[22px] font-extrabold text-[#022C22] tracking-tight">
                      R$ 15,00
                    </Text>
                    <Text className="text-[11px] font-semibold text-[#4B5563] ml-1">
                      / mês
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] font-bold text-[#064E3B]">
                      Acesso imediato
                    </Text>
                    <Text className="text-[10px] text-[#6B7280]">
                      Cancele quando quiser
                    </Text>
                  </View>
                </View>

                {/* Controle segmentado refinado para escolha de forma de pagamento */}
                <View className="flex-row bg-[#E3EBE6] p-1 rounded-xl">
                  {/* Aba Pix selecionada por padrão */}
                  <TouchableOpacity
                    onPress={() => setPaymentMethod('pix')}
                    disabled={isProcessing}
                    activeOpacity={0.85}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: paymentMethod === 'pix' }}
                    accessibilityLabel="Pagar com Pix"
                    className={`flex-1 py-2 rounded-lg flex-row items-center justify-center gap-1.5 ${
                      paymentMethod === 'pix' ? 'bg-white shadow-sm' : 'bg-transparent'
                    }`}
                  >
                    <QrCode
                      size={14}
                      color={paymentMethod === 'pix' ? '#064E3B' : '#4B5563'}
                    />
                    <Text
                      className={`text-[11.5px] font-bold ${
                        paymentMethod === 'pix' ? 'text-[#022C22]' : 'text-[#4B5563]'
                      }`}
                    >
                      Pix
                    </Text>
                  </TouchableOpacity>

                  {/* Aba Cartão de Crédito */}
                  <TouchableOpacity
                    onPress={() => setPaymentMethod('card')}
                    disabled={isProcessing}
                    activeOpacity={0.85}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: paymentMethod === 'card' }}
                    accessibilityLabel="Pagar com Cartão de Crédito"
                    className={`flex-1 py-2 rounded-lg flex-row items-center justify-center gap-1.5 ${
                      paymentMethod === 'card' ? 'bg-white shadow-sm' : 'bg-transparent'
                    }`}
                  >
                    <CreditCard
                      size={14}
                      color={paymentMethod === 'card' ? '#064E3B' : '#4B5563'}
                    />
                    <Text
                      className={`text-[11.5px] font-bold ${
                        paymentMethod === 'card' ? 'text-[#022C22]' : 'text-[#4B5563]'
                      }`}
                    >
                      Cartão de Crédito
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Botão principal CTA em gradiente esmeralda profundo */}
                <TouchableOpacity
                  onPress={handleSubscribe}
                  disabled={isProcessing}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel="Assinar Modo PRO agora por R$ 15,00"
                  className={`rounded-xl overflow-hidden shadow-md ${
                    isProcessing ? 'opacity-90' : ''
                  }`}
                >
                  <LinearGradient
                    colors={['#064E3B', '#022C22']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      height: 44,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isProcessing ? (
                      // Estado de carregamento durante os 1.5s de simulação
                      <>
                        <ActivityIndicator size="small" color="#FDE68A" />
                        <Text className="text-white font-bold text-sm ml-2">
                          Processando pagamento...
                        </Text>
                      </>
                    ) : (
                      // Estado padrão com chamada principal clara
                      <Text className="text-white font-bold text-sm tracking-wide">
                        Assinar agora • R$ 15,00
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Legenda discreta de segurança da simulação */}
                <View className="flex-row items-center justify-center gap-1">
                  <ShieldCheck size={12} color="#6B7280" />
                  <Text className="text-[10px] text-[#6B7280]">
                    Ambiente seguro • Simulação de demonstração
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
