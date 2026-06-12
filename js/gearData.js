(function () {
  // Base icon URL builder — XIVAPI hosts all FFXIV icons
  const icon = (path) => `https://xivapi.com/i/${path}.png`;

  window.SLOTS = [
    { id: "weapon", label: "武器",   icon: "fa-khanda"     },
    { id: "head",   label: "頭部",   icon: "fa-crown"      },
    { id: "body",   label: "身體",   icon: "fa-shirt"      },
    { id: "hands",  label: "手部",   icon: "fa-mitten"     },
    { id: "legs",   label: "腿部",   icon: "fa-socks"      },
    { id: "feet",   label: "腳部",   icon: "fa-shoe-prints"},
  ];

  window.DYES = [
    { id: "none",           name: "無染色",       hex: "transparent",  filter: "" },
    { id: "pure_white",     name: "純白染劑",     hex: "#f4f0e8",      filter: "brightness(1.5) contrast(0.8) grayscale(1)" },
    { id: "snow_white",     name: "雪白染劑",     hex: "#e5e2dc",      filter: "brightness(1.2) contrast(0.9) grayscale(1)" },
    { id: "soot_black",     name: "煤黑染劑",     hex: "#282525",      filter: "brightness(0.3) grayscale(1)" },
    { id: "jet_black",      name: "漆黑染劑",     hex: "#111111",      filter: "brightness(0.12) grayscale(1)" },
    { id: "wine_red",       name: "酒紅染劑",     hex: "#45141d",      filter: "sepia(0.8) saturate(3) hue-rotate(315deg) brightness(0.4) contrast(1.1)" },
    { id: "dalamud_red",    name: "衛月紅染劑",   hex: "#781d24",      filter: "sepia(1) saturate(5) hue-rotate(330deg) brightness(0.6) contrast(1.2)" },
    { id: "honey_yellow",   name: "蜂蜜黃染劑",   hex: "#d9ad45",      filter: "sepia(1) saturate(4) hue-rotate(15deg) brightness(0.9)" },
    { id: "ochu_green",     name: "奧修綠染劑",   hex: "#496a3a",      filter: "sepia(1) saturate(3) hue-rotate(70deg) brightness(0.6)" },
    { id: "turquoise",      name: "綠松石染劑",   hex: "#2e8c8b",      filter: "sepia(1) saturate(3) hue-rotate(140deg) brightness(0.7)" },
    { id: "royal_blue",     name: "皇家藍染劑",   hex: "#24366d",      filter: "sepia(1) saturate(4) hue-rotate(200deg) brightness(0.5)" },
    { id: "lavender",       name: "薰衣草染劑",   hex: "#9b82bf",      filter: "sepia(0.8) saturate(2.5) hue-rotate(235deg) brightness(0.7)" },
    { id: "metallic_gold",  name: "金屬金染劑",   hex: "#c9a64e",      filter: "sepia(1) saturate(3) hue-rotate(15deg) brightness(0.8) contrast(1.3)" },
    { id: "metallic_silver",name: "金屬銀染劑",   hex: "#c6cbd2",      filter: "brightness(1.1) grayscale(1) opacity(0.95)" },
  ];

  // ── Gear Database ──────────────────────────────────────────────────────────
  window.GEAR_DATABASE = [
    // ═══════════════════════ WEAPONS ═══════════════════════
    {
      id: "curtana", slot: "weapon",
      name: "柯塔納與神聖盾", en: "Curtana",
      jobs: ["PLD"], role: "坦克", source: "古武", ilvl: 80, trade: false, tone: "#d7b86a",
      icon: icon("030000/030446"),
      showcase_desc: "聖騎士經典古武，劍盾合一的輝光設計。"
    },
    {
      id: "stardust_rod", slot: "weapon",
      name: "星塵之杖", en: "Stardust Rod",
      jobs: ["BLM"], role: "法系輸出", source: "古武", ilvl: 80, trade: false, tone: "#6b58c9",
      icon: icon("033000/033012"),
      showcase_desc: "滿佈星辰的詠咒長杖，餘晖四溢。"
    },
    {
      id: "classical_cane", slot: "weapon",
      name: "古典牧杖", en: "Classical Cane",
      jobs: ["WHM"], role: "治療", source: "製作", ilvl: 580, trade: true, tone: "#f2e5bb",
      icon: icon("032000/032794")
    },
    {
      id: "gae_bolg", slot: "weapon",
      name: "蓋博爾格", en: "Gae Bolg",
      jobs: ["DRG"], role: "近戰輸出", source: "古武", ilvl: 80, trade: false, tone: "#5c82c8",
      icon: icon("031000/031842"),
      showcase_desc: "蒼穹之槍，龍騎士傳奇古武。"
    },
    {
      id: "artemis_bow", slot: "weapon",
      name: "阿提密斯之弓", en: "Artemis Bow",
      jobs: ["BRD"], role: "遠程物理", source: "古武", ilvl: 80, trade: false, tone: "#8ac2a0",
      icon: icon("032000/032238")
    },
    {
      id: "classical_sword", slot: "weapon",
      name: "古典長劍", en: "Classical Longsword",
      jobs: ["PLD"], role: "坦克", source: "製作", ilvl: 580, trade: true, tone: "#ccd2d8",
      icon: icon("030000/030647")
    },
    {
      id: "classical_katana", slot: "weapon",
      name: "古典武士刀", en: "Classical Samurai Blade",
      jobs: ["SAM"], role: "近戰輸出", source: "製作", ilvl: 580, trade: true, tone: "#d4b26a",
      icon: icon("036000/036526")
    },
    {
      id: "diadochos_sword", slot: "weapon",
      name: "狄亞多克斯長劍", en: "Diadochos Sword",
      jobs: ["PLD"], role: "坦克", source: "製作", ilvl: 640, trade: true, tone: "#aeb9c8",
      icon: icon("030000/030667")
    },

    // ═══════════════════════ HEAD ═══════════════════════
    {
      id: "neo_ish_cap_fending", slot: "head",
      name: "新伊修加德御敵帽", en: "Neo-Ishgardian Cap of Fending",
      jobs: ["PLD","WAR","DRK","GNB"], role: "坦克", source: "製作", ilvl: 480, trade: true, tone: "#4a566f",
      icon: icon("041000/041494"),
      showcase_desc: "帶有精美羽毛與軍裝風格的頭盔。"
    },
    {
      id: "neo_ish_hat_casting", slot: "head",
      name: "新伊修加德咏咒帽", en: "Neo-Ishgardian Hat of Casting",
      jobs: ["BLM","SMN","RDM","PCT"], role: "法系輸出", source: "製作", ilvl: 480, trade: true, tone: "#3f304c",
      icon: icon("041000/041493"),
      showcase_desc: "神秘法師寬邊帽，邊緣閃爍魔力光點。"
    },
    {
      id: "classical_hairpin_casting", slot: "head",
      name: "古典咏咒髮飾", en: "Classical Signifer's Horns",
      jobs: ["BLM","SMN","RDM","PCT"], role: "法系輸出", source: "製作", ilvl: 580, trade: true, tone: "#c9a64e",
      icon: icon("041000/041877")
    },
    {
      id: "calfskin_cap", slot: "head",
      name: "小牛皮騎手帽", en: "Calfskin Rider's Cap",
      jobs: ["全職業"], role: "通用", source: "製作", ilvl: 1, trade: true, tone: "#3b302b",
      icon: icon("041000/041520"),
      showcase_desc: "皮質騎手帽，男女版型略有不同。"
    },
    {
      id: "elegant_glasses", slot: "head",
      name: "優雅無框眼鏡", en: "Elegant Rimless Glasses",
      jobs: ["全職業"], role: "通用", source: "製作", ilvl: 1, trade: true, tone: "#c6cbd2",
      icon: icon("040000/040953")
    },
    {
      id: "bunny_circlet", slot: "head",
      name: "兔女郎頭飾", en: "Bunny Chief Crown",
      jobs: ["全職業"], role: "通用", source: "金碟", ilvl: 1, trade: false, tone: "#e8e2dc",
      icon: icon("041000/041304"),
      femaleOnly: true,
      showcase_desc: "金碟限定女性頭飾，配兔女郎套裝最為合適。"
    },

    // ═══════════════════════ BODY ═══════════════════════
    {
      id: "neo_ish_top_fending", slot: "body",
      name: "新伊修加德御敵上衣", en: "Neo-Ishgardian Top of Fending",
      jobs: ["PLD","WAR","DRK","GNB"], role: "坦克", source: "製作", ilvl: 480, trade: true, tone: "#3c465c",
      icon: icon("043000/043511"),
      outfit_src: "images/outfit_neo_ish_fending.png",
      showcase_desc: "新伊修加德防禦胸甲，鎧甲與布料交織的精緻設計。"
    },
    {
      id: "neo_ish_coat_casting", slot: "body",
      name: "新伊修加德咏咒長衣", en: "Neo-Ishgardian Top of Casting",
      jobs: ["BLM","SMN","RDM","PCT"], role: "法系輸出", source: "製作", ilvl: 480, trade: true, tone: "#2f263f",
      icon: icon("043000/043510"),
      outfit_src: "images/outfit_neo_ish_casting.png",
      showcase_desc: "華麗法系大衣，男女版型剪裁差異明顯。"
    },
    {
      id: "classical_chiton_casting", slot: "body",
      name: "古典咏咒長衣", en: "Classical Signifer's Chiton",
      jobs: ["BLM","SMN","RDM","PCT"], role: "法系輸出", source: "製作", ilvl: 580, trade: true, tone: "#d6caa0",
      icon: icon("042000/042788"),
      outfit_src: "images/outfit_classical.png"
    },
    {
      id: "diadochos_jacket_striking", slot: "body",
      name: "狄亞多克斯強襲外套", en: "Diadochos Jacket of Striking",
      jobs: ["MNK","SAM","NIN","VPR"], role: "近戰輸出", source: "製作", ilvl: 640, trade: true, tone: "#7e2431",
      icon: icon("042000/042967"),
      outfit_src: "images/outfit_diadochos.png"
    },
    {
      id: "rebel_coat", slot: "body",
      name: "叛逆者外套", en: "Rebel Coat",
      jobs: ["全職業"], role: "通用", source: "製作", ilvl: 1, trade: true, tone: "#2b2b30",
      icon: icon("042000/042686"),
      outfit_src: "images/outfit_rebel.png",
      showcase_desc: "暗黑風格潮流外套，男女版型各具魅力。"
    },
    {
      id: "calfskin_jacket", slot: "body",
      name: "小牛皮騎手夾克", en: "Calfskin Rider's Jacket",
      jobs: ["全職業"], role: "通用", source: "製作", ilvl: 1, trade: true, tone: "#4d3426",
      icon: icon("042000/042718"),
      outfit_src: "images/outfit_calfskin.png",
      showcase_desc: "小牛皮夾克，男女版型剪裁略有差異。"
    },
    {
      id: "thavnairian_bustier", slot: "body",
      name: "薩維奈胸衣", en: "Thavnairian Bustier",
      jobs: ["全職業"], role: "通用", source: "製作", ilvl: 1, trade: true, tone: "#b43f4e",
      icon: icon("042000/042441"),
      outfit_src: "images/outfit_thavnairian.png",
      femaleOnly: true,
      showcase_desc: "薩維奈舞者風情胸衣，女性限定款式。"
    },
    {
      id: "far_eastern_robe", slot: "body",
      name: "東方軍官長袍", en: "Far Eastern Officer's Robe",
      jobs: ["全職業"], role: "通用", source: "商城", ilvl: 1, trade: false, tone: "#6d2732",
      icon: icon("043000/043846"),
      outfit_src: "images/outfit_fareast.png",
      showcase_desc: "東方風情長袍，商城限定款式。"
    },

    // ═══════════════════════ HANDS ═══════════════════════
    {
      id: "neo_ish_gauntlets", slot: "hands",
      name: "新伊修加德御敵護手", en: "Neo-Ishgardian Gauntlets of Fending",
      jobs: ["PLD","WAR","DRK","GNB"], role: "坦克", source: "製作", ilvl: 480, trade: true, tone: "#4a566f",
      icon: icon("048000/048815")
    },
    {
      id: "classical_gloves_casting", slot: "hands",
      name: "古典咏咒手套", en: "Classical Signifer's Fingerless Gloves",
      jobs: ["BLM","SMN","RDM","PCT"], role: "法系輸出", source: "製作", ilvl: 580, trade: true, tone: "#d6caa0",
      icon: icon("044000/044900")
    },
    {
      id: "diadochos_gloves_striking", slot: "hands",
      name: "狄亞多克斯強襲手套", en: "Diadochos Gloves of Striking",
      jobs: ["MNK","SAM","NIN","VPR"], role: "近戰輸出", source: "製作", ilvl: 640, trade: true, tone: "#7e2431",
      icon: icon("056000/056099")
    },
    {
      id: "calfskin_gloves", slot: "hands",
      name: "小牛皮騎手手套", en: "Calfskin Rider's Gloves",
      jobs: ["全職業"], role: "通用", source: "製作", ilvl: 1, trade: true, tone: "#4d3426",
      icon: icon("044000/044834")
    },
    {
      id: "thavnairian_armlets", slot: "hands",
      name: "薩維奈臂環", en: "Thavnairian Armlets",
      jobs: ["全職業"], role: "通用", source: "製作", ilvl: 1, trade: true, tone: "#c9a64e",
      icon: icon("048000/048263")
    },

    // ═══════════════════════ LEGS ═══════════════════════
    {
      id: "neo_ish_bottoms", slot: "legs",
      name: "新伊修加德御敵打底褲", en: "Neo-Ishgardian Bottoms of Fending",
      jobs: ["PLD","WAR","DRK","GNB"], role: "坦克", source: "製作", ilvl: 480, trade: true, tone: "#313947",
      icon: icon("047000/047285")
    },
    {
      id: "classical_longkilt", slot: "legs",
      name: "古典咏咒長裙", en: "Classical Signifer's Culottes",
      jobs: ["BLM","SMN","RDM","PCT"], role: "法系輸出", source: "製作", ilvl: 580, trade: true, tone: "#d6caa0",
      icon: icon("046000/046044")
    },
    {
      id: "diadochos_trousers", slot: "legs",
      name: "狄亞多克斯強襲長褲", en: "Diadochos Bottoms of Striking",
      jobs: ["MNK","SAM","NIN","VPR"], role: "近戰輸出", source: "製作", ilvl: 640, trade: true, tone: "#502126",
      icon: icon("047000/047997")
    },
    {
      id: "calfskin_bottoms", slot: "legs",
      name: "小牛皮騎手打底褲", en: "Calfskin Rider's Bottoms",
      jobs: ["全職業"], role: "通用", source: "製作", ilvl: 1, trade: true, tone: "#2c2c31",
      icon: icon("047000/047782")
    },
    {
      id: "spring_skirt", slot: "legs",
      name: "春意裙", en: "Spring Skirt",
      jobs: ["全職業"], role: "通用", source: "製作", ilvl: 1, trade: true, tone: "#e4d6c0",
      icon: icon("045000/045428"),
      showcase_desc: "清爽春日短裙，男女版型均有。"
    },

    // ═══════════════════════ FEET ═══════════════════════
    {
      id: "neo_ish_sabatons", slot: "feet",
      name: "新伊修加德御敵鎧靴", en: "Neo-Ishgardian Sollerets of Fending",
      jobs: ["PLD","WAR","DRK","GNB"], role: "坦克", source: "製作", ilvl: 480, trade: true, tone: "#4a566f",
      icon: icon("049000/049233")
    },
    {
      id: "classical_shoes_casting", slot: "feet",
      name: "古典咏咒鞋", en: "Classical Signifer's Caligae",
      jobs: ["BLM","SMN","RDM","PCT"], role: "法系輸出", source: "製作", ilvl: 580, trade: true, tone: "#d6caa0",
      icon: icon("049000/049374")
    },
    {
      id: "diadochos_boots", slot: "feet",
      name: "狄亞多克斯強襲長靴", en: "Diadochos Shoes of Striking",
      jobs: ["MNK","SAM","NIN","VPR"], role: "近戰輸出", source: "製作", ilvl: 640, trade: true, tone: "#7e2431",
      icon: icon("049000/049589")
    },
    {
      id: "calfskin_shoes", slot: "feet",
      name: "小牛皮騎手鞋", en: "Calfskin Rider's Shoes",
      jobs: ["全職業"], role: "通用", source: "製作", ilvl: 1, trade: true, tone: "#4d3426",
      icon: icon("049000/049305")
    },
    {
      id: "thavnairian_sandals", slot: "feet",
      name: "薩維奈涼鞋", en: "Thavnairian Sandals",
      jobs: ["全職業"], role: "通用", source: "製作", ilvl: 1, trade: true, tone: "#c9a64e",
      icon: icon("049000/049844")
    },
  ];

  window.getGearBySlot = (slot) => window.GEAR_DATABASE.filter((i) => i.slot === slot);
})();
