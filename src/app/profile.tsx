import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Switch, Alert, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BottomNavbar from '@/components/bottom-navbar';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Header from '@/components/header';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();

  // State para os formulários
  const [fullName, setFullName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [phone, setPhone] = useState('');

  const formatPhone = (val: string) => {
    let unmasked = val.replace(/\D/g, '');
    if (unmasked.length > 11) unmasked = unmasked.slice(0, 11);
    if (unmasked.length === 0) return '';
    if (unmasked.length <= 2) return `(${unmasked}`;
    if (unmasked.length <= 6) return `(${unmasked.slice(0, 2)}) ${unmasked.slice(2)}`;
    if (unmasked.length <= 10) return `(${unmasked.slice(0, 2)}) ${unmasked.slice(2, 6)}-${unmasked.slice(6)}`;
    return `(${unmasked.slice(0, 2)}) ${unmasked.slice(2, 7)}-${unmasked.slice(7)}`;
  };
  const [course, setCourse] = useState('');
  const [currentPeriod, setCurrentPeriod] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [ra, setRa] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [prefId, setPrefId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase.from('user_preferences').select('*').limit(1).single();
        if (data) {
          setPrefId(data.id);
          setFullName(data.full_name || '');
          setCourse(data.course || '');
          setCurrentPeriod(data.current_period || '');
          setAvatarUrl(data.avatar_url || '');
          setRa(data.ra ?? data.RA ?? '');
          
          if (data.telefone) {
            setPhone(formatPhone(data.telefone));
          }
          
          if (data.full_name) {
            const parts = data.full_name.split(' ');
            setPreferredName(parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0]);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar perfil", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!prefId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({
          full_name: fullName,
          telefone: phone.replace(/\D/g, ''),
          updated_at: new Date().toISOString()
        })
        .eq('id', prefId);
        
      if (error) throw error;
      Alert.alert("Sucesso", "Alterações salvas com sucesso!");
    } catch (err) {
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permissão necessária", "Você precisa permitir o acesso à galeria para alterar a foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!prefId) return;
    setUploadingAvatar(true);
    
    try {
      // Cria um nome de arquivo único
      const fileExt = uri.split('.').pop() || 'jpeg';
      const fileName = `${prefId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Carrega o arquivo local
      const response = await fetch(uri);
      const blob = await response.blob();

      // Envia para o storage (bucket 'profile_pic')
      const { error: uploadError } = await supabase.storage
        .from('profile_pic')
        .upload(filePath, blob, { upsert: true, contentType: `image/${fileExt}` });

      if (uploadError) throw uploadError;

      // Obtém URL pública
      const { data } = supabase.storage.from('profile_pic').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // Salva no banco de dados
      const { error: updateError } = await supabase
        .from('user_preferences')
        .update({ avatar_url: publicUrl })
        .eq('id', prefId);

      if (updateError) throw updateError;

      // Atualiza o estado da tela
      setAvatarUrl(publicUrl);
      Alert.alert("Sucesso", "Sua foto de perfil foi atualizada!");
      
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", "Não foi possível fazer o upload da foto.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Desconectar",
      "Deseja realmente desconectar sua conta SUAP?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: () => router.replace('/') } // Redireciona pra home por enquanto
      ]
    );
  };

  return (
    <View className="flex-1 bg-surface">
      <Header showProfileInfo={true} />

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center mt-20">
            <ActivityIndicator size="large" color="#195e38" />
            <Text className="mt-4 text-on-surface-variant font-medium">Carregando perfil...</Text>
          </View>
        ) : (
          <>
            {/* HERO SECTION */}
        <LinearGradient
          colors={['#d8e6f3', '#f0f3ff', '#f9f9ff']}
          style={{ width: '100%', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32, alignItems: 'center' }}
        >
          {/* Container fixo para a foto não esticar na tela inteira */}
          <View className="relative mb-4 w-28 h-28 self-center">
            <View className="w-28 h-28 rounded-full overflow-hidden shadow-sm bg-surface-container-high relative">
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="w-full h-full bg-surface-container items-center justify-center">
                  <MaterialIcons name="person" size={40} color="#707971" />
                </View>
              )}
              {uploadingAvatar && (
                <View className="absolute inset-0 bg-black/40 items-center justify-center">
                  <ActivityIndicator size="small" color="#ffffff" />
                </View>
              )}
            </View>
            <TouchableOpacity 
              onPress={handlePickImage}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#195e38] items-center justify-center shadow-md active:scale-95 border-2 border-surface"
            >
              <MaterialIcons name="photo-camera" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View className="items-center">
            <Text className="text-2xl text-[#001c30] font-bold tracking-tight">{fullName}</Text>
            <View className="mt-1 flex-row items-center bg-[#e7eeff] px-3 py-1 rounded-full gap-1">
              <MaterialIcons name="badge" size={15} color="#404941" />
              <Text className="text-[11px] text-[#404941] font-medium tracking-wide">
                RA Acadêmico: {ra || 'Não informado'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View className="px-4 flex-col gap-6 pt-2">
          {/* VÍNCULO INSTITUCIONAL */}
          <View className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex-col gap-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="school" size={22} color="#001c30" />
                <Text className="text-[17px] text-[#001c30] font-semibold">Vínculo Institucional</Text>
              </View>
              <View className="flex-row items-center gap-1 bg-transparent px-2 py-1 ">
                <View className="w-1.5 h-1.5  bg-transparent" />
                <Text className="text-[10px] text-[#005312] font-bold">Matriculado / Ativo</Text>
              </View>
            </View>

            <View className="flex-col gap-2">
              <View className="p-3 bg-[#f0f3ff] rounded-lg">
                <Text className="text-[10px] text-[#404941] uppercase tracking-wider font-bold mb-1">Curso</Text>
                <Text className="text-[15px] text-[#001c30] font-medium">{course || 'Não informado'}</Text>
              </View>
              
              <View className="flex-row gap-2">
                <View className="flex-1 p-3 bg-[#f0f3ff] rounded-lg">
                  <Text className="text-[10px] text-[#404941] uppercase tracking-wider font-bold mb-1">Campus</Text>
                  <Text className="text-[15px] text-[#001c30] font-medium">IFMG - OB </Text>
                </View>
                <View className="flex-1 p-3 bg-[#f0f3ff] rounded-lg">
                  <Text className="text-[10px] text-[#404941] uppercase tracking-wider font-bold mb-1">Período</Text>
                  <Text className="text-[15px] text-[#001c30] font-medium">{currentPeriod || 'Não informado'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* DADOS CADASTRAIS */}
          <View className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex-col gap-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="person-outline" size={22} color="#004525" />
                <Text className="text-base text-on-surface font-semibold">Dados Cadastrais</Text>
              </View>
            </View>

            <View className="flex-col gap-3">
              <View className="flex-col gap-1">
                <Text className="text-xs text-on-surface-variant font-semibold">Nome Completo</Text>
                <View className="relative flex-row items-center">
                  <TextInput 
                    value={fullName}
                    onChangeText={setFullName}
                    className="flex-1 h-11 px-3 bg-surface-container-low rounded-lg text-on-surface text-sm"
                  />
                  <View className="absolute right-3">
                    <MaterialIcons name="edit" size={18} color="#707971" />
                  </View>
                </View>
              </View>

             
              

              <View className="flex-col gap-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-on-surface-variant font-semibold">E-mail Acadêmico</Text>
                  <View className="flex-row items-center gap-0.5">
                    
                  </View>
                </View>
                <View className="relative flex-row items-center">
                  <TextInput 
                    value="arthur.machado@aluno.ifmg.edu.br"
                    editable={false}
                    className="flex-1 h-11 px-3 bg-surface-container rounded-lg text-on-surface-variant text-sm opacity-80"
                  />
                  <View className="absolute right-3">
                    <MaterialIcons name="lock" size={18} color="#707971" />
                  </View>
                </View>
                <Text className="text-xs text-on-surface-variant">Sincronizado automaticamente com o login institucional.</Text>
              </View>

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
                    className="flex-1 h-11 px-3 bg-surface-container-low rounded-lg text-on-surface text-sm"
                  />
                  <View className="absolute right-3">
                    <MaterialIcons name="chat" size={18} color="#004525" />
                  </View>
                </View>
              </View>
            </View>
          </View>
          
          {/* APP SYSTEM INFO */}
          <View className="bg-surface-container-low rounded-xl p-4 flex-col gap-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1">
                <MaterialIcons name="info" size={16} color="#404941" />
                <Text className="text-xs text-on-surface-variant font-semibold">Versão do Aplicativo</Text>
              </View>
              <Text className="text-xs text-on-surface-variant font-bold">v2.4.1 </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1">
                <MaterialIcons name="cloud-done" size={16} color="#404941" />
                <Text className="text-xs text-on-surface-variant font-semibold">Última sincronização</Text>
              </View>
              <Text className="text-xs text-secondary font-bold">Hoje às 14:28</Text>
            </View>
          </View>

          {/* BOTÕES DE AÇÃO */}
          <View className="flex-col gap-3 pb-8">
            <TouchableOpacity 
              onPress={handleSave}
              disabled={saving}
              className={`w-full h-12 bg-primary-container rounded-lg flex-row items-center justify-center shadow-md active:bg-primary ${saving ? 'opacity-70' : ''}`}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <MaterialIcons name="save" size={20} color="#ffffff" />
              )}
              <Text className="text-on-primary font-bold text-sm ml-2">
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleLogout}
              className="w-full h-11 bg-error-container rounded-lg flex-row items-center justify-center active:opacity-80"
            >
              <MaterialIcons name="logout" size={18} color="#ba1a1a" />
              <Text className="text-error font-bold text-sm ml-2">Encerrar Sessão (SUAP)</Text>
            </TouchableOpacity>
          </View>

        </View>
          </>
        )}
      </ScrollView>

      {/* FIXED BOTTOM NAVBAR */}
      <View className="absolute bottom-0 w-full">
        <BottomNavbar activeTab="perfil" />
      </View>
    </View>
  );
}
