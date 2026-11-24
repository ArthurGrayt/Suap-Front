// Importa React e utilitários de contexto, estado e callback
import React, { createContext, useCallback, useContext, useState } from 'react';

// Define o contrato de dados e ações expostos pelo contexto de assinatura PRO
interface PremiumContextData {
  // Indica se o usuário está com o Modo PRO ativo na demonstração
  isPremium: boolean;
  // Ativa o Modo PRO definindo isPremium como true
  activatePremium: () => void;
  // Reinicia o estado para false para facilitar novas demonstrações
  resetPremium: () => void;
  // Controla se o modal de Paywall está visível na tela
  isPaywallVisible: boolean;
  // Abre o modal de Paywall a partir de qualquer tela do app
  openPaywall: () => void;
  // Fecha o modal de Paywall
  closePaywall: () => void;
}

// Cria o contexto inicialmente indefinido para validar o uso dentro do Provider
const PremiumContext = createContext<PremiumContextData | undefined>(undefined);

// Define as props esperadas pelo componente provedor
interface PremiumProviderProps {
  // Elementos filhos da árvore da aplicação envolvidos pelo Provider
  children: React.ReactNode;
}

// Componente provedor que mantém o estado global do Modo PRO e do Paywall
export function PremiumProvider({ children }: PremiumProviderProps) {
  // Estado global de assinatura PRO, iniciando como false conforme regra da demo
  const [isPremium, setIsPremium] = useState(false);
  // Estado global de visibilidade do modal de simulação de pagamento
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);

  // Função memorizada para ativar o plano PRO
  const activatePremium = useCallback(() => {
    // Atualiza o estado global para ativo
    setIsPremium(true);
  }, []);

  // Função memorizada para resetar o plano PRO ao estado inicial
  const resetPremium = useCallback(() => {
    // Atualiza o estado global para inativo
    setIsPremium(false);
  }, []);

  // Função memorizada para exibir o modal do Paywall
  const openPaywall = useCallback(() => {
    // Torna o modal visível
    setIsPaywallVisible(true);
  }, []);

  // Função memorizada para ocultar o modal do Paywall
  const closePaywall = useCallback(() => {
    // Oculta o modal
    setIsPaywallVisible(false);
  }, []);

  // Fornece o estado e as ações para toda a árvore de componentes abaixo
  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        activatePremium,
        resetPremium,
        isPaywallVisible,
        openPaywall,
        closePaywall,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

// Hook personalizado para consumir o contexto Premium com segurança de tipos
export function usePremium(): PremiumContextData {
  // Lê o valor atual do contexto mais próximo na árvore
  const context = useContext(PremiumContext);
  // Dispara erro explícito caso o hook seja usado fora do PremiumProvider
  if (!context) {
    throw new Error('usePremium deve ser utilizado dentro de um PremiumProvider.');
  }
  // Retorna o objeto completo de estado e ações do Modo PRO
  return context;
}
