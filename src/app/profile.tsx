// Importa React e hooks de estado, callback e efeito
import React, { useState, useEffect, useCallback } from 'react';
// Importa componentes nativos e Platform para lidar com diferenças entre Web e Mobile
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform, ActivityIndicator } from 'react-native';
// Importa ícones MaterialIcons mantendo um único conjunto visual em todo o app
import { MaterialIcons } from '@expo/vector-icons';
// Importa o hook de roteamento do Expo Router
import { useRouter } from 'expo-router';
// Importa a barra de navegação inferior
import BottomNavbar from '@/components/bottom-navbar';
// Importa o gradiente linear do Expo para o destaque do perfil
import { LinearGradient } from 'expo-linear-gradient';
// Importa o seletor de imagens da galeria/arquivos
import * as ImagePicker from 'expo-image-picker';
// Importa o cabeçalho institucional superior
import Header from '@/components/header';
// Importa o cliente Supabase para ler/atualizar dados e fazer upload de foto
import { supabase } from '@/lib/supabase';
// Importa FileSystem para leitura de arquivo local no ambiente nativo
import * as FileSystem from 'expo-file-system/legacy';
// Importa decodificador base64 para envio ao Storage no ambiente nativo
import { decode } from 'base64-arraybuffer';
// Importa Constants do Expo para exibir a versão real configurada em app.json
import Constants from 'expo-constants';
// Importa utilitários de data para formatar a última sincronização real
import { formatDate, formatTime } from '@/utils/date';
// Importa os diálogos multiplataforma compatíveis com Web e Mobile
import { showAlert, showConfirm } from '@/utils/dialog';
// Importa o hook global do contexto de assinatura PRO
import { usePremium } from '@/contexts/PremiumContext';

// Tela de Perfil e Dados Cadastrais do estudante
export default function ProfileScreen() {
  // Instância do roteador para redirecionamento no logout
  const router = useRouter();
  // Consome estado e ações do Modo PRO do contexto global
  const { isPremium, openPaywall, resetPremium } = usePremium();

  // Estado para o nome completo do estudante vindo do banco
  const [fullName, setFullName] = useState('');
  // Estado para o telefone formatado do estudante
  const [phone, setPhone] = useState('');
  // Estado para o e-mail institucional carregado do banco ou auth
  const [email, setEmail] = useState('');
  // Estado para o nome do curso acadêmico
  const [course, setCourse] = useState('');
  // Estado para o campus institucional
  const [campus, setCampus] = useState('');
  // Estado para o período letivo atual
  const [currentPeriod, setCurrentPeriod] = useState('');
  // Estado para a URL pública da foto de perfil
  const [avatarUrl, setAvatarUrl] = useState('');
  // Estado para o RA acadêmico do aluno
  const [ra, setRa] = useState('');
  // Estado para o timestamp real da última atualização no banco
  const [lastSync, setLastSync] = useState('');
  // Estado de carregamento inicializado como true até finalizar a busca no banco
  const [loading, setLoading] = useState(true);
  // Estado para exibir erro amigável caso o fetch do perfil falhe
  const [loadError, setLoadError] = useState<string | null>(null);
  // Estado que indica salvamento em andamento
  const [saving, setSaving] = useState(false);
  // Estado que indica upload de avatar em andamento
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  // Estado que armazena o ID do registro na tabela user_preferences
  const [prefId, setPrefId] = useState<string | null>(null);

  // Versão real do aplicativo lida da configuração do Expo
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  // Função utilitária para aplicar máscara de telefone brasileiro
  const formatPhone = (val: string) => {
    // Remove qualquer caractere não numérico
    let unmasked = val.replace(/\D/g, '');
    // Limita a quantidade máxima a 11 dígitos
    if (unmasked.length > 11) unmasked = unmasked.slice(0, 11);
    // Retorna vazio se não houver números
    if (unmasked.length === 0) return '';
    // Formata DDD inicial
    if (unmasked.length <= 2) return `(${unmasked}`;
    // Formata DDD + primeiros dígitos
    if (unmasked.length <= 6) return `(${unmasked.slice(0, 2)}) ${unmasked.slice(2)}`;
    // Formata número fixo
    if (unmasked.length <= 10) return `(${unmasked.slice(0, 2)}) ${unmasked.slice(2, 6)}-${unmasked.slice(6)}`;
    // Formata celular com 9 dígitos
    return `(${unmasked.slice(0, 2)}) ${unmasked.slice(2, 7)}-${unmasked.slice(7)}`;
  };

  // Carrega os dados reais do perfil no Supabase com tratamento de erro amigável
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // Busca o registro de preferências do usuário no Supabase
      const { data, error: prefError } = await supabase
        .from('user_preferences')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (prefError) throw prefError;

      // Busca também o usuário autenticado caso o e-mail venha do auth
      const { data: authData } = await supabase.auth.getUser();

      if (data) {
        setPrefId(data.id);
        setFullName(data.full_name || '');
        setCourse(data.course || '');
        setCampus(data.campus || 'IFMG');
        setCurrentPeriod(data.current_period || '');
        setAvatarUrl(data.avatar_url || '');
        setRa(data.ra ?? data.RA ?? '');
        setEmail(data.email || authData?.user?.email || '');
        setLastSync(data.updated_at || '');

        if (data.telefone) {
          setPhone(formatPhone(data.telefone));
        }
      } else if (authData?.user?.email) {
        setEmail(authData.user.email);
      }
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      setLoadError('Não foi possível carregar os dados do perfil. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Dispara o carregamento inicial ao montar a tela sem chamar setState síncrono direto no corpo do efeito
  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const { data, error: prefError } = await supabase
          .from('user_preferences')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (!active) return;
        if (prefError) throw prefError;

        const { data: authData } = await supabase.auth.getUser();
        if (!active) return;

        if (data) {
          setPrefId(data.id);
          setFullName(data.full_name || '');
          setCourse(data.course || '');
          setCampus(data.campus || 'IFMG');
          setCurrentPeriod(data.current_period || '');
          setAvatarUrl(data.avatar_url || '');
          setRa(data.ra ?? data.RA ?? '');
          setEmail(data.email || authData?.user?.email || '');
          setLastSync(data.updated_at || '');
          if (data.telefone) {
            setPhone(formatPhone(data.telefone));
          }
        } else if (authData?.user?.email) {
          setEmail(authData.user.email);
        }
      } catch (err) {
        if (!active) return;
        console.error('Erro ao buscar perfil:', err);
        setLoadError('Não foi possível carregar os dados do perfil. Verifique sua conexão.');
      } finally {
        if (active) setLoading(false);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  // Persiste alterações de nome e telefone no Supabase
  const handleSave = async () => {
    if (!prefId) {
      showAlert('Aviso', 'Perfil não carregado para atualização.');
      return;
    }
    setSaving(true);
    try {
      const nowIso = new Date().toISOString();
      // Atualiza nome, telefone numérico e timestamp de atualização
      const { error } = await supabase
        .from('user_preferences')
        .update({
          full_name: fullName,
          telefone: phone.replace(/\D/g, ''),
          updated_at: nowIso,
        })
        .eq('id', prefId);

      if (error) throw error;
      setLastSync(nowIso);
      showAlert('Sucesso', 'Alterações salvas com sucesso!');
    } catch {
      showAlert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  // Abre a galeria/seletor de arquivos para escolher uma nova foto de perfil
  const handlePickImage = async () => {
    // Solicita permissão de acesso à biblioteca de mídia
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      showAlert('Permissão necessária', 'Você precisa permitir o acesso à galeria para alterar a foto.');
      return;
    }

    // Abre o seletor de imagens recortado em proporção 1:1
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  // Faz upload da imagem selecionada para o bucket do Supabase (compatível com Web e Nativo)
  const uploadAvatar = async (uri: string) => {
    if (!prefId) {
      showAlert('Aviso', 'Perfil não carregado para enviar a foto.');
      return;
    }
    setUploadingAvatar(true);

    try {
      // Extrai extensão segura do arquivo
      const uriExt = uri.split('.').pop() || 'jpeg';
      const fileExt = uriExt.replace(/[^a-zA-Z0-9]/g, '') || 'jpeg';
      // Gera caminho único na raiz do bucket
      const filePath = `${prefId}-${Date.now()}.${fileExt}`;

      // Obtém o conteúdo binário de forma compatível com Web (fetch) ou Nativo (FileSystem)
      let fileBuffer: ArrayBuffer;
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        fileBuffer = await response.arrayBuffer();
      } else {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        fileBuffer = decode(base64);
      }

      // Envia o arquivo para o bucket profile_pic
      const { error: uploadError } = await supabase.storage
        .from('profile_pic')
        .upload(filePath, fileBuffer, { upsert: true, contentType: `image/${fileExt}` });

      if (uploadError) throw uploadError;

      // Recupera a URL pública gerada pelo Storage
      const { data } = supabase.storage.from('profile_pic').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // Atualiza a URL do avatar no registro do usuário
      const { error: updateError } = await supabase
        .from('user_preferences')
        .update({ avatar_url: publicUrl })
        .eq('id', prefId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      showAlert('Sucesso', 'Sua foto de perfil foi atualizada!');
    } catch (err) {
      console.error(err);
      showAlert('Erro', 'Não foi possível fazer o upload da foto.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Solicita confirmação antes de encerrar a sessão
  const handleLogout = () => {
    showConfirm(
      'Desconectar',
      'Deseja realmente desconectar sua conta SUAP?',
      async () => {
        // Encerra sessão no Supabase Auth caso exista e retorna para a tela inicial
        await supabase.auth.signOut().catch(() => {});
        router.replace('/');
      },
      'Sair'
    );
  };

  // Formata texto legível da última sincronização real registrada no banco
  const formattedLastSync = lastSync
    ? `${formatDate(lastSync)} às ${formatTime(lastSync)}`
    : 'Não registrada';

  return (
    <View className="flex-1 bg-surface">
      {/* Cabeçalho institucional com título específico da tela */}
      <Header title="Perfil" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          // Indicador de carregamento enquanto busca o perfil no banco
          <View className="flex-1 items-center justify-center mt-20">
            <ActivityIndicator size="large" color="#195e38" />
            <Text className="mt-4 text-on-surface-variant font-medium">Carregando perfil...</Text>
          </View>
        ) : loadError ? (
          // Estado de erro amigável com opção de tentar novamente
          <View className="flex-1 items-center justify-center px-6 mt-20">
            <MaterialIcons name="error-outline" size={40} color="#ba1a1a" />
            <Text className="text-error mt-4 font-bold text-center">{loadError}</Text>
            <TouchableOpacity
              onPress={fetchProfile}
              accessibilityRole="button"
              accessibilityLabel="Tentar carregar perfil novamente"
              className="mt-4 px-5 py-3 bg-primary-container rounded-xl active:bg-primary"
            >
              <Text className="text-on-primary font-bold text-sm">Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Seção de destaque superior na paleta neutra esverdeada do IF */}
            <LinearGradient
              colors={['#d9e4dc', '#eef3ef', '#f6f8f6']}
              style={{ width: '100%', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 28, alignItems: 'center' }}
            >
              {/* Container circular da foto de perfil com botão de câmera acessível */}
              <View className="relative mb-4 w-28 h-28 self-center">
                <View className="w-28 h-28 rounded-full overflow-hidden bg-surface-container-high relative">
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="w-full h-full bg-surface-container items-center justify-center">
                      <MaterialIcons name="person" size={40} color="#3d4a40" />
                    </View>
                  )}
                  {uploadingAvatar && (
                    <View className="absolute inset-0 bg-black/40 items-center justify-center">
                      <ActivityIndicator size="small" color="#ffffff" />
                    </View>
                  )}
                </View>
                {/* Botão da câmera com área de toque 44x44px */}
                <TouchableOpacity
                  onPress={handlePickImage}
                  disabled={uploadingAvatar}
                  accessibilityRole="button"
                  accessibilityLabel="Alterar foto de perfil"
                  className="absolute -bottom-1 -right-1 w-11 h-11 rounded-full bg-primary-container items-center justify-center active:scale-95 border-2 border-surface"
                >
                  <MaterialIcons name="photo-camera" size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Nome completo e pílula com RA acadêmico */}
              <View className="items-center">
                <Text className="text-2xl text-on-surface font-bold tracking-tight">
                  {fullName || 'Estudante'}
                </Text>
                <View className="mt-1 flex-row items-center bg-surface-container px-3 py-1 rounded-full gap-1">
                  <MaterialIcons name="badge" size={15} color="#3d4a40" />
                  <Text className="text-xs text-on-surface-variant font-medium tracking-wide">
                    RA acadêmico: {ra || 'Não informado'}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            <View className="px-4 flex-col gap-5 pt-2">
              {/* Banner do Modo PRO harmonizado com a paleta verde institucional do IF */}
              {!isPremium ? (
                <TouchableOpacity
                  onPress={openPaywall}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel="Seja PRO. Abrir detalhes da assinatura."
                  className="rounded-2xl overflow-hidden border border-primary"
                >
                  <LinearGradient
                    colors={['#004525', '#195e38']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ padding: 16 }}
                  >
                    <View className="flex-row items-center gap-3.5">
                      <View className="w-11 h-11 rounded-xl bg-white/15 border border-primary-fixed/40 items-center justify-center shrink-0">
                        <MaterialIcons name="workspace-premium" size={24} color="#adf2c0" />
                      </View>
                      <View className="flex-1 pr-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-base font-bold text-on-primary tracking-tight">
                            Plano PRO
                          </Text>
                          <View className="bg-primary-fixed px-2 py-0.5 rounded-md">
                            <Text className="text-xs font-extrabold text-on-primary-fixed">
                              Integrações
                            </Text>
                          </View>
                        </View>
                        <Text className="text-xs text-on-primary/90 mt-1 leading-4">
                          Exporte seus prazos para o Google Agenda e Notion com alertas ilimitados
                        </Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={22} color="#adf2c0" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                // Card de confirmação do Plano PRO ativo na paleta institucional verde
                <TouchableOpacity
                  onLongPress={resetPremium}
                  delayLongPress={500}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessibilityLabel="Plano PRO ativo. Segure para reiniciar a demonstração."
                  className="bg-surface-container-lowest rounded-2xl p-4 border-2 border-primary-container flex-row items-center gap-3.5"
                >
                  <View className="w-11 h-11 rounded-xl bg-primary-fixed border border-primary/20 items-center justify-center shrink-0">
                    <MaterialIcons name="check-circle" size={24} color="#004525" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm font-bold text-primary">
                        Plano PRO ativo
                      </Text>
                      <View className="bg-primary-container px-2 py-0.5 rounded-full">
                        <Text className="text-xs font-bold text-on-primary">
                          Ativo
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-on-surface-variant mt-1 leading-4">
                      Todos os recursos de integração estão desbloqueados
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Card de vínculo institucional */}
              <View className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container flex-col gap-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <MaterialIcons name="school" size={22} color="#141d17" />
                    <Text className="text-[17px] text-on-surface font-semibold">Matrícula</Text>
                  </View>
                  {/* Rótulo honesto indicando apenas vínculo acadêmico sem afirmar situação sem dado real */}
                  <View className="flex-row items-center gap-1.5 bg-secondary-container/70 px-2.5 py-1 rounded-full">
                    <View className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    <Text className="text-xs text-on-secondary-fixed-variant font-bold">Vínculo SUAP</Text>
                  </View>
                </View>

                <View className="flex-col gap-2">
                  <View className="p-3 bg-surface-container-low rounded-lg">
                    <Text className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">
                      Curso
                    </Text>
                    <Text className="text-[15px] text-on-surface font-medium">{course || 'Não informado'}</Text>
                  </View>

                  <View className="flex-row gap-2">
                    <View className="flex-1 p-3 bg-surface-container-low rounded-lg">
                      <Text className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">
                        Campus
                      </Text>
                      <Text className="text-[15px] text-on-surface font-medium">{campus || 'IFMG'}</Text>
                    </View>
                    <View className="flex-1 p-3 bg-surface-container-low rounded-lg">
                      <Text className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mb-1">
                        Período
                      </Text>
                      <Text className="text-[15px] text-on-surface font-medium">
                        {currentPeriod || 'Não informado'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Card de dados cadastrais */}
              <View className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container flex-col gap-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <MaterialIcons name="person-outline" size={22} color="#004525" />
                    <Text className="text-base text-on-surface font-semibold">Dados cadastrais</Text>
                  </View>
                </View>

                <View className="flex-col gap-3">
                  {/* Campo editável para nome de exibição */}
                  <View className="flex-col gap-1">
                    <Text className="text-xs text-on-surface-variant font-semibold">Nome completo</Text>
                    <View className="relative flex-row items-center">
                      <TextInput
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Seu nome completo"
                        placeholderTextColor="#707971"
                        accessibilityLabel="Nome completo"
                        className="flex-1 h-11 px-3 pr-10 bg-surface-container-low rounded-lg text-on-surface text-sm"
                      />
                      <View className="absolute right-3">
                        <MaterialIcons name="edit" size={18} color="#3d4a40" />
                      </View>
                    </View>
                  </View>

                  {/* Campo somente leitura para o e-mail institucional sem redução de opacidade */}
                  <View className="flex-col gap-1">
                    <Text className="text-xs text-on-surface-variant font-semibold">E-mail acadêmico</Text>
                    <View className="relative flex-row items-center">
                      <TextInput
                        value={email || 'Não informado'}
                        editable={false}
                        accessibilityLabel="E-mail acadêmico (somente leitura)"
                        className="flex-1 h-11 px-3 pr-10 bg-surface-container rounded-lg text-on-surface-variant text-sm"
                      />
                      <View className="absolute right-3">
                        <MaterialIcons name="lock" size={18} color="#3d4a40" />
                      </View>
                    </View>
                    <Text className="text-xs text-on-surface-variant">
                      Sincronizado automaticamente com o login institucional.
                    </Text>
                  </View>

                  {/* Campo editável para telefone de contato com ícone correto de telefone */}
                  <View className="flex-col gap-1">
                    <Text className="text-xs text-on-surface-variant font-semibold">Telefone</Text>
                    <View className="relative flex-row items-center">
                      <TextInput
                        value={phone}
                        onChangeText={(val) => setPhone(formatPhone(val))}
                        keyboardType="phone-pad"
                        maxLength={15}
                        placeholder="(00) 00000-0000"
                        placeholderTextColor="#707971"
                        accessibilityLabel="Telefone de contato"
                        className="flex-1 h-11 px-3 pr-10 bg-surface-container-low rounded-lg text-on-surface text-sm"
                      />
                      <View className="absolute right-3">
                        <MaterialIcons name="phone" size={18} color="#004525" />
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Card de informações reais do sistema */}
              <View className="bg-surface-container-low rounded-xl p-4 flex-col gap-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    <MaterialIcons name="info" size={16} color="#3d4a40" />
                    <Text className="text-xs text-on-surface-variant font-semibold">Versão do aplicativo</Text>
                  </View>
                  <Text className="text-xs text-on-surface-variant font-bold">v{appVersion}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    <MaterialIcons name="cloud-done" size={16} color="#3d4a40" />
                    <Text className="text-xs text-on-surface-variant font-semibold">Última atualização</Text>
                  </View>
                  <Text className="text-xs text-secondary font-bold">{formattedLastSync}</Text>
                </View>
              </View>

              {/* Botões de salvar alterações e encerrar sessão */}
              <View className="flex-col gap-3 pb-8">
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel="Salvar alterações do perfil"
                  className={`w-full h-12 bg-primary-container rounded-lg flex-row items-center justify-center active:bg-primary ${
                    saving ? 'opacity-70' : ''
                  }`}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <MaterialIcons name="save" size={20} color="#ffffff" />
                  )}
                  <Text className="text-on-primary font-bold text-sm ml-2">
                    {saving ? 'Salvando...' : 'Salvar alterações'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLogout}
                  accessibilityRole="button"
                  accessibilityLabel="Encerrar sessão do SUAP"
                  className="w-full h-11 bg-error-container rounded-lg flex-row items-center justify-center active:opacity-80"
                >
                  <MaterialIcons name="logout" size={18} color="#ba1a1a" />
                  <Text className="text-error font-bold text-sm ml-2">Encerrar sessão (SUAP)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Barra inferior com aba Perfil selecionada */}
      <BottomNavbar activeTab="perfil" />
    </View>
  );
}
