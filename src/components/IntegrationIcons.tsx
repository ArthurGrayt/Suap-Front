// Importa React para definir os componentes de ícones vetoriais das integrações
import React from 'react';
// Importa primitivas SVG do react-native-svg para renderizar logos nítidos em Web e Mobile
import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';

// Interface comum de propriedades para controlar o tamanho dos ícones de integração
interface IntegrationIconProps {
  // Tamanho em pixels da largura e altura do ícone (padrão 24)
  size?: number;
}

// Ícone oficial estilizado do Google Agenda (moldura multicolorida com dia 31)
export function GoogleCalendarIcon({ size = 24 }: IntegrationIconProps) {
  return (
    // Elemento raiz SVG com viewBox quadrado 24x24
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Fundo branco interno do calendário */}
      <Rect x="3" y="3" width="18" height="18" rx="3" fill="#FFFFFF" />
      {/* Faixa superior azul característica do Google Calendar */}
      <Path d="M6 3H18C19.6569 3 21 4.34315 21 6V8H3V6C3 4.34315 4.34315 3 6 3Z" fill="#4285F4" />
      {/* Borda lateral direita amarela */}
      <Path d="M18 8H21V16H18V8Z" fill="#FBBC04" />
      {/* Canto inferior direito vermelho */}
      <Path d="M18 16H21V18C21 19.6569 19.6569 21 18 21V16Z" fill="#EA4335" />
      {/* Faixa inferior verde */}
      <Path d="M6 18H18V21H6C4.34315 21 3 19.6569 3 18H6Z" fill="#34A853" />
      {/* Borda lateral esquerda azul mais escuro */}
      <Path d="M3 8H6V18H3V8Z" fill="#1967D2" />
      {/* Número 31 centralizado em azul Google */}
      <SvgText
        x="12"
        y="15.5"
        textAnchor="middle"
        fill="#1A73E8"
        fontSize="8.5"
        fontWeight="bold"
      >
        31
      </SvgText>
    </Svg>
  );
}

// Ícone estilizado do Trello (quadrado azul com duas colunas de cartões brancas)
export function TrelloIcon({ size = 24 }: IntegrationIconProps) {
  return (
    // Elemento raiz SVG com viewBox quadrado 24x24
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Fundo azul oficial do Trello */}
      <Rect x="2" y="2" width="20" height="20" rx="4" fill="#0079BF" />
      {/* Coluna esquerda mais longa representando lista de tarefas */}
      <Rect x="5.5" y="5.5" width="5.5" height="12" rx="1.5" fill="#FFFFFF" />
      {/* Coluna direita mais curta representando lista em andamento */}
      <Rect x="13" y="5.5" width="5.5" height="8" rx="1.5" fill="#FFFFFF" />
    </Svg>
  );
}

// Ícone estilizado do Notion (bloco branco com borda escura e letra N estilizada)
export function NotionIcon({ size = 24 }: IntegrationIconProps) {
  return (
    // Elemento raiz SVG com viewBox quadrado 24x24
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Base quadrada com borda preta característica do Notion */}
      <Rect x="2.5" y="2.5" width="19" height="19" rx="3.5" fill="#FFFFFF" stroke="#111827" strokeWidth="1.8" />
      {/* Letra N serifada estilizada no centro */}
      <Path
        d="M8 17V7.5L15.2 17H16.5V7.5H14.6V13.8L9.6 7.5H7.5V17H8Z"
        fill="#111827"
      />
    </Svg>
  );
}

// Ícone estilizado do Obsidian (cristal facetado em tons de roxo)
export function ObsidianIcon({ size = 24 }: IntegrationIconProps) {
  return (
    // Elemento raiz SVG com viewBox quadrado 24x24
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Silhueta principal do cristal roxo escuro */}
      <Path d="M12.6 2L19.5 7.2L17.8 18.6L11.2 22L5 15.8L6.8 6.5L12.6 2Z" fill="#7C3AED" />
      {/* Faceta direita iluminada em lilás */}
      <Path d="M12.6 2L19.5 7.2L14.2 12.2L12.6 2Z" fill="#A78BFA" />
      {/* Faceta inferior direita em roxo profundo */}
      <Path d="M14.2 12.2L19.5 7.2L17.8 18.6L11.2 22L14.2 12.2Z" fill="#5B21B6" />
      {/* Faceta esquerda em roxo médio */}
      <Path d="M6.8 6.5L12.6 2L14.2 12.2L5 15.8L6.8 6.5Z" fill="#8B5CF6" />
    </Svg>
  );
}
