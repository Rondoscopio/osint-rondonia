import type {
  CategoryFilterExpression,
  RecutAudience,
} from '$lib/shared/types';

export type RecutNature = RecutAudience;

export type RecutDefinition = {
  slug: string;
  title: string;
  description: string;
  categoryIds: readonly string[];
  natureza: RecutNature;
  categoryFilter?: CategoryFilterExpression;
};

export type RecutGroup = {
  id: string;
  title: string;
  icon: string;
  items: RecutDefinition[];
};

export const RECUT_GROUPS: RecutGroup[] = [
  {
    id: 'governo-transparencia',
    title: 'Governo e transparência',
    icon: 'categories',
    items: [
      {
        slug: 'transparencia',
        title: 'Transparência',
        description: 'Fontes classificadas com o tema Transparência.',
        categoryIds: ['cat-14623690a3bbfc', 'cat-97a85be2564673'],
        natureza: 'fonte',
      },
      {
        slug: 'dados-abertos',
        title: 'Dados abertos',
        description: 'Fontes classificadas com o tema Dados Abertos.',
        categoryIds: ['cat-e1db8490083df6', 'cat-71cca68bea3687'],
        natureza: 'fonte',
      },
      {
        slug: 'dados-legislativos',
        title: 'Dados legislativos',
        description: 'Fontes classificadas com o tema Dados Legislativos.',
        categoryIds: ['cat-051bf881bae8e2', 'cat-2d24c09bd70e9d'],
        natureza: 'fonte',
      },
      {
        slug: 'contratos',
        title: 'Contratos',
        description: 'Fontes classificadas com o tema Contratos.',
        categoryIds: ['cat-4277bec2d88789'],
        natureza: 'fonte',
      },
      {
        slug: 'licitacoes',
        title: 'Licitações',
        description: 'Fontes classificadas com o tema Licitações.',
        categoryIds: ['cat-a054fa3c0c57f1'],
        natureza: 'fonte',
      },
    ],
  },
  {
    id: 'justica-controle',
    title: 'Justiça e controle',
    icon: 'legal',
    items: [
      {
        slug: 'dados-judiciais',
        title: 'Dados judiciais',
        description: 'Fontes classificadas com o tema Dados Judiciais.',
        categoryIds: ['cat-484d9e5cf0b7c5'],
        natureza: 'fonte',
      },
      {
        slug: 'tribunais-judiciais',
        title: 'Tribunais judiciais',
        description: 'Fontes classificadas como Tribunais judiciais.',
        categoryIds: ['cat-000587dd59dfa2'],
        natureza: 'fonte',
      },
      {
        slug: 'tribunais-de-contas',
        title: 'Tribunais de contas',
        description: 'Fontes classificadas como Tribunais de contas.',
        categoryIds: ['cat-6e81a64125e8e9'],
        natureza: 'fonte',
      },
      {
        slug: 'certidoes-judiciais-estaduais',
        title: 'Certidões judiciais estaduais',
        description: 'Fontes de certidões judiciais estaduais.',
        categoryIds: ['cat-14d6a274323e8e'],
        natureza: 'fonte',
      },
      {
        slug: 'sancoes',
        title: 'Sanções',
        description: 'Fontes classificadas com o tema Sanções.',
        categoryIds: ['cat-a8e72b4735739d', 'cat-b5295138f59c8a'],
        natureza: 'fonte',
      },
    ],
  },
  {
    id: 'economia-gestao',
    title: 'Economia e gestão',
    icon: 'sources',
    items: [
      {
        slug: 'financas-publicas',
        title: 'Finanças públicas',
        description: 'Fontes classificadas com o tema Finanças Públicas.',
        categoryIds: ['cat-704e54f2ff4f33'],
        natureza: 'fonte',
      },
      {
        slug: 'orcamento',
        title: 'Orçamento',
        description: 'Fontes classificadas com o tema Orçamento.',
        categoryIds: ['cat-d29ecae554b79f'],
        natureza: 'fonte',
      },
      {
        slug: 'despesas',
        title: 'Despesas',
        description: 'Fontes classificadas com o tema Despesas.',
        categoryIds: ['cat-322c33a70781ec'],
        natureza: 'fonte',
      },
      {
        slug: 'receitas',
        title: 'Receitas',
        description: 'Fontes classificadas com o tema Receitas.',
        categoryIds: ['cat-e4c8cf4d8511bb'],
        natureza: 'fonte',
      },
      {
        slug: 'tributacao',
        title: 'Tributação',
        description: 'Fontes classificadas com o tema Tributação.',
        categoryIds: ['cat-d1cc5ff901c1d5'],
        natureza: 'fonte',
      },
    ],
  },
  {
    id: 'sociedade-ambiente',
    title: 'Sociedade e ambiente',
    icon: 'coverage',
    items: [
      {
        slug: 'saude',
        title: 'Saúde',
        description: 'Fontes classificadas com o tema Saúde.',
        categoryIds: ['cat-0e51e3f73eb881'],
        natureza: 'fonte',
      },
      {
        slug: 'educacao',
        title: 'Educação',
        description: 'Fontes classificadas com o tema Educação.',
        categoryIds: ['cat-e371563e4ffd08'],
        natureza: 'fonte',
      },
      {
        slug: 'meio-ambiente',
        title: 'Meio ambiente',
        description: 'Fontes classificadas com o tema Meio Ambiente.',
        categoryIds: ['cat-f483f287fe8bb0'],
        natureza: 'fonte',
      },
      {
        slug: 'seguranca-publica',
        title: 'Segurança pública',
        description: 'Fontes classificadas com o tema Segurança Pública.',
        categoryIds: ['cat-0717cc0d7e4ce6'],
        natureza: 'fonte',
      },
      {
        slug: 'clima',
        title: 'Clima',
        description: 'Fontes classificadas com o tema Clima.',
        categoryIds: ['cat-6dabccac9f28c9', 'cat-6b4b0c2e9f393d'],
        natureza: 'fonte',
      },
    ],
  },
  {
    id: 'geografia-territorio',
    title: 'Geografia e território',
    icon: 'coverage',
    items: [
      {
        slug: 'geografia',
        title: 'Geografia',
        description: 'Fontes classificadas no tema Geografia.',
        categoryIds: ['cat-ef89e0d6cf35d0'],
        natureza: 'fonte',
      },
      {
        slug: 'gestao-territorial',
        title: 'Gestão territorial',
        description:
          'Fontes relacionadas à gestão e organização do território.',
        categoryIds: ['cat-5f9ec40d371f50'],
        natureza: 'fonte',
      },
      {
        slug: 'cartografia',
        title: 'Cartografia',
        description: 'Fontes classificadas no tema Cartografia.',
        categoryIds: ['cat-7c1639c4e43bc6'],
        natureza: 'fonte',
      },
      {
        slug: 'geoprocessamento',
        title: 'Geoprocessamento',
        description: 'Fontes classificadas no tema Geoprocessamento.',
        categoryIds: ['cat-8217bcc6dcfa8f'],
        natureza: 'fonte',
      },
      {
        slug: 'infraestrutura-geoespacial',
        title: 'Infraestrutura geoespacial',
        description:
          'Fontes classificadas como infraestrutura geoespacial, incluindo as classificações principal e de curadoria.',
        categoryIds: ['cat-d00e5f18038ca6', 'cat-76beb159a6d23e'],
        natureza: 'fonte',
      },
    ],
  },
  {
    id: 'mapas-observacao-terra',
    title: 'Mapas e observação da Terra',
    icon: 'categories',
    items: [
      {
        slug: 'mapas-e-visualizacao-geoespacial',
        title: 'Mapas e visualização geoespacial',
        description:
          'Fontes classificadas em Mapas, Mapas geoespaciais ou Visualização geoespacial.',
        categoryIds: [
          'cat-e2408190a71dd2',
          'cat-4a8e465125945d',
          'cat-9af60b9d42c313',
        ],
        natureza: 'fonte',
      },
      {
        slug: 'sensoriamento-remoto',
        title: 'Sensoriamento remoto',
        description: 'Fontes classificadas no tema Sensoriamento remoto.',
        categoryIds: ['cat-29dd327ac5753f'],
        natureza: 'fonte',
      },
      {
        slug: 'satelites-e-imagens',
        title: 'Satélites e imagens',
        description: 'Fontes classificadas no tema Satélites.',
        categoryIds: ['cat-b10f38d35d5664'],
        natureza: 'fonte',
      },
      {
        slug: 'monitoramento-ambiental',
        title: 'Monitoramento ambiental',
        description:
          'Fontes com classificação principal ou de curadoria para monitoramento ambiental.',
        categoryIds: ['cat-3bf15e85499ad1', 'cat-f6df1fc37696c0'],
        natureza: 'fonte',
      },
      {
        slug: 'clima-e-climatologia',
        title: 'Clima e climatologia',
        description:
          'Fontes associadas às classificações Clima e Climatologia.',
        categoryIds: [
          'cat-6dabccac9f28c9',
          'cat-6b4b0c2e9f393d',
          'cat-9c5faad84841f1',
        ],
        natureza: 'fonte',
      },
      {
        slug: 'hidrografia',
        title: 'Hidrografia',
        description: 'Fontes classificadas no tema Hidrografia.',
        categoryIds: ['cat-902311708057d9'],
        natureza: 'fonte',
      },
      {
        slug: 'mapas-geologicos',
        title: 'Mapas geológicos',
        description: 'Fontes classificadas no tema Mapas geológicos.',
        categoryIds: ['cat-9bd46b23a11169'],
        natureza: 'fonte',
      },
    ],
  },
  {
    id: 'infraestrutura-resiliencia',
    title: 'Infraestrutura e resiliência',
    icon: 'coverage',
    items: [
      {
        slug: 'energia-e-setores-extrativos',
        title: 'Energia e setores extrativos',
        description:
          'Fontes sobre energia elétrica, mineração e petróleo e gás.',
        categoryIds: [
          'cat-8823b2f3bf516f',
          'cat-aec3f6a1be0594',
          'cat-544b00f7d78ece',
          'cat-a6ad688d4d5774',
        ],
        natureza: 'fonte',
      },
      {
        slug: 'mobilidade-e-transportes',
        title: 'Mobilidade e transportes',
        description:
          'Fontes sobre transporte de passageiros e cargas e mobilidade.',
        categoryIds: [
          'cat-0af59e7b12080e',
          'cat-4cc8b6a642c902',
          'cat-4bb183e09ae1ac',
          'cat-800ee914b5193a',
          'cat-96b0aeee7cd6d3',
          'cat-c9c72a94c78c33',
          'cat-cba8ed01341a79',
        ],
        natureza: 'fonte',
      },
      {
        slug: 'logistica-e-comercio-exterior',
        title: 'Logística e comércio exterior',
        description:
          'Fontes sobre comércio exterior, transporte de cargas e infraestrutura logística.',
        categoryIds: [
          'cat-54b36fbfeeb4b6',
          'cat-4bb183e09ae1ac',
          'cat-a55f53b0b87b3a',
        ],
        natureza: 'fonte',
      },
      {
        slug: 'infraestrutura-territorial-e-servicos-urbanos',
        title: 'Infraestrutura territorial e serviços urbanos',
        description:
          'Fontes sobre infraestrutura de transportes, saneamento e habitação.',
        categoryIds: [
          'cat-a55f53b0b87b3a',
          'cat-a74910a45ea236',
          'cat-7c1258c3416024',
        ],
        natureza: 'fonte',
      },
      {
        slug: 'desastres-e-monitoramento-ambiental',
        title: 'Desastres e monitoramento ambiental',
        description:
          'Fontes relacionadas a desastres e ao monitoramento ambiental.',
        categoryIds: [
          'cat-6f7d788a3edbf7',
          'cat-3bf15e85499ad1',
          'cat-f6df1fc37696c0',
        ],
        natureza: 'fonte',
      },
    ],
  },
  {
    id: 'economia-trabalho-mercados',
    title: 'Economia, trabalho e mercados',
    icon: 'sources',
    items: [
      {
        slug: 'empresas-e-cadastros',
        title: 'Empresas e cadastros empresariais',
        description:
          'Fontes sobre empresas e cadastros empresariais e de CNPJ.',
        categoryIds: [
          'cat-f83fb9778411ef',
          'cat-66468ad987db9e',
          'cat-74cc6b34e49e7f',
        ],
        natureza: 'fonte',
      },
      {
        slug: 'agricultura-e-pecuaria',
        title: 'Agricultura e pecuária',
        description:
          'Fontes sobre agricultura, agricultura familiar e pecuária.',
        categoryIds: [
          'cat-bf6e3643008677',
          'cat-7707725a56fd03',
          'cat-6880ff9859a65b',
        ],
        natureza: 'fonte',
      },
      {
        slug: 'trabalho-e-remuneracao',
        title: 'Trabalho e remuneração',
        description:
          'Fontes sobre trabalho, pessoal e informações de remuneração.',
        categoryIds: [
          'cat-016763901b3340',
          'cat-9567e853ab69c1',
          'cat-1dbc5cb4b591d6',
        ],
        natureza: 'fonte',
      },
      {
        slug: 'financas-credito-e-financiamento',
        title: 'Finanças, crédito e financiamento',
        description:
          'Fontes classificadas em temas financeiros, de crédito ou financiamento.',
        categoryIds: [
          'cat-112cc825e9dbf0',
          'cat-13d7f4fc17a6f0',
          'cat-29cf13f3f66e83',
          'cat-400a90f8bb1d6e',
          'cat-4336a003a8130d',
          'cat-9577730a56f073',
          'cat-a5d3a6b13b8df6',
          'cat-cf4524716bdfd6',
          'cat-fe18c0eaab0719',
        ],
        natureza: 'fonte',
      },
      {
        slug: 'compras-publicas-contratos-licitacoes',
        title: 'Compras públicas, contratos e licitações',
        description:
          'Fontes sobre compras públicas, contratações, contratos e licitações.',
        categoryIds: [
          'cat-7a6e0b741d14c7',
          'cat-93ccfa28926f9c',
          'cat-bbc91140a3e3a0',
          'cat-4277bec2d88789',
          'cat-a054fa3c0c57f1',
          'cat-a2c7c2ea5f3dce',
        ],
        natureza: 'fonte',
      },
    ],
  },
  {
    id: 'conhecimento-e-sociedade',
    title: 'Conhecimento e sociedade',
    icon: 'categories',
    items: [
      {
        slug: 'ciencia-e-dados-de-pesquisa',
        title: 'Ciência e dados de pesquisa',
        description:
          'Fontes sobre ciência, pesquisa, produção acadêmica e dados científicos.',
        categoryIds: [
          'cat-44decce9003890',
          'cat-45deb637f7221a',
          'cat-7f8a22c2494bd0',
          'cat-f6601f8da5c5a2',
          'cat-265c3bf98a7e1a',
          'cat-821a91b7719a75',
          'cat-864e4e654c0d73',
          'cat-34609194160ed8',
          'cat-4d34e87313d55d',
        ],
        natureza: 'fonte',
      },
      {
        slug: 'educacao-por-nivel',
        title: 'Educação por nível',
        description:
          'Fontes sobre educação básica, ensino superior e pós-graduação.',
        categoryIds: [
          'cat-2fb6c83aab225c',
          'cat-c31fab7490df9e',
          'cat-8aa3030f83a53b',
        ],
        natureza: 'fonte',
      },
      {
        slug: 'sistemas-de-saude-e-regulacao',
        title: 'Saúde suplementar e integração de informações',
        description:
          'Fontes classificadas em Saúde Suplementar ou Integração em Saúde.',
        categoryIds: ['cat-861ca8af29db5d', 'cat-bab613246bdfda'],
        natureza: 'fonte',
      },
      {
        slug: 'populacao-e-protecao-social',
        title: 'População e proteção social',
        description:
          'Fontes sobre demografia, assistência social, seguridade e previdência.',
        categoryIds: [
          'cat-cd88024c284bbc',
          'cat-2fae00ecb33967',
          'cat-9342a2277f2a0e',
          'cat-e824e5cd6ea1a9',
          'cat-f23ad75594b71c',
        ],
        natureza: 'fonte',
      },
      {
        slug: 'cultura-patrimonio-e-turismo',
        title: 'Cultura, patrimônio e turismo',
        description:
          'Fontes sobre cultura, patrimônio cultural e histórico e turismo.',
        categoryIds: [
          'cat-15fc27910adce9',
          'cat-e1d528cba67353',
          'cat-ecff3cc98ad426',
        ],
        natureza: 'fonte',
      },
    ],
  },
  {
    id: 'ferramentas-osint',
    title: 'Ferramentas OSINT',
    icon: 'tools',
    items: [
      {
        slug: 'motores-de-busca',
        title: 'Motores de busca — contexto Brasil',
        description:
          'Ferramentas de busca para investigação no contexto brasileiro.',
        categoryIds: ['cat-7061712425a1fe'],
        natureza: 'ferramenta',
      },
      {
        slug: 'ferramentas-de-redes-sociais',
        title: 'Ferramentas de redes sociais',
        description: 'Utilitários para pesquisar e analisar redes sociais.',
        categoryIds: ['cat-2cdcfc3f73d972'],
        natureza: 'ferramenta',
      },
      {
        slug: 'pesquisa-de-dominios',
        title: 'Pesquisa de domínios',
        description: 'Ferramentas para investigar domínios e sites.',
        categoryIds: ['cat-c43ec199779b2b'],
        natureza: 'ferramenta',
      },
      {
        slug: 'pesquisa-de-ips',
        title: 'Pesquisa de IPs',
        description: 'Ferramentas para consultar e investigar endereços IP.',
        categoryIds: ['cat-83e565b6349062'],
        natureza: 'ferramenta',
      },
      {
        slug: 'monitoramento-da-web',
        title: 'Monitoramento da web',
        description: 'Ferramentas para acompanhar mudanças e atividade na web.',
        categoryIds: ['cat-04fb32ed164b8d'],
        natureza: 'ferramenta',
      },
    ],
  },
  {
    id: 'colecoes-tematicas',
    title: 'Coleções temáticas',
    icon: 'categories',
    items: [
      {
        slug: 'fontes-judiciais-antecedentes-sancoes',
        title: 'Fontes judiciais, antecedentes e sanções',
        description:
          'Recorte que exige simultaneamente os três temas associados a esta coleção.',
        categoryIds: [
          'cat-39808c255ff344',
          'cat-b5295138f59c8a',
          'cat-daa6440f5d46ed',
        ],
        categoryFilter: {
          allOf: [
            'cat-39808c255ff344',
            'cat-b5295138f59c8a',
            'cat-daa6440f5d46ed',
          ],
        },
        natureza: 'todos',
      },
      {
        slug: 'certidoes-judiciais-estaduais-colecao',
        title: 'Certidões judiciais estaduais',
        description:
          'Fontes classificadas no tema Certidões judiciais estaduais.',
        categoryIds: ['cat-14d6a274323e8e'],
        categoryFilter: { allOf: ['cat-14d6a274323e8e'] },
        natureza: 'todos',
      },
      {
        slug: 'apis-e-documentacao-de-dados-publicos',
        title: 'APIs e documentação de dados públicos',
        description:
          'Registros associados aos temas APIs públicas e Documentação de dados públicos.',
        categoryIds: ['cat-a24a55d9c1f6fd', 'cat-da0b018dcb9eb4'],
        categoryFilter: { allOf: ['cat-a24a55d9c1f6fd', 'cat-da0b018dcb9eb4'] },
        natureza: 'todos',
      },
      {
        slug: 'astronomia-catalogos-celestes-dados-orbitais',
        title: 'Astronomia, catálogos celestes e dados orbitais',
        description:
          'Registros que correspondem a Astronomia, Catálogos celestes e Dados orbitais ao mesmo tempo.',
        categoryIds: [
          'cat-3f48e2a748f7b7',
          'cat-56c8f813be8c83',
          'cat-db8924b87b0d6e',
        ],
        categoryFilter: {
          allOf: [
            'cat-3f48e2a748f7b7',
            'cat-56c8f813be8c83',
            'cat-db8924b87b0d6e',
          ],
        },
        natureza: 'todos',
      },
      {
        slug: 'sensoriamento-remoto-clima-monitoramento-ambiental',
        title: 'Sensoriamento remoto, clima e monitoramento ambiental',
        description:
          'Registros que possuem simultaneamente os três temas da coleção.',
        categoryIds: [
          'cat-29dd327ac5753f',
          'cat-6b4b0c2e9f393d',
          'cat-f6df1fc37696c0',
        ],
        categoryFilter: {
          allOf: [
            'cat-29dd327ac5753f',
            'cat-6b4b0c2e9f393d',
            'cat-f6df1fc37696c0',
          ],
        },
        natureza: 'todos',
      },
      {
        slug: 'institutos-e-fontes-de-pesquisa',
        title: 'Institutos e fontes de pesquisa',
        description: 'Registros associados aos dois temas de pesquisa.',
        categoryIds: ['cat-00b91adf484632', 'cat-598e1094eb0565'],
        categoryFilter: { allOf: ['cat-00b91adf484632', 'cat-598e1094eb0565'] },
        natureza: 'todos',
      },
      {
        slug: 'certidoes-municipais-no-brasil',
        title: 'Certidões municipais no Brasil',
        description: 'Fontes classificadas no tema Certidões municipais.',
        categoryIds: ['cat-2c29739d354814'],
        categoryFilter: { allOf: ['cat-2c29739d354814'] },
        natureza: 'todos',
      },
      {
        slug: 'osint-brazuca-fontes',
        title: 'OSINT Brazuca — fontes selecionadas',
        description:
          'Recorte de registros classificados no tema Ferramentas OSINT.',
        categoryIds: ['cat-9cfd0787526986'],
        categoryFilter: { allOf: ['cat-9cfd0787526986'] },
        natureza: 'todos',
      },
      {
        slug: 'certidoes-e-registros-federais-nacionais',
        title: 'Certidões e registros federais e nacionais',
        description:
          'Registros que possuem os temas Certidões e Registros públicos.',
        categoryIds: ['cat-7083c20a9f4827', 'cat-fa16e7359da94b'],
        categoryFilter: { allOf: ['cat-7083c20a9f4827', 'cat-fa16e7359da94b'] },
        natureza: 'todos',
      },
      {
        slug: 'climatologia-anomalias-temperatura',
        title: 'Climatologia e anomalias de temperatura',
        description:
          'Registros que combinam os temas Temperatura, Climatologia e Anomalias de temperatura.',
        categoryIds: [
          'cat-7f595a1f8fb108',
          'cat-9c5faad84841f1',
          'cat-af64fac28f5e9f',
        ],
        categoryFilter: {
          allOf: [
            'cat-7f595a1f8fb108',
            'cat-9c5faad84841f1',
            'cat-af64fac28f5e9f',
          ],
        },
        natureza: 'todos',
      },
      {
        slug: 'referencias-documentais-markdown',
        title: 'Links das referências Markdown',
        description: 'Registros classificados como Referências documentais.',
        categoryIds: ['cat-caec43cc053a43'],
        categoryFilter: { allOf: ['cat-caec43cc053a43'] },
        natureza: 'todos',
      },
      {
        slug: 'awesome-osint-fontes',
        title: 'Awesome OSINT — fontes selecionadas',
        description:
          'Recorte de registros classificados no tema Ferramentas OSINT.',
        categoryIds: ['cat-9cfd0787526986'],
        categoryFilter: { allOf: ['cat-9cfd0787526986'] },
        natureza: 'todos',
      },
      {
        slug: 'fontes-legislativas-de-rondonia',
        title: 'Fontes legislativas de Rondônia',
        description: 'Registros classificados no tema Dados Legislativos.',
        categoryIds: ['cat-2d24c09bd70e9d'],
        categoryFilter: { allOf: ['cat-2d24c09bd70e9d'] },
        natureza: 'todos',
      },
      {
        slug: 'chelfo-api-apis',
        title: 'Chelfo API — APIs selecionadas',
        description: 'Registros classificados no tema APIs públicas.',
        categoryIds: ['cat-a24a55d9c1f6fd'],
        categoryFilter: { allOf: ['cat-a24a55d9c1f6fd'] },
        natureza: 'todos',
      },
      {
        slug: 'tribunais-judiciais-e-de-contas',
        title: 'Tribunais judiciais e de contas',
        description:
          'Registros que possuem as duas classificações de tribunal.',
        categoryIds: ['cat-000587dd59dfa2', 'cat-6e81a64125e8e9'],
        categoryFilter: { allOf: ['cat-000587dd59dfa2', 'cat-6e81a64125e8e9'] },
        natureza: 'todos',
      },
      {
        slug: 'sismologia-clima-espacial-indicadores-oceanicos',
        title: 'Sismologia, clima espacial e indicadores oceânico-atmosféricos',
        description: 'Registros que correspondem aos três temas da coleção.',
        categoryIds: [
          'cat-6760a061c035d2',
          'cat-6c17f22415ddc5',
          'cat-c298f645d974c6',
        ],
        categoryFilter: {
          allOf: [
            'cat-6760a061c035d2',
            'cat-6c17f22415ddc5',
            'cat-c298f645d974c6',
          ],
        },
        natureza: 'todos',
      },
      {
        slug: 'certidoes-regularidade-fiscal-estadual',
        title: 'Certidões de regularidade fiscal estadual',
        description:
          'Registros classificados no tema Certidões de regularidade fiscal estadual.',
        categoryIds: ['cat-9c80af5ed90273'],
        categoryFilter: { allOf: ['cat-9c80af5ed90273'] },
        natureza: 'todos',
      },
      {
        slug: 'certidoes-e-servicos-municipais-de-rondonia',
        title: 'Certidões e serviços municipais de Rondônia',
        description:
          'Registros que possuem os temas Certidões municipais e Serviços municipais.',
        categoryIds: ['cat-2c29739d354814', 'cat-4690cc26c7a4ff'],
        categoryFilter: { allOf: ['cat-2c29739d354814', 'cat-4690cc26c7a4ff'] },
        natureza: 'todos',
      },
      {
        slug: 'selecao-fontes-e-ferramentas',
        title: 'Seleção de fontes e ferramentas',
        description:
          'Registros que possuem as classificações Fontes de pesquisa e Ferramentas OSINT.',
        categoryIds: ['cat-598e1094eb0565', 'cat-9cfd0787526986'],
        categoryFilter: { allOf: ['cat-598e1094eb0565', 'cat-9cfd0787526986'] },
        natureza: 'todos',
      },
    ],
  },
];

export const RECUTS = RECUT_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    groupId: group.id,
    groupTitle: group.title,
  })),
);

export function getRecut(slug: string) {
  return RECUTS.find((recut) => recut.slug === slug);
}

export function getCategoryFilter(
  recut: RecutDefinition,
): CategoryFilterExpression {
  return recut.categoryFilter ?? { anyOf: recut.categoryIds };
}
