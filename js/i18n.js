/**
 * CNC Box — Multi-Language Internationalization Engine (i18n)
 * Supported languages: en (default), pt, es, it, fr, ja, ko, zh
 * Persists selection in localStorage under key 'cncbox_lang'.
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'cncbox_lang';

  const LANGUAGES = [
    { code: 'en', short: 'EN', name: 'English', htmlLang: 'en' },
    { code: 'pt', short: 'PT', name: 'Português', htmlLang: 'pt-BR' },
    { code: 'es', short: 'ES', name: 'Español', htmlLang: 'es' },
    { code: 'it', short: 'IT', name: 'Italiano', htmlLang: 'it' },
    { code: 'fr', short: 'FR', name: 'Français', htmlLang: 'fr' },
    { code: 'ja', short: 'JA', name: '日本語', htmlLang: 'ja' },
    { code: 'ko', short: 'KO', name: '한국어', htmlLang: 'ko' },
    { code: 'zh', short: 'ZH', name: '中文', htmlLang: 'zh-CN' }
  ];

  const VALID_CODES = new Set(LANGUAGES.map(l => l.code));

  /**
   * Canonical key (exact Portuguese source string or explicit key) -> translations for all 8 languages.
   * English ('en') is the default on first visit.
   */
  const DICT = {
    // ---- Page Titles ----
    'title.home': {
      en: 'CNC Box — Laser Cut & CNC Box Generator',
      pt: 'CNC Box — Gerador de Caixas para Corte a Laser e CNC',
      es: 'CNC Box — Generador de Cajas para Corte Láser y CNC',
      it: 'CNC Box — Generatore di Scatole per Taglio Laser e CNC',
      fr: 'CNC Box — Générateur de Boîtes Découpe Laser et CNC',
      ja: 'CNC Box — レーザーカット・CNCボックスジェネレーター',
      ko: 'CNC Box — 레이저 컷 & CNC 박스 생성기',
      zh: 'CNC Box — 激光切割与CNC盒型生成器'
    },
    'title.basic': {
      en: 'CNC Box — Basic Box (Flat & Finger)',
      pt: 'CNC Box — Caixa Básica (Plano & Dedo)',
      es: 'CNC Box — Caja Básica (Plano y Dedos)',
      it: 'CNC Box — Scatola Base (Piatto e Incastri)',
      fr: 'CNC Box — Boîte Basique (Plat et Doigts)',
      ja: 'CNC Box — 基本ボックス（フラット＆フィンガー）',
      ko: 'CNC Box — 기본 박스 (플랫 & 핑거)',
      zh: 'CNC Box — 基础盒（平接与指接）'
    },
    'title.lid': {
      en: 'CNC Box — Box Lid (Flat & Finger)',
      pt: 'CNC Box — Tampa de Caixa (Plano & Dedo)',
      es: 'CNC Box — Tapa de Caja (Plano y Dedos)',
      it: 'CNC Box — Coperchio Scatola (Piatto e Incastri)',
      fr: 'CNC Box — Couvercle de Boîte (Plat et Doigts)',
      ja: 'CNC Box — ボックスのフタ（フラット＆フィンガー）',
      ko: 'CNC Box — 박스 뚜껑 (플랫 & 핑거)',
      zh: 'CNC Box — 盒盖（平接与指接）'
    },
    'title.divider': {
      en: 'CNC Box — Grid Divider Box (Flat & Finger)',
      pt: 'CNC Box — Caixa Divisória em Grade (Plano & Dedo)',
      es: 'CNC Box — Caja con Divisiones en Cuadrícula',
      it: 'CNC Box — Scatola con Divisori a Griglia',
      fr: 'CNC Box — Boîte à Compartiments en Grille',
      ja: 'CNC Box — 仕切り付きグリッドボックス',
      ko: 'CNC Box — 그리드 칸막이 박스',
      zh: 'CNC Box — 网格分隔盒'
    },
    'title.polygon': {
      en: 'CNC Box — Polygon Box (Flat & Finger)',
      pt: 'CNC Box — Caixa Poligonal (Plano & Dedo)',
      es: 'CNC Box — Caja Poligonal (Plano y Dedos)',
      it: 'CNC Box — Scatola Poligonale (Piatto e Incastri)',
      fr: 'CNC Box — Boîte Polygonale (Plat et Doigts)',
      ja: 'CNC Box — 多角形ボックス（フラット＆フィンガー）',
      ko: 'CNC Box — 다각형 박스 (플랫 & 핑거)',
      zh: 'CNC Box — 多边形盒（平接与指接）'
    },
    'title.stackable': {
      en: 'CNC Box — Stackable Parts Bin',
      pt: 'CNC Box — Caixa Empilhável para Peças',
      es: 'CNC Box — Caja Apilable para Piezas',
      it: 'CNC Box — Contenitore Impilabile per Minuteria',
      fr: 'CNC Box — Bac Empilable pour Pièces',
      ja: 'CNC Box — スタッキングパーツビン',
      ko: 'CNC Box — 적재형 부품함',
      zh: 'CNC Box — 可堆叠零件盒'
    },
    'title.kerf': {
      en: 'CNC Box — Kerf Bent Box (Living Hinge & Curved Lid)',
      pt: 'CNC Box — Caixa Curvada (Dobras Kerf & Tampa Curva)',
      es: 'CNC Box — Caja Curvada (Bisagra Viva y Tapa Curva)',
      it: 'CNC Box — Scatola Curva (Tagli Kerf e Coperchio Curvo)',
      fr: 'CNC Box — Boîte Courbée (Charnière Souple et Couvercle)',
      ja: 'CNC Box — カーフ曲げボックス（リビングヒンジ＆カーブ蓋）',
      ko: 'CNC Box — 커프 벤딩 박스 (곡면 힌지 & 곡면 뚜껑)',
      zh: 'CNC Box — 曲折盒（柔性铰链与曲面盖）'
    },

    // ---- Top Nav & Badges ----
    '← Modelos': {
      en: '← Models', pt: '← Modelos', es: '← Modelos', it: '← Modelli',
      fr: '← Modèles', ja: '← モデル一覧', ko: '← 모델 목록', zh: '← 盒型列表'
    },
    'Básica': {
      en: 'Basic', pt: 'Básica', es: 'Básica', it: 'Base',
      fr: 'Basique', ja: '基本', ko: '기본', zh: '基础盒'
    },
    'Tampa': {
      en: 'Lid', pt: 'Tampa', es: 'Tapa', it: 'Coperchio',
      fr: 'Couvercle', ja: 'フタ', ko: '뚜껑', zh: '盒盖'
    },
    'Divisória': {
      en: 'Dividers', pt: 'Divisória', es: 'Divisiones', it: 'Divisori',
      fr: 'Compartiments', ja: '仕切り', ko: '칸막이', zh: '分隔盒'
    },
    'Poligonal': {
      en: 'Polygon', pt: 'Poligonal', es: 'Poligonal', it: 'Poligonale',
      fr: 'Polygonale', ja: '多角形', ko: '다각형', zh: '多边形'
    },
    'Empilhável': {
      en: 'Stackable', pt: 'Empilhável', es: 'Apilable', it: 'Impilabile',
      fr: 'Empilable', ja: 'スタッキング', ko: '적재형', zh: '零件盒'
    },
    'Curvada': {
      en: 'Kerf Bent', pt: 'Curvada', es: 'Curvada', it: 'Curva',
      fr: 'Courbée', ja: 'カーフ曲げ', ko: '곡면', zh: '曲折盒'
    },
    'Explodir': {
      en: 'Explode', pt: 'Explodir', es: 'Explotar', it: 'Esplodi',
      fr: 'Éclater', ja: '分解表示', ko: '분해 보기', zh: '爆炸视图'
    },
    'Centralizar': {
      en: 'Center', pt: 'Centralizar', es: 'Centrar', it: 'Centra',
      fr: 'Centrer', ja: '中央表示', ko: '중앙 정렬', zh: '居中视图'
    },
    'AJUDA': {
      en: 'HELP', pt: 'AJUDA', es: 'AYUDA', it: 'AIUTO',
      fr: 'AIDE', ja: 'ヘルプ', ko: '도움말', zh: '帮助'
    },
    'Laser Cut & CNC · Plano & Dedo': {
      en: 'Laser Cut & CNC · Flat & Finger',
      pt: 'Laser Cut & CNC · Plano & Dedo',
      es: 'Corte Láser y CNC · Plano y Dedos',
      it: 'Taglio Laser e CNC · Piatto e Incastri',
      fr: 'Découpe Laser & CNC · Plat & Doigts',
      ja: 'レーザー＆CNC · フラット＆フィンガー',
      ko: '레이저 & CNC · 플랫 & 핑거',
      zh: '激光与CNC · 平接与指接'
    },
    'Caixa Básica · Plano & Dedo': {
      en: 'Basic Box · Flat & Finger', pt: 'Caixa Básica · Plano & Dedo',
      es: 'Caja Básica · Plano y Dedos', it: 'Scatola Base · Piatto e Incastri',
      fr: 'Boîte Basique · Plat & Doigts', ja: '基本ボックス · フラット＆フィンガー',
      ko: '기본 박스 · 플랫 & 핑거', zh: '基础盒 · 平接与指接'
    },
    'Tampa de Caixa · Medidas Internas': {
      en: 'Box Lid · Internal Dimensions', pt: 'Tampa de Caixa · Medidas Internas',
      es: 'Tapa de Caja · Medidas Internas', it: 'Coperchio · Misure Interne',
      fr: 'Couvercle · Dimensions Internes', ja: 'ボックスのフタ · 内寸基準',
      ko: '박스 뚜껑 · 내부 치수', zh: '盒盖 · 内部尺寸'
    },
    'Caixa Divisória · Plano & Dedo': {
      en: 'Divider Box · Flat & Finger', pt: 'Caixa Divisória · Plano & Dedo',
      es: 'Caja Divisoria · Plano y Dedos', it: 'Scatola Divisori · Piatto e Incastri',
      fr: 'Boîte à Compartiments · Plat & Doigts', ja: '仕切りボックス · フラット＆フィンガー',
      ko: '칸막이 박스 · 플랫 & 핑거', zh: '分隔盒 · 平接与指接'
    },
    'Caixa Poligonal · Plano & Dedo': {
      en: 'Polygon Box · Flat & Finger', pt: 'Caixa Poligonal · Plano & Dedo',
      es: 'Caja Poligonal · Plano y Dedos', it: 'Scatola Poligonale · Piatto e Incastri',
      fr: 'Boîte Polygonale · Plat & Doigts', ja: '多角形ボックス · フラット＆フィンガー',
      ko: '다각형 박스 · 플랫 & 핑거', zh: '多边形盒 · 平接与指接'
    },
    'Caixa Empilhável · Componentes': {
      en: 'Stackable Bin · Parts Organizer', pt: 'Caixa Empilhável · Componentes',
      es: 'Caja Apilable · Componentes', it: 'Contenitore Impilabile · Minuteria',
      fr: 'Bac Empilable · Composants', ja: 'スタッキングビン · 部品整理',
      ko: '적재형 부품함 · 부품 정리', zh: '可堆叠零件盒 · 元件收纳'
    },
    'Caixa Curvada · Living Hinge': {
      en: 'Kerf Bent Box · Living Hinge', pt: 'Caixa Curvada · Living Hinge',
      es: 'Caja Curvada · Bisagra Viva', it: 'Scatola Curva · Tagli Kerf',
      fr: 'Boîte Courbée · Charnière Souple', ja: 'カーフ曲げボックス · リビングヒンジ',
      ko: '커프 벤딩 박스 · 리빙 힌지', zh: '曲折盒 · 柔性铰链'
    },

    // ---- Home Page Hero, Cards & Highlights ----
    'Escolha o tipo de caixa para projetar': {
      en: 'Choose the box type to design',
      pt: 'Escolha o tipo de caixa para projetar',
      es: 'Elige el tipo de caja que deseas diseñar',
      it: 'Scegli il tipo di scatola da progettare',
      fr: 'Choisissez le type de boîte à concevoir',
      ja: '設計するボックスの種類を選択',
      ko: '설계할 박스 유형을 선택하세요',
      zh: '选择要设计的盒型'
    },
    'home.heroDesc': {
      en: 'Create true 1:1 scale 2D cut plans (<strong>SVG</strong> &amp; <strong>DXF</strong>) with interactive 3D preview, <strong>Flat</strong> and <strong>Finger</strong> joints, <em>Kerf</em> compensation, and CNC corner relief.',
      pt: 'Crie planos de corte 2D em escala real 1:1 (<strong>SVG</strong> e <strong>DXF</strong>) com visualização 3D interativa, juntas <strong>Plano (FLAT)</strong> e <strong>Dedo (FINGER)</strong>, compensação de <em>Kerf</em> e alívio de canto CNC.',
      es: 'Crea planos de corte 2D a escala real 1:1 (<strong>SVG</strong> y <strong>DXF</strong>) con vista previa 3D interactiva, uniones <strong>Planas</strong> y de <strong>Dedos</strong>, compensación de <em>Kerf</em> y alivio de esquinas CNC.',
      it: 'Crea piani di taglio 2D in scala reale 1:1 (<strong>SVG</strong> e <strong>DXF</strong>) con anteprima 3D interattiva, giunti <strong>Piatti</strong> e ad <strong>Incastro</strong>, compensazione <em>Kerf</em> e scarico angoli CNC.',
      fr: 'Créez des plans de découpe 2D à l’échelle 1:1 (<strong>SVG</strong> et <strong>DXF</strong>) avec aperçu 3D interactif, assemblages <strong>Plats</strong> et à <strong>Doigts</strong>, compensation <em>Kerf</em> et dégagement d’angles CNC.',
      ja: '実寸1:1の2Dカットデータ（<strong>SVG</strong>・<strong>DXF</strong>）を作成。インタラクティブな3Dプレビュー、<strong>フラット／フィンガー</strong>接合、<em>カーフ</em>補正、CNCコーナー逃がしに対応。',
      ko: '실제 1:1 축척의 2D 커팅 도면(<strong>SVG</strong> 및 <strong>DXF</strong>)을 생성하세요. 인터랙티브 3D 미리보기, <strong>플랫/핑거</strong> 조인트, <em>커프(Kerf)</em> 보정 및 CNC 코너 릴리프를 지원합니다.',
      zh: '生成真实1:1比例的2D切割图纸（<strong>SVG</strong> 与 <strong>DXF</strong>），支持交互式3D预览、<strong>平接</strong>与<strong>指接</strong>、<em>切缝(Kerf)</em>补偿及CNC内角避让。'
    },
    'Básico': {
      en: 'Basic', pt: 'Básico', es: 'Básico', it: 'Base', fr: 'Basique', ja: '基本', ko: '기본', zh: '基础'
    },
    'Interno': {
      en: 'Internal', pt: 'Interno', es: 'Interno', it: 'Interno', fr: 'Interne', ja: '内寸', ko: '내부 치수', zh: '内尺寸'
    },
    'Divisórias': {
      en: 'Dividers', pt: 'Divisórias', es: 'Divisiones', it: 'Divisori', fr: 'Cloisons', ja: '仕切り', ko: '칸막이', zh: '分隔'
    },
    '3–18 Lados': {
      en: '3–18 Sides', pt: '3–18 Lados', es: '3–18 Lados', it: '3–18 Lati', fr: '3–18 Côtés', ja: '3〜18角形', ko: '3–18면', zh: '3–18边'
    },
    'Componentes': {
      en: 'Parts Bin', pt: 'Componentes', es: 'Componentes', it: 'Minuteria', fr: 'Composants', ja: '部品用', ko: '부품함', zh: '零件盒'
    },
    'Living Hinge': {
      en: 'Living Hinge', pt: 'Living Hinge', es: 'Bisagra Viva', it: 'Tagli Kerf', fr: 'Charnière', ja: 'リビングヒンジ', ko: '리빙 힌지', zh: '柔性铰链'
    },
    'Caixa Básica': {
      en: 'Basic Box', pt: 'Caixa Básica', es: 'Caja Básica', it: 'Scatola Base',
      fr: 'Boîte Basique', ja: '基本ボックス', ko: '기본 박스', zh: '基础盒'
    },
    'Tampa de Caixa': {
      en: 'Box Lid', pt: 'Tampa de Caixa', es: 'Tapa de Caja', it: 'Coperchio Scatola',
      fr: 'Couvercle de Boîte', ja: 'ボックスのフタ', ko: '박스 뚜껑', zh: '盒盖'
    },
    'Caixa Divisória em Grade': {
      en: 'Grid Divider Box', pt: 'Caixa Divisória em Grade', es: 'Caja Divisoria en Cuadrícula', it: 'Scatola con Divisori',
      fr: 'Boîte à Compartiments', ja: '仕切り付きグリッドボックス', ko: '그리드 칸막이 박스', zh: '网格分隔盒'
    },
    'Caixa Poligonal': {
      en: 'Polygon Box', pt: 'Caixa Poligonal', es: 'Caja Poligonal', it: 'Scatola Poligonale',
      fr: 'Boîte Polygonale', ja: '多角形ボックス', ko: '다각형 박스', zh: '多边形盒'
    },
    'Caixa Empilhável': {
      en: 'Stackable Bin', pt: 'Caixa Empilhável', es: 'Caja Apilable', it: 'Contenitore Impilabile',
      fr: 'Bac Empilable', ja: 'スタッキングビン', ko: '적재형 부품함', zh: '可堆叠零件盒'
    },
    'Caixa Empilhável para Peças': {
      en: 'Stackable Parts Bin', pt: 'Caixa Empilhável para Peças', es: 'Caja Apilable para Piezas', it: 'Contenitore Impilabile per Pezzi',
      fr: 'Bac Empilable pour Pièces', ja: 'スタッキングパーツビン', ko: '적재형 부품함', zh: '可堆叠零件盒'
    },
    'Caixa Curvada': {
      en: 'Kerf Bent Box', pt: 'Caixa Curvada', es: 'Caja Curvada', it: 'Scatola Curva',
      fr: 'Boîte Courbée', ja: 'カーフ曲げボックス', ko: '커프 벤딩 박스', zh: '曲折盒'
    },
    'Caixa retangular aberta ou fechada com encaixes retos (Plano) ou dedo (Dedo) totalmente personalizáveis.': {
      en: 'Open or closed rectangular box with fully customizable Flat or Finger edge joints.',
      pt: 'Caixa retangular aberta ou fechada com encaixes retos (Plano) ou dedo (Dedo) totalmente personalizáveis.',
      es: 'Caja rectangular abierta o cerrada con uniones rectas (Plano) o de dedos (Dedo) personalizables.',
      it: 'Scatola rettangolare aperta o chiusa con giunti piatti o ad incastro completamente personalizzabili.',
      fr: 'Boîte rectangulaire ouverte ou fermée avec assemblages plats ou à doigts entièrement personnalisables.',
      ja: 'フラット接合・フィンガー接合を自由に設定できるオープン／クローズ型長方形ボックス。',
      ko: '플랫 또는 핑거 조인트를 자유롭게 설정할 수 있는 오픈/클로즈 직사각형 박스입니다.',
      zh: '可自由定制开口或封闭式的矩形盒，支持平接与指接。'
    },
    'Tampa de encaixe com medidas sempre pelo lado interno (largura, comprimento, altura e espessura).': {
      en: 'Slip-over lid always dimensioned from the inside (width, length, height, and thickness).',
      pt: 'Tampa de encaixe com medidas sempre pelo lado interno (largura, comprimento, altura e espessura).',
      es: 'Tapa encajable medida siempre por el interior (ancho, largo, altura y espesor).',
      it: 'Coperchio ad incastro dimensionato sempre dall’interno (larghezza, lunghezza, altezza e spessore).',
      fr: 'Couvercle emboîtable toujours mesuré par l’intérieur (largeur, longueur, hauteur et épaisseur).',
      ja: '箱にぴったり被せられる内寸基準のフタ（内幅・内長・高さ・板厚のみ設定）。',
      ko: '박스에 맞게 씌울 수 있도록 항상 내부 치수 기준으로 설계하는 뚜껑입니다.',
      zh: '始终按内部尺寸设计的扣合式盒盖（内宽、内长、盖高与板厚）。'
    },
    'Organizador com linhas e colunas configuráveis, compartimentos redimensionáveis, opção de tampa e encaixes cruzados.': {
      en: 'Organizer with configurable rows and columns, resizable compartments, lid option, and cross-lap joints.',
      pt: 'Organizador com linhas e colunas configuráveis, compartimentos redimensionáveis, opção de tampa e encaixes cruzados.',
      es: 'Organizador con filas y columnas configurables, compartimentos redimensionables, tapa opcional y encastres cruzados.',
      it: 'Organizer con righe e colonne configurabili, scomparti ridimensionabili, coperchio opzionale e incastri a croce.',
      fr: 'Organiseur avec rangées et colonnes réglables, compartiments redimensionnables, couvercle et encoches croisées.',
      ja: '行・列数を設定でき、区画サイズ変更・フタ・相欠き仕切りに対応した整理ボックス。',
      ko: '행/열 수 설정, 개별 칸 크기 조절, 뚜껑 옵션 및 교차 끼움 칸막이를 지원하는 정리함입니다.',
      zh: '可配置行列数、支持自定义格尺寸、可选盖板及十字插接隔板的收纳盒。'
    },
    'Caixa regular de 3 a 18 lados (triângulo, pentágono, hexágono, octógono) com encaixes angulares precisos.': {
      en: 'Regular 3 to 18-sided box (triangle, pentagon, hexagon, octagon) with exact angular finger joints.',
      pt: 'Caixa regular de 3 a 18 lados (triângulo, pentágono, hexágono, octógono) com encaixes angulares precisos.',
      es: 'Caja regular de 3 a 18 lados (triángulo, pentágono, hexágono, octógono) con uniones angulares precisas.',
      it: 'Scatola regolare da 3 a 18 lati (triangolo, pentagono, esagono, ottagono) con incastri angolari precisi.',
      fr: 'Boîte régulière de 3 à 18 côtés (triangle, pentagone, hexagone, octogone) à assemblages angulaires précis.',
      ja: '3〜18角形（三角・五角・六角・八角など）に対応し、角度補正された精密な接合を実現。',
      ko: '삼각형부터 18각형까지 정밀한 각도 보정 조인트를 지원하는 정다각형 박스입니다.',
      zh: '支持3至18边形（三角、五边、六边、八边形等）的精密角度指接盒。'
    },
    'Organizador empilhável para peças e componentes com boca frontal inclinada, divisórias e lote em pilha 3D.': {
      en: 'Stackable parts & components bin with angled front scoop lip, dividers, and 3D stacked batch preview.',
      pt: 'Organizador empilhável para peças e componentes com boca frontal inclinada, divisórias e lote em pilha 3D.',
      es: 'Organizador apilable para piezas y componentes con boca frontal inclinada, divisiones y vista apilada 3D.',
      it: 'Contenitore impilabile per minuteria con fronte inclinato, divisori e anteprima 3D impilata.',
      fr: 'Bac empilable pour pièces et composants avec ouverture frontale inclinée, cloisons et aperçu empilé 3D.',
      ja: '取り出しやすい傾斜フロント・スタッキング突起・仕切り・複数段3D表示を備えた部品ビン。',
      ko: '기울어진 전면 입구, 적재 잠금 홈, 칸막이 및 3D 적재 미리보기를 갖춘 부품함입니다.',
      zh: '带倾斜前口、梯形堆叠卡扣、可选隔板及3D堆叠预览的零件收纳盒。'
    },
    'Cantos arredondados dobráveis a laser (1, 2 ou 4 dobras), modo aberta, fechada ou com tampa curva sob medida.': {
      en: 'Laser-cut living-hinge rounded corners (1, 2, or 4 bends) with Open, Closed, or custom Curved Lid modes.',
      pt: 'Cantos arredondados dobráveis a laser (1, 2 ou 4 dobras), modo aberta, fechada ou com tampa curva sob medida.',
      es: 'Esquinas redondeadas plegables por láser (1, 2 o 4 curvas), modo abierta, cerrada o con tapa curva a medida.',
      it: 'Angoli arrotondati pieghevoli al laser (1, 2 o 4 curve), modalità aperta, chiusa o con coperchio curvo.',
      fr: 'Coins arrondis pliables au laser (1, 2 ou 4 courbes), en version ouverte, fermée ou avec couvercle courbé.',
      ja: 'レーザー用リビングヒンジの曲面コーナー（1/2/4箇所）。オープン・クローズ・専用カーブ蓋に対応。',
      ko: '레이저 커프 벤딩 곡면 모서리(1/2/4면)와 오픈, 클로즈, 맞춤형 곡면 뚜껑 모드를 지원합니다.',
      zh: '激光柔性铰链圆角折弯盒（1/2/4处圆角），支持开口、封闭及定制配套曲面盒盖。'
    },
    'Plano & Dedo': {
      en: 'Flat & Finger', pt: 'Plano & Dedo', es: 'Plano y Dedos', it: 'Piatto e Incastri',
      fr: 'Plat & Doigts', ja: 'フラット＆フィンガー', ko: '플랫 & 핑거', zh: '平接与指接'
    },
    'Medidas Internas': {
      en: 'Internal Size', pt: 'Medidas Internas', es: 'Medidas Internas', it: 'Misure Interne',
      fr: 'Dimensions Internes', ja: '内寸基準', ko: '내부 치수', zh: '内尺寸'
    },
    'Dobras Kerf': {
      en: 'Kerf Bends', pt: 'Dobras Kerf', es: 'Curvas Kerf', it: 'Tagli Kerf',
      fr: 'Plis Kerf', ja: 'カーフ曲げ', ko: '커프 벤딩', zh: '柔性折弯'
    },
    'Com Tampa': {
      en: 'With Lid', pt: 'Com Tampa', es: 'Con Tapa', it: 'Con Coperchio',
      fr: 'Avec Couvercle', ja: 'フタ付き', ko: '뚜껑 포함', zh: '配盒盖'
    },
    'Pré-visualização 3D WebGL': {
      en: 'Interactive WebGL 3D Preview', pt: 'Pré-visualização 3D WebGL', es: 'Vista Previa 3D WebGL', it: 'Anteprima 3D WebGL',
      fr: 'Aperçu 3D WebGL', ja: 'WebGL 3Dプレビュー', ko: 'WebGL 3D 미리보기', zh: 'WebGL 3D 实时预览'
    },
    'Gire em 360°, dê zoom e use a vista explodida para conferir cada encaixe antes de cortar.': {
      en: 'Orbit 360°, zoom, and toggle exploded view to inspect every joint before cutting.',
      pt: 'Gire em 360°, dê zoom e use a vista explodida para conferir cada encaixe antes de cortar.',
      es: 'Gira 360°, haz zoom y usa la vista explotada para verificar cada encastre antes de cortar.',
      it: 'Ruota a 360°, esegui lo zoom e usa la vista esplosa per verificare ogni incastro prima del taglio.',
      fr: 'Pivotez à 360°, zoomez et utilisez la vue éclatée pour vérifier chaque assemblage avant la découpe.',
      ja: '360°回転・ズーム・分解表示で、カット前にすべての接合部を確認できます。',
      ko: '360° 회전, 줌 및 분해 보기로 가공 전에 모든 결합 부위를 확인할 수 있습니다.',
      zh: '支持360°旋转、缩放与爆炸视图，切割前清晰检查每一处卡扣。'
    },
    'Exportação SVG & DXF 1:1': {
      en: 'True 1:1 SVG & DXF Export', pt: 'Exportação SVG & DXF 1:1', es: 'Exportación SVG y DXF 1:1', it: 'Esportazione SVG e DXF 1:1',
      fr: 'Export SVG & DXF 1:1', ja: '実寸1:1 SVG・DXF出力', ko: '1:1 SVG & DXF 내보내기', zh: '1:1 SVG 与 DXF 导出'
    },
    'Arquivos prontos para LightBurn, RDWorks, Inkscape, AutoCAD, Fusion 360 e VCarve.': {
      en: 'Ready for LightBurn, RDWorks, Inkscape, AutoCAD, Fusion 360, and VCarve.',
      pt: 'Arquivos prontos para LightBurn, RDWorks, Inkscape, AutoCAD, Fusion 360 e VCarve.',
      es: 'Archivos listos para LightBurn, RDWorks, Inkscape, AutoCAD, Fusion 360 y VCarve.',
      it: 'File pronti per LightBurn, RDWorks, Inkscape, AutoCAD, Fusion 360 e VCarve.',
      fr: 'Fichiers prêts pour LightBurn, RDWorks, Inkscape, AutoCAD, Fusion 360 et VCarve.',
      ja: 'LightBurn・RDWorks・Inkscape・AutoCAD・Fusion 360・VCarveですぐに利用可能。',
      ko: 'LightBurn, RDWorks, Inkscape, AutoCAD, Fusion 360 및 VCarve에서 바로 사용할 수 있습니다.',
      zh: '直接兼容 LightBurn、RDWorks、Inkscape、AutoCAD、Fusion 360 与 VCarve。'
    },
    'Kerf & Dogbone CNC': {
      en: 'Kerf & CNC Dogbones', pt: 'Kerf & Dogbone CNC', es: 'Kerf y Dogbone CNC', it: 'Kerf e Dogbone CNC',
      fr: 'Kerf & Dogbone CNC', ja: 'カーフ補正＆CNCドッグボーン', ko: '커프 & CNC 도그본', zh: '切缝补偿与CNC清角'
    },
    'Compensação de feixe laser e alívio automático de cantos internos para fresas cilíndricas.': {
      en: 'Laser beam kerf compensation and automatic dogbone corner relief for round router bits.',
      pt: 'Compensação de feixe laser e alívio automático de cantos internos para fresas cilíndricas.',
      es: 'Compensación del haz láser y alivio automático de esquinas internas para fresas cilíndricas.',
      it: 'Compensazione del raggio laser e scarico automatico degli angoli interni per frese cilindriche.',
      fr: 'Compensation du faisceau laser et dégagement automatique des angles internes pour fraises CNC.',
      ja: 'レーザーのカーフ補正と、エンドミル用の自動ドッグボーン内角逃がしに対応。',
      ko: '레이저 빔 커프 보정과 원형 라우터 비트용 자동 도그본 내각 처리를 지원합니다.',
      zh: '支持激光光束切缝补偿，以及圆柱铣刀专用的内角自动圆弧清角(Dogbone)。'
    },

    // ---- Shared Sidebar Controls ----
    'Dimensões': {
      en: 'Dimensions', pt: 'Dimensões', es: 'Dimensiones', it: 'Dimensioni',
      fr: 'Dimensions', ja: '寸法', ko: '치수', zh: '尺寸'
    },
    'Largura': {
      en: 'Width', pt: 'Largura', es: 'Ancho', it: 'Larghezza',
      fr: 'Largeur', ja: '幅', ko: '너비', zh: '宽度'
    },
    'Altura': {
      en: 'Height', pt: 'Altura', es: 'Altura', it: 'Altezza',
      fr: 'Hauteur', ja: '高さ', ko: '높이', zh: '高度'
    },
    'Profundidade': {
      en: 'Depth', pt: 'Profundidade', es: 'Profundidad', it: 'Profondità',
      fr: 'Profondeur', ja: '奥行き', ko: '깊이', zh: '深度'
    },
    'Espessura': {
      en: 'Thickness', pt: 'Espessura', es: 'Espesor', it: 'Spessore',
      fr: 'Épaisseur', ja: '板厚', ko: '두께', zh: '板厚'
    },
    'Personalizado': {
      en: 'Custom', pt: 'Personalizado', es: 'Personalizado', it: 'Personalizzato',
      fr: 'Personnalisé', ja: 'カスタム', ko: '사용자 지정', zh: '自定义'
    },
    'Dimensões internas ou externas?': {
      en: 'Inside or outside dimensions?', pt: 'Dimensões internas ou externas?',
      es: '¿Dimensiones internas o externas?', it: 'Dimensioni interne o esterne?',
      fr: 'Dimensions internes ou externes ?', ja: '内寸または外寸',
      ko: '내부 또는 외부 치수?', zh: '内部还是外部尺寸？'
    },
    'EXTERNO': {
      en: 'OUTSIDE', pt: 'EXTERNO', es: 'EXTERNO', it: 'ESTERNO',
      fr: 'EXTERNE', ja: '外寸', ko: '외부', zh: '外部'
    },
    'INTERNO': {
      en: 'INSIDE', pt: 'INTERNO', es: 'INTERNO', it: 'INTERNO',
      fr: 'INTERNE', ja: '内寸', ko: '내부', zh: '内部'
    },
    'Caixa aberta ou fechada': {
      en: 'Open or closed box', pt: 'Caixa aberta ou fechada', es: 'Caja abierta o cerrada', it: 'Scatola aperta o chiusa',
      fr: 'Boîte ouverte ou fermée', ja: 'オープン／クローズ', ko: '오픈 또는 클로즈 박스', zh: '开口或封闭'
    },
    'ABERTO': {
      en: 'OPEN', pt: 'ABERTO', es: 'ABIERTO', it: 'APERTO',
      fr: 'OUVERT', ja: 'オープン', ko: '오픈', zh: '开口'
    },
    'FECHADO': {
      en: 'CLOSED', pt: 'FECHADO', es: 'CERRADO', it: 'CHIUSO',
      fr: 'FERMÉ', ja: 'クローズ', ko: '클로즈', zh: '封闭'
    },
    'Juntas de borda': {
      en: 'Edge Joints', pt: 'Juntas de borda', es: 'Uniones de borde', it: 'Giunti dei bordi',
      fr: 'Assemblages', ja: '接合タイプ', ko: '모서리 조인트', zh: '边缘拼接'
    },
    'PLANO': {
      en: 'FLAT', pt: 'PLANO', es: 'PLANO', it: 'PIATTO',
      fr: 'PLAT', ja: 'フラット', ko: '플랫', zh: '平接'
    },
    'DEDO': {
      en: 'FINGER', pt: 'DEDO', es: 'DEDOS', it: 'INCASTRO',
      fr: 'DOIGTS', ja: 'フィンガー', ko: '핑거', zh: '指接'
    },
    'Tamanho do Dedo': {
      en: 'Finger Size', pt: 'Tamanho do Dedo', es: 'Tamaño de Dedo', it: 'Dim. Incastro',
      fr: 'Taille des Doigts', ja: 'フィンガー幅', ko: '핑거 크기', zh: '指接宽度'
    },
    'BAIXAR': {
      en: 'DOWNLOAD', pt: 'BAIXAR', es: 'DESCARGAR', it: 'SCARICA',
      fr: 'TÉLÉCHARGER', ja: 'ダウンロード', ko: '다운로드', zh: '下载图纸'
    },
    'Arraste para girar · Scroll para zoom': {
      en: 'Drag to orbit · Scroll to zoom', pt: 'Arraste para girar · Scroll para zoom',
      es: 'Arrastra para girar · Rueda para zoom', it: 'Trascina per ruotare · Scorri per zoom',
      fr: 'Glisser pour pivoter · Molette pour zoomer', ja: 'ドラッグで回転 · スクロールで拡大縮小',
      ko: '드래그하여 회전 · 스크롤하여 확대/축소', zh: '拖动旋转 · 滚轮缩放'
    },

    // ---- Lid Page ----
    'Dimensões Internas da Tampa': {
      en: 'Internal Lid Dimensions', pt: 'Dimensões Internas da Tampa', es: 'Dimensiones Internas de la Tapa', it: 'Dimensioni Interne Coperchio',
      fr: 'Dimensions Internes du Couvercle', ja: 'フタの内寸', ko: '뚜껑 내부 치수', zh: '盒盖内部尺寸'
    },
    'Todas as medidas são internas para encaixe perfeito sobre a caixa.': {
      en: 'All measurements are internal so the lid slips cleanly over your box.',
      pt: 'Todas as medidas são internas para encaixe perfeito sobre a caixa.',
      es: 'Todas las medidas son internas para encajar perfectamente sobre la caja.',
      it: 'Tutte le misure sono interne per un incastro perfetto sulla scatola.',
      fr: 'Toutes les mesures sont internes pour un ajustement parfait sur la boîte.',
      ja: 'すべての寸法は箱に被せるための内寸です。',
      ko: '모든 치수는 박스에 꼭 맞게 끼워지도록 내부 기준입니다.',
      zh: '所有尺寸均为内尺寸，可直接套合在盒体外部。'
    },
    'Largura Interna': {
      en: 'Inside Width', pt: 'Largura Interna', es: 'Ancho Interno', it: 'Larghezza Interna',
      fr: 'Largeur Interne', ja: '内幅', ko: '내부 너비', zh: '内宽度'
    },
    'Comprimento Interno': {
      en: 'Inside Length', pt: 'Comprimento Interno', es: 'Largo Interno', it: 'Lunghezza Interna',
      fr: 'Longueur Interne', ja: '内長さ', ko: '내부 길이', zh: '内长度'
    },
    'Altura da Tampa': {
      en: 'Lid Height', pt: 'Altura da Tampa', es: 'Altura de la Tapa', it: 'Altezza Coperchio',
      fr: 'Hauteur Couvercle', ja: 'フタの高さ', ko: '뚜껑 높이', zh: '盒盖高度'
    },

    // ---- Divider Page ----
    'Linhas': {
      en: 'Rows', pt: 'Linhas', es: 'Filas', it: 'Righe', fr: 'Rangées', ja: '行数', ko: '행', zh: '行数'
    },
    'Colunas': {
      en: 'Columns', pt: 'Colunas', es: 'Columnas', it: 'Colonne', fr: 'Colonnes', ja: '列数', ko: '열', zh: '列数'
    },
    'REDIMENSIONAR DIVISÓRIAS': {
      en: 'RESIZE DIVIDERS', pt: 'REDIMENSIONAR DIVISÓRIAS', es: 'REDIMENSIONAR DIVISIONES', it: 'RIDIMENSIONA DIVISORI',
      fr: 'REDIMENSIONNER CLOISONS', ja: '仕切りサイズ変更', ko: '칸막이 크기 조절', zh: '调整分隔尺寸'
    },
    'Redimensionar divisórias': {
      en: 'Resize Dividers', pt: 'Redimensionar divisórias', es: 'Redimensionar divisiones', it: 'Ridimensiona divisori',
      fr: 'Redimensionner les cloisons', ja: '仕切りサイズの変更', ko: '칸막이 크기 조절', zh: '调整分隔尺寸'
    },
    'Defina o tamanho interno de cada coluna e linha. A caixa aumenta ou diminui automaticamente para caber, mantendo o tamanho dos compartimentos que você não alterar.': {
      en: 'Set the inner size of each column and row. The box automatically expands or shrinks to fit while keeping untouched compartments unchanged.',
      pt: 'Defina o tamanho interno de cada coluna e linha. A caixa aumenta ou diminui automaticamente para caber, mantendo o tamanho dos compartimentos que você não alterar.',
      es: 'Define el tamaño interno de cada columna y fila. La caja se ajusta automáticamente manteniendo sin cambios los compartimentos que no modifiques.',
      it: 'Imposta la dimensione interna di ogni colonna e riga. La scatola si adatta automaticamente mantenendo invariati gli altri scomparti.',
      fr: 'Définissez la taille interne de chaque colonne et rangée. La boîte s’adapte automatiquement tout en conservant les autres compartiments.',
      ja: '各列・各行の内寸を設定します。変更しない区画のサイズを保ったまま、ボックス全体が自動調整されます。',
      ko: '각 열과 행의 내부 크기를 설정하세요. 변경하지 않은 칸의 크기를 유지하면서 전체 박스가 자동 조정됩니다.',
      zh: '设置每列和每行的内部尺寸。盒体将自动缩放，未修改的隔格尺寸保持不变。'
    },
    'Igualar todas': {
      en: 'Equalize All', pt: 'Igualar todas', es: 'Igualar todas', it: 'Uniforma tutto',
      fr: 'Tout égaliser', ja: 'すべて均等化', ko: '모두 균등하게', zh: '全部均分'
    },
    'Cancelar': {
      en: 'Cancel', pt: 'Cancelar', es: 'Cancelar', it: 'Annulla', fr: 'Annuler', ja: 'キャンセル', ko: '취소', zh: '取消'
    },
    'Aplicar': {
      en: 'Apply', pt: 'Aplicar', es: 'Aplicar', it: 'Applica', fr: 'Appliquer', ja: '適用', ko: '적용', zh: '应用'
    },
    'Dimensões internas, externas ou da célula?': {
      en: 'Inside, outside, or cell dimensions?', pt: 'Dimensões internas, externas ou da célula?',
      es: '¿Dimensiones internas, externas o de celda?', it: 'Dimensioni interne, esterne o cella?',
      fr: 'Dimensions internes, externes ou cellule ?', ja: '内寸・外寸・セル寸法',
      ko: '내부, 외부 또는 셀 치수?', zh: '内尺寸、外尺寸或单格尺寸？'
    },
    'INTERNA': {
      en: 'INSIDE', pt: 'INTERNA', es: 'INTERNA', it: 'INTERNA', fr: 'INTERNE', ja: '内寸', ko: '내부', zh: '内部'
    },
    'EXTERNA': {
      en: 'OUTSIDE', pt: 'EXTERNA', es: 'EXTERNA', it: 'ESTERNA', fr: 'EXTERNE', ja: '外寸', ko: '외부', zh: '外部'
    },
    'CÉLULA': {
      en: 'CELL', pt: 'CÉLULA', es: 'CELDA', it: 'CELLA', fr: 'CELLULE', ja: 'セル', ko: '셀', zh: '单格'
    },
    'Tipo de Tampa': {
      en: 'Lid Type', pt: 'Tipo de Tampa', es: 'Tipo de Tapa', it: 'Tipo di Coperchio',
      fr: 'Type de Couvercle', ja: 'フタの種類', ko: '뚜껑 유형', zh: '盒盖类型'
    },
    'Nenhuma': {
      en: 'None', pt: 'Nenhuma', es: 'Ninguna', it: 'Nessuno', fr: 'Aucun', ja: 'なし', ko: '없음', zh: '无'
    },
    'Plana': {
      en: 'Flat', pt: 'Plana', es: 'Plana', it: 'Piatto', fr: 'Plat', ja: 'フラット', ko: '평면', zh: '平盖'
    },
    'Nenhuma (Aberta)': {
      en: 'None (Open)', pt: 'Nenhuma (Aberta)', es: 'Ninguna (Abierta)', it: 'Nessuno (Aperta)',
      fr: 'Aucun (Ouverte)', ja: 'なし（オープン）', ko: '없음 (오픈)', zh: '无（开口）'
    },
    'Plana (Fechada)': {
      en: 'Flat (Closed)', pt: 'Plana (Fechada)', es: 'Plana (Cerrada)', it: 'Piatto (Chiusa)',
      fr: 'Plat (Fermée)', ja: 'フラット（クローズ）', ko: '평면 (클로즈)', zh: '平盖（封闭）'
    },

    // ---- Polygon Page ----
    'Lados': {
      en: 'Sides', pt: 'Lados', es: 'Lados', it: 'Lati', fr: 'Côtés', ja: '辺の数', ko: '면 수', zh: '边数'
    },
    'Tamanho': {
      en: 'Size', pt: 'Tamanho', es: 'Tamaño', it: 'Dimensione', fr: 'Taille', ja: 'サイズ基準', ko: '크기 기준', zh: '尺寸基准'
    },
    'DIÂMETRO INTERNO': {
      en: 'INSIDE DIAMETER', pt: 'DIÂMETRO INTERNO', es: 'DIÁMETRO INTERNO', it: 'DIAMETRO INTERNO',
      fr: 'DIAMÈTRE INTERNE', ja: '内接直径', ko: '내부 지름', zh: '内径'
    },
    'DIÂMETRO EXTERNO': {
      en: 'OUTSIDE DIAMETER', pt: 'DIÂMETRO EXTERNO', es: 'DIÁMETRO EXTERNO', it: 'DIAMETRO ESTERNO',
      fr: 'DIAMÈTRE EXTERNE', ja: '外接直径', ko: '외부 지름', zh: '外径'
    },
    'COMPRIMENTO DO LADO': {
      en: 'SIDE LENGTH', pt: 'COMPRIMENTO DO LADO', es: 'LONGITUD DEL LADO', it: 'LUNGHEZZA LATO',
      fr: 'LONGUEUR DE CÔTÉ', ja: '辺の長さ', ko: '변의 길이', zh: '边长'
    },
    'Diâmetro Interno': {
      en: 'Inside Diameter', pt: 'Diâmetro Interno', es: 'Diámetro Interno', it: 'Diametro Interno',
      fr: 'Diamètre Interne', ja: '内接直径', ko: '내부 지름', zh: '内径'
    },
    'Diâmetro Externo': {
      en: 'Outside Diameter', pt: 'Diâmetro Externo', es: 'Diámetro Externo', it: 'Diametro Esterno',
      fr: 'Diamètre Externe', ja: '外接直径', ko: '외부 지름', zh: '外径'
    },
    'Comprimento do Lado': {
      en: 'Side Length', pt: 'Comprimento do Lado', es: 'Longitud del Lado', it: 'Lunghezza Lato',
      fr: 'Longueur de Côté', ja: '辺の長さ', ko: '변의 길이', zh: '边长'
    },
    'Altura Interna': {
      en: 'Inside Height', pt: 'Altura Interna', es: 'Altura Interna', it: 'Altezza Interna',
      fr: 'Hauteur Interne', ja: '内高さ', ko: '내부 높이', zh: '内高度'
    },
    'Altura Externa': {
      en: 'Outside Height', pt: 'Altura Externa', es: 'Altura Externa', it: 'Altezza Esterna',
      fr: 'Hauteur Externe', ja: '外高さ', ko: '외부 높이', zh: '外高度'
    },

    // ---- Stackable Bin Page ----
    'Altura da Borda Frontal': {
      en: 'Front Lip Height', pt: 'Altura da Borda Frontal', es: 'Altura del Borde Frontal', it: 'Altezza Bordo Frontale',
      fr: 'Hauteur Bord Avant', ja: '前面リップ高さ', ko: '전면 턱 높이', zh: '前挡板高度'
    },
    'Lote': {
      en: 'Batch', pt: 'Lote', es: 'Lote', it: 'Lotto', fr: 'Lot', ja: 'バッチ', ko: '배치', zh: '批量'
    },
    'Quantidade': {
      en: 'Quantity', pt: 'Quantidade', es: 'Cantidad', it: 'Quantità', fr: 'Quantité', ja: '数量', ko: '수량', zh: '数量'
    },

    // ---- Kerf Bent Page ----
    'Raio': {
      en: 'Bend Radius', pt: 'Raio', es: 'Radio', it: 'Raggio', fr: 'Rayon', ja: '曲げ半径', ko: '곡률 반경', zh: '圆角半径'
    },
    'Raio Mínimo Sugerido': {
      en: 'Suggested Min. Radius', pt: 'Raio Mínimo Sugerido', es: 'Radio Mínimo Sugerido', it: 'Raggio Min. Consigliato',
      fr: 'Rayon Min. Conseillé', ja: '推奨最小半径', ko: '권장 최소 반경', zh: '建议最小半径'
    },
    'Raio abaixo do mínimo sugerido para esta espessura (pode exigir maior flexibilidade do material).': {
      en: 'Radius is below the suggested minimum for this thickness (may require more flexible material).',
      pt: 'Raio abaixo do mínimo sugerido para esta espessura (pode exigir maior flexibilidade do material).',
      es: 'El radio es inferior al mínimo sugerido para este espesor (puede requerir material más flexible).',
      it: 'Il raggio è inferiore al minimo consigliato per questo spessore.',
      fr: 'Le rayon est inférieur au minimum conseillé pour cette épaisseur.',
      ja: 'この板厚の推奨最小半径を下回っています（割れやすくなる場合があります）。',
      ko: '이 두께의 권장 최소 반경보다 작습니다 (더 유연한 소재가 필요할 수 있습니다).',
      zh: '当前半径小于此板厚的建议最小值（可能需要更柔韧的材料）。'
    },
    'Tipo de Caixa': {
      en: 'Box Style', pt: 'Tipo de Caixa', es: 'Tipo de Caja', it: 'Tipo di Scatola',
      fr: 'Type de Boîte', ja: 'ボックス形式', ko: '박스 유형', zh: '盒体类型'
    },
    'ABERTA': {
      en: 'OPEN', pt: 'ABERTA', es: 'ABIERTA', it: 'APERTA', fr: 'OUVERTE', ja: 'オープン', ko: '오픈', zh: '开口'
    },
    'FECHADA': {
      en: 'CLOSED', pt: 'FECHADA', es: 'CERRADA', it: 'CHIUSA', fr: 'FERMÉE', ja: 'クローズ', ko: '클로즈', zh: '封闭'
    },
    'COM TAMPA': {
      en: 'WITH LID', pt: 'COM TAMPA', es: 'CON TAPA', it: 'CON COPERCHIO', fr: 'AVEC COUVERCLE', ja: 'フタ付き', ko: '뚜껑 포함', zh: '配盒盖'
    },
    'Tampa Curva Sob Medida': {
      en: 'Custom Curved Lid', pt: 'Tampa Curva Sob Medida', es: 'Tapa Curva a Medida', it: 'Coperchio Curvo su Misura',
      fr: 'Couvercle Courbé sur Mesure', ja: '専用カーブ蓋設定', ko: '맞춤형 곡면 뚜껑', zh: '配套曲面盒盖'
    },
    'Folga de Encaixe': {
      en: 'Fit Clearance', pt: 'Folga de Encaixe', es: 'Holgura de Encaje', it: 'Gioco di Incastro',
      fr: 'Jeu d’Ajustement', ja: 'はめ合いクリアランス', ko: '결합 여유(공차)', zh: '配合间隙'
    },
    'ENCAIXADA': {
      en: 'SEATED', pt: 'ENCAIXADA', es: 'ENCAJADA', it: 'CHIUSA', fr: 'POSÉ', ja: '装着表示', ko: '장착 상태', zh: '盖合状态'
    },
    'LEVANTADA': {
      en: 'LIFTED', pt: 'LEVANTADA', es: 'LEVANTADA', it: 'SOLLEVATA', fr: 'SOULEVÉ', ja: '浮かせ表示', ko: '열림 상태', zh: '抬起状态'
    },
    'Número de Dobras': {
      en: 'Number of Bends', pt: 'Número de Dobras', es: 'Número de Curvas', it: 'Numero di Curve',
      fr: 'Nombre de Courbes', ja: '曲げ箇所の数', ko: '곡면 수', zh: '折弯数量'
    },
    'Esticar Painéis Curvados': {
      en: 'Stretch Curved Panels', pt: 'Esticar Painéis Curvados', es: 'Estirar Paneles Curvos', it: 'Estendi Pannelli Curvi',
      fr: 'Étirer Panneaux Courbes', ja: '曲面パネル伸縮調整', ko: '곡면 패널 길이 보정', zh: '曲面拉伸微调'
    },

    // ---- Download / Export Modal ----
    'Baixar': {
      en: 'Download', pt: 'Baixar', es: 'Descargar', it: 'Scarica', fr: 'Télécharger', ja: 'ダウンロード', ko: '다운로드', zh: '下载'
    },
    'Rótulos': {
      en: 'Labels', pt: 'Rótulos', es: 'Etiquetas', it: 'Etichette', fr: 'Étiquettes', ja: 'ラベル', ko: '라벨', zh: '标签'
    },
    'Formatação de Linha': {
      en: 'Line Formatting', pt: 'Formatação de Linha', es: 'Formato de Línea', it: 'Formato Linea',
      fr: 'Format de Ligne', ja: '線の書式', ko: '선 서식', zh: '线条格式'
    },
    'Compensação de Corte': {
      en: 'Cut Compensation', pt: 'Compensação de Corte', es: 'Compensación de Corte', it: 'Compensazione Taglio',
      fr: 'Compensation de Coupe', ja: 'カット補正', ko: '절단 보정', zh: '切割补偿'
    },
    'Layout': {
      en: 'Layout', pt: 'Layout', es: 'Disposición', it: 'Layout', fr: 'Disposition', ja: 'レイアウト', ko: '레이아웃', zh: '排版布局'
    },
    'HABILITADO': {
      en: 'ENABLED', pt: 'HABILITADO', es: 'ACTIVADO', it: 'ABILITATO', fr: 'ACTIVÉ', ja: '有効', ko: '사용', zh: '启用'
    },
    'DESABILITADO': {
      en: 'DISABLED', pt: 'DESABILITADO', es: 'DESACTIVADO', it: 'DISABILITATO', fr: 'DÉSACTIVÉ', ja: '無効', ko: '사용 안 함', zh: '禁用'
    },
    'Cor do Rótulo': {
      en: 'Label Color', pt: 'Cor do Rótulo', es: 'Color de Etiqueta', it: 'Colore Etichetta',
      fr: 'Couleur d’Étiquette', ja: 'ラベルの色', ko: '라벨 색상', zh: '标签颜色'
    },
    'Largura da Linha de Corte': {
      en: 'Cut Line Width', pt: 'Largura da Linha de Corte', es: 'Grosor de Línea de Corte', it: 'Spessore Linea Taglio',
      fr: 'Largeur de Trait', ja: 'カット線幅', ko: '절단선 두께', zh: '切割线宽'
    },
    'Cor da Linha de Corte Externa': {
      en: 'Outer Cut Line Color', pt: 'Cor da Linha de Corte Externa', es: 'Color de Corte Externo', it: 'Colore Taglio Esterno',
      fr: 'Couleur Coupe Externe', ja: '外側カット線色', ko: '외부 절단선 색상', zh: '外切割线颜色'
    },
    'Cor da Linha de Corte Interna': {
      en: 'Inner Cut Line Color', pt: 'Cor da Linha de Corte Interna', es: 'Color de Corte Interno', it: 'Colore Taglio Interno',
      fr: 'Couleur Coupe Interne', ja: '内側カット線色', ko: '내부 절단선 색상', zh: '内切割线颜色'
    },
    'Tipo de Compensação de Corte': {
      en: 'Cut Compensation Type', pt: 'Tipo de Compensação de Corte', es: 'Tipo de Compensación', it: 'Tipo di Compensazione',
      fr: 'Type de Compensation', ja: 'カット補正タイプ', ko: '절단 보정 유형', zh: '切割补偿类型'
    },
    'NENHUM': {
      en: 'NONE', pt: 'NENHUM', es: 'NINGUNO', it: 'NESSUNO', fr: 'AUCUN', ja: 'なし', ko: '없음', zh: '无'
    },
    'KERF': {
      en: 'KERF', pt: 'KERF', es: 'KERF', it: 'KERF', fr: 'KERF', ja: 'カーフ', ko: '커프(KERF)', zh: '切缝(KERF)'
    },
    'COMPENSAÇÃO DE CANTO': {
      en: 'CORNER COMPENSATION', pt: 'COMPENSAÇÃO DE CANTO', es: 'COMP. DE ESQUINAS', it: 'COMP. ANGOLI',
      fr: 'COMP. D’ANGLES', ja: 'コーナー逃がし', ko: '코너 보정', zh: '内角清角'
    },
    'Compensação de Corte (Diâ. Feixe/2)': {
      en: 'Kerf Offset (Beam Dia./2)', pt: 'Compensação de Corte (Diâ. Feixe/2)', es: 'Compensación Kerf (Haz/2)', it: 'Compensazione Kerf (Raggio/2)',
      fr: 'Décalage Kerf (Faisceau/2)', ja: 'カーフ補正値（ビーム径/2）', ko: '커프 보정 (빔 지름/2)', zh: '切缝偏移（光斑直径/2）'
    },
    'Diâmetro da Broca do Router': {
      en: 'Router Bit Diameter', pt: 'Diâmetro da Broca do Router', es: 'Diámetro de Fresa CNC', it: 'Diametro Fresa CNC',
      fr: 'Diamètre de Fraise CNC', ja: 'ルータービット径', ko: '라우터 비트 지름', zh: '铣刀直径'
    },
    'Alívios de canto (dogbone) aplicam-se apenas aos cantos internos do modo Dedo.': {
      en: 'Corner relief (dogbones) only applies to inside corners in Finger mode.',
      pt: 'Alívios de canto (dogbone) aplicam-se apenas aos cantos internos do modo Dedo.',
      es: 'El alivio de esquinas (dogbone) solo se aplica a las esquinas internas en modo Dedos.',
      it: 'Lo scarico angoli (dogbone) si applica solo agli angoli interni in modalità Incastro.',
      fr: 'Les dégagements d’angles (dogbone) ne s’appliquent qu’en mode Doigts.',
      ja: 'ドッグボーンはフィンガーモードの内角のみに適用されます。',
      ko: '코너 보정(도그본)은 핑거 모드의 내각에만 적용됩니다.',
      zh: '内角清角(Dogbone)仅适用于指接模式的内角。'
    },
    'Alívios de canto (dogbone) aplicam-se apenas aos encaixes do modo Dedo.': {
      en: 'Corner relief (dogbones) only applies to inside corners in Finger mode.',
      pt: 'Alívios de canto (dogbone) aplicam-se apenas aos encaixes do modo Dedo.',
      es: 'El alivio de esquinas (dogbone) solo se aplica al modo Dedos.',
      it: 'Lo scarico angoli (dogbone) si applica solo alla modalità Incastro.',
      fr: 'Les dégagements d’angles (dogbone) ne s’appliquent qu’en mode Doigts.',
      ja: 'ドッグボーンはフィンガーモードの内角のみに適用されます。',
      ko: '코너 보정(도그본)은 핑거 모드에만 적용됩니다.',
      zh: '内角清角(Dogbone)仅适用于指接模式。'
    },
    'No modo Plano, os alívios de canto aplicam-se aos encaixes cruzados das divisórias.': {
      en: 'In Flat mode, corner relief applies to the cross-lap notches of the dividers.',
      pt: 'No modo Plano, os alívios de canto aplicam-se aos encaixes cruzados das divisórias.',
      es: 'En modo Plano, el alivio de esquinas se aplica a las ranuras cruzadas de las divisiones.',
      it: 'In modalità Piatto, lo scarico angoli si applica agli incastri dei divisori.',
      fr: 'En mode Plat, le dégagement d’angles s’applique aux encoches des cloisons.',
      ja: 'フラットモードでは仕切りの相欠き溝のみに適用されます。',
      ko: '플랫 모드에서는 칸막이 교차 홈에만 코너 보정이 적용됩니다.',
      zh: '平接模式下，清角仅应用于隔板的十字插槽。'
    },
    'Layout do Painel': {
      en: 'Panel Layout', pt: 'Layout do Painel', es: 'Disposición de Paneles', it: 'Disposizione Pannelli',
      fr: 'Disposition des Panneaux', ja: 'パネル配置', ko: '패널 배치', zh: '面板排版'
    },
    'SEPARAR': {
      en: 'SEPARATE', pt: 'SEPARAR', es: 'SEPARAR', it: 'SEPARA', fr: 'SÉPARER', ja: '分離', ko: '분리', zh: '分开'
    },
    'COMBINAR': {
      en: 'COMBINE', pt: 'COMBINAR', es: 'COMBINAR', it: 'COMBINA', fr: 'COMBINER', ja: '結合', ko: '밀착', zh: '紧贴'
    },
    'Espaçamento de Painéis': {
      en: 'Panel Spacing', pt: 'Espaçamento de Painéis', es: 'Espaciado de Paneles', it: 'Spaziatura Pannelli',
      fr: 'Espacement des Panneaux', ja: 'パネル間隔', ko: '패널 간격', zh: '面板间距'
    },
    'Saída de Arquivo': {
      en: 'File Output', pt: 'Saída de Arquivo', es: 'Salida de Archivo', it: 'Output File',
      fr: 'Sortie de Fichier', ja: 'ファイル出力', ko: '파일 출력', zh: '文件输出'
    },
    'ARQUIVO ÚNICO': {
      en: 'SINGLE FILE', pt: 'ARQUIVO ÚNICO', es: 'ARCHIVO ÚNICO', it: 'FILE SINGOLO',
      fr: 'FICHIER UNIQUE', ja: '単一ファイル', ko: '단일 파일', zh: '单个文件'
    },
    'ARQUIVOS SEPARADOS': {
      en: 'SEPARATE FILES', pt: 'ARQUIVOS SEPARADOS', es: 'ARCHIVOS SEPARADOS', it: 'FILE SEPARATI',
      fr: 'FICHIERS SÉPARÉS', ja: '個別ファイル', ko: '개별 파일', zh: '分件打包'
    },
    'Nome do arquivo': {
      en: 'Filename', pt: 'Nome do arquivo', es: 'Nombre del archivo', it: 'Nome file',
      fr: 'Nom du fichier', ja: 'ファイル名', ko: '파일 이름', zh: '文件名'
    },
    'BAIXAR SVG': {
      en: 'DOWNLOAD SVG', pt: 'BAIXAR SVG', es: 'DESCARGAR SVG', it: 'SCARICA SVG',
      fr: 'TÉLÉCHARGER SVG', ja: 'SVGをダウンロード', ko: 'SVG 다운로드', zh: '下载 SVG'
    },
    'BAIXAR DXF': {
      en: 'DOWNLOAD DXF', pt: 'BAIXAR DXF', es: 'DESCARGAR DXF', it: 'SCARICA DXF',
      fr: 'TÉLÉCHARGER DXF', ja: 'DXFをダウンロード', ko: 'DXF 다운로드', zh: '下载 DXF'
    },

    // ---- HUD Prefixes ----
    'Externo:': {
      en: 'Outside:', pt: 'Externo:', es: 'Externo:', it: 'Esterno:', fr: 'Externe :', ja: '外寸:', ko: '외부:', zh: '外部:'
    },
    'Interno:': {
      en: 'Inside:', pt: 'Interno:', es: 'Interno:', it: 'Interno:', fr: 'Interne :', ja: '内寸:', ko: '내부:', zh: '内部:'
    },
    'Painéis:': {
      en: 'Panels:', pt: 'Painéis:', es: 'Paneles:', it: 'Pannelli:', fr: 'Panneaux :', ja: 'パーツ:', ko: '패널:', zh: '板件:'
    },
    'Peças:': {
      en: 'Parts:', pt: 'Peças:', es: 'Piezas:', it: 'Pezzi:', fr: 'Pièces :', ja: 'パーツ:', ko: '부품:', zh: '板件:'
    },
    'Grade:': {
      en: 'Grid:', pt: 'Grade:', es: 'Cuadrícula:', it: 'Griglia:', fr: 'Grille :', ja: 'グリッド:', ko: '그리드:', zh: '网格:'
    },
    'Polígono:': {
      en: 'Polygon:', pt: 'Polígono:', es: 'Polígono:', it: 'Poligono:', fr: 'Polygone :', ja: '多角形:', ko: '다각형:', zh: '多边形:'
    },
    'Diâm. Ext.:': {
      en: 'Outer Ø:', pt: 'Diâm. Ext.:', es: 'Diám. Ext.:', it: 'Diam. Est.:', fr: 'Diam. Ext. :', ja: '外径:', ko: '외부 Ø:', zh: '外径:'
    },
    'Caixa:': {
      en: 'Bin:', pt: 'Caixa:', es: 'Caja:', it: 'Scatola:', fr: 'Boîte :', ja: 'サイズ:', ko: '크기:', zh: '尺寸:'
    },
    'Lote:': {
      en: 'Batch:', pt: 'Lote:', es: 'Lote:', it: 'Lotto:', fr: 'Lot :', ja: 'バッチ:', ko: '배치:', zh: '批量:'
    },
    'Dobras:': {
      en: 'Bends:', pt: 'Dobras:', es: 'Curvas:', it: 'Curve:', fr: 'Courbes :', ja: '曲げ:', ko: '곡면:', zh: '折弯:'
    },
    'Antigo (Externo):': {
      en: 'Old (Outside):', pt: 'Antigo (Externo):', es: 'Anterior (Externo):', it: 'Vecchio (Esterno):',
      fr: 'Ancien (Externe) :', ja: '変更前（外寸）:', ko: '이전 (외부):', zh: '原尺寸（外）:'
    },
    'Novo (Externo):': {
      en: 'New (Outside):', pt: 'Novo (Externo):', es: 'Nuevo (Externo):', it: 'Nuovo (Esterno):',
      fr: 'Nouveau (Externe) :', ja: '変更後（外寸）:', ko: '새 치수 (외부):', zh: '新尺寸（外）:'
    },

    // ---- Dynamic JS Messages ----
    'dyn.sheet': {
      en: 'Sheet', pt: 'Chapa', es: 'Lámina', it: 'Foglio', fr: 'Planche', ja: 'シート', ko: '시트', zh: '板材'
    },
    'dyn.parts': {
      en: 'parts', pt: 'peças', es: 'piezas', it: 'pezzi', fr: 'pièces', ja: 'パーツ', ko: '개', zh: '件'
    },
    'dyn.panels': {
      en: 'panels', pt: 'painéis', es: 'paneles', it: 'pannelli', fr: 'panneaux', ja: 'パネル', ko: '패널', zh: '块'
    },
    'dyn.flat': {
      en: 'Flat', pt: 'Plano', es: 'Plano', it: 'Piatto', fr: 'Plat', ja: 'フラット', ko: '플랫', zh: '平接'
    },
    'dyn.finger': {
      en: 'Finger', pt: 'Dedo', es: 'Dedos', it: 'Incastro', fr: 'Doigts', ja: 'フィンガー', ko: '핑거', zh: '指接'
    },
    'dyn.open': {
      en: 'Open', pt: 'Aberta', es: 'Abierta', it: 'Aperta', fr: 'Ouverte', ja: 'オープン', ko: '오픈', zh: '开口'
    },
    'dyn.closed': {
      en: 'Closed', pt: 'Fechada', es: 'Cerrada', it: 'Chiusa', fr: 'Fermée', ja: 'クローズ', ko: '클로즈', zh: '封闭'
    },
    'dyn.lid': {
      en: 'With Lid', pt: 'Com Tampa', es: 'Con Tapa', it: 'Con Coperchio', fr: 'Avec Couvercle', ja: 'フタ付き', ko: '뚜껑 포함', zh: '配盒盖'
    },
    'dyn.sidesWord': {
      en: 'sides', pt: 'lados', es: 'lados', it: 'lati', fr: 'côtés', ja: '角', ko: '면', zh: '边'
    },
    'dyn.cells': {
      en: 'cells', pt: 'cél.', es: 'celdas', it: 'celle', fr: 'cell.', ja: '区画', ko: '칸', zh: '格'
    },
    'dyn.units': {
      en: 'pcs', pt: 'un.', es: 'uds.', it: 'pz.', fr: 'u.', ja: '個', ko: '개', zh: '个'
    },
    'dyn.seg': {
      en: 'seg.', pt: 'seg.', es: 'seg.', it: 'seg.', fr: 'seg.', ja: '分割', ko: '분할', zh: '段'
    },
    'dyn.captionSingle': {
      en: 'Instant local downloads at true 1:1 scale',
      pt: 'Downloads locais instantâneos em escala real 1:1',
      es: 'Descargas locales instantáneas a escala real 1:1',
      it: 'Download locali istantanei in scala reale 1:1',
      fr: 'Téléchargements locaux instantanés à l’échelle 1:1',
      ja: '実寸1:1スケールで即時ローカルダウンロード',
      ko: '실제 1:1 축척으로 즉시 로컬 다운로드',
      zh: '真实 1:1 比例本地即时下载'
    },
    'dyn.captionSeparate': {
      en: 'Exports a .ZIP archive with 1 file per part at true 1:1 scale',
      pt: 'Exporta um arquivo .ZIP com 1 arquivo por peça em escala 1:1',
      es: 'Exporta un archivo .ZIP con 1 archivo por pieza a escala 1:1',
      it: 'Esporta un archivio .ZIP con 1 file per pezzo in scala 1:1',
      fr: 'Exporte une archive .ZIP avec 1 fichier par pièce à l’échelle 1:1',
      ja: 'パーツごとに分割した1:1ファイルの .ZIP アーカイブを出力',
      ko: '부품당 1개 파일로 구성된 1:1 축척 .ZIP 압축 파일 내보내기',
      zh: '导出包含每个独立板件 1:1 图纸的 .ZIP 压缩包'
    },
    'dyn.rowColHeader': {
      en: 'Row \\ Col', pt: 'Linha \\ Col', es: 'Fila \\ Col', it: 'Riga \\ Col',
      fr: 'Rang \\ Col', ja: '行 \\ 列', ko: '행 \\ 열', zh: '行 \\ 列'
    },
    'dyn.colShort': {
      en: 'Col', pt: 'Col', es: 'Col', it: 'Col', fr: 'Col', ja: '列', ko: '열', zh: '列'
    },
    'dyn.rowShort': {
      en: 'Row', pt: 'Lin', es: 'Fila', it: 'Riga', fr: 'Rang', ja: '行', ko: '행', zh: '行'
    },

    // ---- 2D SVG / DXF Panel Labels ----
    'panel.Superior': {
      en: 'Top', pt: 'Superior', es: 'Superior', it: 'Superiore', fr: 'Dessus', ja: '上面', ko: '윗면', zh: '顶面'
    },
    'panel.Topo': {
      en: 'Top', pt: 'Topo', es: 'Tapa', it: 'Coperchio', fr: 'Dessus', ja: '上面', ko: '윗면', zh: '顶面'
    },
    'panel.Fundo': {
      en: 'Bottom', pt: 'Fundo', es: 'Fondo', it: 'Fondo', fr: 'Fond', ja: '底面', ko: '바닥', zh: '底面'
    },
    'panel.Frente': {
      en: 'Front', pt: 'Frente', es: 'Frente', it: 'Fronte', fr: 'Avant', ja: '前面', ko: '앞면', zh: '前面'
    },
    'panel.Traseira': {
      en: 'Back', pt: 'Traseira', es: 'Trasera', it: 'Retro', fr: 'Arrière', ja: '背面', ko: '뒷면', zh: '背面'
    },
    'panel.Esquerda': {
      en: 'Left', pt: 'Esquerda', es: 'Izquierda', it: 'Sinistra', fr: 'Gauche', ja: '左面', ko: '왼쪽', zh: '左面'
    },
    'panel.Direita': {
      en: 'Right', pt: 'Direita', es: 'Derecha', it: 'Destra', fr: 'Droite', ja: '右面', ko: '오른쪽', zh: '右面'
    },
    'panel.Lado': {
      en: 'Side', pt: 'Lado', es: 'Lado', it: 'Lato', fr: 'Côté', ja: '側面', ko: '측면', zh: '侧面'
    },
    'panel.Lado Curvo': {
      en: 'Curved Side', pt: 'Lado Curvo', es: 'Lado Curvo', it: 'Lato Curvo', fr: 'Côté Courbé', ja: '曲面側面', ko: '곡면 측면', zh: '曲面侧板'
    },
    'panel.Tampa Superior': {
      en: 'Lid Top', pt: 'Tampa Superior', es: 'Tapa Superior', it: 'Coperchio Sup.', fr: 'Couvercle Dessus', ja: 'フタ上面', ko: '뚜껑 윗면', zh: '盖顶面'
    },
    'panel.Tampa Lado': {
      en: 'Lid Side', pt: 'Tampa Lado', es: 'Tapa Lado', it: 'Coperchio Lato', fr: 'Couvercle Côté', ja: 'フタ側面', ko: '뚜껑 측면', zh: '盖侧板'
    },
    'panel.Tampa Lado Curvo': {
      en: 'Lid Curved Side', pt: 'Tampa Lado Curvo', es: 'Tapa Lado Curvo', it: 'Coperchio Curvo', fr: 'Couvercle Courbé', ja: 'フタ曲面側面', ko: '뚜껑 곡면', zh: '盖曲面侧板'
    },
    'panel.Tampa Traseira': {
      en: 'Lid Back', pt: 'Tampa Traseira', es: 'Tapa Trasera', it: 'Coperchio Retro', fr: 'Couvercle Arrière', ja: 'フタ背面', ko: '뚜껑 뒷면', zh: '盖背面'
    },
    'panel.Tampa Esquerda': {
      en: 'Lid Left', pt: 'Tampa Esquerda', es: 'Tapa Izquierda', it: 'Coperchio Sin.', fr: 'Couvercle Gauche', ja: 'フタ左面', ko: '뚜껑 왼쪽', zh: '盖左面'
    },
    'panel.Div. Linha': {
      en: 'Row Div.', pt: 'Div. Linha', es: 'Div. Fila', it: 'Div. Riga', fr: 'Cloison H.', ja: '横仕切り', ko: '가로 칸막이', zh: '横向隔板'
    },
    'panel.Div. Coluna': {
      en: 'Col Div.', pt: 'Div. Coluna', es: 'Div. Col.', it: 'Div. Col.', fr: 'Cloison V.', ja: '縦仕切り', ko: '세로 칸막이', zh: '纵向隔板'
    },

    // ---- Help Modal Titles ----
    'Sobre o CNC Box': {
      en: 'About CNC Box', pt: 'Sobre o CNC Box', es: 'Acerca de CNC Box', it: 'Informazioni su CNC Box',
      fr: 'À propos de CNC Box', ja: 'CNC Boxについて', ko: 'CNC Box 정보', zh: '关于 CNC Box'
    },
    'Ajuda — Caixa Básica': {
      en: 'Help — Basic Box', pt: 'Ajuda — Caixa Básica', es: 'Ayuda — Caja Básica', it: 'Aiuto — Scatola Base',
      fr: 'Aide — Boîte Basique', ja: 'ヘルプ — 基本ボックス', ko: '도움말 — 기본 박스', zh: '帮助 — 基础盒'
    },
    'Ajuda — Tampa de Caixa': {
      en: 'Help — Box Lid', pt: 'Ajuda — Tampa de Caixa', es: 'Ayuda — Tapa de Caja', it: 'Aiuto — Coperchio',
      fr: 'Aide — Couvercle', ja: 'ヘルプ — ボックスのフタ', ko: '도움말 — 박스 뚜껑', zh: '帮助 — 盒盖'
    },
    'Ajuda — Caixa Divisória em Grade': {
      en: 'Help — Grid Divider Box', pt: 'Ajuda — Caixa Divisória em Grade', es: 'Ayuda — Caja Divisoria', it: 'Aiuto — Scatola con Divisori',
      fr: 'Aide — Boîte à Compartiments', ja: 'ヘルプ — 仕切りボックス', ko: '도움말 — 칸막이 박스', zh: '帮助 — 网格分隔盒'
    },
    'Ajuda — Caixa Poligonal': {
      en: 'Help — Polygon Box', pt: 'Ajuda — Caixa Poligonal', es: 'Ayuda — Caja Poligonal', it: 'Aiuto — Scatola Poligonale',
      fr: 'Aide — Boîte Polygonale', ja: 'ヘルプ — 多角形ボックス', ko: '도움말 — 다각형 박스', zh: '帮助 — 多边形盒'
    },
    'Ajuda — Caixa Empilhável para Peças': {
      en: 'Help — Stackable Parts Bin', pt: 'Ajuda — Caixa Empilhável para Peças', es: 'Ayuda — Caja Apilable', it: 'Aiuto — Contenitore Impilabile',
      fr: 'Aide — Bac Empilable', ja: 'ヘルプ — スタッキングビン', ko: '도움말 — 적재형 부품함', zh: '帮助 — 可堆叠零件盒'
    },
    'Ajuda — Caixa Curvada': {
      en: 'Help — Kerf Bent Box', pt: 'Ajuda — Caixa Curvada', es: 'Ayuda — Caja Curvada', it: 'Aiuto — Scatola Curva',
      fr: 'Aide — Boîte Courbée', ja: 'ヘルプ — カーフ曲げボックス', ko: '도움말 — 커프 벤딩 박스', zh: '帮助 — 曲折盒'
    }
  };

  // Polygon names per language (N = 3..18)
  const POLYGON_NAMES = {
    en: { 3: 'Triangle', 4: 'Square', 5: 'Pentagon', 6: 'Hexagon', 7: 'Heptagon', 8: 'Octagon', 9: 'Nonagon', 10: 'Decagon', 11: 'Hendecagon', 12: 'Dodecagon' },
    pt: { 3: 'Triângulo', 4: 'Quadrado', 5: 'Pentágono', 6: 'Hexágono', 7: 'Heptágono', 8: 'Octógono', 9: 'Eneágono', 10: 'Decágono', 11: 'Undecágono', 12: 'Dodecágono' },
    es: { 3: 'Triángulo', 4: 'Cuadrado', 5: 'Pentágono', 6: 'Hexágono', 7: 'Heptágono', 8: 'Octógono', 9: 'Eneágono', 10: 'Decágono', 11: 'Endecágono', 12: 'Dodecágono' },
    it: { 3: 'Triangolo', 4: 'Quadrato', 5: 'Pentagono', 6: 'Esagono', 7: 'Ettagono', 8: 'Ottagono', 9: 'Ennagono', 10: 'Decagono', 11: 'Endecagono', 12: 'Dodecagono' },
    fr: { 3: 'Triangle', 4: 'Carré', 5: 'Pentagone', 6: 'Hexagone', 7: 'Heptagone', 8: 'Octogone', 9: 'Ennéagone', 10: 'Décagone', 11: 'Hendécagone', 12: 'Dodécagone' },
    ja: { 3: '三角形', 4: '正方形', 5: '五角形', 6: '六角形', 7: '七角形', 8: '八角形', 9: '九角形', 10: '十角形', 11: '十一角形', 12: '十二角形' },
    ko: { 3: '삼각형', 4: '정사각형', 5: '오각형', 6: '육각형', 7: '칠각형', 8: '팔각형', 9: '구각형', 10: '십각형', 11: '십일각형', 12: '십이각형' },
    zh: { 3: '三角形', 4: '正方形', 5: '五边形', 6: '六边形', 7: '七边形', 8: '八边形', 9: '九边形', 10: '十边形', 11: '十一边形', 12: '十二边形' }
  };

  function readSavedLang() {
    try {
      const saved = global.localStorage.getItem(STORAGE_KEY);
      if (saved && VALID_CODES.has(saved)) return saved;
    } catch (_) {
      // Ignore storage restrictions
    }
    return 'en'; // Default language on first visit is English!
  }

  let currentLang = readSavedLang();

  function getLang() {
    return currentLang;
  }

  function getLangMeta(code) {
    return LANGUAGES.find(l => l.code === (code || currentLang)) || LANGUAGES[0];
  }

  function t(key, fallback) {
    const entry = DICT[key];
    if (entry) {
      return entry[currentLang] || entry.en || key;
    }
    return fallback !== undefined ? fallback : key;
  }

  /**
   * Translate dynamic panel labels generated in geometry.js (e.g., "Lado 3", "Div. Linha 1", "Esquerda #2")
   */
  function translatePanelLabel(rawLabel) {
    if (!rawLabel) return '';
    // Direct exact match
    if (DICT['panel.' + rawLabel]) {
      return t('panel.' + rawLabel, rawLabel);
    }
    // Pattern: "<Base> <number>" or "<Base> #<number>"
    const mBatch = rawLabel.match(/^(.*?)\s+(#\d+)$/);
    if (mBatch) {
      return `${translatePanelLabel(mBatch[1])} ${mBatch[2]}`;
    }
    const mNum = rawLabel.match(/^(Lado|Div\. Linha|Div\. Coluna)\s+(\d+)$/);
    if (mNum) {
      return `${t('panel.' + mNum[1], mNum[1])} ${mNum[2]}`;
    }
    return rawLabel;
  }

  function polygonName(sides) {
    const map = POLYGON_NAMES[currentLang] || POLYGON_NAMES.en;
    if (map[sides]) return map[sides];
    return `${sides}-${t('dyn.sidesWord')}`;
  }

  /**
   * Detect current page key for <title> translation.
   */
  function detectPageKey() {
    const path = (global.location.pathname || '').toLowerCase();
    if (path.endsWith('basic-box.html')) return 'basic';
    if (path.endsWith('lid-box.html')) return 'lid';
    if (path.endsWith('divider-box.html')) return 'divider';
    if (path.endsWith('polygon-box.html')) return 'polygon';
    if (path.endsWith('stackable-bin.html')) return 'stackable';
    if (path.endsWith('kerf-box.html')) return 'kerf';
    return 'home';
  }

  /**
   * Translate all static text nodes & explicit data-i18n elements in the DOM.
   */
  function applyTranslations() {
    const meta = getLangMeta();
    document.documentElement.lang = meta.htmlLang;

    const pageKey = detectPageKey();
    document.title = t('title.' + pageKey, document.title);

    // 1. Explicit data-i18n-html elements
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (DICT[key]) {
        el.innerHTML = t(key);
      }
    });

    // 2. Auto-discover & translate leaf text elements across the UI
    const selector = [
      'header a', 'header button', 'header span',
      'main h1', 'main h2', 'main h3', 'main p',
      '.field-name', '.section-label', '.segment-btn', '.primary-btn',
      '.secondary-action-btn', '.tab-btn', '.tab-label', '.tab-note',
      '.card-tier-badge', '.card-tag', '.highlight-item strong', '.highlight-item span',
      '.hud-stats strong', '.hud-hint',
      '.modal-header h2', '.filename-row label', '.resize-desc', '.resize-summary strong',
      '.resize-footer button', '.thickness-option', '.custom-select-trigger span'
    ].join(', ');

    document.querySelectorAll(selector).forEach(el => {
      if (el.closest('.lang-select') || el.hasAttribute('data-i18n-html') || el.hasAttribute('data-i18n-skip')) {
        return;
      }
      // Only translate elements that don't wrap child elements (except pure text)
      if (el.children.length > 0) return;

      if (!el.dataset.i18nKey) {
        const raw = el.textContent.trim();
        if (DICT[raw]) {
          el.dataset.i18nKey = raw;
        }
      }
      if (el.dataset.i18nKey) {
        el.textContent = t(el.dataset.i18nKey);
      }
    });

    // Update language selector badge text
    const langDisplay = document.getElementById('lang-current-label');
    if (langDisplay) {
      langDisplay.textContent = meta.name;
    }
    document.querySelectorAll('.lang-option').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.langCode === currentLang);
    });
  }

  function setLang(code) {
    if (!VALID_CODES.has(code)) return;
    currentLang = code;
    try {
      global.localStorage.setItem(STORAGE_KEY, code);
    } catch (_) {
      // Ignore storage errors
    }
    applyTranslations();
    global.dispatchEvent(new CustomEvent('cncbox:langchange', { detail: { lang: code } }));
  }

  /**
   * Inject the Globe Language Switcher dropdown into the top navbar on every page,
   * AND optionally populate a prominent selector pill on the Home page if present.
   */
  function mountLanguageSwitcher() {
    const navRight = document.querySelector('.top-nav .nav-right');
    if (!navRight || document.getElementById('lang-switcher')) return;

    const meta = getLangMeta();
    const details = document.createElement('details');
    details.className = 'lang-select';
    details.id = 'lang-switcher';

    details.innerHTML = `
      <summary class="nav-btn lang-trigger" aria-label="Language / Idioma">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span id="lang-current-label">${meta.name}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </summary>
      <div class="lang-menu" role="listbox" aria-label="Select Language"></div>
    `;

    const menu = details.querySelector('.lang-menu');
    LANGUAGES.forEach(lang => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-option' + (lang.code === currentLang ? ' selected' : '');
      btn.dataset.langCode = lang.code;
      btn.setAttribute('role', 'option');
      btn.innerHTML = `<span class="lang-code-badge">${lang.short}</span><span>${lang.name}</span>`;
      btn.addEventListener('click', () => {
        setLang(lang.code);
        details.removeAttribute('open');
      });
      menu.appendChild(btn);
    });

    // Insert right before the nav-divider / Help button
    const divider = navRight.querySelector('.nav-divider');
    if (divider) {
      navRight.insertBefore(details, divider);
    } else {
      navRight.appendChild(details);
    }

    // Close on outside click
    document.addEventListener('click', e => {
      if (details.open && !details.contains(e.target)) {
        details.removeAttribute('open');
      }
    });

    // Also mount quick-pick language bar on the Home page hero if container exists
    const homeLangBar = document.getElementById('home-lang-bar');
    if (homeLangBar) {
      homeLangBar.innerHTML = '';
      LANGUAGES.forEach(lang => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'home-lang-pill lang-option' + (lang.code === currentLang ? ' selected' : '');
        pill.dataset.langCode = lang.code;
        pill.textContent = lang.name;
        pill.addEventListener('click', () => setLang(lang.code));
        homeLangBar.appendChild(pill);
      });
    }
  }

  function init() {
    mountLanguageSwitcher();
    applyTranslations();
  }

  // Run before app controllers' DOMContentLoaded listeners if loaded first, or on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.CNCBoxI18n = {
    LANGUAGES,
    getLang,
    setLang,
    t,
    translatePanelLabel,
    polygonName,
    applyTranslations
  };
})(window);
