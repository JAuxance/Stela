import { createContext, useContext, useState, type ReactNode } from "react";

export type UiLang = "en" | "fr" | "zh";

export const UI_LANGS: { code: UiLang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "zh", label: "中文" },
];

const KEY = "stela.ui-lang";

export function getUiLang(): UiLang {
  try {
    const v = localStorage.getItem(KEY);
    return v === "en" || v === "fr" || v === "zh" ? v : "en";
  } catch {
    return "en";
  }
}

export function hasUiLang(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

function persist(lang: UiLang) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* ignore */
  }
}

type Dict = Record<string, string>;

const en: Dict = {
  "action.newNote": "New note",
  "action.settings": "Settings",
  "action.connect": "Connect Google Drive",
  "action.disconnect": "Disconnect Drive",
  "action.delete": "Delete",
  "action.retry": "Retry connection",
  "action.retryShort": "Retry",
  "action.apply": "Apply",
  "action.insert": "Insert",
  "action.show": "Show",
  "action.cancel": "Cancel",
  "action.save": "Save",
  "action.close": "Close",

  "sidebar.notes": "Notes",
  "sidebar.emptyConnected": "No notes yet. Create the first with +.",
  "sidebar.emptyDisconnected": "Connect Drive to see your notes.",

  "note.untitled": "Untitled",
  "note.deleteAria": "Delete note",

  "time.now": "just now",
  "time.min": "{n} min ago",
  "time.hour": "{n} h ago",
  "time.day": "{n} d ago",

  "status.offline": "Offline (local draft)",
  "status.connecting": "Connecting…",
  "status.idle": "Ready",
  "status.loading": "Loading…",
  "status.saving": "Saving…",
  "status.saved": "Saved to Drive",
  "status.error": "Sync error",
  "status.conflict": "Conflict — edited elsewhere",
  "status.words": "{n} words",

  "banner.noEnv": "Google Drive isn't configured (.env file). You can write a local draft; set your credentials to save. See the README.",
  "banner.connecting": "Connecting to Google Drive… finish authorizing in your browser.",
  "banner.error": "Sync error.",
  "conflict.message": "This note was edited elsewhere.",
  "conflict.reload": "Reload from Drive",
  "conflict.keepLocal": "Overwrite with my version",
  "confirm.deleteNote": "Permanently delete this note from Google Drive?",

  "tabs.close": "Close tab",
  "tabs.new": "New note",

  "spell.searching": "Searching…",
  "spell.none": "No suggestions",
  "spell.ignore": "Ignore",
  "spell.add": "Add to dictionary",

  "tb.bold": "Bold",
  "tb.italic": "Italic",
  "tb.h1": "Heading 1",
  "tb.h2": "Heading 2",
  "tb.list": "List",
  "tb.tasks": "Tasks",
  "tb.quote": "Quote",
  "tb.code": "Code block",
  "tb.mathInline": "Inline formula ($…$)",
  "tb.mathBlock": "Block formula ($$…$$)",
  "tb.chart": "Chart (data)",
  "tb.diagram": "Diagram (Mermaid)",
  "tb.drawing": "Drawing",
  "tb.image": "Insert image",
  "tb.voice": "Voice note",
  "tb.video": "Insert video",
  "tb.undo": "Undo (Ctrl+Z)",
  "tb.redo": "Redo (Ctrl+Y)",

  "editor.aria": "Note editor",

  "settings.title": "Settings",
  "settings.account": "Google Drive account",
  "settings.connected": "Connected",
  "settings.disconnected": "Not connected",
  "settings.storage": "Storage",
  "settings.folder": "Folder",
  "settings.storageHint": "Google Drive folder where your .md notes are created and read.",
  "settings.storageNote": "Changing the folder reloads the note list. With the drive.file scope, the app manages its own folders; picking an arbitrary existing Drive folder would need the Google Picker.",
  "settings.spellcheck": "Spell checking",
  "settings.spellHintTitle": "Default language when auto-detection isn't confident.",
  "settings.language": "Language",
  "settings.langAuto": "Auto (system)",
  "settings.spellHint": "Takes effect on the next note opened.",
  "settings.interface": "Interface",
  "settings.uiLanguage": "Language",
  "settings.appearance": "Appearance",
  "settings.theme": "Theme",
  "theme.system": "System",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "settings.about": "About",
  "settings.version": "Version",

  "video.title": "Insert a video",
  "video.urlLabel": "Link (YouTube, Vimeo, .mp4)",
  "video.pick": "Choose a video (uploaded to Drive)",
  "video.uploading": "Uploading…",
  "video.needConnect": "Connect Google Drive to upload a local video file.",
  "upload.fail": "Upload failed:",

  "image.title": "Insert an image",
  "image.urlLabel": "Image link (URL)",
  "image.pick": "Choose an image (uploaded to Drive)",
  "image.needConnect": "Connect Google Drive to upload a local image.",

  "audio.title": "Voice note",
  "audio.start": "Allow the microphone to start…",
  "audio.stop": "Stop and save",
  "audio.saving": "Saving to Drive…",
  "audio.micError": "Microphone unavailable:",
  "audio.saveError": "Failed to save to Drive:",

  "draw.empty": "Empty drawing — click ✎ to draw.",
  "draw.title": "Drawing",
  "draw.loading": "Loading the drawing editor…",

  "media.loadingVideo": "Loading the video…",
  "media.loadingAudio": "Loading the audio…",
  "media.loadingImage": "Loading the image…",
  "media.loadFailed": "Couldn't load the file from Drive.",

  "chart.titlePlaceholder": "Chart title",
  "chart.dataPlaceholder": "One value per line:\nJanuary, 12\nFebruary, 19\nMarch, 7",
  "chart.bar": "Bars",
  "chart.line": "Lines",
  "chart.pie": "Pie",
  "chart.doughnut": "Doughnut",
  "chart.radar": "Radar",

  "firstRun.title": "Choose your language",
  "firstRun.subtitle": "You can change it later in Settings.",
};

const fr: Dict = {
  "action.newNote": "Nouvelle note",
  "action.settings": "Réglages",
  "action.connect": "Connecter Google Drive",
  "action.disconnect": "Déconnecter Drive",
  "action.delete": "Supprimer",
  "action.retry": "Réessayer la connexion",
  "action.retryShort": "Réessayer",
  "action.apply": "Appliquer",
  "action.insert": "Insérer",
  "action.show": "Afficher",
  "action.cancel": "Annuler",
  "action.save": "Enregistrer",
  "action.close": "Fermer",

  "sidebar.notes": "Notes",
  "sidebar.emptyConnected": "Aucune note. Crée la première avec +.",
  "sidebar.emptyDisconnected": "Connecte Drive pour voir tes notes.",

  "note.untitled": "Sans titre",
  "note.deleteAria": "Supprimer la note",

  "time.now": "à l'instant",
  "time.min": "il y a {n} min",
  "time.hour": "il y a {n} h",
  "time.day": "il y a {n} j",

  "status.offline": "Hors ligne (brouillon local)",
  "status.connecting": "Connexion…",
  "status.idle": "Prêt",
  "status.loading": "Chargement…",
  "status.saving": "Enregistrement…",
  "status.saved": "Enregistré sur Drive",
  "status.error": "Erreur de synchro",
  "status.conflict": "Conflit — modifiée ailleurs",
  "status.words": "{n} mots",

  "banner.noEnv": "Google Drive n'est pas configuré (fichier .env). Tu peux écrire un brouillon local ; configure tes identifiants pour sauvegarder. Voir le README.",
  "banner.connecting": "Connexion à Google Drive… termine l'autorisation dans ton navigateur.",
  "banner.error": "Erreur de synchronisation.",
  "conflict.message": "Cette note a été modifiée ailleurs.",
  "conflict.reload": "Recharger depuis Drive",
  "conflict.keepLocal": "Écraser avec ma version",
  "confirm.deleteNote": "Supprimer définitivement cette note de Google Drive ?",

  "tabs.close": "Fermer l'onglet",
  "tabs.new": "Nouvelle note",

  "spell.searching": "Recherche…",
  "spell.none": "Aucune suggestion",
  "spell.ignore": "Ignorer",
  "spell.add": "Ajouter au dictionnaire",

  "tb.bold": "Gras",
  "tb.italic": "Italique",
  "tb.h1": "Titre 1",
  "tb.h2": "Titre 2",
  "tb.list": "Liste",
  "tb.tasks": "Tâches",
  "tb.quote": "Citation",
  "tb.code": "Bloc de code",
  "tb.mathInline": "Formule en ligne ($…$)",
  "tb.mathBlock": "Bloc formule ($$…$$)",
  "tb.chart": "Graphique (données)",
  "tb.diagram": "Diagramme (Mermaid)",
  "tb.drawing": "Dessin",
  "tb.image": "Insérer une image",
  "tb.voice": "Note vocale",
  "tb.video": "Insérer une vidéo",
  "tb.undo": "Annuler (Ctrl+Z)",
  "tb.redo": "Rétablir (Ctrl+Y)",

  "editor.aria": "Éditeur de note",

  "settings.title": "Réglages",
  "settings.account": "Compte Google Drive",
  "settings.connected": "Connecté",
  "settings.disconnected": "Non connecté",
  "settings.storage": "Stockage",
  "settings.folder": "Dossier",
  "settings.storageHint": "Dossier Google Drive où tes notes .md sont créées et lues.",
  "settings.storageNote": "Changer de dossier recharge la liste des notes. Avec le périmètre drive.file, l'app gère ses propres dossiers ; choisir un dossier Drive existant arbitraire nécessiterait le Google Picker.",
  "settings.spellcheck": "Correction orthographique",
  "settings.spellHintTitle": "Langue par défaut quand la détection automatique n'est pas sûre.",
  "settings.language": "Langue",
  "settings.langAuto": "Auto (système)",
  "settings.spellHint": "Prend effet à l'ouverture de la prochaine note.",
  "settings.interface": "Interface",
  "settings.uiLanguage": "Langue",
  "settings.appearance": "Apparence",
  "settings.theme": "Thème",
  "theme.system": "Système",
  "theme.light": "Clair",
  "theme.dark": "Sombre",
  "settings.about": "À propos",
  "settings.version": "Version",

  "video.title": "Insérer une vidéo",
  "video.urlLabel": "Lien (YouTube, Vimeo, .mp4)",
  "video.pick": "Choisir une vidéo (uploadée sur Drive)",
  "video.uploading": "Upload en cours…",
  "video.needConnect": "Connecte Google Drive pour uploader un fichier vidéo local.",
  "upload.fail": "Échec de l'upload :",

  "image.title": "Insérer une image",
  "image.urlLabel": "Lien de l'image (URL)",
  "image.pick": "Choisir une image (uploadée sur Drive)",
  "image.needConnect": "Connecte Google Drive pour uploader une image locale.",

  "audio.title": "Note vocale",
  "audio.start": "Autorise le micro pour démarrer…",
  "audio.stop": "Arrêter et enregistrer",
  "audio.saving": "Enregistrement sur Drive…",
  "audio.micError": "Micro indisponible :",
  "audio.saveError": "Échec de l'enregistrement sur Drive :",

  "draw.empty": "Dessin vide — clique sur ✎ pour dessiner.",
  "draw.title": "Dessin",
  "draw.loading": "Chargement de l'éditeur de dessin…",

  "media.loadingVideo": "Chargement de la vidéo…",
  "media.loadingAudio": "Chargement de l'audio…",
  "media.loadingImage": "Chargement de l'image…",
  "media.loadFailed": "Impossible de charger le fichier depuis Drive.",

  "chart.titlePlaceholder": "Titre du graphique",
  "chart.dataPlaceholder": "Une ligne par valeur :\nJanvier, 12\nFévrier, 19\nMars, 7",
  "chart.bar": "Barres",
  "chart.line": "Lignes",
  "chart.pie": "Camembert",
  "chart.doughnut": "Anneau",
  "chart.radar": "Radar",

  "firstRun.title": "Choisis ta langue",
  "firstRun.subtitle": "Tu pourras la changer plus tard dans les réglages.",
};

const zh: Dict = {
  "action.newNote": "新建笔记",
  "action.settings": "设置",
  "action.connect": "连接 Google Drive",
  "action.disconnect": "断开 Drive",
  "action.delete": "删除",
  "action.retry": "重试连接",
  "action.retryShort": "重试",
  "action.apply": "应用",
  "action.insert": "插入",
  "action.show": "显示",
  "action.cancel": "取消",
  "action.save": "保存",
  "action.close": "关闭",

  "sidebar.notes": "笔记",
  "sidebar.emptyConnected": "暂无笔记。点击 + 新建。",
  "sidebar.emptyDisconnected": "连接 Drive 以查看你的笔记。",

  "note.untitled": "无标题",
  "note.deleteAria": "删除笔记",

  "time.now": "刚刚",
  "time.min": "{n} 分钟前",
  "time.hour": "{n} 小时前",
  "time.day": "{n} 天前",

  "status.offline": "离线（本地草稿）",
  "status.connecting": "连接中…",
  "status.idle": "就绪",
  "status.loading": "加载中…",
  "status.saving": "保存中…",
  "status.saved": "已保存到 Drive",
  "status.error": "同步错误",
  "status.conflict": "冲突 — 在别处被修改",
  "status.words": "{n} 字",

  "banner.noEnv": "未配置 Google Drive（.env 文件）。你可以写本地草稿；配置凭据后即可保存。详见 README。",
  "banner.connecting": "正在连接 Google Drive… 请在浏览器中完成授权。",
  "banner.error": "同步错误。",
  "conflict.message": "这条笔记在别处被修改了。",
  "conflict.reload": "从 Drive 重新加载",
  "conflict.keepLocal": "用我的版本覆盖",
  "confirm.deleteNote": "确定要从 Google Drive 永久删除这条笔记吗？",

  "tabs.close": "关闭标签页",
  "tabs.new": "新建笔记",

  "spell.searching": "搜索中…",
  "spell.none": "没有建议",
  "spell.ignore": "忽略",
  "spell.add": "添加到词典",

  "tb.bold": "粗体",
  "tb.italic": "斜体",
  "tb.h1": "标题 1",
  "tb.h2": "标题 2",
  "tb.list": "列表",
  "tb.tasks": "任务",
  "tb.quote": "引用",
  "tb.code": "代码块",
  "tb.mathInline": "行内公式 ($…$)",
  "tb.mathBlock": "公式块 ($$…$$)",
  "tb.chart": "图表（数据）",
  "tb.diagram": "图示 (Mermaid)",
  "tb.drawing": "绘图",
  "tb.image": "插入图片",
  "tb.voice": "语音笔记",
  "tb.video": "插入视频",
  "tb.undo": "撤销 (Ctrl+Z)",
  "tb.redo": "重做 (Ctrl+Y)",

  "editor.aria": "笔记编辑器",

  "settings.title": "设置",
  "settings.account": "Google Drive 账户",
  "settings.connected": "已连接",
  "settings.disconnected": "未连接",
  "settings.storage": "存储",
  "settings.folder": "文件夹",
  "settings.storageHint": "用于创建和读取 .md 笔记的 Google Drive 文件夹。",
  "settings.storageNote": "更改文件夹会重新加载笔记列表。在 drive.file 权限下，应用管理自己的文件夹；选择任意已有的 Drive 文件夹需要 Google Picker。",
  "settings.spellcheck": "拼写检查",
  "settings.spellHintTitle": "自动检测不确定时使用的默认语言。",
  "settings.language": "语言",
  "settings.langAuto": "自动（系统）",
  "settings.spellHint": "下次打开笔记时生效。",
  "settings.interface": "界面",
  "settings.uiLanguage": "语言",
  "settings.appearance": "外观",
  "settings.theme": "主题",
  "theme.system": "跟随系统",
  "theme.light": "浅色",
  "theme.dark": "深色",
  "settings.about": "关于",
  "settings.version": "版本",

  "video.title": "插入视频",
  "video.urlLabel": "链接（YouTube、Vimeo、.mp4）",
  "video.pick": "选择视频（上传到 Drive）",
  "video.uploading": "上传中…",
  "video.needConnect": "连接 Google Drive 以上传本地视频文件。",
  "upload.fail": "上传失败：",

  "image.title": "插入图片",
  "image.urlLabel": "图片链接（URL）",
  "image.pick": "选择图片（上传到 Drive）",
  "image.needConnect": "连接 Google Drive 以上传本地图片。",

  "audio.title": "语音笔记",
  "audio.start": "请允许使用麦克风以开始…",
  "audio.stop": "停止并保存",
  "audio.saving": "保存到 Drive…",
  "audio.micError": "麦克风不可用：",
  "audio.saveError": "保存到 Drive 失败：",

  "draw.empty": "空白绘图 — 点击 ✎ 开始绘制。",
  "draw.title": "绘图",
  "draw.loading": "正在加载绘图编辑器…",

  "media.loadingVideo": "正在加载视频…",
  "media.loadingAudio": "正在加载音频…",
  "media.loadingImage": "正在加载图片…",
  "media.loadFailed": "无法从 Drive 加载文件。",

  "chart.titlePlaceholder": "图表标题",
  "chart.dataPlaceholder": "每行一个值：\n一月, 12\n二月, 19\n三月, 7",
  "chart.bar": "柱状图",
  "chart.line": "折线图",
  "chart.pie": "饼图",
  "chart.doughnut": "环形图",
  "chart.radar": "雷达图",

  "firstRun.title": "选择你的语言",
  "firstRun.subtitle": "之后可在设置中更改。",
};

const DICT: Record<UiLang, Dict> = { en, fr, zh };

export type TFn = (key: string, params?: Record<string, string | number>) => string;

interface I18nValue {
  lang: UiLang;
  t: TFn;
  setLang: (lang: UiLang) => void;
}

const I18nContext = createContext<I18nValue>({
  lang: "en",
  t: (k) => k,
  setLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<UiLang>(getUiLang);

  const setLang = (next: UiLang) => {
    persist(next);
    setLangState(next);
  };

  const t: TFn = (key, params) => {
    let s = DICT[lang][key] ?? DICT.en[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
    }
    return s;
  };

  return <I18nContext.Provider value={{ lang, t, setLang }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
