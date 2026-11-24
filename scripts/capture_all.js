// Importa o módulo fs para leitura e escrita de arquivos no sistema
const fs = require('fs');
// Importa o módulo path para resolução e manipulação de caminhos
const path = require('path');
// Importa a função execSync para executar comandos do sistema operacional de forma síncrona
const { execSync } = require('child_process');

// Define o diretório raiz do projeto no computador do usuário
const projectDir = path.resolve(__dirname, '..');
// Define o diretório de saída onde as capturas de tela serão salvas
const outputDir = path.join(projectDir, 'screenshots');

// Cria o diretório de screenshots caso ele ainda não exista
if (!fs.existsSync(outputDir)) {
  // Cria o diretório de forma recursiva
  fs.mkdirSync(outputDir, { recursive: true });
}

// Caminho do arquivo CSS estático gerado pelo build do Expo
const cssPath = path.join(projectDir, 'dist', '_expo', 'static', 'css', 'web-e742f75119c1422f23053d6ebe81b541.css');
// Lê todo o conteúdo textual do CSS compilado
const cssContent = fs.readFileSync(cssPath, 'utf8');

// Caminho do arquivo de fontes MaterialIcons do pacote @expo/vector-icons
const fontPath = path.join(projectDir, 'node_modules', '@expo', 'vector-icons', 'build', 'vendor', 'react-native-vector-icons', 'Fonts', 'MaterialIcons.ttf');
// Converte a fonte TTF para string base64 para inclusão direta no HTML
const fontBase64 = fs.readFileSync(fontPath).toString('base64');

// Cria o bloco de estilo CSS contendo @font-face e os estilos gerais da aplicação
const embeddedStyles = `
<style>
@font-face {
  font-family: 'material';
  src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');
  font-weight: normal;
  font-style: normal;
}
@font-face {
  font-family: 'MaterialIcons';
  src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');
  font-weight: normal;
  font-style: normal;
}
${cssContent}
</style>
`;

// Lista de páginas a serem processadas com seus caminhos de origem e nomes de arquivo de saída
const pages = [
  // 01. Tela inicial com central de atividades, métricas e lista de tarefas
  {
    name: '01_tela_inicio_prazos.png',
    htmlFile: path.join(projectDir, 'dist', 'index.html'),
    title: 'Tela Inicial (Central de Prazos)'
  },
  // 02. Tela de detalhes da tarefa com temporizador e diretrizes de entrega
  {
    name: '02_detalhes_da_tarefa.png',
    htmlFile: path.join(projectDir, 'dist', 'task', '[id].html'),
    title: 'Detalhes da Tarefa'
  },
  // 03. Tela de perfil com dados do estudante, vínculo acadêmico e configurações
  {
    name: '03_perfil_do_aluno.png',
    htmlFile: path.join(projectDir, 'dist', 'profile.html'),
    title: 'Perfil do Aluno'
  },
  // 04. Tela de configurações de alerta e notificações personalizadas
  {
    name: '04_notificacoes_e_alertas.png',
    htmlFile: path.join(projectDir, 'dist', 'notifications.html'),
    title: 'Notificações e Alertas'
  },
  // 05. Tela explorar com componentes e recursos do aplicativo
  {
    name: '05_explorar.png',
    htmlFile: path.join(projectDir, 'dist', 'explore.html'),
    title: 'Explorar'
  }
];

// Caminho do executável do Google Chrome instalado no Windows
const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Itera sobre cada página configurada para gerar o print correspondente
for (const page of pages) {
  // Exibe no terminal a tela que está sendo processada
  console.log(`Gerando print de: ${page.title}...`);

  // Lê o arquivo HTML original exportado pelo Expo
  let html = fs.readFileSync(page.htmlFile, 'utf8');

  // Insere os estilos CSS e a fonte base64 antes do fechamento da tag </head>
  html = html.replace('</head>', `${embeddedStyles}</head>`);

  // Define um caminho temporário para o HTML com estilos embutidos
  const tempHtmlPath = path.join(projectDir, `temp_${path.basename(page.name, '.png')}.html`);
  // Grava o arquivo temporário no disco
  fs.writeFileSync(tempHtmlPath, html, 'utf8');

  // Define o caminho final de destino da imagem capturada
  const destinationImage = path.join(outputDir, page.name);

  // Constrói a URL do arquivo no padrão file:///
  const fileUrl = `file:///${tempHtmlPath.replace(/\\/g, '/')}`;

  // Monta a linha de comando para execução do Chrome em modo headless com largura 500px (<640px mobile) e escala 1:1 sem cortes
  const chromeCommand = `"${chromeExe}" --headless=new --no-sandbox --disable-gpu --force-device-scale-factor=1 --allow-file-access-from-files --window-size=500,950 --screenshot="${destinationImage}" "${fileUrl}"`;

  try {
    // Executa a chamada do Chrome
    execSync(chromeCommand, { stdio: 'pipe' });
    // Remove o arquivo HTML temporário gerado para a captura
    fs.unlinkSync(tempHtmlPath);
    // Exibe mensagem de confirmação com o tamanho da imagem gerada
    const stats = fs.statSync(destinationImage);
    // Informa sucesso no console
    console.log(`  -> Salvo com sucesso: ${page.name} (${stats.size} bytes)`);
  } catch (error) {
    // Exibe erro caso ocorra falha na execução do Chrome
    console.error(`  -> Erro ao gerar print de ${page.title}:`, error.message);
  }
}

// Mensagem final de conclusão do script
console.log('Todas as capturas de tela foram processadas com sucesso!');
