// Importa Alert e Platform do react-native para exibir diálogos compatíveis com Web e Mobile
import { Alert, Platform } from 'react-native';

// Função auxiliar para exibir avisos simples em ambas as plataformas (Mobile e Web)
export function showAlert(title: string, message: string): void {
  // Verifica se o código está sendo executado no navegador Web
  if (Platform.OS === 'web') {
    // Exibe o diálogo nativo do navegador com título e mensagem concatenados
    window.alert(`${title}\n\n${message}`);
    // Encerra a execução após exibir o alerta na Web
    return;
  }

  // No ambiente nativo (Android/iOS), utiliza o Alert padrão do React Native
  Alert.alert(title, message);
}

// Função auxiliar para exibir confirmações com ação destrutiva ou reversível no Mobile e na Web
export function showConfirm(
  // Título exibido no cabeçalho da caixa de diálogo
  title: string,
  // Mensagem descritiva detalhando a confirmação
  message: string,
  // Função callback executada quando o usuário confirmar a ação
  onConfirm: () => void | Promise<void>,
  // Rótulo do botão de confirmação no ambiente nativo
  confirmLabel = 'Confirmar'
): void {
  // Verifica se a aplicação está rodando no navegador Web
  if (Platform.OS === 'web') {
    // Solicita confirmação síncrona usando window.confirm do navegador
    const confirmed = window.confirm(`${title}\n\n${message}`);
    // Caso o usuário confirme, dispara a função de callback
    if (confirmed) {
      // Executa o callback de confirmação
      void onConfirm();
    }
    // Encerra a execução para não chamar Alert.alert na Web
    return;
  }

  // No ambiente nativo, exibe os botões Cancelar e Confirmar com estilo destrutivo
  Alert.alert(title, message, [
    // Botão para cancelar sem executar nenhuma ação
    { text: 'Cancelar', style: 'cancel' },
    // Botão de confirmação que dispara o callback recebido
    { text: confirmLabel, style: 'destructive', onPress: () => void onConfirm() },
  ]);
}
