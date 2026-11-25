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
    },

    // ---- Help Modal Bodies (All 7 Pages × 8 Languages) ----
    'help.home': {
      en: `<p>100% client-side HTML, CSS, and JavaScript application to generate true 1:1 scale box cut plans for laser cutters and CNC routers.</p>
        <h3>Available Models</h3>
        <ul>
          <li><strong>Basic Box:</strong> Open or closed rectangular box with <em>Flat</em> or <em>Finger</em> joints.</li>
          <li><strong>Box Lid:</strong> Slip-over lid (closed on top, open at bottom) always dimensioned from the inside to fit cleanly over your box.</li>
          <li><strong>Grid Divider Box:</strong> Organizer with internal <em>Rows × Columns</em> grid, cross-lap dividers, custom compartment resizing, cell dimension mode, and optional flat lid.</li>
          <li><strong>Polygon Box:</strong> Regular 3 to 18-sided box configurable by inside diameter, outside diameter, or side length, with angular <em>Flat</em> and <em>Finger</em> joints.</li>
          <li><strong>Stackable Parts Bin:</strong> Stackable parts organizer with angled front lip, trapezoidal stacking lugs, optional dividers, and multi-unit batch preview.</li>
          <li><strong>Kerf Bent Box:</strong> Living-hinge rounded box with 1, 2, or 4 bends, available in <em>Open</em>, <em>Closed</em>, or custom <em>Curved Lid</em> modes.</li>
        </ul>`,
      pt: `<p>Aplicação 100% local em HTML, CSS e JavaScript para gerar planos de corte de caixas em escala real 1:1 para cortadoras a laser e fresadoras CNC.</p>
        <h3>Modelos Disponíveis</h3>
        <ul>
          <li><strong>Caixa Básica:</strong> Caixa aberta ou fechada com juntas <em>Plano (FLAT)</em> ou <em>Dedo (FINGER)</em>.</li>
          <li><strong>Tampa de Caixa:</strong> Tampa de encaixe (fechada no topo e aberta na base) dimensionada sempre pelo lado interno para vestir perfeitamente sobre a caixa.</li>
          <li><strong>Caixa Divisória em Grade:</strong> Caixa com grade interna de <em>Linhas × Colunas</em>, divisórias com encaixes cruzados (meia-madeira), redimensionamento individual de compartimentos, modo de dimensões por célula e opção de tampa plana.</li>
          <li><strong>Caixa Poligonal:</strong> Caixa regular de 3 a 18 lados configurável por diâmetro interno, externo ou comprimento do lado, com juntas angulares <em>Plano</em> e <em>Dedo</em>.</li>
          <li><strong>Caixa Empilhável para Peças:</strong> Gaveteiro empilhável para componentes com boca frontal inclinada, travas trapezoidais de empilhamento, divisórias opcionais e lote múltiplo.</li>
          <li><strong>Caixa Curvada:</strong> Caixa com dobras flexíveis a laser (<em>living hinge</em>) de 1, 2 ou 4 cantos arredondados, nas opções <em>Aberta</em>, <em>Fechada</em> ou <em>Com Tampa Curva</em> sob medida.</li>
        </ul>`,
      es: `<p>Aplicación 100% local en HTML, CSS y JavaScript para generar planos de corte a escala real 1:1 para cortadoras láser y fresadoras CNC.</p>
        <h3>Modelos Disponibles</h3>
        <ul>
          <li><strong>Caja Básica:</strong> Caja abierta o cerrada con uniones <em>Planas</em> o de <em>Dedos</em>.</li>
          <li><strong>Tapa de Caja:</strong> Tapa encajable (cerrada arriba, abierta abajo) medida siempre por el interior para ajustarse sobre la caja.</li>
          <li><strong>Caja Divisoria en Cuadrícula:</strong> Organizador con cuadrícula de <em>Filas × Columnas</em>, divisiones cruzadas, redimensionamiento individual, modo celda y tapa plana opcional.</li>
          <li><strong>Caja Poligonal:</strong> Caja regular de 3 a 18 lados configurable por diámetro interno, externo o longitud de lado, con uniones angulares <em>Planas</em> y de <em>Dedos</em>.</li>
          <li><strong>Caja Apilable para Piezas:</strong> Organizador apilable con frente inclinado, trabas trapezoidales de apilamiento, divisiones opcionales y vista en lote.</li>
          <li><strong>Caja Curvada:</strong> Caja con bisagras vivas láser (<em>living hinge</em>) de 1, 2 o 4 curvas, en modos <em>Abierta</em>, <em>Cerrada</em> o <em>Con Tapa Curva</em> a medida.</li>
        </ul>`,
      it: `<p>Applicazione 100% locale in HTML, CSS e JavaScript per generare piani di taglio 1:1 per taglio laser e frese CNC.</p>
        <h3>Modelli Disponibili</h3>
        <ul>
          <li><strong>Scatola Base:</strong> Scatola aperta o chiusa con giunti <em>Piatti</em> o ad <em>Incastro</em>.</li>
          <li><strong>Coperchio Scatola:</strong> Coperchio ad incastro (chiuso sopra, aperto sotto) sempre dimensionato dall’interno.</li>
          <li><strong>Scatola con Divisori:</strong> Organizer con griglia <em>Righe × Colonne</em>, divisori a croce, ridimensionamento scomparti, modalità cella e coperchio piatto opzionale.</li>
          <li><strong>Scatola Poligonale:</strong> Scatola regolare da 3 a 18 lati configurabile per diametro interno, esterno o lato, con giunti angolari.</li>
          <li><strong>Contenitore Impilabile:</strong> Contenitore per minuteria con fronte inclinato, incastri trapezoidali impilabili, divisori e anteprima in lotto.</li>
          <li><strong>Scatola Curva:</strong> Scatola con tagli kerf flessibili a 1, 2 o 4 curve, in modalità <em>Aperta</em>, <em>Chiusa</em> o <em>Con Coperchio Curvo</em>.</li>
        </ul>`,
      fr: `<p>Application 100% locale en HTML, CSS et JavaScript pour générer des plans de découpe à l’échelle 1:1 pour découpeuses laser et fraiseuses CNC.</p>
        <h3>Modèles Disponibles</h3>
        <ul>
          <li><strong>Boîte Basique :</strong> Boîte ouverte ou fermée avec assemblages <em>Plats</em> ou à <em>Doigts</em>.</li>
          <li><strong>Couvercle de Boîte :</strong> Couvercle emboîtable (fermé en haut, ouvert en bas) toujours mesuré par l’intérieur.</li>
          <li><strong>Boîte à Compartiments :</strong> Organiseur à grille <em>Rangées × Colonnes</em>, cloisons croisées, redimensionnement individuel, mode cellule et couvercle plat en option.</li>
          <li><strong>Boîte Polygonale :</strong> Boîte régulière de 3 à 18 côtés réglable par diamètre interne, externe ou longueur de côté.</li>
          <li><strong>Bac Empilable :</strong> Bac à composants avec ouverture inclinée, tenons trapézoïdaux d’empilement, cloisons et aperçu par lot.</li>
          <li><strong>Boîte Courbée :</strong> Boîte à charnière souple laser (<em>living hinge</em>) à 1, 2 ou 4 courbes, en mode <em>Ouverte</em>, <em>Fermée</em> ou <em>Avec Couvercle Courbé</em>.</li>
        </ul>`,
      ja: `<p>レーザーカッターおよびCNCルーター向けの実寸1:1ボックスカットデータを生成する、完全ローカル動作のHTML/CSS/JSアプリです。</p>
        <h3>利用可能なモデル</h3>
        <ul>
          <li><strong>基本ボックス：</strong> <em>フラット</em>または<em>フィンガー</em>接合のオープン／クローズ長方形ボックス。</li>
          <li><strong>ボックスのフタ：</strong> 箱に被せるための内寸基準のフタ（上面クローズ・底面オープン）。</li>
          <li><strong>仕切り付きグリッドボックス：</strong> <em>行×列</em>の相欠き仕切り、個別サイズ変更、セル寸法モード、フラット蓋に対応。</li>
          <li><strong>多角形ボックス：</strong> 3〜18角形に対応し、内接直径・外接直径・辺の長さから角度補正付きで設計可能。</li>
          <li><strong>スタッキングパーツビン：</strong> 傾斜前面、台形スタッキング突起、仕切り、複数段プレビューを備えた部品用ビン。</li>
          <li><strong>カーフ曲げボックス：</strong> 1・2・4箇所の曲面（<em>リビングヒンジ</em>）に対応し、<em>オープン</em>・<em>クローズ</em>・専用<em>カーブ蓋付き</em>を選択可能。</li>
        </ul>`,
      ko: `<p>레이저 커터와 CNC 라우터용 실제 1:1 축척 박스 도면을 생성하는 100% 로컬 HTML/CSS/JS 웹 앱입니다.</p>
        <h3>지원 모델</h3>
        <ul>
          <li><strong>기본 박스:</strong> <em>플랫</em> 또는 <em>핑거</em> 조인트 방식의 오픈/클로즈 직사각형 박스.</li>
          <li><strong>박스 뚜껑:</strong> 박스에 끼워지도록 항상 내부 치수 기준으로 설계되는 덮개형 뚜껑.</li>
          <li><strong>그리드 칸막이 박스:</strong> <em>행 × 열</em> 교차 끼움 칸막이, 개별 칸 크기 조절, 셀 치수 모드 및 평면 뚜껑 지원.</li>
          <li><strong>다각형 박스:</strong> 3~18각형 정다각형 박스를 내부 지름, 외부 지름 또는 변 길이로 정밀 설계.</li>
          <li><strong>적재형 부품함:</strong> 기울어진 전면 입구, 사다리꼴 적재 홈, 선택형 칸막이 및 다단 적재 미리보기 지원.</li>
          <li><strong>커프 벤딩 박스:</strong> 1, 2, 4면 곡면 <em>리빙 힌지</em> 박스로 <em>오픈</em>, <em>클로즈</em> 또는 맞춤형 <em>곡면 뚜껑</em> 지원.</li>
        </ul>`,
      zh: `<p>100% 本地运行的 HTML/CSS/JS 应用，用于为激光切割机和 CNC 雕刻机生成真实 1:1 比例盒型切割图纸。</p>
        <h3>可用盒型</h3>
        <ul>
          <li><strong>基础盒：</strong> 支持<em>平接</em>或<em>指接</em>的开口或封闭式矩形盒。</li>
          <li><strong>盒盖：</strong> 上封下开的扣合式盒盖，始终按内部尺寸设计，方便直接套合盒体。</li>
          <li><strong>网格分隔盒：</strong> 支持 <em>行 × 列</em> 十字插接隔板、单个隔格尺寸自定义、单格尺寸模式及可选平盖。</li>
          <li><strong>多边形盒：</strong> 支持 3 至 18 边形，可按内径、外径或边长设定，自动计算角度指接。</li>
          <li><strong>可堆叠零件盒：</strong> 带倾斜前口、梯形堆叠卡扣、可选隔板及 3D 批量堆叠预览的元件收纳盒。</li>
          <li><strong>曲折盒：</strong> 1、2 或 4 处激光柔性铰链圆角折弯，支持<em>开口</em>、<em>封闭</em>及定制配套<em>曲面盒盖</em>。</li>
        </ul>`
    },

    'help.basic': {
      en: `<p>Generate true 1:1 scale 2D cut plans (<strong>SVG</strong> &amp; <strong>DXF</strong>) for laser cutters and CNC routers with interactive 3D preview.</p>
        <h3>Edge Joint Modes</h3>
        <ul>
          <li><strong>Flat:</strong> Straight butt-joint edges ideal for simple gluing or corner brackets.</li>
          <li><strong>Finger:</strong> Interlocking box joints across all edges, adjustable via <em>Finger Size</em>.</li>
        </ul>
        <h3>Cut Compensation</h3>
        <ul>
          <li><strong>Kerf (Laser):</strong> Offsets outer paths outward by half the beam width for snug press-fit assembly.</li>
          <li><strong>Corner Compensation (CNC):</strong> Adds circular <em>dogbone</em> reliefs to inside finger corners for round router bits.</li>
        </ul>`,
      pt: `<p>Este gerador cria planos de corte 2D (<strong>SVG</strong> e <strong>DXF</strong>) em escala real 1:1 para cortadoras a laser e fresadoras CNC, com pré-visualização 3D interativa.</p>
        <h3>Modos de Junta Implementados</h3>
        <ul>
          <li><strong>Plano (FLAT):</strong> Bordas retas de topo, ideais para colagem simples ou montagem com cantoneiras.</li>
          <li><strong>Dedo (FINGER):</strong> Encaixes tipo dedo (box joints) com intertravamento exato entre todas as paredes, ajustável pelo controle <em>Tamanho do Dedo</em>.</li>
        </ul>
        <h3>Compensação de Corte</h3>
        <ul>
          <li><strong>Kerf (Laser):</strong> Expande os contornos externos pela metade da largura do feixe para garantir encaixe firme por pressão.</li>
          <li><strong>Compensação de Canto (CNC):</strong> Adiciona alívios circulares (<em>dogbones</em>) nos cantos internos dos encaixes de dedo para compensar o raio da fresa.</li>
        </ul>`,
      es: `<p>Genera planos de corte 2D (<strong>SVG</strong> y <strong>DXF</strong>) a escala real 1:1 para láser y CNC con vista previa 3D interactiva.</p>
        <h3>Modos de Unión</h3>
        <ul>
          <li><strong>Plano:</strong> Bordes rectos a tope, ideales para encolado simple.</li>
          <li><strong>Dedos:</strong> Encastres tipo caja en todos los bordes, ajustables mediante <em>Tamaño de Dedo</em>.</li>
        </ul>
        <h3>Compensación de Corte</h3>
        <ul>
          <li><strong>Kerf (Láser):</strong> Compensa la mitad del ancho del haz para un ajuste firme a presión.</li>
          <li><strong>Compensación de Esquinas (CNC):</strong> Agrega alivios circulares (<em>dogbone</em>) en las esquinas internas para fresas redondas.</li>
        </ul>`,
      it: `<p>Genera piani di taglio 2D (<strong>SVG</strong> e <strong>DXF</strong>) in scala 1:1 per laser e CNC con anteprima 3D interattiva.</p>
        <h3>Modalità di Giunzione</h3>
        <ul>
          <li><strong>Piatto:</strong> Bordi dritti di testa, ideali per incollaggio semplice.</li>
          <li><strong>Incastro:</strong> Giunti a pettine su tutti i bordi, regolabili tramite <em>Dim. Incastro</em>.</li>
        </ul>
        <h3>Compensazione Taglio</h3>
        <ul>
          <li><strong>Kerf (Laser):</strong> Compensa metà della larghezza del raggio per un incastro preciso.</li>
          <li><strong>Comp. Angoli (CNC):</strong> Aggiunge scarichi circolari (<em>dogbone</em>) negli angoli interni per frese cilindriche.</li>
        </ul>`,
      fr: `<p>Générez des plans de découpe 2D (<strong>SVG</strong> et <strong>DXF</strong>) à l’échelle 1:1 pour laser et CNC avec aperçu 3D interactif.</p>
        <h3>Modes d’Assemblage</h3>
        <ul>
          <li><strong>Plat :</strong> Bords droits bout à bout, parfaits pour un collage simple.</li>
          <li><strong>Doigts :</strong> Assemblages crantés sur tous les bords, réglables via <em>Taille des Doigts</em>.</li>
        </ul>
        <h3>Compensation de Coupe</h3>
        <ul>
          <li><strong>Kerf (Laser) :</strong> Décale les contours de la moitié du faisceau pour un emboîtement ferme.</li>
          <li><strong>Comp. d’Angles (CNC) :</strong> Ajoute des dégagements circulaires (<em>dogbone</em>) dans les angles internes.</li>
        </ul>`,
      ja: `<p>レーザーカッター・CNCルーター向けの実寸1:1 2Dカットデータ（<strong>SVG</strong>／<strong>DXF</strong>）を3Dプレビュー付きで生成します。</p>
        <h3>接合モード</h3>
        <ul>
          <li><strong>フラット：</strong> 接着や金具留めに適した直線突き合わせ構造。</li>
          <li><strong>フィンガー：</strong> <em>フィンガー幅</em>で調整可能な精密噛み合わせ構造。</li>
        </ul>
        <h3>カット補正</h3>
        <ul>
          <li><strong>カーフ（レーザー）：</strong> レーザー幅の半分を外側へオフセットし、タイトなはめ合いを実現。</li>
          <li><strong>コーナー逃がし（CNC）：</strong> 丸エンドミル用に内角へドッグボーン円弧を自動追加。</li>
        </ul>`,
      ko: `<p>인터랙티브 3D 미리보기와 함께 레이저 커터 및 CNC용 1:1 축척 2D 도면(<strong>SVG</strong>, <strong>DXF</strong>)을 생성합니다.</p>
        <h3>조인트 모드</h3>
        <ul>
          <li><strong>플랫:</strong> 단순 접착이나 브래킷 조립에 적합한 직선 맞대기 구조.</li>
          <li><strong>핑거:</strong> <em>핑거 크기</em>로 조절 가능한 정밀 맞물림 박스 조인트.</li>
        </ul>
        <h3>절단 보정</h3>
        <ul>
          <li><strong>커프 (레이저):</strong> 빔 폭의 절반만큼 외곽을 확장해 단단한 끼워 맞춤을 구현합니다.</li>
          <li><strong>코너 보정 (CNC):</strong> 원형 라우터 비트를 위해 내각에 도그본 원호를 자동 추가합니다.</li>
        </ul>`,
      zh: `<p>生成适用于激光切割机与 CNC 雕刻机的真实 1:1 比例 2D 图纸（<strong>SVG</strong> 和 <strong>DXF</strong>），带实时 3D 预览。</p>
        <h3>边缘拼接模式</h3>
        <ul>
          <li><strong>平接：</strong> 平直对接边缘，适合直接胶粘或角码固定。</li>
          <li><strong>指接：</strong> 咬合式榫卯结构，可通过<em>指接宽度</em>自由调节。</li>
        </ul>
        <h3>切割补偿</h3>
        <ul>
          <li><strong>切缝 (Kerf)：</strong> 按光斑半径自动外扩轮廓，实现紧密插接。</li>
          <li><strong>内角清角 (CNC)：</strong> 自动在指接内角添加圆形 <em>Dogbone</em> 避让弧以适配圆柱铣刀。</li>
        </ul>`
    },

    'help.lid': {
      en: `<p>Design slip-over box lids (closed on top, open at the bottom) that fit cleanly over your boxes.</p>
        <h3>Always Internal Dimensions</h3>
        <ul>
          <li><strong>Inside Width &amp; Inside Length:</strong> The inner opening of the lid. Tip: enter your box’s outside size plus a small clearance (e.g. <code>+0.5 mm</code> to <code>+1.0 mm</code>) for a smooth sliding fit.</li>
          <li><strong>Lid Height:</strong> Inner skirt depth that drops over the box walls.</li>
          <li><strong>Thickness:</strong> Material thickness automatically added to the outside.</li>
        </ul>`,
      pt: `<p>Projete tampas de encaixe (tipo tampa de caixa de sapato) fechadas na parte superior e abertas na base para cobrir suas caixas.</p>
        <h3>Medidas Sempre Internas</h3>
        <ul>
          <li><strong>Largura Interna e Comprimento Interno:</strong> Correspondem ao vão interno da tampa. Dica: informe a medida externa da caixa + uma pequena folga (ex.: <code>+0.5 mm</code> a <code>+1.0 mm</code>) para deslizar suavemente.</li>
          <li><strong>Altura da Tampa:</strong> Altura interna da aba lateral que desce sobre a caixa.</li>
          <li><strong>Espessura:</strong> Espessura do material (MDF, compensado, acrílico) adicionada automaticamente por fora.</li>
        </ul>`,
      es: `<p>Diseña tapas encajables (cerradas arriba y abiertas abajo) para cubrir tus cajas.</p>
        <h3>Medidas Siempre Internas</h3>
        <ul>
          <li><strong>Ancho y Largo Interno:</strong> Corresponden al hueco interior de la tapa. Consejo: usa la medida externa de la caja más una pequeña holgura (<code>+0.5</code> a <code>+1.0 mm</code>).</li>
          <li><strong>Altura de la Tapa:</strong> Altura interna de la solapa que baja sobre la caja.</li>
          <li><strong>Espesor:</strong> Espesor del material añadido automáticamente por fuera.</li>
        </ul>`,
      it: `<p>Progetta coperchi ad incastro (chiusi sopra, aperti sotto) per coprire le tue scatole.</p>
        <h3>Misure Sempre Interne</h3>
        <ul>
          <li><strong>Larghezza e Lunghezza Interna:</strong> Vano interno del coperchio. Consiglio: inserisci la misura esterna della scatola + un piccolo gioco (<code>+0.5–1.0 mm</code>).</li>
          <li><strong>Altezza Coperchio:</strong> Altezza interna del bordo laterale.</li>
          <li><strong>Spessore:</strong> Spessore del materiale aggiunto automaticamente all’esterno.</li>
        </ul>`,
      fr: `<p>Concevez des couvercles emboîtables (fermés en haut, ouverts en bas) pour recouvrir vos boîtes.</p>
        <h3>Dimensions Toujours Internes</h3>
        <ul>
          <li><strong>Largeur et Longueur Internes :</strong> Ouverture intérieure du couvercle. Conseil : indiquez la taille externe de la boîte + un léger jeu (<code>+0.5</code> à <code>+1.0 mm</code>).</li>
          <li><strong>Hauteur Couvercle :</strong> Hauteur intérieure de la jupe latérale.</li>
          <li><strong>Épaisseur :</strong> Épaisseur du matériau ajoutée automatiquement à l’extérieur.</li>
        </ul>`,
      ja: `<p>箱の上から被せるタイプ（上面クローズ・底面オープン）のフタを設計します。</p>
        <h3>常に内寸基準</h3>
        <ul>
          <li><strong>内幅・内長さ：</strong> フタの内側の開口サイズです。箱の外寸に <code>+0.5〜1.0 mm</code> 程度のクリアランスを足すと滑らかに被せられます。</li>
          <li><strong>フタの高さ：</strong> 箱に被さる側面の内側高さです。</li>
          <li><strong>板厚：</strong> 素材の厚みは自動的に外側へ加算されます。</li>
        </ul>`,
      ko: `<p>박스 위에서 덮어 씌우는 방식(상단 폐쇄, 하단 개방)의 뚜껑을 설계합니다.</p>
        <h3>항상 내부 치수 기준</h3>
        <ul>
          <li><strong>내부 너비 및 길이:</strong> 뚜껑 안쪽 공간 크기입니다. 박스 외치수에 <code>+0.5~1.0 mm</code> 여유를 더하면 부드럽게 닫힙니다.</li>
          <li><strong>뚜껑 높이:</strong> 박스 옆면을 감싸는 내부 높이입니다.</li>
          <li><strong>두께:</strong> 소재 두께는 자동으로 바깥쪽에 더해집니다.</li>
        </ul>`,
      zh: `<p>设计上封下开的扣合式盒盖（天地盖样式），直接套合在盒体外部。</p>
        <h3>始终按内部尺寸计算</h3>
        <ul>
          <li><strong>内宽度与内长度：</strong> 盒盖内部净空尺寸。建议输入盒体外尺寸加 <code>+0.5 至 +1.0 mm</code> 间隙以顺滑套合。</li>
          <li><strong>盒盖高度：</strong> 盖边内部净高。</li>
          <li><strong>板厚：</strong> 材料厚度自动向外增加。</li>
        </ul>`
    },

    'help.divider': {
      en: `<p>Design grid organizer boxes (<strong>Rows × Columns</strong>) and export true 1:1 scale <strong>SVG</strong> and <strong>DXF</strong> cut plans.</p>
        <h3>Divider Joints</h3>
        <ul>
          <li><strong>Cross-lap notches:</strong> Row and column dividers interlock at half height so all top edges sit flush.</li>
          <li><strong>Lid None + Finger:</strong> Dividers drop into open U-slots cut from the top of the outer walls.</li>
          <li><strong>Flat Lid + Finger:</strong> Outer walls include blue interior through-mortises locking the dividers beneath the closed lid.</li>
          <li><strong>Resize Dividers:</strong> Customize individual widths and depths for every column and row.</li>
        </ul>`,
      pt: `<p>Projete caixas organizadoras com divisórias internas em grade (<strong>Linhas × Colunas</strong>) e exporte os planos de corte em <strong>SVG</strong> e <strong>DXF</strong> na escala real 1:1.</p>
        <h3>Encaixes das Divisórias</h3>
        <ul>
          <li><strong>Encaixe cruzado (Meia-madeira):</strong> Divisórias de linha e coluna se travam a meia altura para ficarem perfeitamente niveladas.</li>
          <li><strong>Tampa Nenhuma + Dedo:</strong> As divisórias encaixam de cima para baixo em rasgos em U nas paredes externas.</li>
          <li><strong>Tampa Plana + Dedo:</strong> As paredes externas recebem furos internos (linha azul) onde as abas das divisórias se travam sob a tampa fechada.</li>
          <li><strong>Redimensionar divisórias:</strong> Permite definir larguras e profundidades individuais para cada compartimento.</li>
        </ul>`,
      es: `<p>Diseña cajas organizadoras con divisiones en cuadrícula (<strong>Filas × Columnas</strong>) y exporta planos 1:1 en <strong>SVG</strong> y <strong>DXF</strong>.</p>
        <h3>Encastres de Divisiones</h3>
        <ul>
          <li><strong>Encastre cruzado:</strong> Las divisiones se cruzan a media altura quedando totalmente niveladas.</li>
          <li><strong>Sin Tapa + Dedos:</strong> Las divisiones encajan desde arriba en ranuras en U en las paredes externas.</li>
          <li><strong>Tapa Plana + Dedos:</strong> Las paredes externas incluyen ranuras internas azules donde encajan las pestañas bajo la tapa.</li>
          <li><strong>Redimensionar divisiones:</strong> Personaliza el ancho y profundidad individual de cada compartimento.</li>
        </ul>`,
      it: `<p>Progetta scatole organizer con griglia interna (<strong>Righe × Colonne</strong>) ed esporta file <strong>SVG</strong> e <strong>DXF</strong> in scala 1:1.</p>
        <h3>Incastri dei Divisori</h3>
        <ul>
          <li><strong>Incastro a croce:</strong> I divisori si incastrano a mezza altezza restando perfettamente a filo.</li>
          <li><strong>Senza Coperchio + Incastro:</strong> I divisori scendono in fresature a U sulle pareti esterne.</li>
          <li><strong>Coperchio Piatto + Incastro:</strong> Le pareti esterne presentano asole interne blu sotto il coperchio chiuso.</li>
          <li><strong>Ridimensiona divisori:</strong> Personalizza larghezza e profondità di ogni singolo scomparto.</li>
        </ul>`,
      fr: `<p>Concevez des boîtes à compartiments en grille (<strong>Rangées × Colonnes</strong>) et exportez en <strong>SVG</strong> et <strong>DXF</strong> à l’échelle 1:1.</p>
        <h3>Assemblages des Cloisons</h3>
        <ul>
          <li><strong>Encoches croisées :</strong> Les cloisons s’emboîtent à mi-hauteur pour un affleurement parfait.</li>
          <li><strong>Sans Couvercle + Doigts :</strong> Les cloisons s’insèrent par le haut dans des fentes en U des parois externes.</li>
          <li><strong>Couvercle Plat + Doigts :</strong> Les parois externes comportent des mortaises internes bleues sous le couvercle fermé.</li>
          <li><strong>Redimensionner cloisons :</strong> Définissez des largeurs et profondeurs individuelles pour chaque case.</li>
        </ul>`,
      ja: `<p><strong>行 × 列</strong>の格子状仕切り付きボックスを設計し、実寸1:1の<strong>SVG</strong>／<strong>DXF</strong>データを出力します。</p>
        <h3>仕切りの接合</h3>
        <ul>
          <li><strong>相欠き接合：</strong> 縦横の仕切りが半分の高さで噛み合い、上面がフラットに揃います。</li>
          <li><strong>フタなし＋フィンガー：</strong> 外壁上部のU字溝に仕切りを上から差し込みます。</li>
          <li><strong>フラット蓋＋フィンガー：</strong> 外壁に青い貫通スロットが開き、フタの下で仕切りが固定されます。</li>
          <li><strong>仕切りサイズ変更：</strong> 列・行ごとに異なる区画サイズを個別に指定できます。</li>
        </ul>`,
      ko: `<p><strong>행 × 열</strong> 격자 칸막이 정리함을 설계하고 실제 1:1 축척 <strong>SVG</strong> / <strong>DXF</strong> 도면을 내보냅니다.</p>
        <h3>칸막이 결합 방식</h3>
        <ul>
          <li><strong>교차 끼움:</strong> 가로/세로 칸막이가 절반 높이로 맞물려 상단이 평평하게 정렬됩니다.</li>
          <li><strong>뚜껑 없음 + 핑거:</strong> 외벽 상단의 U자 홈에 칸막이가 위에서 아래로 끼워집니다.</li>
          <li><strong>평면 뚜껑 + 핑거:</strong> 닫힌 뚜껑 아래 외벽에 파란색 내부 관통 슬롯이 생성됩니다.</li>
          <li><strong>칸막이 크기 조절:</strong> 각 열과 행의 크기를 개별적으로 지정할 수 있습니다.</li>
        </ul>`,
      zh: `<p>设计 <strong>行 × 列</strong> 网格分隔收纳盒，并导出真实 1:1 比例 <strong>SVG</strong> 和 <strong>DXF</strong> 切割图纸。</p>
        <h3>隔板拼接方式</h3>
        <ul>
          <li><strong>十字半槽插接：</strong> 横纵隔板半高互锁，顶面完全齐平。</li>
          <li><strong>无盖 + 指接：</strong> 隔板从顶部插入外墙的 U 型槽中。</li>
          <li><strong>平盖 + 指接：</strong> 外墙自动生成蓝色内部穿孔槽，在封闭顶盖下牢牢锁定隔板。</li>
          <li><strong>调整分隔尺寸：</strong> 可单独设定每一列和每一行的内部尺寸。</li>
        </ul>`
    },

    'help.polygon': {
      en: `<p>Generate regular <strong>3 to 18-sided</strong> polygon boxes (triangle, pentagon, hexagon, octagon, etc.) with true 1:1 <strong>SVG</strong> and <strong>DXF</strong> export.</p>
        <h3>Size Modes</h3>
        <ul>
          <li><strong>Inside Diameter:</strong> Flat-to-flat inner distance (2 × inside apothem) and <em>Inside Height</em>.</li>
          <li><strong>Outside Diameter:</strong> Outer vertex-to-vertex diameter and <em>Outside Height</em>.</li>
          <li><strong>Side Length:</strong> Inner length of each side wall and <em>Outside Height</em>.</li>
        </ul>
        <h3>Angular Finger Joints</h3>
        <ul>
          <li><strong>Finger:</strong> Vertical side joints are trigonometrically compensated for dihedral angle <em>2π/N</em> for clean interlocking corners.</li>
          <li><strong>Flat:</strong> Plain rectangular walls and smooth polygonal base/top caps.</li>
        </ul>`,
      pt: `<p>Gere caixas poligonais regulares de <strong>3 a 18 lados</strong> (triângulo, pentágono, hexágono, octógono, etc.) com exportação em escala real 1:1 para <strong>SVG</strong> e <strong>DXF</strong>.</p>
        <h3>Modos de Medida</h3>
        <ul>
          <li><strong>Diâmetro Interno:</strong> Distância interna entre faces opostas (2 × apótema interno) e <em>Altura Interna</em>.</li>
          <li><strong>Diâmetro Externo:</strong> Diâmetro externo vértice a vértice e <em>Altura Externa</em>.</li>
          <li><strong>Comprimento do Lado:</strong> Comprimento interno de cada face lateral e <em>Altura Externa</em>.</li>
        </ul>
        <h3>Encaixes Poligonais</h3>
        <ul>
          <li><strong>Dedo (FINGER):</strong> As laterais possuem encaixes com profundidade compensada trigonometricamente pelo ângulo diedro do polígono (<em>2π/N</em>).</li>
          <li><strong>Plano (FLAT):</strong> Paredes laterais retangulares e base/tampa poligonal lisa.</li>
        </ul>`,
      es: `<p>Genera cajas poligonales regulares de <strong>3 a 18 lados</strong> con exportación 1:1 en <strong>SVG</strong> y <strong>DXF</strong>.</p>
        <h3>Modos de Medida</h3>
        <ul>
          <li><strong>Diámetro Interno:</strong> Distancia interna entre caras opuestas y <em>Altura Interna</em>.</li>
          <li><strong>Diámetro Externo:</strong> Diámetro externo vértice a vértice y <em>Altura Externa</em>.</li>
          <li><strong>Longitud del Lado:</strong> Longitud interna de cada pared lateral y <em>Altura Externa</em>.</li>
        </ul>
        <h3>Uniones Poligonales</h3>
        <ul>
          <li><strong>Dedos:</strong> Profundidad compensada trigonométricamente según el ángulo <em>2π/N</em>.</li>
          <li><strong>Plano:</strong> Paredes rectangulares simples y base/tapa poligonal lisa.</li>
        </ul>`,
      it: `<p>Genera scatole poligonali regolari da <strong>3 a 18 lati</strong> con esportazione 1:1 in <strong>SVG</strong> e <strong>DXF</strong>.</p>
        <h3>Modalità di Misura</h3>
        <ul>
          <li><strong>Diametro Interno:</strong> Distanza interna tra lati opposti e <em>Altezza Interna</em>.</li>
          <li><strong>Diametro Esterno:</strong> Diametro esterno vertice-vertice e <em>Altezza Esterna</em>.</li>
          <li><strong>Lunghezza Lato:</strong> Lunghezza interna di ogni parete e <em>Altezza Esterna</em>.</li>
        </ul>
        <h3>Giunti Angolari</h3>
        <ul>
          <li><strong>Incastro:</strong> Profondità compensata trigonometricamente per l’angolo <em>2π/N</em>.</li>
          <li><strong>Piatto:</strong> Pareti rettangolari semplici e base/coperchio poligonale liscio.</li>
        </ul>`,
      fr: `<p>Générez des boîtes polygonales régulières de <strong>3 à 18 côtés</strong> avec export 1:1 en <strong>SVG</strong> et <strong>DXF</strong>.</p>
        <h3>Modes de Mesure</h3>
        <ul>
          <li><strong>Diamètre Interne :</strong> Distance interne entre faces opposées et <em>Hauteur Interne</em>.</li>
          <li><strong>Diamètre Externe :</strong> Diamètre externe sommet à sommet et <em>Hauteur Externe</em>.</li>
          <li><strong>Longueur de Côté :</strong> Longueur interne de chaque paroi et <em>Hauteur Externe</em>.</li>
        </ul>
        <h3>Assemblages Angulaires</h3>
        <ul>
          <li><strong>Doigts :</strong> Profondeur compensée trigonométriquement selon l’angle <em>2π/N</em>.</li>
          <li><strong>Plat :</strong> Parois rectangulaires simples et fond/couvercle lisse.</li>
        </ul>`,
      ja: `<p><strong>3〜18角形</strong>の正多角形ボックスを実寸1:1の<strong>SVG</strong>／<strong>DXF</strong>で生成します。</p>
        <h3>サイズ基準</h3>
        <ul>
          <li><strong>内接直径：</strong> 対辺間の内寸距離と<em>内高さ</em>。</li>
          <li><strong>外接直径：</strong> 頂点間の外寸直径と<em>外高さ</em>。</li>
          <li><strong>辺の長さ：</strong> 各側面の内側長さと<em>外高さ</em>。</li>
        </ul>
        <h3>多角形接合</h3>
        <ul>
          <li><strong>フィンガー：</strong> 多角形の角度（<em>2π/N</em>）に応じて側面タブ深さを三角関数で精密補正。</li>
          <li><strong>フラット：</strong> 単純な長方形側面と滑らかな多角形底・上面。</li>
        </ul>`,
      ko: `<p><strong>3~18각형</strong> 정다각형 박스를 실제 1:1 <strong>SVG</strong> 및 <strong>DXF</strong>로 생성합니다.</p>
        <h3>크기 기준</h3>
        <ul>
          <li><strong>내부 지름:</strong> 마주보는 내벽 간 거리 및 <em>내부 높이</em>.</li>
          <li><strong>외부 지름:</strong> 꼭짓점 간 외부 지름 및 <em>외부 높이</em>.</li>
          <li><strong>변의 길이:</strong> 각 측면 벽의 내부 길이 및 <em>외부 높이</em>.</li>
        </ul>
        <h3>각도 보정 조인트</h3>
        <ul>
          <li><strong>핑거:</strong> 다각형 각도(<em>2π/N</em>)에 맞춰 측면 맞물림 깊이를 삼각함수로 정밀 보정합니다.</li>
          <li><strong>플랫:</strong> 직사각형 측벽과 매끄러운 다각형 바닥/상판.</li>
        </ul>`,
      zh: `<p>生成 <strong>3 至 18 边形</strong> 正多边形盒，支持 1:1 <strong>SVG</strong> 与 <strong>DXF</strong> 导出。</p>
        <h3>尺寸基准</h3>
        <ul>
          <li><strong>内径：</strong> 相对内壁间距与<em>内高度</em>。</li>
          <li><strong>外径：</strong> 外部顶点对角直径与<em>外高度</em>。</li>
          <li><strong>边长：</strong> 单侧内壁长度与<em>外高度</em>。</li>
        </ul>
        <h3>多边形拼接</h3>
        <ul>
          <li><strong>指接：</strong> 按多边形夹角（<em>2π/N</em>）进行三角函数深度补偿，实现精确咬合。</li>
          <li><strong>平接：</strong> 平直矩形侧板与平滑多边形底/顶板。</li>
        </ul>`
    },

    'help.stackable': {
      en: `<p>Design stackable parts and electronics bins with an angled open front scoop and true 1:1 <strong>SVG</strong> / <strong>DXF</strong> export.</p>
        <h3>Key Features</h3>
        <ul>
          <li><strong>Trapezoidal stacking lugs:</strong> Left, right, and back walls feature matching top lugs and bottom notches plus a recessed floor for wobble-free stacking.</li>
          <li><strong>Mortise-and-tenon joints:</strong> Blue interior through-slots receive tabs from the tilted front lip, back wall, floor, and optional dividers.</li>
          <li><strong>Batch (Quantity):</strong> Increase quantity to preview stacked bins in 3D and export the entire batch at once.</li>
        </ul>`,
      pt: `<p>Projete caixas organizadoras empilháveis para parafusos, componentes eletrônicos e peças pequenas, com boca frontal inclinada para fácil acesso e exportação em escala real 1:1 (<strong>SVG</strong> e <strong>DXF</strong>).</p>
        <h3>Recursos Principais</h3>
        <ul>
          <li><strong>Travas de empilhamento trapezoidais:</strong> As laterais e a traseira possuem pinos superiores e recortes inferiores correspondentes, além de fundo elevado para empilhar sem folga.</li>
          <li><strong>Encaixe por furos e espigas:</strong> Os cortes internos em azul recebem as abas da frente inclinada, traseira, fundo e divisórias opcionais.</li>
          <li><strong>Lote (Quantidade):</strong> Aumente a quantidade para pré-visualizar as caixas empilhadas em 3D e exportar o lote completo na chapa.</li>
        </ul>`,
      es: `<p>Diseña cajas apilables para tornillos, electrónica y piezas pequeñas con boca frontal inclinada y exportación 1:1 (<strong>SVG</strong> y <strong>DXF</strong>).</p>
        <h3>Características Principales</h3>
        <ul>
          <li><strong>Trabas trapezoidales de apilamiento:</strong> Laterales y trasera con pestañas superiores y muescas inferiores coincidentes, además de fondo elevado.</li>
          <li><strong>Encastres de caja y espiga:</strong> Las ranuras internas azules reciben las pestañas del frente inclinado, trasera, fondo y divisiones.</li>
          <li><strong>Lote (Cantidad):</strong> Aumenta la cantidad para ver la pila en 3D y exportar el lote completo.</li>
        </ul>`,
      it: `<p>Progetta contenitori impilabili per minuteria e componenti con apertura frontale inclinata ed esportazione 1:1 (<strong>SVG</strong> / <strong>DXF</strong>).</p>
        <h3>Caratteristiche Principali</h3>
        <ul>
          <li><strong>Incastri trapezoidali impilabili:</strong> Pareti laterali e retro con perni superiori e tacche inferiori, più fondo rialzato.</li>
          <li><strong>Giunti a tenone e mortasa:</strong> Le asole interne blu accolgono le linguette di fronte inclinato, retro, fondo e divisori.</li>
          <li><strong>Lotto (Quantità):</strong> Aumenta la quantità per visualizzare la pila 3D ed esportare l’intero lotto.</li>
        </ul>`,
      fr: `<p>Concevez des bacs empilables pour visserie et composants avec ouverture frontale inclinée et export 1:1 (<strong>SVG</strong> / <strong>DXF</strong>).</p>
        <h3>Points Clés</h3>
        <ul>
          <li><strong>Tenons trapézoïdaux d’empilement :</strong> Parois latérales et arrière équipées de tenons supérieurs, encoches inférieures et fond surélevé.</li>
          <li><strong>Assemblage tenon-mortaise :</strong> Les mortaises internes bleues reçoivent les languettes de la façade inclinée, de l’arrière, du fond et des cloisons.</li>
          <li><strong>Lot (Quantité) :</strong> Augmentez la quantité pour voir la pile en 3D et exporter tout le lot.</li>
        </ul>`,
      ja: `<p>取り出しやすい傾斜フロント付きのスタッキングパーツビンを設計し、実寸1:1の<strong>SVG</strong>／<strong>DXF</strong>を出力します。</p>
        <h3>主な特徴</h3>
        <ul>
          <li><strong>台形スタッキング突起：</strong> 左右・背面に噛み合う上下の突起と底上げ床板により安定して積み重ね可能。</li>
          <li><strong>ほぞ差し構造：</strong> 青い貫通スロットに傾斜前面・背面・底板・オプション仕切りのタブがしっかり固定されます。</li>
          <li><strong>バッチ（数量）：</strong> 数量を増やすと3Dで積み重ね状態を確認でき、一括でシート出力できます。</li>
        </ul>`,
      ko: `<p>부품과 전자 소자를 쉽게 꺼낼 수 있는 경사 전면 적재형 부품함을 설계하고 1:1 <strong>SVG</strong> / <strong>DXF</strong>로 내보냅니다.</p>
        <h3>주요 기능</h3>
        <ul>
          <li><strong>사다리꼴 적재 잠금:</strong> 좌우 및 뒷면의 상단 돌기와 하단 홈, 들린 바닥판으로 흔들림 없이 적재됩니다.</li>
          <li><strong>장부 맞춤 조인트:</strong> 파란색 내부 관통 슬롯에 기울어진 전면, 뒷면, 바닥 및 칸막이 탭이 결합됩니다.</li>
          <li><strong>배치(수량):</strong> 수량을 늘려 3D 적재 상태를 미리 보고 전체 수량을 한 번에 내보낼 수 있습니다.</li>
        </ul>`,
      zh: `<p>设计带倾斜前口的零件与电子元件可堆叠收纳盒，支持 1:1 <strong>SVG</strong> 和 <strong>DXF</strong> 导出。</p>
        <h3>主要特性</h3>
        <ul>
          <li><strong>梯形堆叠卡扣：</strong> 左右侧板和背板配有上下对应的梯形卡扣与抬高底板，堆叠稳固。</li>
          <li><strong>插榫穿孔结构：</strong> 蓝色内部穿孔槽与倾斜前板、背板、底板及可选隔板的凸榫精准咬合。</li>
          <li><strong>批量（数量）：</strong> 增加数量可在 3D 中预览多层堆叠效果，并一次性导出整批排版图纸。</li>
        </ul>`
    },

    'help.kerf': {
      en: `<p>Design laser-cut rounded-corner boxes using flexible <strong>living-hinge / kerf bends</strong> (1, 2, or 4 bends) with true 1:1 <strong>SVG</strong> and <strong>DXF</strong> export.</p>
        <h3>Box Styles</h3>
        <ul>
          <li><strong>Open:</strong> Rounded bottom cap (<code>Bottom</code>) + continuous living-hinge wrap wall.</li>
          <li><strong>Closed:</strong> Adds a fixed rounded top cap (<code>Top</code>) with finger joints along straight edges.</li>
          <li><strong>With Lid:</strong> Automatically generates the open curved box <strong>plus a matching concentric curved slip-over lid</strong> with customizable skirt height and fit clearance (toggle <em>Seated</em> or <em>Lifted</em> in 3D).</li>
        </ul>`,
      pt: `<p>Projete caixas com cantos arredondados dobráveis a laser (<strong>living hinge / corte kerf</strong>) com 1, 2 ou 4 dobras e exportação 1:1 em <strong>SVG</strong> e <strong>DXF</strong>.</p>
        <h3>Modos de Caixa</h3>
        <ul>
          <li><strong>Aberta:</strong> Base arredondada (<code>Fundo</code>) + faixa lateral flexível com cortes de dobra nos cantos.</li>
          <li><strong>Fechada:</strong> Adiciona o topo fixo (<code>Superior</code>) com encaixes tipo dedo nos trechos retos.</li>
          <li><strong>Com Tampa:</strong> Gera automaticamente a caixa aberta <strong>+ uma tampa curva sob medida</strong> concêntrica ao raio da caixa, com altura da aba e folga de encaixe configuráveis (pode ser visualizada <em>Encaixada</em> ou <em>Levantada</em> no 3D).</li>
        </ul>`,
      es: `<p>Diseña cajas con esquinas redondeadas plegables por láser (<strong>living hinge / kerf</strong>) de 1, 2 o 4 curvas y exportación 1:1 en <strong>SVG</strong> y <strong>DXF</strong>.</p>
        <h3>Modos de Caja</h3>
        <ul>
          <li><strong>Abierta:</strong> Base redondeada + pared envolvente flexible con cortes de plegado.</li>
          <li><strong>Cerrada:</strong> Añade tapa superior fija con encastres de dedos en los tramos rectos.</li>
          <li><strong>Con Tapa:</strong> Genera la caja abierta <strong>+ una tapa curva concéntrica a medida</strong> con altura y holgura ajustables (vista <em>Encajada</em> o <em>Levantada</em> en 3D).</li>
        </ul>`,
      it: `<p>Progetta scatole con angoli arrotondati pieghevoli al laser (<strong>living hinge / kerf</strong>) a 1, 2 o 4 curve con esportazione 1:1 in <strong>SVG</strong> e <strong>DXF</strong>.</p>
        <h3>Modalità Scatola</h3>
        <ul>
          <li><strong>Aperta:</strong> Base arrotondata + fascia laterale flessibile con tagli di piegatura.</li>
          <li><strong>Chiusa:</strong> Aggiunge un piano superiore fisso con incastri sui tratti dritti.</li>
          <li><strong>Con Coperchio:</strong> Genera la scatola aperta <strong>+ un coperchio curvo concentrico su misura</strong> con altezza e gioco regolabili (<em>Chiusa</em> o <em>Sollevata</em> in 3D).</li>
        </ul>`,
      fr: `<p>Concevez des boîtes à coins arrondis pliables au laser (<strong>living hinge / kerf</strong>) à 1, 2 ou 4 courbes avec export 1:1 en <strong>SVG</strong> et <strong>DXF</strong>.</p>
        <h3>Styles de Boîte</h3>
        <ul>
          <li><strong>Ouverte :</strong> Fond arrondi + bande latérale souple avec fentes de pliage.</li>
          <li><strong>Fermée :</strong> Ajoute un dessus fixe assemblé par doigts sur les côtés droits.</li>
          <li><strong>Avec Couvercle :</strong> Génère la boîte ouverte <strong>+ un couvercle courbé concentrique sur mesure</strong> avec hauteur et jeu réglables (vue <em>Posé</em> ou <em>Soulevé</em> en 3D).</li>
        </ul>`,
      ja: `<p>レーザー加工の<strong>リビングヒンジ（カーフ曲げ）</strong>による角丸ボックス（1・2・4箇所）を実寸1:1の<strong>SVG</strong>／<strong>DXF</strong>で生成します。</p>
        <h3>ボックス形式</h3>
        <ul>
          <li><strong>オープン：</strong> 角丸底板＋カーフスリット入り連続側面シート。</li>
          <li><strong>クローズ：</strong> 直線辺にフィンガー接合を備えた固定上面を追加。</li>
          <li><strong>フタ付き：</strong> オープン角丸ボックスに加え、同じ曲げ半径に同心円状に合わせた<strong>専用カーブ蓋</strong>を自動生成します（高さ・クリアランス調整、3D<em>装着／浮かせ</em>切替対応）。</li>
        </ul>`,
      ko: `<p>레이저 <strong>리빙 힌지(커프 벤딩)</strong> 곡면 모서리 박스(1/2/4면)를 실제 1:1 <strong>SVG</strong> / <strong>DXF</strong>로 설계합니다.</p>
        <h3>박스 유형</h3>
        <ul>
          <li><strong>오픈:</strong> 둥근 바닥판 + 유연한 커프 슬릿 측면 밴드.</li>
          <li><strong>클로즈:</strong> 직선 구간에 핑거 조인트가 적용된 고정 상판을 추가합니다.</li>
          <li><strong>뚜껑 포함:</strong> 오픈 곡면 박스와 함께 반경이 정확히 일치하는 <strong>맞춤형 곡면 뚜껑</strong>을 자동 생성합니다 (높이/여유 조절 및 3D <em>장착/열림</em> 전환).</li>
        </ul>`,
      zh: `<p>设计基于激光<strong>柔性铰链（切缝折弯）</strong>的圆角盒（支持 1、2 或 4 处圆角），导出 1:1 <strong>SVG</strong> 与 <strong>DXF</strong>。</p>
        <h3>盒体类型</h3>
        <ul>
          <li><strong>开口：</strong> 圆角底板 + 带柔性折弯切缝的一体式环绕侧板。</li>
          <li><strong>封闭：</strong> 增加带直线指接的固定圆角顶板。</li>
          <li><strong>配盒盖：</strong> 自动生成开口曲折盒 <strong>+ 配套同心圆角扣合盖</strong>，可调盖高与配合间隙，并支持 3D <em>盖合/抬起</em> 预览。</li>
        </ul>`
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

    // 1b. Explicit data-i18n-key elements (always translated regardless of nesting)
    document.querySelectorAll('[data-i18n-key]').forEach(el => {
      const key = el.getAttribute('data-i18n-key');
      if (DICT[key]) {
        el.textContent = t(key);
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
