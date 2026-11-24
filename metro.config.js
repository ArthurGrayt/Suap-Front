// Importa o gerador de configuração padrão do Expo Metro
const { getDefaultConfig } = require("expo/metro-config");
// Importa o plugin do NativeWind para suporte ao Tailwind CSS
const { withNativeWind } = require("nativewind/metro");

// Cria a configuração base do Metro para o diretório atual
const config = getDefaultConfig(__dirname);

// Garante que extensões .mjs e .cjs (usadas por pacotes como lucide-react-native) sejam resolvidas pelo Metro
config.resolver.sourceExts = Array.from(
  new Set([...(config.resolver.sourceExts || []), "mjs", "cjs"])
);

// Exporta a configuração final integrada ao NativeWind
module.exports = withNativeWind(config, { input: "./src/global.css" });
