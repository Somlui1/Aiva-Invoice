// Retained runtime module. Dynamic DOM remains owned by this compatibility layer.
export function initializeCore() {
Object.defineProperty(window, "COMPANY", { configurable: true, get: () => COMPANY });
Object.defineProperty(window, "ORG", { configurable: true, get: () => ORG });
Object.defineProperty(window, "companyOfOrg", { configurable: true, get: () => companyOfOrg });
Object.defineProperty(window, "companyOfTax", { configurable: true, get: () => companyOfTax });
Object.defineProperty(window, "PERM", { configurable: true, get: () => PERM });
Object.defineProperty(window, "ROLES", { configurable: true, get: () => ROLES });
Object.defineProperty(window, "USERS", { configurable: true, get: () => USERS });
Object.defineProperty(window, "MAPS", { configurable: true, get: () => MAPS });
Object.defineProperty(window, "acctsOf", { configurable: true, get: () => acctsOf });
Object.defineProperty(window, "bound", { configurable: true, get: () => bound });
Object.defineProperty(window, "ME", { configurable: true, get: () => ME, set: value => { ME = value; } });
Object.defineProperty(window, "can", { configurable: true, get: () => can });
Object.defineProperty(window, "EXC", { configurable: true, get: () => EXC });
Object.defineProperty(window, "EUCODES", { configurable: true, get: () => EUCODES });
Object.defineProperty(window, "RULES", { configurable: true, get: () => RULES });
Object.defineProperty(window, "RSTEP", { configurable: true, get: () => RSTEP });
Object.defineProperty(window, "P", { configurable: true, get: () => P });
Object.defineProperty(window, "F", { configurable: true, get: () => F });
Object.defineProperty(window, "N", { configurable: true, get: () => N });
Object.defineProperty(window, "M", { configurable: true, get: () => M });
Object.defineProperty(window, "R", { configurable: true, get: () => R });
Object.defineProperty(window, "DMS_BASE", { configurable: true, get: () => DMS_BASE });
Object.defineProperty(window, "DOCS", { configurable: true, get: () => DOCS });
Object.defineProperty(window, "UR", { configurable: true, get: () => UR });
Object.defineProperty(window, "BATCHES", { configurable: true, get: () => BATCHES });
Object.defineProperty(window, "AUDIT", { configurable: true, get: () => AUDIT });
Object.defineProperty(window, "setOwner", { configurable: true, get: () => setOwner, set: value => { setOwner = value; } });
Object.defineProperty(window, "uName", { configurable: true, get: () => uName });
Object.defineProperty(window, "COMPANY_EN", { configurable: true, get: () => COMPANY_EN });
Object.defineProperty(window, "I", { configurable: true, get: () => I });
Object.defineProperty(window, "icon", { configurable: true, get: () => icon });
Object.defineProperty(window, "page", { configurable: true, get: () => page, set: value => { page = value; } });
Object.defineProperty(window, "sel", { configurable: true, get: () => sel, set: value => { sel = value; } });
Object.defineProperty(window, "tab", { configurable: true, get: () => tab, set: value => { tab = value; } });
Object.defineProperty(window, "filt", { configurable: true, get: () => filt, set: value => { filt = value; } });
Object.defineProperty(window, "coF", { configurable: true, get: () => coF, set: value => { coF = value; } });
Object.defineProperty(window, "view", { configurable: true, get: () => view, set: value => { view = value; } });
Object.defineProperty(window, "qText", { configurable: true, get: () => qText, set: value => { qText = value; } });
Object.defineProperty(window, "RM", { configurable: true, get: () => RM });
Object.defineProperty(window, "PDF", { configurable: true, get: () => PDF });
Object.defineProperty(window, "$", { configurable: true, get: () => $ });
Object.defineProperty(window, "B", { configurable: true, get: () => B });
Object.defineProperty(window, "now", { configurable: true, get: () => now });
Object.defineProperty(window, "esc", { configurable: true, get: () => esc });
Object.defineProperty(window, "badge", { configurable: true, get: () => badge });
Object.defineProperty(window, "sevOf", { configurable: true, get: () => sevOf });
Object.defineProperty(window, "docOf", { configurable: true, get: () => docOf });
Object.defineProperty(window, "scopeCheck", { configurable: true, get: () => scopeCheck, set: value => { scopeCheck = value; } });
Object.defineProperty(window, "visible", { configurable: true, get: () => visible });
Object.defineProperty(window, "log", { configurable: true, get: () => log, set: value => { log = value; } });
Object.defineProperty(window, "storageGet", { configurable: true, get: () => storageGet, set: value => { storageGet = value; } });
Object.defineProperty(window, "storageSet", { configurable: true, get: () => storageSet, set: value => { storageSet = value; } });
Object.defineProperty(window, "init", { configurable: true, get: () => init, set: value => { init = value; } });
Object.defineProperty(window, "toggleNav", { configurable: true, get: () => toggleNav, set: value => { toggleNav = value; } });
Object.defineProperty(window, "switchUser", { configurable: true, get: () => switchUser, set: value => { switchUser = value; } });
Object.defineProperty(window, "go", { configurable: true, get: () => go, set: value => { go = value; } });
Object.defineProperty(window, "renderNav", { configurable: true, get: () => renderNav, set: value => { renderNav = value; } });
Object.defineProperty(window, "render", { configurable: true, get: () => render, set: value => { render = value; } });
Object.defineProperty(window, "match", { configurable: true, get: () => match, set: value => { match = value; } });
Object.defineProperty(window, "TODAY", { configurable: true, get: () => TODAY });
Object.defineProperty(window, "OPEN_ST", { configurable: true, get: () => OPEN_ST });
Object.defineProperty(window, "PER_OPT", { configurable: true, get: () => PER_OPT });
Object.defineProperty(window, "PERS", { configurable: true, get: () => PERS });
Object.defineProperty(window, "isoD", { configurable: true, get: () => isoD });
Object.defineProperty(window, "dAdd", { configurable: true, get: () => dAdd });
Object.defineProperty(window, "mRange", { configurable: true, get: () => mRange });
Object.defineProperty(window, "perRange", { configurable: true, get: () => perRange, set: value => { perRange = value; } });
Object.defineProperty(window, "inPerOf", { configurable: true, get: () => inPerOf });
Object.defineProperty(window, "inPer", { configurable: true, get: () => inPer });
Object.defineProperty(window, "dmy", { configurable: true, get: () => dmy });
Object.defineProperty(window, "perLabel", { configurable: true, get: () => perLabel, set: value => { perLabel = value; } });
Object.defineProperty(window, "ageDays", { configurable: true, get: () => ageDays });
Object.defineProperty(window, "agePill", { configurable: true, get: () => agePill });
Object.defineProperty(window, "perKey", { configurable: true, get: () => perKey });
Object.defineProperty(window, "perDefault", { configurable: true, get: () => perDefault });
Object.defineProperty(window, "perLoad", { configurable: true, get: () => perLoad, set: value => { perLoad = value; } });
Object.defineProperty(window, "perCtl", { configurable: true, get: () => perCtl, set: value => { perCtl = value; } });
Object.defineProperty(window, "perSet", { configurable: true, get: () => perSet, set: value => { perSet = value; } });
Object.defineProperty(window, "staleOut", { configurable: true, get: () => staleOut });
Object.defineProperty(window, "filtersOn", { configurable: true, get: () => filtersOn });
Object.defineProperty(window, "clearFilters", { configurable: true, get: () => clearFilters, set: value => { clearFilters = value; } });
Object.defineProperty(window, "listFilter", { configurable: true, get: () => listFilter, set: value => { listFilter = value; } });
Object.defineProperty(window, "KPI_META", { configurable: true, get: () => KPI_META });
Object.defineProperty(window, "kpiNote", { configurable: true, get: () => kpiNote, set: value => { kpiNote = value; } });
Object.defineProperty(window, "queuePage", { configurable: true, get: () => queuePage, set: value => { queuePage = value; } });
Object.defineProperty(window, "drawTop", { configurable: true, get: () => drawTop, set: value => { drawTop = value; } });
Object.defineProperty(window, "drawStale", { configurable: true, get: () => drawStale, set: value => { drawStale = value; } });
Object.defineProperty(window, "togCo", { configurable: true, get: () => togCo, set: value => { togCo = value; } });
Object.defineProperty(window, "setView", { configurable: true, get: () => setView, set: value => { setView = value; } });
Object.defineProperty(window, "curList", { configurable: true, get: () => curList, set: value => { curList = value; } });
Object.defineProperty(window, "drawList", { configurable: true, get: () => drawList, set: value => { drawList = value; } });
Object.defineProperty(window, "pick", { configurable: true, get: () => pick, set: value => { pick = value; } });
Object.defineProperty(window, "mBack", { configurable: true, get: () => mBack, set: value => { mBack = value; } });
Object.defineProperty(window, "drawTable", { configurable: true, get: () => drawTable, set: value => { drawTable = value; } });
Object.defineProperty(window, "drawTableRows", { configurable: true, get: () => drawTableRows, set: value => { drawTableRows = value; } });
Object.defineProperty(window, "rowKey", { configurable: true, get: () => rowKey, set: value => { rowKey = value; } });
Object.defineProperty(window, "openFromTable", { configurable: true, get: () => openFromTable, set: value => { openFromTable = value; } });
Object.defineProperty(window, "backToTable", { configurable: true, get: () => backToTable, set: value => { backToTable = value; } });
Object.defineProperty(window, "scrollMem", { configurable: true, get: () => scrollMem, set: value => { scrollMem = value; } });
Object.defineProperty(window, "drawDetail", { configurable: true, get: () => drawDetail, set: value => { drawDetail = value; } });
Object.defineProperty(window, "tabTo", { configurable: true, get: () => tabTo, set: value => { tabTo = value; } });
Object.defineProperty(window, "sumPane", { configurable: true, get: () => sumPane, set: value => { sumPane = value; } });
Object.defineProperty(window, "linesPane", { configurable: true, get: () => linesPane, set: value => { linesPane = value; } });
Object.defineProperty(window, "rulesPane", { configurable: true, get: () => rulesPane, set: value => { rulesPane = value; } });
Object.defineProperty(window, "ownPane", { configurable: true, get: () => ownPane, set: value => { ownPane = value; } });
Object.defineProperty(window, "jsonPane", { configurable: true, get: () => jsonPane, set: value => { jsonPane = value; } });
Object.defineProperty(window, "logPane", { configurable: true, get: () => logPane, set: value => { logPane = value; } });
Object.defineProperty(window, "custOf", { configurable: true, get: () => custOf, set: value => { custOf = value; } });
Object.defineProperty(window, "toJSON", { configurable: true, get: () => toJSON, set: value => { toJSON = value; } });
Object.defineProperty(window, "VENDOR_TH", { configurable: true, get: () => VENDOR_TH });
Object.defineProperty(window, "CUST_TH", { configurable: true, get: () => CUST_TH });
Object.defineProperty(window, "BR_ADDR", { configurable: true, get: () => BR_ADDR });
Object.defineProperty(window, "PAGE_W", { configurable: true, get: () => PAGE_W });
Object.defineProperty(window, "PAGE_H", { configurable: true, get: () => PAGE_H });
Object.defineProperty(window, "bahtText", { configurable: true, get: () => bahtText, set: value => { bahtText = value; } });
Object.defineProperty(window, "thDate", { configurable: true, get: () => thDate });
Object.defineProperty(window, "addDays", { configurable: true, get: () => addDays });
Object.defineProperty(window, "seedR", { configurable: true, get: () => seedR, set: value => { seedR = value; } });
Object.defineProperty(window, "sigSvg", { configurable: true, get: () => sigSvg, set: value => { sigSvg = value; } });
Object.defineProperty(window, "stamp", { configurable: true, get: () => stamp });
Object.defineProperty(window, "ivPage", { configurable: true, get: () => ivPage, set: value => { ivPage = value; } });
Object.defineProperty(window, "boxOf", { configurable: true, get: () => boxOf, set: value => { boxOf = value; } });
Object.defineProperty(window, "regions", { configurable: true, get: () => regions, set: value => { regions = value; } });
Object.defineProperty(window, "hasRegion", { configurable: true, get: () => hasRegion, set: value => { hasRegion = value; } });
Object.defineProperty(window, "evidenceOf", { configurable: true, get: () => evidenceOf, set: value => { evidenceOf = value; } });
Object.defineProperty(window, "pageEl", { configurable: true, get: () => pageEl, set: value => { pageEl = value; } });
Object.defineProperty(window, "placeOverlays", { configurable: true, get: () => placeOverlays, set: value => { placeOverlays = value; } });
Object.defineProperty(window, "qHide", { configurable: true, get: () => qHide, set: value => { qHide = value; } });
Object.defineProperty(window, "qPrev", { configurable: true, get: () => qPrev, set: value => { qPrev = value; } });
Object.defineProperty(window, "openDMS", { configurable: true, get: () => openDMS, set: value => { openDMS = value; } });
Object.defineProperty(window, "togglePdf", { configurable: true, get: () => togglePdf, set: value => { togglePdf = value; } });
Object.defineProperty(window, "closeDock", { configurable: true, get: () => closeDock, set: value => { closeDock = value; } });
Object.defineProperty(window, "toggleQueue", { configurable: true, get: () => toggleQueue, set: value => { toggleQueue = value; } });
Object.defineProperty(window, "peekQueue", { configurable: true, get: () => peekQueue, set: value => { peekQueue = value; } });
Object.defineProperty(window, "stepDoc", { configurable: true, get: () => stepDoc, set: value => { stepDoc = value; } });
Object.defineProperty(window, "queueBtns", { configurable: true, get: () => queueBtns, set: value => { queueBtns = value; } });
Object.defineProperty(window, "MO", { configurable: true, get: () => MO });
Object.defineProperty(window, "animT", { configurable: true, get: () => animT, set: value => { animT = value; } });
Object.defineProperty(window, "renderSeq", { configurable: true, get: () => renderSeq, set: value => { renderSeq = value; } });
Object.defineProperty(window, "markAnim", { configurable: true, get: () => markAnim, set: value => { markAnim = value; } });
Object.defineProperty(window, "animating", { configurable: true, get: () => animating });
Object.defineProperty(window, "setPdfMode", { configurable: true, get: () => setPdfMode, set: value => { setPdfMode = value; } });
Object.defineProperty(window, "pdfGo", { configurable: true, get: () => pdfGo, set: value => { pdfGo = value; } });
Object.defineProperty(window, "evGo", { configurable: true, get: () => evGo, set: value => { evGo = value; } });
Object.defineProperty(window, "pdfZoom", { configurable: true, get: () => pdfZoom, set: value => { pdfZoom = value; } });
Object.defineProperty(window, "fitPages", { configurable: true, get: () => fitPages, set: value => { fitPages = value; } });
Object.defineProperty(window, "printDoc", { configurable: true, get: () => printDoc, set: value => { printDoc = value; } });
Object.defineProperty(window, "syncDock", { configurable: true, get: () => syncDock, set: value => { syncDock = value; } });
Object.defineProperty(window, "renderDoc", { configurable: true, get: () => renderDoc, set: value => { renderDoc = value; } });
Object.defineProperty(window, "dockChrome", { configurable: true, get: () => dockChrome, set: value => { dockChrome = value; } });
Object.defineProperty(window, "scrollEvd", { configurable: true, get: () => scrollEvd, set: value => { scrollEvd = value; } });
Object.defineProperty(window, "scrollEvPage", { configurable: true, get: () => scrollEvPage, set: value => { scrollEvPage = value; } });
Object.defineProperty(window, "applyFocus", { configurable: true, get: () => applyFocus, set: value => { applyFocus = value; } });
Object.defineProperty(window, "evScrollT", { configurable: true, get: () => evScrollT, set: value => { evScrollT = value; } });
Object.defineProperty(window, "onEvScroll", { configurable: true, get: () => onEvScroll, set: value => { onEvScroll = value; } });
Object.defineProperty(window, "rzStart", { configurable: true, get: () => rzStart, set: value => { rzStart = value; } });
Object.defineProperty(window, "syncDockVars", { configurable: true, get: () => syncDockVars, set: value => { syncDockVars = value; } });
Object.defineProperty(window, "rzReset", { configurable: true, get: () => rzReset, set: value => { rzReset = value; } });
Object.defineProperty(window, "testDocDom", { configurable: true, get: () => testDocDom, set: value => { testDocDom = value; } });
Object.defineProperty(window, "runTests", { configurable: true, get: () => runTests, set: value => { runTests = value; } });
Object.defineProperty(window, "RANK", { configurable: true, get: () => RANK });
Object.defineProperty(window, "hasHigh", { configurable: true, get: () => hasHigh });
Object.defineProperty(window, "euPending", { configurable: true, get: () => euPending });
Object.defineProperty(window, "allowed", { configurable: true, get: () => allowed, set: value => { allowed = value; } });
Object.defineProperty(window, "BTN", { configurable: true, get: () => BTN });
Object.defineProperty(window, "abtn", { configurable: true, get: () => abtn, set: value => { abtn = value; } });
Object.defineProperty(window, "actions", { configurable: true, get: () => actions, set: value => { actions = value; } });
Object.defineProperty(window, "openOld", { configurable: true, get: () => openOld, set: value => { openOld = value; } });
Object.defineProperty(window, "act", { configurable: true, get: () => act, set: value => { act = value; } });
Object.defineProperty(window, "CFG", { configurable: true, get: () => CFG });
Object.defineProperty(window, "REASON", { configurable: true, get: () => REASON });
Object.defineProperty(window, "openM", { configurable: true, get: () => openM, set: value => { openM = value; } });
Object.defineProperty(window, "doUpload", { configurable: true, get: () => doUpload, set: value => { doUpload = value; } });
Object.defineProperty(window, "doAct", { configurable: true, get: () => doAct, set: value => { doAct = value; } });
Object.defineProperty(window, "TONE", { configurable: true, get: () => TONE });
Object.defineProperty(window, "modal", { configurable: true, get: () => modal, set: value => { modal = value; } });
Object.defineProperty(window, "closeM", { configurable: true, get: () => closeM, set: value => { closeM = value; } });
Object.defineProperty(window, "toast", { configurable: true, get: () => toast, set: value => { toast = value; } });
Object.defineProperty(window, "copyTxt", { configurable: true, get: () => copyTxt, set: value => { copyTxt = value; } });
Object.defineProperty(window, "apTab", { configurable: true, get: () => apTab, set: value => { apTab = value; } });
Object.defineProperty(window, "apSel", { configurable: true, get: () => apSel, set: value => { apSel = value; } });
Object.defineProperty(window, "apF", { configurable: true, get: () => apF, set: value => { apF = value; } });
Object.defineProperty(window, "AP_TABS", { configurable: true, get: () => AP_TABS });
Object.defineProperty(window, "goAP", { configurable: true, get: () => goAP, set: value => { goAP = value; } });
Object.defineProperty(window, "apRows", { configurable: true, get: () => apRows, set: value => { apRows = value; } });
Object.defineProperty(window, "precheck", { configurable: true, get: () => precheck, set: value => { precheck = value; } });
Object.defineProperty(window, "openFromAP", { configurable: true, get: () => openFromAP, set: value => { openFromAP = value; } });
Object.defineProperty(window, "apPage", { configurable: true, get: () => apPage, set: value => { apPage = value; } });
Object.defineProperty(window, "apTog", { configurable: true, get: () => apTog, set: value => { apTog = value; } });
Object.defineProperty(window, "apAll", { configurable: true, get: () => apAll, set: value => { apAll = value; } });
Object.defineProperty(window, "apPre", { configurable: true, get: () => apPre, set: value => { apPre = value; } });
Object.defineProperty(window, "apOpenSend", { configurable: true, get: () => apOpenSend, set: value => { apOpenSend = value; } });
Object.defineProperty(window, "apDoSend", { configurable: true, get: () => apDoSend, set: value => { apDoSend = value; } });
Object.defineProperty(window, "apImport", { configurable: true, get: () => apImport, set: value => { apImport = value; } });
Object.defineProperty(window, "apOpenReturn", { configurable: true, get: () => apOpenReturn, set: value => { apOpenReturn = value; } });
Object.defineProperty(window, "apDoReturn", { configurable: true, get: () => apDoReturn, set: value => { apDoReturn = value; } });
Object.defineProperty(window, "casesPage", { configurable: true, get: () => casesPage, set: value => { casesPage = value; } });
Object.defineProperty(window, "rbacPage", { configurable: true, get: () => rbacPage, set: value => { rbacPage = value; } });
Object.defineProperty(window, "auditPage", { configurable: true, get: () => auditPage, set: value => { auditPage = value; } });
Object.defineProperty(window, "PSTD", { configurable: true, get: () => PSTD });
Object.defineProperty(window, "REC_ENUM", { configurable: true, get: () => REC_ENUM });
Object.defineProperty(window, "ID_ENUM", { configurable: true, get: () => ID_ENUM });
Object.defineProperty(window, "ES", { configurable: true, get: () => ES });
Object.defineProperty(window, "SEV", { configurable: true, get: () => SEV });
Object.defineProperty(window, "CRULE", { configurable: true, get: () => CRULE });
Object.defineProperty(window, "AP_ST", { configurable: true, get: () => AP_ST });
Object.defineProperty(window, "CLOSED_ST", { configurable: true, get: () => CLOSED_ST });
Object.defineProperty(window, "isActive", { configurable: true, get: () => isActive });
Object.defineProperty(window, "FORBID", { configurable: true, get: () => FORBID });
Object.defineProperty(window, "SUPS", { configurable: true, get: () => SUPS });
Object.defineProperty(window, "SIMD", { configurable: true, get: () => SIMD });
Object.defineProperty(window, "SPEC", { configurable: true, get: () => SPEC });
Object.defineProperty(window, "getP", { configurable: true, get: () => getP });
Object.defineProperty(window, "validatePayload", { configurable: true, get: () => validatePayload, set: value => { validatePayload = value; } });
Object.defineProperty(window, "fh", { configurable: true, get: () => fh, set: value => { fh = value; } });
Object.defineProperty(window, "pad", { configurable: true, get: () => pad });
Object.defineProperty(window, "newMsg", { configurable: true, get: () => newMsg, set: value => { newMsg = value; } });
Object.defineProperty(window, "empOf", { configurable: true, get: () => empOf });
Object.defineProperty(window, "mkPayload", { configurable: true, get: () => mkPayload, set: value => { mkPayload = value; } });
Object.defineProperty(window, "freshSim", { configurable: true, get: () => freshSim, set: value => { freshSim = value; } });
Object.defineProperty(window, "SIM", { configurable: true, get: () => SIM, set: value => { SIM = value; } });
Object.defineProperty(window, "nextRid", { configurable: true, get: () => nextRid });
Object.defineProperty(window, "nextInv", { configurable: true, get: () => nextInv });
Object.defineProperty(window, "simWho", { configurable: true, get: () => simWho, set: value => { simWho = value; } });
Object.defineProperty(window, "simActor", { configurable: true, get: () => simActor, set: value => { simActor = value; } });
Object.defineProperty(window, "simDup", { configurable: true, get: () => simDup, set: value => { simDup = value; } });
Object.defineProperty(window, "simLog", { configurable: true, get: () => simLog, set: value => { simLog = value; } });
Object.defineProperty(window, "simIngest", { configurable: true, get: () => simIngest, set: value => { simIngest = value; } });
Object.defineProperty(window, "SACT", { configurable: true, get: () => SACT });
Object.defineProperty(window, "simActs", { configurable: true, get: () => simActs, set: value => { simActs = value; } });
Object.defineProperty(window, "simBlock", { configurable: true, get: () => simBlock, set: value => { simBlock = value; } });
Object.defineProperty(window, "simActBy", { configurable: true, get: () => simActBy, set: value => { simActBy = value; } });
Object.defineProperty(window, "simApply", { configurable: true, get: () => simApply, set: value => { simApply = value; } });
Object.defineProperty(window, "simDo", { configurable: true, get: () => simDo, set: value => { simDo = value; } });
Object.defineProperty(window, "simSeed", { configurable: true, get: () => simSeed, set: value => { simSeed = value; } });
Object.defineProperty(window, "PRESETS", { configurable: true, get: () => PRESETS });
Object.defineProperty(window, "presetOf", { configurable: true, get: () => presetOf });
Object.defineProperty(window, "simLoadPreset", { configurable: true, get: () => simLoadPreset, set: value => { simLoadPreset = value; } });
Object.defineProperty(window, "simParse", { configurable: true, get: () => simParse, set: value => { simParse = value; } });
Object.defineProperty(window, "simValidate", { configurable: true, get: () => simValidate, set: value => { simValidate = value; } });
Object.defineProperty(window, "simSend", { configurable: true, get: () => simSend, set: value => { simSend = value; } });
Object.defineProperty(window, "simNewMsg", { configurable: true, get: () => simNewMsg, set: value => { simNewMsg = value; } });
Object.defineProperty(window, "simRescan", { configurable: true, get: () => simRescan, set: value => { simRescan = value; } });
Object.defineProperty(window, "simFromForm", { configurable: true, get: () => simFromForm, set: value => { simFromForm = value; } });
Object.defineProperty(window, "simReset", { configurable: true, get: () => simReset, set: value => { simReset = value; } });
Object.defineProperty(window, "simRefresh", { configurable: true, get: () => simRefresh, set: value => { simRefresh = value; } });
Object.defineProperty(window, "simTab", { configurable: true, get: () => simTab, set: value => { simTab = value; } });
Object.defineProperty(window, "simPick", { configurable: true, get: () => simPick, set: value => { simPick = value; } });
Object.defineProperty(window, "MCOLS", { configurable: true, get: () => MCOLS });
Object.defineProperty(window, "MROWS", { configurable: true, get: () => MROWS });
Object.defineProperty(window, "mExpect", { configurable: true, get: () => mExpect, set: value => { mExpect = value; } });
Object.defineProperty(window, "mBase", { configurable: true, get: () => mBase, set: value => { mBase = value; } });
Object.defineProperty(window, "mNew", { configurable: true, get: () => mNew, set: value => { mNew = value; } });
Object.defineProperty(window, "sandboxed", { configurable: true, get: () => sandboxed, set: value => { sandboxed = value; } });
Object.defineProperty(window, "mRun", { configurable: true, get: () => mRun, set: value => { mRun = value; } });
Object.defineProperty(window, "XTESTS", { configurable: true, get: () => XTESTS });
Object.defineProperty(window, "simRunAll", { configurable: true, get: () => simRunAll, set: value => { simRunAll = value; } });
Object.defineProperty(window, "simMatrixLoad", { configurable: true, get: () => simMatrixLoad, set: value => { simMatrixLoad = value; } });
Object.defineProperty(window, "tsIcon", { configurable: true, get: () => tsIcon });
Object.defineProperty(window, "rchip", { configurable: true, get: () => rchip });
Object.defineProperty(window, "idTag", { configurable: true, get: () => idTag });
Object.defineProperty(window, "stateMap", { configurable: true, get: () => stateMap, set: value => { stateMap = value; } });
Object.defineProperty(window, "simPage", { configurable: true, get: () => simPage, set: value => { simPage = value; } });
Object.defineProperty(window, "simConsole", { configurable: true, get: () => simConsole, set: value => { simConsole = value; } });
Object.defineProperty(window, "simDetail", { configurable: true, get: () => simDetail, set: value => { simDetail = value; } });
Object.defineProperty(window, "simLedger", { configurable: true, get: () => simLedger, set: value => { simLedger = value; } });
Object.defineProperty(window, "simIngestLog", { configurable: true, get: () => simIngestLog, set: value => { simIngestLog = value; } });
Object.defineProperty(window, "simLife", { configurable: true, get: () => simLife, set: value => { simLife = value; } });
Object.defineProperty(window, "simMatrix", { configurable: true, get: () => simMatrix, set: value => { simMatrix = value; } });
Object.defineProperty(window, "STDX", { configurable: true, get: () => STDX, set: value => { STDX = value; } });
Object.defineProperty(window, "stdExamples", { configurable: true, get: () => stdExamples, set: value => { stdExamples = value; } });
Object.defineProperty(window, "specToSchema", { configurable: true, get: () => specToSchema, set: value => { specToSchema = value; } });
Object.defineProperty(window, "stdDownload", { configurable: true, get: () => stdDownload, set: value => { stdDownload = value; } });
Object.defineProperty(window, "stdPage", { configurable: true, get: () => stdPage, set: value => { stdPage = value; } });
Object.defineProperty(window, "SET0", { configurable: true, get: () => SET0 });
Object.defineProperty(window, "SET", { configurable: true, get: () => SET, set: value => { SET = value; } });
Object.defineProperty(window, "PREF", { configurable: true, get: () => PREF, set: value => { PREF = value; } });
Object.defineProperty(window, "showClosed", { configurable: true, get: () => showClosed, set: value => { showClosed = value; } });
Object.defineProperty(window, "setTab", { configurable: true, get: () => setTab, set: value => { setTab = value; } });
Object.defineProperty(window, "itRef", { configurable: true, get: () => itRef, set: value => { itRef = value; } });
Object.defineProperty(window, "mseq", { configurable: true, get: () => mseq, set: value => { mseq = value; } });
Object.defineProperty(window, "SETLOG", { configurable: true, get: () => SETLOG });
Object.defineProperty(window, "RS_ACT", { configurable: true, get: () => RS_ACT });
Object.defineProperty(window, "COLS", { configurable: true, get: () => COLS });
Object.defineProperty(window, "CLOSED_V", { configurable: true, get: () => CLOSED_V });
Object.defineProperty(window, "isAPR", { configurable: true, get: () => isAPR });
Object.defineProperty(window, "pendingBind", { configurable: true, get: () => pendingBind, set: value => { pendingBind = value; } });
Object.defineProperty(window, "ownTag", { configurable: true, get: () => ownTag, set: value => { ownTag = value; } });
Object.defineProperty(window, "refreshBinding", { configurable: true, get: () => refreshBinding, set: value => { refreshBinding = value; } });
Object.defineProperty(window, "unboundAccts", { configurable: true, get: () => unboundAccts, set: value => { unboundAccts = value; } });
Object.defineProperty(window, "knownAccts", { configurable: true, get: () => knownAccts });
Object.defineProperty(window, "loadPref", { configurable: true, get: () => loadPref, set: value => { loadPref = value; } });
Object.defineProperty(window, "applyColCss", { configurable: true, get: () => applyColCss, set: value => { applyColCss = value; } });
Object.defineProperty(window, "wantShowClosed", { configurable: true, get: () => wantShowClosed });
Object.defineProperty(window, "savePref", { configurable: true, get: () => savePref, set: value => { savePref = value; } });
Object.defineProperty(window, "resetPref", { configurable: true, get: () => resetPref, set: value => { resetPref = value; } });
Object.defineProperty(window, "needAPR", { configurable: true, get: () => needAPR, set: value => { needAPR = value; } });
Object.defineProperty(window, "setLog", { configurable: true, get: () => setLog, set: value => { setLog = value; } });
Object.defineProperty(window, "saveStale", { configurable: true, get: () => saveStale, set: value => { saveStale = value; } });
Object.defineProperty(window, "saveLimit", { configurable: true, get: () => saveLimit, set: value => { saveLimit = value; } });
Object.defineProperty(window, "saveReasons", { configurable: true, get: () => saveReasons, set: value => { saveReasons = value; } });
Object.defineProperty(window, "saveEuVis", { configurable: true, get: () => saveEuVis, set: value => { saveEuVis = value; } });
Object.defineProperty(window, "savePrint", { configurable: true, get: () => savePrint, set: value => { savePrint = value; } });
Object.defineProperty(window, "saveQueueDef", { configurable: true, get: () => saveQueueDef, set: value => { saveQueueDef = value; } });
Object.defineProperty(window, "itNeed", { configurable: true, get: () => itNeed, set: value => { itNeed = value; } });
Object.defineProperty(window, "mapAddForm", { configurable: true, get: () => mapAddForm, set: value => { mapAddForm = value; } });
Object.defineProperty(window, "mapAdd", { configurable: true, get: () => mapAdd, set: value => { mapAdd = value; } });
Object.defineProperty(window, "mapDel", { configurable: true, get: () => mapDel, set: value => { mapDel = value; } });
Object.defineProperty(window, "coToggle", { configurable: true, get: () => coToggle, set: value => { coToggle = value; } });
Object.defineProperty(window, "setTabTo", { configurable: true, get: () => setTabTo, set: value => { setTabTo = value; } });
Object.defineProperty(window, "settingsPage", { configurable: true, get: () => settingsPage, set: value => { settingsPage = value; } });
Object.defineProperty(window, "secH", { configurable: true, get: () => secH });
Object.defineProperty(window, "setPersonal", { configurable: true, get: () => setPersonal, set: value => { setPersonal = value; } });
Object.defineProperty(window, "setOrg", { configurable: true, get: () => setOrg, set: value => { setOrg = value; } });
Object.defineProperty(window, "setLocked", { configurable: true, get: () => setLocked, set: value => { setLocked = value; } });
Object.defineProperty(window, "setIT", { configurable: true, get: () => setIT, set: value => { setIT = value; } });
Object.defineProperty(window, "setHist", { configurable: true, get: () => setHist, set: value => { setHist = value; } });
Object.defineProperty(window, "histView", { configurable: true, get: () => histView, set: value => { histView = value; } });
Object.defineProperty(window, "CF", { configurable: true, get: () => CF, set: value => { CF = value; } });
Object.defineProperty(window, "CD", { configurable: true, get: () => CD, set: value => { CD = value; } });
Object.defineProperty(window, "NONE", { configurable: true, get: () => NONE });
Object.defineProperty(window, "ST_ORDER", { configurable: true, get: () => ST_ORDER });
Object.defineProperty(window, "OPL", { configurable: true, get: () => OPL });
Object.defineProperty(window, "nfmt", { configurable: true, get: () => nfmt });
Object.defineProperty(window, "escA", { configurable: true, get: () => escA });
Object.defineProperty(window, "OWN_L", { configurable: true, get: () => OWN_L });
Object.defineProperty(window, "CFC", { configurable: true, get: () => CFC });
Object.defineProperty(window, "CF_ORDER", { configurable: true, get: () => CF_ORDER });
Object.defineProperty(window, "cfKeys", { configurable: true, get: () => cfKeys });
Object.defineProperty(window, "cfTxt", { configurable: true, get: () => cfTxt });
Object.defineProperty(window, "cfLab", { configurable: true, get: () => cfLab });
Object.defineProperty(window, "cfCount", { configurable: true, get: () => cfCount });
Object.defineProperty(window, "cfSnap", { configurable: true, get: () => cfSnap });
Object.defineProperty(window, "cfMatch", { configurable: true, get: () => cfMatch, set: value => { cfMatch = value; } });
Object.defineProperty(window, "cfPass", { configurable: true, get: () => cfPass, set: value => { cfPass = value; } });
Object.defineProperty(window, "baseList", { configurable: true, get: () => baseList, set: value => { baseList = value; } });
Object.defineProperty(window, "cfHeadRow", { configurable: true, get: () => cfHeadRow, set: value => { cfHeadRow = value; } });
Object.defineProperty(window, "cfPaintHeads", { configurable: true, get: () => cfPaintHeads, set: value => { cfPaintHeads = value; } });
Object.defineProperty(window, "cfPaintBar", { configurable: true, get: () => cfPaintBar, set: value => { cfPaintBar = value; } });
Object.defineProperty(window, "cfSum", { configurable: true, get: () => cfSum, set: value => { cfSum = value; } });
Object.defineProperty(window, "cfOpts", { configurable: true, get: () => cfOpts, set: value => { cfOpts = value; } });
Object.defineProperty(window, "cfDefault", { configurable: true, get: () => cfDefault, set: value => { cfDefault = value; } });
Object.defineProperty(window, "DP", { configurable: true, get: () => DP });
Object.defineProperty(window, "cfDateRange", { configurable: true, get: () => cfDateRange, set: value => { cfDateRange = value; } });
Object.defineProperty(window, "cfNumPresets", { configurable: true, get: () => cfNumPresets, set: value => { cfNumPresets = value; } });
Object.defineProperty(window, "cfOpen", { configurable: true, get: () => cfOpen, set: value => { cfOpen = value; } });
Object.defineProperty(window, "cfClose", { configurable: true, get: () => cfClose, set: value => { cfClose = value; } });
Object.defineProperty(window, "cfPlace", { configurable: true, get: () => cfPlace, set: value => { cfPlace = value; } });
Object.defineProperty(window, "cfBody", { configurable: true, get: () => cfBody, set: value => { cfBody = value; } });
Object.defineProperty(window, "cfDrawList", { configurable: true, get: () => cfDrawList, set: value => { cfDrawList = value; } });
Object.defineProperty(window, "cfVisIdx", { configurable: true, get: () => cfVisIdx, set: value => { cfVisIdx = value; } });
Object.defineProperty(window, "cfAllState", { configurable: true, get: () => cfAllState, set: value => { cfAllState = value; } });
Object.defineProperty(window, "cfTog", { configurable: true, get: () => cfTog, set: value => { cfTog = value; } });
Object.defineProperty(window, "cfSetAll", { configurable: true, get: () => cfSetAll, set: value => { cfSetAll = value; } });
Object.defineProperty(window, "cfSetQ", { configurable: true, get: () => cfSetQ, set: value => { cfSetQ = value; } });
Object.defineProperty(window, "cfSetMode", { configurable: true, get: () => cfSetMode, set: value => { cfSetMode = value; } });
Object.defineProperty(window, "cfSetOp", { configurable: true, get: () => cfSetOp, set: value => { cfSetOp = value; } });
Object.defineProperty(window, "cfSetV", { configurable: true, get: () => cfSetV, set: value => { cfSetV = value; } });
Object.defineProperty(window, "cfSetNum", { configurable: true, get: () => cfSetNum, set: value => { cfSetNum = value; } });
Object.defineProperty(window, "cfNumPreset", { configurable: true, get: () => cfNumPreset, set: value => { cfNumPreset = value; } });
Object.defineProperty(window, "cfSetDate", { configurable: true, get: () => cfSetDate, set: value => { cfSetDate = value; } });
Object.defineProperty(window, "cfDatePreset", { configurable: true, get: () => cfDatePreset, set: value => { cfDatePreset = value; } });
Object.defineProperty(window, "cfPaintPre", { configurable: true, get: () => cfPaintPre, set: value => { cfPaintPre = value; } });
Object.defineProperty(window, "cfWidenTop", { configurable: true, get: () => cfWidenTop, set: value => { cfWidenTop = value; } });
Object.defineProperty(window, "cfNorm", { configurable: true, get: () => cfNorm, set: value => { cfNorm = value; } });
Object.defineProperty(window, "cfValid", { configurable: true, get: () => cfValid, set: value => { cfValid = value; } });
Object.defineProperty(window, "cfRefresh", { configurable: true, get: () => cfRefresh, set: value => { cfRefresh = value; } });
Object.defineProperty(window, "cfReset", { configurable: true, get: () => cfReset, set: value => { cfReset = value; } });
Object.defineProperty(window, "cfAfter", { configurable: true, get: () => cfAfter, set: value => { cfAfter = value; } });
Object.defineProperty(window, "cfApplyDraft", { configurable: true, get: () => cfApplyDraft, set: value => { cfApplyDraft = value; } });
Object.defineProperty(window, "cfRemove", { configurable: true, get: () => cfRemove, set: value => { cfRemove = value; } });
Object.defineProperty(window, "cfClearAll", { configurable: true, get: () => cfClearAll, set: value => { cfClearAll = value; } });
Object.defineProperty(window, "toastUndo", { configurable: true, get: () => toastUndo, set: value => { toastUndo = value; } });


/* ================= Master data ================= */
const COMPANY={ /* บริษัท = นิติบุคคล (Tax ID) ตามตารางที่ 4 */
 AH:{name:"อาปิโก ไฮเทค (มหาชน)",tax:"0107545000179",orgs:[103,222]},
 AHT:{name:"อาปิโก ไฮเทค ทูลลิ่ง",tax:"0145548001557",orgs:[352,196]},
 AHP:{name:"อาปิโก ไฮเทค พาร์ทส์",tax:"0145548001549",orgs:[175]},
 AM:{name:"เอเบิล มอเตอร์ส",tax:"0135546008643",orgs:[376]},
 "?":{name:"ไม่ระบุบริษัท (ORG_ID ยังไม่ทราบ / ยกเลิก)",tax:"—",orgs:[556,104]}};
const ORG={103:"APD",222:"AHR",352:"AHD",196:"AHT",175:"AHP",376:"AM",556:"MGP",104:"ATD"};
const companyOfOrg=o=>Object.keys(COMPANY).find(k=>COMPANY[k].orgs.includes(o));
const companyOfTax=t=>Object.keys(COMPANY).find(k=>COMPANY[k].tax===t)||"?";

const PERM={VIEW_OWN:"ดูเอกสารที่ตนเป็น Receiver",VIEW_CO:"ดูเอกสารทั้งบริษัทที่ได้รับมอบหมาย",DMS:"เปิดเอกสารจาก DMS",UPLOAD_NEW:"อัปโหลดเอกสารใหม่",CONFIRM:"Confirm",REVIEW:"ย้ายเป็น Review",HOLD:"Hold",REJECT:"Reject",MANUAL_REVIEW:"ตัดสิน Manual Review",DUP_OVERRIDE:"ยืนยันว่าไม่ซ้ำ (Duplicate)",UNCONFIRM:"ยกเลิกการยืนยัน",POST:"ส่งเข้า AP Interface (Batch)",RETURN_FAILED:"Return Import Failed",VIEW_AP:"ดูหน้าส่งเข้า AP Interface",MAP:"จัดการการเชื่อมบัญชีและสิทธิ์",AUDIT:"ดูบันทึกการเข้าถึง"};
const ROLES={
 EU:{n:"ผู้ใช้งาน (Receiver)",c:"var(--t-org)",bg:"var(--t-org-bg)",p:["VIEW_OWN","DMS","UPLOAD_NEW"],scope:"receiver"},
 ACC:{n:"เจ้าหน้าที่บัญชี",c:"var(--t-ok)",bg:"var(--t-ok-bg)",p:["VIEW_CO","DMS","CONFIRM","REVIEW","HOLD","REJECT","VIEW_AP"],scope:"company"},
 APR:{n:"หัวหน้าฝ่ายบัญชี",c:"var(--t-blue)",bg:"var(--t-blue-bg)",p:["VIEW_CO","DMS","CONFIRM","REVIEW","HOLD","REJECT","VIEW_AP","MANUAL_REVIEW","DUP_OVERRIDE","UNCONFIRM","POST","RETURN_FAILED","AUDIT"],scope:"company",postMax:1000000},
 ADM:{n:"ผู้ดูแลระบบ (IT)",c:"var(--t-adm)",bg:"var(--t-adm-bg)",p:["MAP","AUDIT"],scope:"none"}};
/* Portal user ↔ Entra ID ↔ Receiver ใน Oracle (RCV_VRC_HDS_V.RECEIVER จาก EMPLOYEE_ID ของหัวใบรับ) ↔ companies */
const USERS=[
 {id:"u1",n:"สมศักดิ์ ใจดี",email:"somsak.j@aapico.com",role:"EU",rcvName:"SOMSAK JAIDEE",emp:10231,co:["AH"],unit:"คลังวัตถุดิบ"},
 {id:"u2",n:"วิไลวรรณ ศรีสุข",email:"wilaiwan.s@aapico.com",role:"EU",rcvName:"WILAIWAN SRISUK",emp:20417,co:["AHT"],unit:"ฝ่ายซ่อมบำรุง"},
 {id:"u3",n:"ธนากร มั่นคง",email:"thanakorn.m@aapico.com",role:"EU",rcvName:"THANAKORN MANKONG",emp:30552,co:["AM"],unit:"คลังอะไหล่"},
 {id:"u4",n:"ปณิดา รักงาน",email:"panida.r@aapico.com",role:"ACC",rcvName:"—",emp:11020,co:["AH","AHT"],unit:"ฝ่ายบัญชี AH/AHT"},
 {id:"u5",n:"กมลวรรณ ใจงาม",email:"kamonwan.j@aapico.com",role:"ACC",rcvName:"—",emp:31005,co:["AM","AHP"],unit:"ฝ่ายบัญชี AM/AHP"},
 {id:"u6",n:"สมชาย วงศ์ทอง",email:"somchai.w@aapico.com",role:"APR",rcvName:"—",emp:11001,co:["AH","AHT","AHP","AM","?"],unit:"หัวหน้าฝ่ายบัญชี"},
 {id:"u7",n:"อนุชา ไอที",email:"anucha.i@aapico.com",role:"ADM",rcvName:"—",emp:null,co:[],unit:"IT"},
 {id:"u8",n:"กิตติ สมบูรณ์",email:"kitti.s@aapico.com",role:"EU",rcvName:"—",emp:null,co:["AH","AHT","AM"],unit:"หัวหน้าคลัง (ดูแลหลาย account)"}];
/* v4.18 — เอกสารเป็นของ Oracle account (Receiver) · AD user ผูกกับ account แบบหลายต่อหลาย · IT Admin จัดการ */
const MAPS=[{id:"m1",user:"u1",acct:"SOMSAK JAIDEE",by:"อนุชา ไอที",at:"2026-09-20",req:"INC-0998"},{id:"m2",user:"u2",acct:"WILAIWAN SRISUK",by:"อนุชา ไอที",at:"2026-09-20",req:"INC-0998"},
 {id:"m3",user:"u3",acct:"THANAKORN MANKONG",by:"อนุชา ไอที",at:"2026-09-20",req:"INC-0998"},{id:"m4",user:"u8",acct:"SOMSAK JAIDEE",by:"อนุชา ไอที",at:"2026-10-02",req:"ticket INC-1021"},
 {id:"m5",user:"u8",acct:"WILAIWAN SRISUK",by:"อนุชา ไอที",at:"2026-10-02",req:"ticket INC-1021"},{id:"m6",user:"u8",acct:"THANAKORN MANKONG",by:"อนุชา ไอที",at:"2026-10-02",req:"ticket INC-1021"}];
const acctsOf=u=>MAPS.filter(m=>m.user===u.id).map(m=>m.acct);
const bound=a=>!a||MAPS.some(m=>m.acct===a&&(x=>x.role==="EU"&&!x.off)(USERS.find(x=>x.id===m.user)||{}));
let ME=USERS[0];
const can=p=>ROLES[ME.role].p.includes(p);

/* ================= Standard v6.10 reference (Exception code E01–E15) ================= */
const EXC={E01:["Missing Field","eu"],
E02:["Arithmetic Inconsistency","acc"],
E03:["Total Mismatch","acc"],
E04:["Rounding","acc"],
E05:["Receipt Not Found","eu"],
E06:["Multiple Receipts","eu"],
E07:["Customer Mismatch","acc"],
E08:["Signature Missing","eu"],
E09:["Price Variance","acc"],
E10:["UOM Mismatch","eu"],
E11:["Line Resolved by Description","acc"],
E12:["Price Variance Within Tolerance","acc"],
E13:["Line Not Identified","acc"],
E14:["Over Quantity","eu"],
E15:["Quantity Below Receipt","eu"]};
const EUCODES=new Set(Object.keys(EXC).filter(k=>EXC[k][1]==="eu"));
const RULES=["V-01 ฟิลด์บังคับ","V-02 เลขคณิตรายบรรทัด","V-03 ยอดรวมในใบแจ้งหนี้","V-04 พบใบรับ","V-05 ลูกค้าตรงกับตารางที่ 4","V-06 ลายเซ็น","V-07 จับคู่รายบรรทัดและราคา","V-08 จำนวนเท่ากับใบรับ","V-09 ยอดรวมเท่ากับใบรับ"];
const RSTEP={"V-01":1,"V-02":1,"V-03":1,"V-06":1,"V-04":2,"V-05":2,"V-07":3,"V-08":3,"V-09":3};
const P="pass",F="fail",N="not_evaluated",M="manual_review";
const R=o=>RULES.map(r=>{const id=r.slice(0,4);return Object.assign({rule_id:id,result:P},o[id]||{})});
const DMS_BASE="https://dms.aapico.com/viewer";

/* ================= Documents (JSON from AIVA + receiver + DMS) ================= */
/* v4.16 — ชุดเอกสารตัวอย่างครบทุกเคส (สร้างจาก docs.py · ค่าสมมติทั้งหมด) · up = วันที่เข้าระบบ (dms.uploaded_at) */
const DOCS=[{"doc":"DMS-2026-000123","inv":"IV6909245","stax":"0105500000000","oname":"ABC SUPPLY CO., LTD.","release":null,"po":"42052823","vendor":"ABC Supply Co., Ltd.","org":103,"tax":"0107545000179","pages":2,"rcv":"530340001","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-09-24","up":"2026-10-01","sub":2910,"vat":203.7,"total":3113.7,"sig":[1,1],"custOn":"head_office_th","lines":[["HSS CENTRE DRILL A225 BS4 5/16\"",3,"PCS",130,390,1,3,130,"M1"],["CASTER WHEEL URETHANE-3\" (FIXED)",4,"PCS",310,1240,2,4,310,"M1"],["CASTER WHEEL URETHANE-3\" (SWIVEL)",4,"PCS",320,1280,3,4,320,"M1"]],"rtotal":2910.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":[],"aiva":"Auto-pass","status":"Auto-pass","tc":"Auto-pass ไม่มีรหัส · DR-07 ไม่พบคู่เทียบ","grp":"A · ผลตรวจ AIVA"},{"doc":"DMS-2026-000201","inv":"RD-2610-0011","stax":"0105547055551","oname":"RAYONG DIE SUPPLY CO., LTD.","release":null,"po":"40130000","vendor":"Rayong Die Supply Co., Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530340201","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-10-02","up":"2026-10-02","sub":5000.0,"vat":350.0,"total":5350.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Punch Pin D6 x 60L",3,"PCS",1666.6,4999.8,1,3,1666.6,"M1"]],"rtotal":4999.8,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"fail","exception_code":"E04","severity":"Low","evidence":"ผลรวมบรรทัด 4,999.80 vs ยอดก่อนภาษี 5,000.00 ต่าง 0.20 (ในกรอบ)","page":1},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":["E04"],"aiva":"Auto-pass","status":"Auto-pass","tc":"Auto-pass มีเฉพาะ E04 Low","grp":"A · ผลตรวจ AIVA"},{"doc":"DMS-2026-000202","inv":"ST-2610-0102","stax":"0105556055550","oname":"STEEL TECH CO., LTD.","release":null,"po":"40130000","vendor":"Steel Tech Co., Ltd.","org":352,"tax":"0145548001557","pages":1,"rcv":"530340202","receiver":"WILAIWAN SRISUK","upl":"WILAIWAN.S","date":"2026-10-03","up":"2026-10-03","sub":8600,"vat":602.0,"total":9202.0,"sig":[1,1],"custOn":"head_office_th","lines":[["SKD11 Plate 20 x 200 x 300",4,"PCS",2150,8600,1,4,2150,"M1"]],"rtotal":8600.0,"rules":[{"rule_id":"V-01","result":"fail","exception_code":"E01","severity":"Medium","evidence":"อ่าน Tax ID ลูกค้าไม่ได้ (หมึกจาง)","page":1},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":["E01"],"aiva":"Review","status":"Review","tc":"E01 Medium · ผู้ใช้งานแก้","grp":"A · ผลตรวจ AIVA"},{"doc":"DMS-2026-000152","inv":"SR6909-1142","stax":"0103554001122","oname":null,"release":null,"po":"40120973","vendor":"S R Y Engineering & Trading","org":null,"tax":"0107545000179","pages":1,"rcv":"—","receiver":null,"upl":"SOMSAK.J","date":"2026-09-27","up":"2026-09-28","sub":560,"vat":39.2,"total":599.2,"sig":[1,1],"custOn":"head_office_th","lines":[["ก๊าซ CO2 ขนาด 25 กก.",2,"CYL",280,520,null,null,null,"—"]],"rtotal":null,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"fail","exception_code":"E02","severity":"High","evidence":"บรรทัด 1: 2 × 280.00 = 560.00 แต่ระบุ 520.00","page":1},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"not_evaluated","halted_by":"V-02"},{"rule_id":"V-05","result":"not_evaluated","halted_by":"V-02"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"not_evaluated","halted_by":"V-02"},{"rule_id":"V-08","result":"not_evaluated","halted_by":"V-02"},{"rule_id":"V-09","result":"not_evaluated","halted_by":"V-02"}],"codes":["E02"],"aiva":"Hold","status":"Hold","tc":"E02 High · ไม่เรียก Oracle · ไม่มี Receiver → Reject เท่านั้น · ค้างจากเดือนก่อน","grp":"A · ผลตรวจ AIVA","halted":true},{"doc":"DMS-2026-000203","inv":"TP-2610-0045","stax":"0105552066662","oname":"THAI PACKAGING CO., LTD.","release":null,"po":"40130000","vendor":"Thai Packaging Co., Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530340203","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-10-02","up":"2026-10-02","sub":10500,"vat":735.0,"total":11235.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Carton Box 40x30x30",500,"PCS",20,10000,1,500,20,"M1"]],"rtotal":10000.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"fail","exception_code":"E03","severity":"High","evidence":"ผลรวมบรรทัด 10,000.00 ≠ ยอดก่อนภาษี 10,500.00","page":1},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"fail","exception_code":"E03","severity":"High","evidence":"ใบแจ้งหนี้ 10,500.00 vs ใบรับ 10,000.00","page":1}],"codes":["E03"],"aiva":"Hold","status":"Hold","tc":"E03 High (V-03 และ V-09) · ฝ่ายบัญชีตัดสิน","grp":"A · ผลตรวจ AIVA"},{"doc":"DMS-2026-000161","inv":"TK-2609-0120","stax":"0105551099887","oname":null,"release":null,"po":"40121210","vendor":"Sanwa Precision Tools Co., Ltd.","org":null,"tax":"0145548001557","pages":1,"rcv":"—","receiver":null,"upl":"WILAIWAN.S","date":"2026-09-28","up":"2026-09-29","sub":18400,"vat":1288.0,"total":19688.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Carbide Drill D8",20,"PCS",920,18400,null,null,null,"—"]],"rtotal":null,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"fail","exception_code":"E05","severity":"High","evidence":"SQL ไม่คืนแถว: Tax ID ผู้ขาย 0105551099887 + SHIPMENT_NUM TK-2609-0120 (ตรวจ Tax ID ใน Vendor Master)","page":1},{"rule_id":"V-05","result":"not_evaluated","halted_by":"V-04"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"not_evaluated","halted_by":"V-04"},{"rule_id":"V-08","result":"not_evaluated","halted_by":"V-04"},{"rule_id":"V-09","result":"not_evaluated","halted_by":"V-04"}],"codes":["E05"],"aiva":"Hold","status":"Hold","tc":"E05 High · ไม่พบใบรับ · ไม่มี Receiver → Reject เท่านั้น · ค้างจากเดือนก่อน","grp":"A · ผลตรวจ AIVA"},{"doc":"DMS-2026-000204","inv":"MR-2610-0230","stax":"0105544077773","oname":"MEGA RUBBER CO., LTD.","release":null,"po":"40130000","vendor":"Mega Rubber Co., Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530340204, 530340205","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-10-03","up":"2026-10-03","sub":9000,"vat":630.0,"total":9630.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Rubber Bush 30A",200,"PCS",45,9000,1,200,45,"M1"]],"rtotal":9000.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"fail","exception_code":"E06","severity":"High","evidence":"พบ RECEIPT_NUM 2 ค่า: 530340204, 530340205","page":1},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"not_evaluated","halted_by":"V-04"},{"rule_id":"V-08","result":"not_evaluated","halted_by":"V-04"},{"rule_id":"V-09","result":"not_evaluated","halted_by":"V-04"}],"codes":["E06"],"aiva":"Hold","status":"Hold","tc":"E06 High · ใบรับ 2 ใบ · ข้าม STEP 3","grp":"A · ผลตรวจ AIVA"},{"doc":"DMS-2026-000205","inv":"SA-2610-0501","stax":"0105539044556","oname":"SIAM AUTO PARTS CO., LTD.","release":null,"po":"40130000","vendor":"Siam Auto Parts Co., Ltd.","org":376,"tax":"0135546008650","pages":1,"rcv":"530340205","receiver":"THANAKORN MANKONG","upl":"THANAKORN.M","date":"2026-10-04","up":"2026-10-04","sub":10500,"vat":735.0,"total":11235.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Air Filter",50,"PCS",210,10500,1,50,210,"M1"]],"rtotal":10500.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"fail","exception_code":"E07","severity":"High","evidence":"Tax ID ลูกค้าบนใบแจ้งหนี้ 0135546008650 ≠ ตารางที่ 4 (0135546008643)","page":1},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":["E07"],"aiva":"Hold","status":"Hold","tc":"E07 High · Tax ID ลูกค้าไม่ตรง","grp":"A · ผลตรวจ AIVA","ent":{"tax_id_match":false}},{"doc":"DMS-2026-000206","inv":"SA-2610-0502","stax":"0105539044556","oname":"SIAM AUTO PARTS CO., LTD.","release":null,"po":"40130000","vendor":"Siam Auto Parts Co., Ltd.","org":376,"tax":"0135546008643","pages":1,"rcv":"530340206","receiver":"THANAKORN MANKONG","upl":"THANAKORN.M","date":"2026-10-04","up":"2026-10-04","sub":7200,"vat":504.0,"total":7704.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Cabin Filter",40,"PCS",180,7200,1,40,180,"M1"]],"rtotal":7200.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"fail","exception_code":"E07","severity":"Medium","evidence":"ที่อยู่ลูกค้า 55 ถ.รามอินทรา 10230 ไม่ตรงกับสำนักงานใหญ่หรือสาขาในตารางที่ 4","page":1},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":["E07"],"aiva":"Review","status":"Review","tc":"E07 Medium · ที่อยู่ลูกค้าไม่ตรง","grp":"A · ผลตรวจ AIVA","badAddr":"55 ถนนรามอินทรา แขวงคันนายาว เขตคันนายาว กรุงเทพมหานคร 10230","ent":{"address_match":false,"address_matched":null}},{"doc":"DMS-2026-000131","inv":"A631577","stax":"0105536012345","oname":"THAI STEEL SERVICE CO., LTD.","release":"3","po":"40100303","vendor":"Thai Steel Service Co., Ltd.","org":103,"tax":"0107545000179","pages":2,"rcv":"530340112","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-09-26","up":"2026-09-27","sub":18054.0,"vat":1263.78,"total":19317.78,"sig":[1,0],"custOn":"head_office_th","lines":[["SPH270C-OD 2.0 x 225 x COIL",590,"KG",30.6,18054.0,1,590,30.6,"M1"]],"rtotal":18054.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"fail","exception_code":"E08","severity":"High","evidence":"ไม่พบลายเซ็นหรือตราในช่องผู้รับของ","page":1},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":["E08"],"aiva":"Hold","status":"Hold","tc":"E08 High · ไม่มีลายเซ็นผู้รับของ · ค้างจากเดือนก่อน","grp":"A · ผลตรวจ AIVA"},{"doc":"DMS-2026-000207","inv":"PT-2610-0071","stax":"0105548077777","oname":"PRECISION TOOLS (THAILAND) CO., LTD.","release":null,"po":"40130000","vendor":"Precision Tools (Thailand) Co., Ltd.","org":352,"tax":"0145548001557","pages":1,"rcv":"530340207","receiver":"WILAIWAN SRISUK","upl":"WILAIWAN.S","date":"2026-10-05","up":"2026-10-05","sub":7800,"vat":546.0,"total":8346.0,"sig":[0,1],"custOn":"head_office_th","lines":[["Carbide Insert CNMG120408",30,"PCS",260,7800,1,30,260,"M1"]],"rtotal":7800.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"fail","exception_code":"E08","severity":"Medium","evidence":"ไม่พบลายเซ็นหรือตราในช่องผู้ขาย/ผู้ส่งของ","page":1},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":["E08"],"aiva":"Review","status":"Review","tc":"E08 Medium · ไม่มีลายเซ็นผู้ขาย","grp":"A · ผลตรวจ AIVA"},{"doc":"DMS-2026-000208","inv":"PT-2610-0088","stax":"0105548077777","oname":"PRECISION TOOLS (THAILAND) CO., LTD.","release":null,"po":"40130000","vendor":"Precision Tools (Thailand) Co., Ltd.","org":352,"tax":"0145548001557","pages":1,"rcv":"530340208","receiver":"WILAIWAN SRISUK","upl":"WILAIWAN.S","date":"2026-10-05","up":"2026-10-05","sub":13000,"vat":910.0,"total":13910.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Collet ER32 10mm",25,"PCS",520,13000,1,25,480,"—"]],"rtotal":12000.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"fail","exception_code":"E09","severity":"High","evidence":"ราคา 520.00 vs ใบรับ 480.00 ต่าง 8.33% (เกินกรอบ)","page":1},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"fail","exception_code":"E03","severity":"High","evidence":"ใบแจ้งหนี้ 13,000.00 vs ใบรับ 12,000.00","page":1}],"codes":["E09","E03"],"aiva":"Hold","status":"Hold","tc":"E09 High · ราคาต่างเกินกรอบ","grp":"A · ผลตรวจ AIVA"},{"doc":"DMS-2026-000209","inv":"AM-2610-0611","stax":"0105539044556","oname":"SIAM AUTO PARTS CO., LTD.","release":null,"po":"40130000","vendor":"Siam Auto Parts Co., Ltd.","org":376,"tax":"0135546008643","pages":1,"rcv":"530340209","receiver":"THANAKORN MANKONG","upl":"THANAKORN.M","date":"2026-10-06","up":"2026-10-06","sub":11400,"vat":798.0,"total":12198.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Engine Oil 5W-30",120,"L",95,11400,1,120,95,"M1"]],"rtotal":11400.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"fail","exception_code":"E10","severity":"Medium","evidence":"หน่วยนับใบแจ้งหนี้ L vs ใบรับ BTL (ห้ามแปลงข้ามประเภท)","page":1},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":["E10"],"aiva":"Review","status":"Review","tc":"E10 Medium · หน่วยนับไม่ตรง · ผู้ใช้งานแก้","grp":"A · ผลตรวจ AIVA"},{"doc":"DMS-2026-000210","inv":"TS-2610-0119","stax":"0105536012345","oname":"THAI STEEL SERVICE CO., LTD.","release":null,"po":"40130000","vendor":"Thai Steel Service Co., Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530340210","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-10-06","up":"2026-10-06","sub":3600.0,"vat":252.0,"total":3852.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Bolt M10 x 30",500,"PCS",4.5,2250.0,1,500,4.5,"M4"],["Bolt M10 x 40",300,"PCS",4.5,1350.0,2,300,4.5,"M4"]],"rtotal":3600.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"fail","exception_code":"E11","severity":"Medium","evidence":"ราคา 4.50 ตรง 2 บรรทัด จำนวนชี้ขาดไม่ได้ · ใช้คำบรรยายตัดสิน (M4)","page":1},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":["E11"],"aiva":"Review","status":"Review","tc":"E11 Medium · จับคู่ด้วยคำบรรยาย","grp":"A · ผลตรวจ AIVA"},{"doc":"DMS-2026-000158","inv":"AM-2609-0412","stax":"0105539044556","oname":"SIAM AUTO PARTS CO., LTD.","release":"12","po":"45008812","vendor":"Siam Auto Parts Co., Ltd.","org":376,"tax":"0135546008643","pages":2,"rcv":"560020415","receiver":"THANAKORN MANKONG","upl":"THANAKORN.M","date":"2026-09-27","up":"2026-09-27","sub":42600,"vat":2982.0,"total":45582.0,"sig":[1,1],"custOn":"branch 00004","lines":[["Brake Pad Set Front",60,"SET",710,42600,1,60,712.5,"M5"]],"rtotal":42750.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"fail","exception_code":"E12","severity":"Medium","evidence":"ราคา 710.00 vs ใบรับ 712.50 ต่าง 0.35% (ในกรอบ)","page":1},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"fail","exception_code":"E03","severity":"High","evidence":"ใบแจ้งหนี้ 42,600.00 vs ใบรับ 42,750.00","page":1}],"codes":["E12","E03"],"aiva":"Hold","status":"Hold","tc":"E12 Medium + E03 · ใบกำกับภาษีในนามสาขา 00004 · ค้างจากเดือนก่อน","grp":"A · ผลตรวจ AIVA"},{"doc":"DMS-2026-000211","inv":"TS-2610-0125","stax":"0105536012345","oname":"THAI STEEL SERVICE CO., LTD.","release":null,"po":"40130000","vendor":"Thai Steel Service Co., Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530340211","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-10-06","up":"2026-10-06","sub":720.0,"vat":50.4,"total":770.4,"sig":[1,1],"custOn":"head_office_th","lines":[["Washer M12 Spring",400,"PCS",1.8,720.0,1,null,null,"—"]],"rtotal":0.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"fail","exception_code":"E13","severity":"High","evidence":"ระบุบรรทัดในใบรับไม่ได้ (Confidence 0.62)","page":1},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":["E13"],"aiva":"Hold","status":"Hold","tc":"E13 High · ระบุบรรทัดไม่ได้","grp":"A · ผลตรวจ AIVA"},{"doc":"DMS-2026-000140","inv":"INV-2609-0088","stax":"0105548077777","oname":"PRECISION TOOLS (THAILAND) CO., LTD.","release":null,"po":"40121082","vendor":"Precision Tools (Thailand) Co., Ltd.","org":352,"tax":"0145548001557","pages":1,"rcv":"540112231","receiver":"WILAIWAN SRISUK","upl":"WILAIWAN.S","date":"2026-09-25","up":"2026-09-25","sub":11040,"vat":772.8,"total":11812.8,"sig":[1,1],"custOn":"head_office_th","lines":[["Carbide End Mill D10 x 75L",12,"PCS",920,11040,1,10,920,"M1"]],"rtotal":9200.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"fail","exception_code":"E14","severity":"High","evidence":"บรรทัด 1 วางบิล 12 PCS > ใบรับ 10 PCS","page":1},{"rule_id":"V-09","result":"fail","exception_code":"E03","severity":"High","evidence":"ใบแจ้งหนี้ 11,040.00 vs ใบรับ 9,200.00","page":1}],"codes":["E14","E03"],"aiva":"Hold","status":"Hold","tc":"E14 High + E03 · จำนวนเกินใบรับ · ค้างจากเดือนก่อน","grp":"A · ผลตรวจ AIVA"},{"doc":"DMS-2026-000212","inv":"AM-2610-0640","stax":"0105539044556","oname":"SIAM AUTO PARTS CO., LTD.","release":null,"po":"40130000","vendor":"Siam Auto Parts Co., Ltd.","org":376,"tax":"0135546008643","pages":1,"rcv":"530340212","receiver":"THANAKORN MANKONG","upl":"THANAKORN.M","date":"2026-10-07","up":"2026-10-07","sub":12000,"vat":840.0,"total":12840.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Wiper Blade 22\"",80,"PCS",150,12000,1,100,150,"M1"]],"rtotal":15000.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"fail","exception_code":"E15","severity":"Medium","evidence":"บรรทัด 1 วางบิล 80 PCS < ใบรับ 100 PCS","page":1},{"rule_id":"V-09","result":"fail","exception_code":"E03","severity":"High","evidence":"ใบแจ้งหนี้ 12,000.00 vs ใบรับ 15,000.00","page":1}],"codes":["E15","E03"],"aiva":"Hold","status":"Hold","tc":"E15 Medium + E03 · จำนวนน้อยกว่าใบรับ · เข้าระบบวันนี้","grp":"A · ผลตรวจ AIVA"},{"doc":"DMS-2026-000170","inv":"MG-2609-0009","stax":"0105560033221","oname":"METRO SUPPLY CO., LTD.","release":null,"po":"48000121","vendor":"Metro Supply Co., Ltd.","org":556,"tax":"—","pages":1,"rcv":"580001120","receiver":"NARONG PHOLSRI","upl":"NARONG.P","date":"2026-09-29","up":"2026-09-29","sub":5400,"vat":378.0,"total":5778.0,"sig":[1,1],"custOn":null,"lines":[["Service Kit",3,"SET",1800,5400,1,3,1800,"M1"]],"rtotal":5400.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"manual_review","evidence":"ORG_ID 556 สถานะยังไม่ทราบในตารางที่ 4"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":[],"aiva":"Manual Review","status":"Manual Review","tc":"Manual Review · ORG_ID ยังไม่ทราบ (บริษัท ?) · Receiver ยังไม่เชื่อมบัญชี","grp":"B · Manual Review"},{"doc":"DMS-2026-000213","inv":"AT-2610-0004","stax":"0105549044449","oname":"ASIA TECH SERVICE CO., LTD.","release":null,"po":"40130000","vendor":"Asia Tech Service Co., Ltd.","org":104,"tax":"—","pages":1,"rcv":"530340213","receiver":"ANAN THONGDEE","upl":"ANAN.T","date":"2026-10-02","up":"2026-10-02","sub":18500,"vat":1295.0,"total":19795.0,"sig":[1,1],"custOn":null,"lines":[["PM Service Contract",1,"JOB",18500,18500,1,1,18500,"M1"]],"rtotal":18500.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"manual_review","evidence":"ORG_ID 104 (ATD) สถานะยกเลิกในตารางที่ 4"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":[],"aiva":"Manual Review","status":"Manual Review","tc":"Manual Review · ORG_ID ยกเลิก (ATD)","grp":"B · Manual Review"},{"doc":"DMS-2026-000214","inv":"FS-2610-1301","stax":"0105550033338","oname":"FASTENER NET CO., LTD.","release":null,"po":"40130000","vendor":"Fastener Net Co., Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530340214","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-10-03","up":"2026-10-03","sub":2100.0,"vat":147.0,"total":2247.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Hex Bolt M8 x 20",1000,"PCS",1.2,1200.0,1,1000,1.2,"M1"],["Hex Nut M8",1000,"PCS",0.6,600.0,2,1000,0.6,"M1"],["Flat Washer M8",1000,"PCS",0.3,300.0,3,1000,0.3,"M1"]],"rtotal":2100.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"manual_review","evidence":"SQL คืน 50 แถวพอดี อาจถูกตัด (ใบรับเกิน 50 บรรทัด)"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":[],"aiva":"Manual Review","status":"Manual Review","tc":"Manual Review · SQL ได้ 50 แถวพอดี","grp":"B · Manual Review"},{"doc":"DMS-2026-000215","inv":"BK-2610-0021","stax":"0105553088884","oname":"BANGKOK OFFICE SUPPLY CO., LTD.","release":null,"po":"40130000","vendor":"Bangkok Office Supply Co., Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530340215","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-10-04","up":"2026-10-04","sub":5750,"vat":402.5,"total":6152.5,"sig":[1,1],"custOn":"branch 00003","lines":[["Copy Paper A4 80g",50,"REAM",115,5750,1,50,115,"M1"]],"rtotal":5750.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":[],"aiva":"Auto-pass","status":"Auto-pass","tc":"Auto-pass · ใบกำกับภาษีในนาม AH สาขา 00003 กรุงเทพฯ","grp":"C · ลูกค้า / นิติบุคคล"},{"doc":"DMS-2026-000216","inv":"AHT-2610-0088","stax":"0145548001557","oname":"AAPICO HITECH TOOLING CO., LTD.","release":null,"po":"40130000","vendor":"AAPICO Hitech Tooling Co., Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530340216","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-10-05","up":"2026-10-05","sub":38500,"vat":2695.0,"total":41195.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Die Repair Service",1,"JOB",38500,38500,1,1,38500,"M1"]],"rtotal":38500.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":[],"aiva":"Auto-pass","status":"Auto-pass","tc":"Auto-pass · Intercompany (ผู้ขาย AHT ส่งให้ AH)","grp":"C · ลูกค้า / นิติบุคคล"},{"doc":"DMS-2026-000163","inv":"PL-2610-0071","stax":"0105541099995","oname":"PRIME LUBRICANT CO., LTD.","release":null,"po":"40130000","vendor":"Prime Lubricant Co., Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530340163","receiver":"PRAPHAN KAEWKLA","upl":"PRAPHAN.K","date":"2026-10-05","up":"2026-10-05","sub":13600,"vat":952.0,"total":14552.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Hydraulic Oil ISO 46",200,"L",68,13600,1,200,68,"M1"]],"rtotal":13600.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"fail","exception_code":"E10","severity":"Medium","evidence":"หน่วยนับใบแจ้งหนี้ L vs ใบรับ DRUM","page":1},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":["E10"],"aiva":"Review","status":"Review","tc":"Receiver ยังไม่เชื่อมบัญชี · รหัสของผู้ใช้งานแต่ไม่มีผู้ใช้เห็น → ฝ่ายบัญชีดำเนินการได้","grp":"D · ผู้รับผิดชอบ"},{"doc":"DMS-2026-000301","inv":"DR-2610-0101","stax":"0105546011116","oname":"DELTA TRADING CO., LTD.","release":null,"po":"40130000","vendor":"Delta Trading Co., Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530340301","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-10-01","up":"2026-10-01","sub":8500,"vat":595.0,"total":9095.0,"sig":[1,0],"custOn":"head_office_th","lines":[["Safety Glove Nitrile",100,"PR",85,8500,1,100,85,"M1"]],"rtotal":8500.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"fail","exception_code":"E08","severity":"High","evidence":"ไม่พบลายเซ็นผู้รับของ","page":1},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":["E08"],"aiva":"Hold","status":"Superseded","tc":"DR-01 ฉบับเดิม (Hold) → Superseded","grp":"E · เอกสารซ้ำ (ตารางที่ 8A)","supersededBy":"DMS-2026-000301-R1","supRule":"DR-01 ฉบับใหม่ดีกว่า (Review vs Hold) → ฉบับเดิม Superseded","xh":[{"t":"2026-10-03 08:40","a":"Superseded","d":"DR-01 ฉบับใหม่ดีกว่า (Review vs Hold) → ฉบับเดิม Superseded · ฉบับใหม่ DMS-2026-000301-R1","k":"c"}]},{"doc":"DMS-2026-000301-R1","inv":"DR-2610-0101","stax":"0105546011116","oname":"DELTA TRADING CO., LTD.","release":null,"po":"40130000","vendor":"Delta Trading Co., Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530341-R1","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-10-03","up":"2026-10-03","sub":8500,"vat":595.0,"total":9095.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Safety Glove Nitrile",100,"PR",85,8500,1,100,85,"M4"]],"rtotal":8500.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"fail","exception_code":"E11","severity":"Medium","evidence":"จับคู่ด้วยคำบรรยาย (M4)","page":1},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":["E11"],"aiva":"Review","status":"Review","tc":"DR-01 ฉบับใหม่ดีกว่า (Review) → ใช้ฉบับใหม่","grp":"E · เอกสารซ้ำ (ตารางที่ 8A)","supersedes":"DMS-2026-000301","supRule":"DR-01 ฉบับใหม่ดีกว่า (Review vs Hold) → ฉบับเดิม Superseded","xh":[{"t":"2026-10-03 08:40","a":"แทนที่ฉบับเดิม","d":"DR-01 ฉบับใหม่ดีกว่า (Review vs Hold) → ฉบับเดิม Superseded · ฉบับเดิม DMS-2026-000301","k":"g"}]},{"doc":"DMS-2026-000302","inv":"DR-2610-0102","stax":"0105546011116","oname":"DELTA TRADING CO., LTD.","release":null,"po":"40130000","vendor":"Delta Trading Co., Ltd.","org":352,"tax":"0145548001557","pages":1,"rcv":"530340302","receiver":"WILAIWAN SRISUK","upl":"WILAIWAN.S","date":"2026-10-01","up":"2026-10-01","sub":8400,"vat":588.0,"total":8988.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Ejector Pin 6 x 150",60,"PCS",140,8400,1,50,140,"M1"]],"rtotal":7000.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"fail","exception_code":"E14","severity":"High","evidence":"วางบิล 60 > ใบรับ 50","page":1},{"rule_id":"V-09","result":"fail","exception_code":"E03","severity":"High","evidence":"ใบแจ้งหนี้ 8,400.00 vs ใบรับ 7,000.00","page":1}],"codes":["E14","E03"],"aiva":"Hold","status":"Superseded","tc":"DR-02 ฉบับเดิม (Hold) → Superseded","grp":"E · เอกสารซ้ำ (ตารางที่ 8A)","supersededBy":"DMS-2026-000302-R1","supRule":"DR-02 ฉบับใหม่เท่าเดิม (Hold vs Hold) → ฉบับเดิม Superseded","xh":[{"t":"2026-10-04 08:40","a":"Superseded","d":"DR-02 ฉบับใหม่เท่าเดิม (Hold vs Hold) → ฉบับเดิม Superseded · ฉบับใหม่ DMS-2026-000302-R1","k":"c"}]},{"doc":"DMS-2026-000302-R1","inv":"DR-2610-0102","stax":"0105546011116","oname":"DELTA TRADING CO., LTD.","release":null,"po":"40130000","vendor":"Delta Trading Co., Ltd.","org":352,"tax":"0145548001557","pages":1,"rcv":"530342-R1","receiver":"WILAIWAN SRISUK","upl":"WILAIWAN.S","date":"2026-10-04","up":"2026-10-04","sub":7000,"vat":490.0,"total":7490.0,"sig":[1,0],"custOn":"head_office_th","lines":[["Ejector Pin 6 x 150",50,"PCS",140,7000,1,50,140,"M1"]],"rtotal":7000.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"fail","exception_code":"E08","severity":"High","evidence":"ไม่พบลายเซ็นผู้รับของ","page":1},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":["E08"],"aiva":"Hold","status":"Hold","tc":"DR-02 ฉบับใหม่เท่าเดิม (Hold) → ใช้ฉบับใหม่","grp":"E · เอกสารซ้ำ (ตารางที่ 8A)","supersedes":"DMS-2026-000302","supRule":"DR-02 ฉบับใหม่เท่าเดิม (Hold vs Hold) → ฉบับเดิม Superseded","xh":[{"t":"2026-10-04 08:40","a":"แทนที่ฉบับเดิม","d":"DR-02 ฉบับใหม่เท่าเดิม (Hold vs Hold) → ฉบับเดิม Superseded · ฉบับเดิม DMS-2026-000302","k":"g"}]},{"doc":"DMS-2026-000303","inv":"DR-2610-0103","stax":"0105546011116","oname":"DELTA TRADING CO., LTD.","release":null,"po":"40130000","vendor":"Delta Trading Co., Ltd.","org":376,"tax":"0135546008643","pages":1,"rcv":"530340303","receiver":"THANAKORN MANKONG","upl":"THANAKORN.M","date":"2026-10-02","up":"2026-10-02","sub":6400,"vat":448.0,"total":6848.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Coolant Concentrate",20,"L",320,6400,1,20,320,"M1"]],"rtotal":6400.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"fail","exception_code":"E10","severity":"Medium","evidence":"หน่วยนับ L vs ใบรับ CAN","page":1},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":["E10"],"aiva":"Review","status":"Review","tc":"DR-03 ฉบับเดิม (Review) → คงไว้","grp":"E · เอกสารซ้ำ (ตารางที่ 8A)"},{"doc":"DMS-2026-000303-R1","inv":"DR-2610-0103","stax":"0105546011116","oname":"DELTA TRADING CO., LTD.","release":null,"po":"40130000","vendor":"Delta Trading Co., Ltd.","org":376,"tax":"0135546008643","pages":1,"rcv":"530343-R1","receiver":"THANAKORN MANKONG","upl":"THANAKORN.M","date":"2026-10-05","up":"2026-10-05","sub":6400,"vat":448.0,"total":6848.0,"sig":[1,0],"custOn":"head_office_th","lines":[["Coolant Concentrate",20,"L",320,6400,1,20,320,"M1"]],"rtotal":6400.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"fail","exception_code":"E08","severity":"High","evidence":"ไม่พบลายเซ็นผู้รับของ","page":1},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":["E08"],"aiva":"Hold","status":"Duplicate","tc":"DR-03 ฉบับใหม่แย่กว่า (Hold) → Duplicate","grp":"E · เอกสารซ้ำ (ตารางที่ 8A)","dup":"DMS-2026-000303","dupRule":"DR-03 ฉบับใหม่แย่กว่า (Hold vs Review) → ฉบับใหม่ Duplicate"},{"doc":"DMS-2026-000305","inv":"DR-2610-0105","stax":"0105546011116","oname":"DELTA TRADING CO., LTD.","release":null,"po":"40130000","vendor":"Delta Trading Co., Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530340305","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-09-15","up":"2026-09-15","sub":4200,"vat":294.0,"total":4494.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Grease EP2",30,"KG",140,4200,1,30,120,"—"]],"rtotal":3600.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"fail","exception_code":"E09","severity":"High","evidence":"ราคา 140.00 vs ใบรับ 120.00","page":1},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"fail","exception_code":"E03","severity":"High","evidence":"ใบแจ้งหนี้ 4,200.00 vs ใบรับ 3,600.00","page":1}],"codes":["E09","E03"],"aiva":"Hold","status":"Rejected","tc":"DR-05 ฉบับเดิม Rejected (เดือนก่อน)","grp":"E · เอกสารซ้ำ (ตารางที่ 8A)","xh":[{"t":"2026-09-16 10:05","a":"Reject (Hold → Rejected)","d":"ปณิดา รักงาน (เจ้าหน้าที่บัญชี) · ผู้ขายออกใบแจ้งหนี้ผิด · รอฉบับแก้ไข","k":"c"}]},{"doc":"DMS-2026-000305-R1","inv":"DR-2610-0105","stax":"0105546011116","oname":"DELTA TRADING CO., LTD.","release":null,"po":"40130000","vendor":"Delta Trading Co., Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530345-R1","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-10-02","up":"2026-10-02","sub":3600,"vat":252.0,"total":3852.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Grease EP2",30,"KG",120,3600,1,30,120,"M1"]],"rtotal":3600.0,"rules":[{"rule_id":"V-01","result":"fail","exception_code":"E01","severity":"Medium","evidence":"อ่านวันที่ใบแจ้งหนี้ไม่ได้ (สแกนไม่ชัด)","page":1},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":["E01"],"aiva":"Review","status":"Review","tc":"DR-05 ฉบับใหม่หลังฉบับเดิมถูก Reject → สถานะตามผลตรวจ","grp":"E · เอกสารซ้ำ (ตารางที่ 8A)","xh":[{"t":"2026-10-02 08:40","a":"Portal ตรวจเอกสารซ้ำ","d":"DR-05 ฉบับเดิม DMS-2026-000305 เป็น Rejected ไม่ใช้เป็นคู่เทียบ · ใช้ผลตรวจตามปกติ","k":"s"}]},{"doc":"DMS-2026-000306","inv":"DR-2610-0106A","stax":"0105546011116","oname":"DELTA TRADING CO., LTD.","release":null,"po":"40130000","vendor":"Delta Trading Co., Ltd.","org":352,"tax":"0145548001557","pages":1,"rcv":"540112600","receiver":"WILAIWAN SRISUK","upl":"WILAIWAN.S","date":"2026-10-01","up":"2026-10-01","sub":8400,"vat":588.0,"total":8988.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Spring Die 20 x 50",40,"PCS",210,8400,1,40,210,"M4"]],"rtotal":8400.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"fail","exception_code":"E11","severity":"Medium","evidence":"จับคู่ด้วยคำบรรยาย (M4)","page":1},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":["E11"],"aiva":"Review","status":"Review","tc":"DR-06 ฉบับเดิม (ใบรับ 540112600) → คงไว้","grp":"E · เอกสารซ้ำ (ตารางที่ 8A)"},{"doc":"DMS-2026-000307","inv":"DR-2610-0106B","stax":"0105546011116","oname":"DELTA TRADING CO., LTD.","release":null,"po":"40130000","vendor":"Delta Trading Co., Ltd.","org":352,"tax":"0145548001557","pages":1,"rcv":"540112600","receiver":"WILAIWAN SRISUK","upl":"WILAIWAN.S","date":"2026-10-03","up":"2026-10-03","sub":8400,"vat":588.0,"total":8988.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Spring Die 20 x 50",40,"PCS",210,8400,1,40,210,"M1"]],"rtotal":8400.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":[],"aiva":"Auto-pass","status":"Duplicate","tc":"DR-06 คนละเลขที่ใบแจ้งหนี้ แต่ใบรับเดียวกัน → Duplicate","grp":"E · เอกสารซ้ำ (ตารางที่ 8A)","dup":"DMS-2026-000306","dupRule":"DR-06 ใช้ใบรับ 540112600 ซ้ำกับ DMS-2026-000306 (คนละเลขที่ใบแจ้งหนี้) → ฉบับใหม่ Duplicate"},{"doc":"DMS-2026-000180","inv":"KS-2609-0301","stax":"0105537011111","oname":"KANOK STEEL CO., LTD.","release":null,"po":"40130000","vendor":"Kanok Steel Co., Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530340310","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-09-26","up":"2026-09-26","sub":25200.0,"vat":1764.0,"total":26964.0,"sig":[1,1],"custOn":"head_office_th","lines":[["SPCC 1.2 x 1219 x COIL",800,"KG",31.5,25200.0,1,800,31.5,"M1"]],"rtotal":25200.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":[],"aiva":"Auto-pass","status":"Auto-pass","tc":"Confirmed · ส่ง Batch ได้ · DR-04 ฉบับเดิม","grp":"F · AP Interface","ap":{"st":"Confirmed","by":"u4","at":"2026-09-29"}},{"doc":"DMS-2026-000181","inv":"OSG-2609-0045","stax":"0105549022222","oname":"OSG THAI CO., LTD.","release":null,"po":"40130000","vendor":"OSG Thai Co., Ltd.","org":352,"tax":"0145548001557","pages":1,"rcv":"540112320","receiver":"WILAIWAN SRISUK","upl":"WILAIWAN.S","date":"2026-09-26","up":"2026-09-26","sub":15400,"vat":1078.0,"total":16478.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Tap M8 x 1.25",40,"PCS",385,15400,1,40,385,"M1"]],"rtotal":15400.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":[],"aiva":"Auto-pass","status":"Auto-pass","tc":"Confirmed · ส่ง Batch ได้","grp":"F · AP Interface","ap":{"st":"Confirmed","by":"u4","at":"2026-09-29"}},{"doc":"DMS-2026-000182","inv":"AM-2609-0420","stax":"0105539044556","oname":"SIAM AUTO PARTS CO., LTD.","release":null,"po":"40130000","vendor":"Siam Auto Parts Co., Ltd.","org":376,"tax":"0135546008643","pages":1,"rcv":"560020430","receiver":"THANAKORN MANKONG","upl":"THANAKORN.M","date":"2026-09-30","up":"2026-09-30","sub":22200,"vat":1554.0,"total":23754.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Oil Filter",120,"PCS",185,22200,1,120,185,"M1"]],"rtotal":22200.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":[],"aiva":"Auto-pass","status":"Auto-pass","tc":"Confirmed โดย APR · SoD: ผู้ยืนยันส่งเองไม่ได้","grp":"F · AP Interface","ap":{"st":"Confirmed","by":"u6","at":"2026-09-30"}},{"doc":"DMS-2026-000183","inv":"FN-2609-1200","stax":"0105545033333","oname":"FANUC THAI LTD.","release":null,"po":"40130000","vendor":"Fanuc Thai Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530340355","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-09-30","up":"2026-09-30","sub":1240000,"vat":86800.0,"total":1326800.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Servo Motor αiF 22",5,"PCS",248000,1240000,1,5,248000,"M1"]],"rtotal":1240000.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":[],"aiva":"Auto-pass","status":"Auto-pass","tc":"Confirmed · เกินวงเงิน 1,000,000 บาท","grp":"F · AP Interface","ap":{"st":"Confirmed","by":"u4","at":"2026-09-30"}},{"doc":"DMS-2026-000184","inv":"NX-2609-0777","stax":"0105551045678","oname":"NX SHOJI (THAILAND) CO., LTD.","release":null,"po":"40130000","vendor":"NX Shoji (Thailand) Co., Ltd.","org":175,"tax":"0145548001549","pages":1,"rcv":"570010021","receiver":"KITTI SOMBOON","upl":"KITTI.S","date":"2026-09-30","up":"2026-09-30","sub":18600,"vat":1302.0,"total":19902.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Plastic Pallet 1100x1100",30,"PCS",620,18600,1,30,620,"M1"]],"rtotal":18600.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":[],"aiva":"Auto-pass","status":"Auto-pass","tc":"Confirmed · พบซ้ำตอนตรวจก่อนส่ง → Duplicate","grp":"F · AP Interface","ap":{"st":"Confirmed","by":"u5","at":"2026-09-30"},"dupAtPost":"IV ฉบับเดียวกันถูกส่งเข้า AP แล้วใน Batch B-260925-02"},{"doc":"DMS-2026-000185","inv":"KS-2609-0288","stax":"0105537011111","oname":"KANOK STEEL CO., LTD.","release":null,"po":"40130000","vendor":"Kanok Steel Co., Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530340290","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-09-28","up":"2026-09-28","sub":19080.0,"vat":1335.6,"total":20415.6,"sig":[1,1],"custOn":"head_office_th","lines":[["SPCC 1.0 x 1219 x COIL",600,"KG",31.8,19080.0,1,600,31.8,"M1"]],"rtotal":19080.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":[],"aiva":"Auto-pass","status":"Auto-pass","tc":"Sent · รอผล Import","grp":"F · AP Interface","ap":{"st":"Sent","by":"u4","at":"2026-09-28","batch":"B-261001-01","sentBy":"u6","sentAt":"2026-10-01 16:10"}},{"doc":"DMS-2026-000186","inv":"OSG-2609-0031","stax":"0105549022222","oname":"OSG THAI CO., LTD.","release":null,"po":"40130000","vendor":"OSG Thai Co., Ltd.","org":352,"tax":"0145548001557","pages":1,"rcv":"540112290","receiver":"WILAIWAN SRISUK","upl":"WILAIWAN.S","date":"2026-09-27","up":"2026-09-27","sub":13800,"vat":966.0,"total":14766.0,"sig":[1,1],"custOn":"head_office_th","lines":[["End Mill D6",20,"PCS",690,13800,1,20,690,"M1"]],"rtotal":13800.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":[],"aiva":"Auto-pass","status":"Auto-pass","tc":"Posted · ปิดแล้ว (เดือนก่อน)","grp":"F · AP Interface","ap":{"st":"Posted","by":"u4","at":"2026-09-27","batch":"B-260930-01","sentBy":"u6","sentAt":"2026-09-30 15:20","apId":"AP-1188204"}},{"doc":"DMS-2026-000187","inv":"PS-2609-0012","stax":"0105560044444","oname":"PROSERV ENGINEERING CO., LTD.","release":null,"po":"40130000","vendor":"Proserv Engineering Co., Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530340250","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-09-27","up":"2026-09-27","sub":45000,"vat":3150.0,"total":48150.0,"sig":[1,1],"custOn":"head_office_th","lines":[["ค่าบริการซ่อมเครื่องอัด",1,"JOB",45000,45000,1,1,45000,"M1"]],"rtotal":45000.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":[],"aiva":"Auto-pass","status":"Auto-pass","tc":"Import Failed · Return → Review (APR)","grp":"F · AP Interface","ap":{"st":"Import Failed","by":"u4","at":"2026-09-27","batch":"B-260930-01","sentBy":"u6","sentAt":"2026-09-30 15:20","err":"AP_INVOICES_INTERFACE · INVALID SUPPLIER SITE: Supplier site ของผู้ขายถูกปิดใช้งานใน Oracle"}},{"doc":"DMS-2026-000180-R1","inv":"KS-2609-0301","stax":"0105537011111","oname":"KANOK STEEL CO., LTD.","release":null,"po":"40130000","vendor":"Kanok Steel Co., Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530340310","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-10-06","up":"2026-10-06","sub":25200.0,"vat":1764.0,"total":26964.0,"sig":[1,1],"custOn":"head_office_th","lines":[["SPCC 1.2 x 1219 x COIL",800,"KG",31.5,25200.0,1,800,31.5,"M1"]],"rtotal":25200.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":[],"aiva":"Auto-pass","status":"Duplicate","tc":"DR-04 ฉบับเดิม Confirmed → ฉบับใหม่ Duplicate","grp":"E · เอกสารซ้ำ (ตารางที่ 8A)","dup":"DMS-2026-000180","dupRule":"DR-04 ฉบับเดิม DMS-2026-000180 Confirmed → ฉบับใหม่ Duplicate"},{"doc":"DMS-2026-000090","inv":"OL-2608-0012","stax":"0105558022227","oname":"ORIENT LOGISTICS CO., LTD.","release":null,"po":"40130000","vendor":"Orient Logistics Co., Ltd.","org":352,"tax":"0145548001557","pages":1,"rcv":"530340090","receiver":"WILAIWAN SRISUK","upl":"WILAIWAN.S","date":"2026-08-18","up":"2026-08-18","sub":14000,"vat":980.0,"total":14980.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Freight Bangkok–Ayutthaya",4,"TRIP",3500,14000,1,4,3200,"—"]],"rtotal":12800.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"fail","exception_code":"E09","severity":"High","evidence":"ราคา 3,500.00 vs ใบรับ 3,200.00","page":1},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"fail","exception_code":"E03","severity":"High","evidence":"ใบแจ้งหนี้ 14,000.00 vs ใบรับ 12,800.00","page":1}],"codes":["E09","E03"],"aiva":"Hold","status":"Hold","tc":"ค้างนอกช่วง 2 เดือน (ส.ค.) · ต้องขึ้นแถบเตือน","grp":"H · ช่วงเวลา"},{"doc":"DMS-2026-000091","inv":"OL-2608-0020","stax":"0105558022227","oname":"ORIENT LOGISTICS CO., LTD.","release":null,"po":"40130000","vendor":"Orient Logistics Co., Ltd.","org":103,"tax":"0107545000179","pages":1,"rcv":"530331020","receiver":"SOMSAK JAIDEE","upl":"SOMSAK.J","date":"2026-08-20","up":"2026-08-20","sub":8400,"vat":588.0,"total":8988.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Freight Rayong–Ayutthaya",2,"TRIP",4200,8400,1,2,4200,"M1"]],"rtotal":8400.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"pass"},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":[],"aiva":"Auto-pass","status":"Auto-pass","tc":"Posted (ส.ค.) · ปิดแล้ว ซ่อนได้ตามช่วงเวลา","grp":"H · ช่วงเวลา","ap":{"st":"Posted","by":"u4","at":"2026-08-21","batch":"B-260822-01","sentBy":"u6","sentAt":"2026-08-22 15:00","apId":"AP-1176011"}},{"doc":"DMS-2026-000092","inv":"OL-2608-0031","stax":"0105558022227","oname":"ORIENT LOGISTICS CO., LTD.","release":null,"po":"40130000","vendor":"Orient Logistics Co., Ltd.","org":376,"tax":"0135546008600","pages":1,"rcv":"530340092","receiver":"THANAKORN MANKONG","upl":"THANAKORN.M","date":"2026-08-25","up":"2026-08-25","sub":8400,"vat":588.0,"total":8988.0,"sig":[1,1],"custOn":"head_office_th","lines":[["Freight Bangna–Lat Phrao",3,"TRIP",2800,8400,1,3,2800,"M1"]],"rtotal":8400.0,"rules":[{"rule_id":"V-01","result":"pass"},{"rule_id":"V-02","result":"pass"},{"rule_id":"V-03","result":"pass"},{"rule_id":"V-04","result":"pass"},{"rule_id":"V-05","result":"fail","exception_code":"E07","severity":"High","evidence":"Tax ID ลูกค้าบนใบแจ้งหนี้ไม่ตรงกับตารางที่ 4","page":1},{"rule_id":"V-06","result":"pass"},{"rule_id":"V-07","result":"pass"},{"rule_id":"V-08","result":"pass"},{"rule_id":"V-09","result":"pass"}],"codes":["E07"],"aiva":"Hold","status":"Rejected","tc":"Rejected (ส.ค.) · ปิดแล้ว","grp":"H · ช่วงเวลา","ent":{"tax_id_match":false},"xh":[{"t":"2026-08-26 11:20","a":"Reject (Hold → Rejected)","d":"กมลวรรณ ใจงาม (เจ้าหน้าที่บัญชี) · ผู้ขายออกใบแจ้งหนี้ผิดนิติบุคคล","k":"c"}]}];
/* v4.18 — เอกสารไม่ทราบเจ้าของ (UNRESOLVED → Manual Review · ไม่มี Receiver · บริษัทจาก Tax ID ลูกค้า) */
const UR=(why)=>R({"V-01":{result:M,evidence:why},"V-04":{result:N,halted_by:"IDENTITY"},"V-05":{result:N,halted_by:"IDENTITY"},"V-07":{result:N,halted_by:"IDENTITY"},"V-08":{result:N,halted_by:"IDENTITY"},"V-09":{result:N,halted_by:"IDENTITY"}});
DOCS.push({"doc":"DMS-2026-000401","inv":"(อ่านไม่ได้)","stax":"0105546011116","oname":null,"release":null,"po":"—","vendor":"Delta Trading Co., Ltd.","org":null,"tax":"0107545000179","pages":1,"rcv":"—","receiver":null,"upl":"SOMSAK.J","date":"2026-09-30","up":"2026-10-01","sub":5000,"vat":350,"total":5350,"sig":[1,1],"custOn":"head_office_th","lines":[["รายการสินค้า (เลขที่ใบแจ้งหนี้อ่านไม่ได้)",1,"JOB",5000,5000,null,null,null,"—"]],"rtotal":null,"rules":UR("OCR อ่านเลขที่ใบแจ้งหนี้และเลข PO ไม่ได้ จึงค้น Oracle ไม่ได้"),"codes":[],"aiva":"Manual Review","status":"Manual Review","tc":"UNRESOLVED · ไม่ทราบเจ้าของ (อ่าน Invoice + PO ไม่ได้) · บริษัท AH จาก Tax ID ลูกค้า · ACC/APR Reject ได้","grp":"B · Manual Review","unres":true,"missing":["invoice_num","po_number"]},
{"doc":"DMS-2026-000402","inv":"MG-2610-0770","stax":"—","oname":null,"release":null,"po":"—","vendor":"Metro Supply Co., Ltd.","org":null,"tax":"—","pages":1,"rcv":"—","receiver":null,"upl":"NARONG.P","date":"2026-10-05","up":"2026-10-05","sub":8000,"vat":560,"total":8560,"sig":[1,1],"custOn":null,"lines":[["Service Kit",2,"SET",4000,8000,null,null,null,"—"]],"rtotal":null,"rules":UR("OCR อ่านเลข PO และ Tax ID ผู้ขายไม่ได้ จึงค้น Oracle ไม่ได้ · อ่าน Tax ID ลูกค้าไม่ได้ → บริษัท ?"),"codes":[],"aiva":"Manual Review","status":"Manual Review","tc":"UNRESOLVED · อ่าน PO + Tax ID ผู้ขายไม่ได้ · Tax ID ลูกค้าอ่านไม่ได้ → บริษัท ? (เห็นเฉพาะ APR)","grp":"B · Manual Review","unres":true,"missing":["po_number","supplier_tax_id"]});
const BATCHES=[{"id":"B-260822-01","at":"2026-08-22 15:00","by":"u6","docs":["DMS-2026-000091"]},{"id":"B-260930-01","at":"2026-09-30 15:20","by":"u6","docs":["DMS-2026-000186","DMS-2026-000187"]},{"id":"B-261001-01","at":"2026-10-01 16:10","by":"u6","docs":["DMS-2026-000185"]}];
const AUDIT=[];
function setOwner(d){d.owner=d.receiver||null;d.ownerSrc=d.receiver?"RECEIVER จากใบรับ (RCV_VRC_HDS_V)":"ไม่มี Receiver (ยังไม่พบใบรับ)";
 d.receiverActive=!d.receiver||bound(d.receiver)}
DOCS.forEach((d,i)=>{d.round=1;d.company=d.org?companyOfOrg(d.org):companyOfTax(d.tax);
 setOwner(d);
 d.assigned=(!d.receiver||!d.receiverActive||d.status==="Manual Review"||d.status==="Duplicate"||d.status==="Auto-pass")?"acc":(d.codes.some(c=>EUCODES.has(c))?"eu":"acc");
 d.hist=[{t:d.up+" 08:10",a:"AIVA ตรวจรอบที่ 1",d:"ผล "+(d.aiva||d.status)+(d.codes.length?" · "+d.codes.join(", "):""),k:"s"}];
 if(d.dup){d.duplicateOf=d.dup;d.dupRule=d.dupRule||"ตรวจพบตอนรับเอกสาร";d.hist.push({t:d.up+" 08:40",a:"Portal ตรวจเอกสารซ้ำ",d:d.dupRule,k:"c"})}if(d.xh)d.hist.push(...d.xh);});

const uName=id=>(USERS.find(u=>u.id===id)||{}).n||"—";
DOCS.forEach(d=>{if(!d.ap)return;const a=d.ap;d.status=a.st;d.confirmedBy=a.by;d.confirmedAt=a.at;d.assigned="acc";
 d.hist.push({t:a.at,a:"ยืนยันผลตรวจ",d:uName(a.by)+" · ตรวจแล้วถูกต้อง",k:"g"});
 if(a.batch){d.batch=a.batch;d.sentBy=a.sentBy;d.sentAt=a.sentAt;d.hist.push({t:a.sentAt,a:"ส่งเข้า AP Interface · "+a.batch,d:uName(a.sentBy)+" · Portal ตรวจซ้ำแล้ว ไม่พบซ้ำ",k:"h"})}
 if(a.st==="Posted"){d.apId=a.apId;d.hist.push({t:a.sentAt,a:"Oracle Import สำเร็จ",d:"Invoice ID "+a.apId,k:"g"})}
 if(a.st==="Import Failed"){d.apErr=a.err;d.hist.push({t:a.sentAt,a:"Oracle Import ไม่ผ่าน",d:a.err,k:"c"})}});
DOCS.forEach(d=>d.hist.forEach(h=>{if(h.a&&h.a.startsWith("Reject (")){const p=h.d.split(" · ");h.who=p[0];h.rs=p[1]||"";h.nt=p.slice(2).join(" · ")}else if(h.a==="ยืนยันผลตรวจ"){const p=h.d.split(" · ");h.who=p[0];h.rs=p[1]||"";h.nt=""}}));
/* v4.16 — ประวัติจากระบบ (seed) สำหรับทดสอบตัวกรองช่วงเวลาในหน้า Audit */
DOCS.slice().sort((x,y)=>y.up.localeCompare(x.up)).forEach(d=>{AUDIT.push({dt:d.up,t:"08:30:00",who:"AIVA (ระบบ)",role:"ระบบ",act:"รับผลตรวจจาก AIVA",doc:d.doc,detail:"ผล "+(d.aiva||d.status)+(d.codes.length?" · "+d.codes.join(", "):"")})});
/* ---- v4.8 additions: English legal names (ใช้บนไฟล์ PDF ตัวอย่าง) ---- */
const COMPANY_EN={AH:"AAPICO HITECH PUBLIC COMPANY LIMITED",AHT:"AAPICO HITECH TOOLING CO., LTD.",AHP:"AAPICO HITECH PARTS CO., LTD.",AM:"ABLE MOTORS CO., LTD.","?":"AAPICO GROUP (ORG 556 - MGP)"};


/* =====================================================================
   AIVA Portal v4.8 — UI layer (logic ported 1:1 from v4.7, visual from v2)
   Sections: icons · state · shell/nav · queue (list/detail) · PDF dock ·
             actions/modals · AP Interface · RBAC · Audit · keyboard
   ===================================================================== */
/* ================= Icons (Lucide-style, stroke 1.8) ================= */
const I={menu:"M4 6h16M4 12h16M4 18h16",inbox:"M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
shield:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",send:"M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",log:"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
file:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",search:"M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35",x:"M18 6 6 18M6 6l12 12",
check:"M20 6 9 17l-5-5",checkc:"M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",alert:"M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
pause:"M10 15V9M14 15V9M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",copy:"M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
refresh:"M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",undo:"M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-1",
ban:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM4.93 4.93l14.14 14.14",msg:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
ext:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3",dl:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
chevL:"M15 18l-6-6 6-6",chevR:"M9 18l6-6-6-6",chevsL:"M11 17l-5-5 5-5M18 17l-5-5 5-5",lock:"M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
user:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",building:"M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01",
layers:"M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",clock:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
target:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
table:"M3 3h18v18H3zM3 9h18M3 15h18M9 3v18",split:"M3 3h18v18H3zM12 3v18",info:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
zin:"M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35M11 8v6M8 11h6",zout:"M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35M8 11h6",
fitw:"M21 12H3M7 8l-4 4 4 4M17 8l4 4-4 4",monitor:"M2 3h20v14H2zM8 21h8M12 17v4",key:"M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zM15.5 7.5l3 3L22 7l-3-3"};
const icon=(n,c="")=>{const a=window.AIVA_ICONS&&AIVA_ICONS[n];return `<svg class="ico ${c}" viewBox="0 0 24 24" aria-hidden="true">${a?(a[1]?`<path class="f" d="${a[1]}"/>`:"")+`<path d="${a[0]}"/>`+(a[2]?`<path class="a" d="${a[2]}"/>`:""):`<path d="${I[n]}"/>`}</svg>`};

/* ================= State ================= */
let page="queue",sel=null,tab="sum",filt="all",coF=new Set(),view="table",qText="";
const RM=()=>!!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches);
const PDF={open:false,doc:null,page:1,mode:"evidence",focus:null,token:"",zoom:1,key:""};
const $=id=>document.getElementById(id);
const B=n=>n==null?"—":Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const now=()=>new Date().toTimeString().slice(0,8);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");
const badge=s=>`<span class="badge st-${s.split(" ")[0]}"><i></i>${s}</span>`;
const sevOf=(d,c)=>{const r=d.rules.find(x=>x.exception_code===c);return r&&r.severity||"High"};
const docOf=id=>DOCS.find(x=>x.doc===id)||DOCS.find(x=>id&&id.startsWith(x.doc));

/* ================= RBAC (v4.7) ================= */
function scopeCheck(d,u=ME){const r=ROLES[u.role];
   if(u.off)return {ok:false,why:"บัญชีถูกระงับ"};
 if(r.scope==="none")return {ok:false,why:"บทบาทนี้ไม่เข้าถึงเนื้อหาเอกสาร"};
 if(!u.co.includes(d.company))return {ok:false,why:"เอกสารอยู่นอกบริษัทที่ได้รับมอบหมาย ("+d.company+")"};
 if(r.scope==="receiver"&&!d.receiver)return {ok:false,why:"เอกสารยังไม่มี Receiver ในใบรับ · ฝ่ายบัญชีดำเนินการ"};
 if(r.scope==="receiver"&&!acctsOf(u).includes(d.receiver))return {ok:false,why:"ไม่ได้เป็น Receiver ของใบรับนี้ (Receiver = "+d.receiver+")"};
 return {ok:true}}
const visible=()=>DOCS.filter(d=>scopeCheck(d).ok);
function log(act,doc,detail){AUDIT.unshift({dt:TODAY,t:now(),who:ME.n,role:ROLES[ME.role].n,act,doc,detail})}

/* ================= Shell ================= */
function storageGet(key){try{return window.localStorage.getItem(key)}catch(e){return null}}
function storageSet(key,value){try{window.localStorage.setItem(key,value)}catch(e){}}
function init(){$("user").innerHTML=USERS.map(u=>`<option value="${u.id}">${u.n} — ${ROLES[u.role].n}</option>`).join("");$("user").value=ME.id;
 if(storageGet("aiva.nav")==="c")$("shell").classList.add("nav-c");switchUser(true)}
function toggleNav(){const s=$("shell");s.classList.toggle("nav-c");storageSet("aiva.nav",s.classList.contains("nav-c")?"c":"e")}
function switchUser(first){ME=USERS.find(u=>u.id===$("user").value);
 const r=ROLES[ME.role],rb=$("rolebadge");rb.textContent=r.n;rb.style.background=r.bg;rb.style.color=r.c;
 page=ME.role==="ADM"?"perm":"queue";filt=ME.role==="EU"?"mine":"all";coF=new Set();CF={};if(CD)cfClose();loadPref();perLoad();showClosed=wantShowClosed();setTab=null;tab="sum";view=PREF.view||"table";qText="";closeDock(true);qHide=false;
 sel=(visible().filter(listFilter)[0]||{}).doc;
 log("เข้าสู่ระบบ","—","Entra ID "+ME.email+(ME.role==="EU"?" · Oracle account "+(acctsOf(ME).join(", ")||"—"):""));$("app").innerHTML="";render();if(!first)toast("สลับเป็น "+ME.n)}
function go(p){if(page===p){if(p==="queue"&&view==="split")backToTable();return}if(p==="queue"){view="table";closeDock(true)}page=p;$("shell").classList.remove("nav-auto");$("app").innerHTML="";render()}
function renderNav(){
 const qn=visible().filter(d=>ME.role==="EU"?match("mine",d):!["Posted","Rejected","Confirmed","Sent","Import Failed","Auto-pass"].includes(d.status)).length;
 const items=[["งานหลัก"],["queue",ME.role==="EU"?"งานของฉัน":"คิวตรวจสอบ","inbox",ME.role!=="ADM",qn],["ap","ส่งเข้า AP Interface","send",can("VIEW_AP"),can("VIEW_AP")?apRows("pending").length:0],
  ["การกำกับดูแล"],["perm","จัดการสิทธิ์ (Admin)","users",can("MAP"),typeof pmPendingN==="function"?pmPendingN():0],["rbac","สิทธิ์และการเชื่อมบัญชี (อ้างอิง)","shield",true,0],["cases","ชุดเอกสารทดสอบ","layers",true,DOCS.length],["audit","บันทึกการเข้าถึง","log",can("AUDIT"),0],["settings","ตั้งค่า","sliders",true,ME.role==="ADM"?unboundAccts().length:0],
  ["สำหรับนักพัฒนา"],["std","มาตรฐาน Payload","code",true,0],["เครื่องมือพิเศษ"],["sim","Document Simulation","flask",true,0]];
 $("navlist").innerHTML=items.map(it=>{if(it.length===1)return `<div class="nav-sec ${it[0]==="เครื่องมือพิเศษ"?"sp":""}">${it[0]}</div>`;const [k,l,ic,ok,n]=it;
  return `<button class="nav-it ${k==="sim"?"sim":""} ${page===k?"on":""} ${ok?"":"dis"} ${n?"has-cnt":""}" title="${l}${ok?"":" (ไม่มีสิทธิ์)"}" ${page===k?'aria-current="page"':""} onclick="${ok?`go('${k}')`:`toast('ไม่มีสิทธิ์เข้าหน้านี้',1)`}">${icon(ic,"lg")}<span class="lbl">${l}</span>${!ok?`<span class="lock">${icon("lock","sm")}</span>`:k==="sim"?`<span class="tagsim">SIM</span>`:k==="std"?`<span class="tagdev">API</span>`:n?`<span class="cnt">${n}</span>`:""}</button>`}).join("")}
function render(){renderNav();if(page==="perm"){$("app").innerHTML=permPage();pmMount()}else if(page==="settings")$("app").innerHTML=settingsPage();else if(page==="sim")$("app").innerHTML=simPage();else if(page==="std")$("app").innerHTML=stdPage();else if(page==="cases")$("app").innerHTML=casesPage();else if(page==="rbac")$("app").innerHTML=rbacPage();else if(page==="ap")$("app").innerHTML=apPage();else if(page==="audit")$("app").innerHTML=auditPage();else queuePage()}

/* ================= Queue page ================= */
function match(k,d){if(k==="all")return showClosed||ME.role==="EU"||!CLOSED_V.includes(d.status);if(k==="bind")return pendingBind(d);if(k==="unres")return !!d.unres&&d.status==="Manual Review";if(k==="mine")return d.assigned==="eu"&&!["Posted","Rejected","Confirmed","Sent","Superseded","Duplicate"].includes(d.status);return d.status===k}

/* ================= v4.16 Period filter (วันที่เข้าระบบ = dms.uploaded_at) ================= */
const TODAY="2026-10-07";
const OPEN_ST=["Review","Hold","Manual Review","Duplicate"];
const PER_OPT=[["all","ทั้งหมด"],["today","วันนี้"],["7d","7 วันล่าสุด"],["month","เดือนนี้"],["lastm","เดือนก่อน"],["period","เลือกงวด"],["custom","กำหนดเอง"]];
const PERS={q:{k:"month"},ap:{k:"all"},au:{k:"all"}};
const isoD=t=>t.toISOString().slice(0,10);
const dAdd=(x,n)=>{const t=new Date(x+"T00:00:00Z");t.setUTCDate(t.getUTCDate()+n);return isoD(t)};
const mRange=ym=>{const [y,m]=ym.split("-").map(Number);return [ym+"-01",isoD(new Date(Date.UTC(y,m,0)))]};
function perRange(p){const ym=TODAY.slice(0,7);
 switch(p.k){case "today":return [TODAY,TODAY];case "7d":return [dAdd(TODAY,-6),TODAY];case "month":return mRange(ym);
  case "lastm":{const [y,m]=ym.split("-").map(Number);return mRange(isoD(new Date(Date.UTC(y,m-2,1))).slice(0,7))}
  case "period":return mRange(p.ym||ym);
  case "custom":return (p.from||p.to)?[p.from||"0000-01-01",p.to||"9999-12-31"]:null;
  default:return null}}
const inPerOf=(dt,p)=>{const r=perRange(p);return !r||(!!dt&&dt>=r[0]&&dt<=r[1])};
const inPer=d=>inPerOf(d.up,PERS.q);
const dmy=x=>x&&x.length>=10?x.slice(8,10)+"/"+x.slice(5,7)+"/"+x.slice(0,4):"…";
function perLabel(p){const r=perRange(p);if(!r)return "ทุกช่วงเวลา";return (r[0]==="0000-01-01"?"…":dmy(r[0]))+" – "+(r[1]==="9999-12-31"?"…":dmy(r[1]))}
const ageDays=d=>Math.max(0,Math.round((new Date(TODAY+"T00:00:00Z")-new Date(d.up+"T00:00:00Z"))/864e5));
const agePill=d=>`<span class="age ${OPEN_ST.includes(d.status)&&ageDays(d)>SET.staleDays?"old":""}" title="นับจากวันที่เข้าระบบ ${dmy(d.up)}">อายุ ${ageDays(d)} วัน</span>`;
const perKey=()=>"aiva.per."+ME.id;
const perDefault=()=>({k:ME.role==="EU"?(PREF.period||"all"):(PREF.period||SET.period)});
function perLoad(){let p=null;try{p=JSON.parse(storageGet(perKey())||"null")}catch(e){}PERS.q=p&&p.k?p:perDefault();PERS.ap={k:"all"};PERS.au={k:"all"}}
function perCtl(sc){const p=PERS[sc];
 return `<span class="lab">ช่วงเวลา</span><select class="sel" aria-label="ช่วงเวลา" onchange="perSet('${sc}','k',this.value)">${PER_OPT.map(([k,l])=>`<option value="${k}" ${p.k===k?"selected":""}>${l}</option>`).join("")}</select>`
  +(p.k==="period"?`<input class="inp" type="month" aria-label="งวด" value="${p.ym||TODAY.slice(0,7)}" onchange="perSet('${sc}','ym',this.value)">`:"")
  +(p.k==="custom"?`<input class="inp" type="date" aria-label="ตั้งแต่วันที่" value="${p.from||""}" onchange="perSet('${sc}','from',this.value)"><span class="muted sm">ถึง</span><input class="inp" type="date" aria-label="ถึงวันที่" value="${p.to||""}" onchange="perSet('${sc}','to',this.value)">`:"")
  +`<span class="scope-note">${icon("clock","sm")}${sc==="au"?"ตามเวลาเหตุการณ์":"ตามวันที่เข้าระบบ"} · <b>${perLabel(p)}</b></span>`}
function perSet(sc,f,v){const p=PERS[sc];p[f]=v;if(f==="k"&&v==="period"&&!p.ym)p.ym=TODAY.slice(0,7);
 if(sc==="q"){storageSet(perKey(),JSON.stringify(p));const L=visible().filter(listFilter);if(!L.find(x=>x.doc===sel))sel=(L[0]||{}).doc;queuePage();renderNav()}
 else{if(sc==="ap")apSel=new Set();render()}}
const staleOut=()=>visible().filter(d=>OPEN_ST.includes(d.status)&&(coF.size===0||coF.has(d.company))&&!inPer(d));
const filtersOn=()=>coF.size>0||cfCount()>0||!!qText||PERS.q.k!=="all"||filt!==(ME.role==="EU"?"mine":"all");
function clearFilters(){filt="all";coF=new Set();CF={};if(CD)cfClose();qText="";PERS.q={k:"all"};storageSet(perKey(),JSON.stringify(PERS.q));if($("q"))$("q").value="";const L=visible();if(!L.find(x=>x.doc===sel))sel=(L[0]||{}).doc;queuePage()}
function listFilter(d){return match(filt,d)&&(coF.size===0||coF.has(d.company))&&inPer(d)}
const KPI_META={all:["layers","var(--t-blue)","var(--t-blue-bg)"],mine:["user","var(--t-org)","var(--t-org-bg)"],"Auto-pass":["checkc","var(--t-ok)","var(--t-ok-bg)"],Review:["clock","var(--t-warn)","var(--t-warn-bg)"],Hold:["pause","var(--t-err)","var(--t-err-bg)"],
 "Manual Review":["alert","var(--t-vio)","var(--t-vio-bg)"],Duplicate:["copy","var(--t-org)","var(--t-org-bg)"],Confirmed:["check","var(--t-blue)","var(--t-blue-bg)"],Posted:["send","var(--t-navy)","var(--t-navy-bg)"],Superseded:["layers","var(--t-slate)","var(--t-slate-bg)"],Rejected:["ban","var(--t-slate)","var(--t-slate-bg)"],unres:["alert","var(--t-vio)","var(--t-vio-bg)"],bind:["key","var(--t-teal)","var(--t-teal-bg)"]};
function kpiNote(k){if(k!=="unres")return "";const s=visible().filter(d=>d.unres&&d.status==="Manual Review"&&ageDays(d)>SET.staleDays).length;return s?`<span class="kst">ค้างนาน ${s}</span>`:""}
function queuePage(){
 if(!$("work")){$("app").innerHTML=`<div class="pg" data-pg="queue"><div class="tbar" id="tbar"></div><div id="stale"></div><div class="kpis" id="kpis"></div>
  <div class="work" id="work"><button class="qrail" id="qrail" onclick="peekQueue()" aria-label="แสดงคิวเอกสาร" title="แสดงคิวเอกสาร ( [ )"></button><div class="qscrim" onclick="peekQueue(false)"></div><aside class="col q47" aria-label="คิวเอกสาร"><div class="ph"><span id="qtitle"></span><span style="display:flex;align-items:center;gap:6px"><span id="qn"></span><button class="ibtn" onclick="backToTable()" title="กลับไปมุมมองตาราง (Esc)" aria-label="กลับไปมุมมองตาราง">${icon("table","sm")}</button></span></div>
   <div class="srch">${icon("search","sm")}<input id="q" type="search" placeholder="ค้นหาเลขที่ใบแจ้งหนี้ / Tax ID / PO / ผู้ขาย" oninput="qText=this.value;drawList()" aria-label="ค้นหาเอกสาร"></div>
   <div class="scroll" id="list" role="listbox" aria-label="รายการเอกสาร"></div></aside>
   <section class="col detail" id="detail" aria-label="รายละเอียดเอกสาร"></section><section class="col dock" id="dock" aria-label="เอกสาร PDF"></section></div>
  <div class="tview" id="tview" hidden></div></div>`;$("q").value=qText}
 drawTop();drawStale();drawList();drawDetail();syncDock();
 $("work").hidden=view!=="split";$("tview").hidden=view!=="table";if(view==="table")drawTable()}
function drawTop(){const v=visible(),r=ROLES[ME.role];
 const kd=ME.role==="EU"?[["mine","รอฉันแก้ไข"],["all","ใบรับของฉัน"],["Hold","Hold"],["Review","Review"],["Rejected","ปฏิเสธ"],["Superseded","ถูกแทนที่"]]
  :[["all","ทั้งหมด"],["Auto-pass","Auto-pass"],["Review","Review"],["Hold","Hold"],["Manual Review","Manual Review"],["unres","ไม่ทราบเจ้าของ"],["bind","รอผูกบัญชี"],["Duplicate","ซ้ำ (Portal)"],["Superseded","ถูกแทนที่"]];
 const scope=r.scope==="receiver"
  ?`<span class="lab">ขอบเขต</span><span class="scope-note">${icon("user","sm")}เฉพาะใบรับที่ <b>Oracle account: ${acctsOf(ME).join(", ")||"— ยังไม่ถูกผูก"}</b></span><span class="chip on" style="cursor:default">${ME.co.join(", ")}</span><span class="scope-note">${icon("info","sm")}เอกสารที่ยังไม่มีใบรับ ฝ่ายบัญชีเป็นผู้ดำเนินการ</span>`
  :`<span class="lab">ขอบเขตบริษัท</span><button class="chip ${coF.size?"":"on"}" onclick="coF=new Set();queuePage()">ทุกบริษัท <span class="n">${v.length}</span></button>${ME.co.map(c=>`<button class="chip ${coF.has(c)?"on":""}" aria-pressed="${coF.has(c)}" onclick="togCo('${c}')" title="${COMPANY[c].name}">${c} <span class="n">${v.filter(d=>d.company===c).length}</span></button>`).join("")}`;
 $("tbar").innerHTML=`${scope}<span class="vsep" aria-hidden="true"></span>${perCtl("q")}${ME.role!=="EU"?`<button class="chip ${showClosed?"on":""}" aria-pressed="${showClosed}" title="Posted / Rejected / Superseded" onclick="showClosed=!showClosed;queuePage();renderNav()">รวมที่ปิดแล้ว</button>`:""}${cfCount()&&view==="split"?`<button class="chip on" title="มีตัวกรองคอลัมน์ใช้อยู่ · กดเพื่อล้าง (เลิกทำได้)" onclick="cfClearAll()">${icon("filter","sm")}ตัวกรองคอลัมน์ ${cfCount()}${icon("x","sm")}</button>`:""}${filtersOn()?`<button class="chip" onclick="clearFilters()">${icon("x","sm")}ล้างตัวกรอง</button>`:""}<span class="grow"></span><div class="seg" role="group" aria-label="มุมมอง"><button class="${view==="split"?"on":""}" onclick="setView('split')">${icon("split","sm")}แยก 2 ฝั่ง</button><button class="${view==="table"?"on":""}" onclick="setView('table')">${icon("table","sm")}ตารางสรุป</button></div>`;
 $("kpis").innerHTML=kd.map(([k,l])=>{const m=KPI_META[k]||KPI_META.all;const n=v.filter(d=>match(k,d)&&(coF.size===0||coF.has(d.company))&&inPer(d)).length;
  return `<button class="kpi ${filt===k?"on":""}" aria-pressed="${filt===k}" onclick="filt='${k}';queuePage()"><span class="k-l">${l}${kpiNote(k)}</span><span class="k-v">${n}</span><span class="k-i" style="background:${m[2]};color:${m[1]}">${icon(m[0])}</span></button>`}).join("")}
function drawStale(){const el=$("stale");if(!el)return;const st=staleOut();el.innerHTML=st.length?`<div class="stale" role="status">${icon("alert","sm")}<span>มีเอกสารค้างนอกช่วงที่เลือก <b>${st.length} ฉบับ</b> (${[...new Set(st.map(d=>d.status))].join(", ")}) · เข้าระบบเก่าสุด ${dmy(st.map(d=>d.up).sort()[0])}</span><span class="grow"></span><button class="btn btn-sec sm" onclick="perSet('q','k','all')">${icon("layers","sm")}แสดงทั้งหมด</button></div>`:""}
function togCo(c){coF.has(c)?coF.delete(c):coF.add(c);queuePage()}
function setView(v){if(v===view)return;if(v==="split")openFromTable(sel||(curList()[0]||{}).doc);else backToTable()}
function curList(){return baseList(null).sort((a,b)=>filt==="mine"?a.up.localeCompare(b.up):b.up.localeCompare(a.up))}
function drawList(){const el=$("list");if(!el)return;const L=curList();
 $("qtitle").textContent=ME.role==="EU"?"ใบรับของฉัน":"คิวตรวจสอบ";$("qn").textContent=L.length+" ฉบับ";if($("qrail"))$("qrail").innerHTML=`${icon("log")}<span class="vt">คิวเอกสาร</span><span class="n">${L.length}</span>`;
 if(!L.find(d=>d.doc===sel)){sel=(L[0]||{}).doc;if($("detail"))drawDetail()}
 el.innerHTML=L.length?L.map(d=>`<button class="qi ${d.doc===sel?"on":""}" role="option" aria-selected="${d.doc===sel}" data-doc="${d.doc}" onclick="pick('${d.doc}')">
  <div class="r1"><span class="inv">${d.inv}<span class="co">${d.company}</span></span>${badge(d.status)}</div>
  <div class="v">${d.vendor}</div>
  <div class="r2"><span>PO ${d.po}${d.release?"-"+d.release:""} · ${d.owner?"Receiver "+d.owner:`<span class="warn">ไม่มี Receiver</span>`}${d.owner&&!d.receiverActive?` <span class="warn">(ยังไม่เชื่อมบัญชี)</span>`:""}</span><span class="mono">${B(d.total)}</span></div>
  <div class="r3">${ownTag(d)}${d.codes.map(c=>`<span class="code ${sevOf(d,c)}">${c}</span>`).join("")}<span class="rnd">${d.assigned==="eu"?"→ ผู้ใช้งาน":"→ ฝ่ายบัญชี"} · ${agePill(d)}</span></div></button>`).join("")
  :`<div class="empty">${icon("inbox")}ไม่มีเอกสารในขอบเขตสิทธิ์และตัวกรองนี้</div>`}
function pick(id){if($("work"))$("work").classList.remove("q-peek");sel=id;tab="sum";drawList();drawDetail();if(PDF.open&&PDF.doc!==id)openDMS(id,1,null,true);
 if(window.innerWidth<900)$("work").classList.add("m-detail");
 const it=document.querySelector(`.qi[data-doc="${id}"]`);if(it)it.scrollIntoView({block:"nearest"})}
function mBack(){$("work").classList.remove("m-detail")}
function drawTable(){const t=$("tview");if(!t)return;
 if(!$("tbody")){t.innerHTML=`<div class="panel"><div class="panel-h"><h3>ตารางสรุปคิวเอกสาร</h3><span class="muted sm" id="tcount"></span><span class="grow"></span>
  <div class="tsrch">${icon("search","sm")}<input id="tq" type="search" placeholder="ค้นหาเลขที่ใบแจ้งหนี้ / Tax ID / PO / ผู้ขาย" aria-label="ค้นหาในตาราง" oninput="qText=this.value;drawTableRows();if($('q'))$('q').value=qText"></div>
  <span class="thint">${icon("split","sm")}คลิกแถว หรือ <kbd>Enter</kbd> เปิดแบบ 2 ฝั่ง</span><span class="thint">${icon("filter","sm")}กรองที่ไอคอนหัวคอลัมน์</span></div>
  <div class="cfbar" id="cfbar" hidden></div>
  <div class="tbl-wrap"><table class="t"><thead>${cfHeadRow()}</thead><tbody id="tbody"></tbody></table></div></div>`}
 $("tq").value=qText;drawTableRows()}
function drawTableRows(){const L=curList(),tb=$("tbody");if(!tb)return;$("tcount").textContent=L.length+" ฉบับ";cfPaintBar();cfPaintHeads();
 tb.innerHTML=L.map(d=>`<tr class="click ${d.doc===sel?"sel":""}" data-doc="${d.doc}" tabindex="0" aria-label="เปิด ${d.inv}" onclick="openFromTable('${d.doc}')" onkeydown="rowKey(event,this)"><td><b>${d.inv}</b></td><td><span class="co" style="margin:0">${d.company}</span></td><td>${d.vendor}</td><td class="mono">${d.stax}</td><td class="mono">${d.po}${d.release?"-"+d.release:""}</td><td>${d.owner||'<span class="pre-x">ไม่มี</span>'}${d.owner&&!d.receiverActive?' <span class="pre-x xs">(ยังไม่เชื่อม)</span>':""}</td><td class="num">${B(d.total)}</td><td>${badge(d.status)}${ownTag(d)}</td><td>${d.codes.map(c=>`<span class="code ${sevOf(d,c)}">${c}</span>`).join(" ")||'<span class="nac">—</span>'}</td><td>${d.assigned==="eu"?"ผู้ใช้งาน":"ฝ่ายบัญชี"}</td><td class="mono">${dmy(d.date)}</td><td class="mono">${dmy(d.up)}</td><td class="num">${agePill(d)}</td></tr>`).join("")
  ||`<tr><td colspan="13"><div class="empty">${icon("inbox")}ไม่มีเอกสารในขอบเขตสิทธิ์และตัวกรองนี้${staleOut().length?" · มีเอกสารค้างนอกช่วงที่เลือก":""}${cfCount()?`<div style="margin-top:10px"><button class="btn btn-sec sm" onclick="cfClearAll()">${icon("x","sm")}ล้างตัวกรองคอลัมน์ (${cfCount()})</button></div>`:""}</div></td></tr>`}
function rowKey(e,tr){if(e.key==="Enter"||e.key===" "){e.preventDefault();tr.click()}
 else if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();const n=e.key==="ArrowDown"?tr.nextElementSibling:tr.previousElementSibling;if(n&&n.dataset.doc)n.focus()}}
function openFromTable(id){if(!id)return;sel=id;tab="sum";view="split";queuePage();
 if(window.innerWidth<900)$("work").classList.add("m-detail");
 const it=document.querySelector(`.qi[data-doc="${id}"]`);if(it)it.scrollIntoView({block:"nearest"})}
function backToTable(){if(view==="table"||page!=="queue")return;view="table";closeDock(true);$("work").classList.remove("m-detail");queuePage();
 const r=document.querySelector("#tbody tr.sel");if(r)r.scrollIntoView({block:"nearest"})}

/* ---------- Detail ---------- */
let scrollMem={};
function drawDetail(){const el=$("detail");if(!el)return;const d=DOCS.find(x=>x.doc===sel);
 const prev=$("dbody");if(prev&&prev.dataset.k)scrollMem[prev.dataset.k]=prev.scrollTop;
 if(!d){el.innerHTML=`<div class="empty" style="margin:auto">${icon("file")}เลือกเอกสารจากคิวด้านซ้าย</div>`;return}
 if(!scopeCheck(d).ok){el.innerHTML=`<div class="empty" style="margin:auto">${icon("lock")}${scopeCheck(d).why}</div>`;return}
 const st=[1,2,3].map(s=>{const rs=d.rules.filter(r=>RSTEP[r.rule_id]===s);if(rs.every(r=>r.result===N))return["skip","ไม่ได้ประเมิน","pause"];if(rs.some(r=>r.result===F&&r.severity==="High"))return["bad","พบ High","x"];if(rs.some(r=>r.result===F||r.result===M))return["warn","ต้องตรวจ","alert"];return["ok","ผ่าน","check"]});
 st.push(d.status==="Duplicate"?["bad","พบซ้ำ","x"]:["ok","ไม่ซ้ำ","check"]);
 const names=["STEP 1 สกัดและตรวจเอกสาร","STEP 2 ค้นใบรับและลูกค้า","STEP 3 เทียบกับใบรับ","Portal ตรวจซ้ำ"],shortN=["STEP 1","STEP 2","STEP 3","ตรวจซ้ำ"];
 const fails=d.rules.filter(r=>r.result===F).length,pass=d.rules.filter(r=>r.result===P).length;
 const pdfOn=PDF.open&&docOf(PDF.doc)===d;
 const m=(l,v,h="",cls="")=>`<div><div class="m-l">${l}</div><div class="m-v ${cls}" title="${String(v).replace(/<[^>]+>/g,"")}">${v}</div>${h?`<div class="m-h">${h}</div>`:""}</div>`;
 const k=d.doc+"|"+tab;
 el.innerHTML=`<div class="scroll" id="dbody" data-k="${k}"><div class="dh"><div class="dh-top"><div class="dh-title"><button class="btn btn-ghost sm m-back" onclick="mBack()">${icon("chevL","sm")}คิว</button>${queueBtns(d)}<h1>${d.inv}</h1>${badge(d.status)}${ownTag(d)}
  <span class="pill">${icon("building","sm")}${d.company} · ${COMPANY[d.company].name}</span><span class="pill">รอบตรวจ #${d.round}</span><span class="pill">${icon("user","sm")}${d.assigned==="eu"?"รอผู้ใช้งาน":"ฝ่ายบัญชี"}</span></div>
  <div class="dh-act"><button class="btn btn-sec sm" onclick="copyTxt('${d.inv}')" title="คัดลอกเลขที่ใบแจ้งหนี้">${icon("copy","sm")}คัดลอก</button>
  <button class="btn ${pdfOn?"btn-close-pdf":"btn-sec"} sm" onclick="togglePdf()" ${can("DMS")?"":"disabled title='ไม่มีสิทธิ์เปิดเอกสาร DMS'"} aria-pressed="${pdfOn}" title="${pdfOn?"ปิด PDF (P / Esc)":"เปิดเอกสาร PDF (P)"}">${icon(pdfOn?"x":"file","sm")}${pdfOn?"ปิด PDF":"เปิดเอกสาร PDF"} <kbd>P</kbd></button></div></div>
  <div class="meta">${m("ผู้ขาย",d.vendor,"Tax ID "+d.stax)}${m("ชื่อผู้ขายใน Oracle",d.oname||"—")}${m(`PO <span class="tag-ro">ไม่ตรวจ</span>`,`<span class="mono">${d.po}</span>`,"Release "+(d.release??"—"))}
  ${m("ใบรับ",`<span class="mono">${d.rcv}</span>`)}${m("ORG_ID",d.org?d.org+" "+ORG[d.org]:"—",d.org?"":"ยังไม่เรียก Oracle")}${m("Receiver",d.owner||`<span class="pre-x">ไม่มี</span>`,d.owner&&!d.receiverActive?"ยังไม่เชื่อมบัญชี":"")}
  ${m("วันที่ใบแจ้งหนี้",d.date,d.doc+" · "+d.pages+" หน้า")}${m("วันที่เข้าระบบ",dmy(d.up),"อายุ "+ageDays(d)+" วัน")}${m("ยอดรวมสุทธิ",B(d.total)+" ฿","ก่อนภาษี "+B(d.sub),"big mono")}</div>
  <div class="steps">${names.map((n,i)=>`<div class="step ${st[i][0]}" title="${n} · ${st[i][1]}"><span class="dot">${icon(st[i][2])}</span><div style="min-width:0"><div class="t"><span class="full">${n}</span><span class="short">${shortN[i]}</span></div><div class="s">${st[i][1]}</div></div></div>`).join("")}</div></div>
 <div class="tabs" role="tablist">${[["sum","สรุปผล",fails,fails?"r":""],["lines","รายบรรทัด",d.lines.length,""],["rules","กฎ 9 ข้อ",pass+"/9",""],["own","ผู้รับผิดชอบและสิทธิ์","",""],["json","JSON","",""],["log","ประวัติ",d.hist.length,""]]
  .map(([k2,l,c,cc])=>`<button class="tab ${tab===k2?"on":""}" role="tab" aria-selected="${tab===k2}" onclick="tabTo('${k2}')">${l}${c!==""?`<span class="c ${cc}">${c}</span>`:""}</button>`).join("")}</div>
 <div class="pane">${({sum:sumPane,lines:linesPane,rules:rulesPane,own:ownPane,json:jsonPane,log:logPane})[tab](d)}</div>
 <div class="abar">${actions(d)}</div></div>`;
 $("dbody").scrollTop=scrollMem[k]||0}
function tabTo(t){const b=$("dbody"),hdr=b.querySelector(".dh").offsetHeight,past=b.scrollTop>hdr;tab=t;drawDetail();const nb=$("dbody");if(!scrollMem[sel+"|"+t])nb.scrollTop=past?hdr:0}
function sumPane(d){const fails=d.rules.filter(r=>r.result===F);let lk=d.tc?`<div class="note i" style="margin:0 0 10px">${icon("info")}<div><b>เคสทดสอบ (mock):</b> ${d.tc}</div></div>`:"";if(d.supersededBy)lk+=`<div class="note d">${icon("layers")}<div><b>ถูกแทนที่ (Superseded)</b> โดย <button class="link" onclick="openOld('${d.supersededBy}')">${d.supersededBy}</button> · ${d.supRule||""}</div></div>`;if(d.supersedes)lk+=`<div class="note i">${icon("layers")}<div>ฉบับนี้แทนที่ <button class="link" onclick="openOld('${d.supersedes}')">${d.supersedes}</button> · ${d.supRule||""}</div></div>`;if(d.duplicateOf)lk+=`<div class="note d">${icon("copy")}<div><b>Duplicate</b> ของ <button class="link" onclick="openOld('${d.duplicateOf}')">${d.duplicateOf}</button> · ${d.dupRule||""}</div></div>`;
 let h=`<div class="sec-h"><h3>ข้อยกเว้นจาก AIVA (${fails.length})</h3><p>มาตรฐาน v6.10 · schema 1.6</p></div>`;
 h=lk+h;h+=fails.length?fails.map(r=>{const eu=EXC[r.exception_code][1]==="eu";const ev=hasRegion(d,r.rule_id);
  return `<div class="exc ${r.severity}"><div class="exc-h"><span class="code ${r.severity}">${r.exception_code}</span><h4>${EXC[r.exception_code][0]}</h4><span class="sev ${r.severity}">${r.severity}</span><span class="sp"></span><span class="owner-tag ${eu?"eu":""}">${icon(eu?"user":"building","sm")}${eu?"ผู้ใช้งานแก้":"ฝ่ายบัญชีตัดสิน"}</span></div>
  <div class="rl">${RULES.find(x=>x.startsWith(r.rule_id))}</div>
  <div class="ev"><span>${r.evidence||""}</span>${ev&&can("DMS")?`<button class="link" onclick="openDMS('${d.doc}',${r.page||ev},'${r.rule_id}')">${icon("target","sm")}ดูหลักฐานหน้า ${r.page||ev}</button>`:""}</div></div>`}).join("")
  :`<div class="note ok">${icon("checkc")}<div><b>ไม่พบรหัสข้อผิดพลาดจาก AIVA</b><br>เอกสารผ่านกฎ 9 ข้อตามมาตรฐาน v6.10</div></div>`;
 if(d.rules.some(r=>r.result===M))h+=`<div class="note w">${icon("alert")}<div><b>Manual Review:</b> ${d.rules.find(r=>r.result===M).evidence}</div></div>`;
 if(d.halted)h+=`<div class="note w">${icon("pause")}<div>ระบบหยุดที่ STEP 1 (V-02) ไม่เรียก Oracle</div></div>`;
 if(!d.receiver)h+=`<div class="note w">${icon("user")}<div>ไม่มี Receiver เพราะยังไม่พบใบรับ · ผู้ใช้งานมองไม่เห็นเอกสารนี้ ฝ่ายบัญชีติดต่อผู้สแกน (<b>${d.upl}</b>) นอกระบบ · ทำได้เฉพาะ Reject · ผู้สแกนอัปโหลดเอกสารใหม่เข้าระบบ · บริษัทกำหนดจาก Tax ID ลูกค้าบนใบแจ้งหนี้</div></div>`;
 else if(!d.receiverActive)h+=`<div class="note w">${icon("user")}<div>Receiver ${d.receiver} ยังไม่เชื่อมบัญชีในพอร์ทัล · เอกสารจะไม่ปรากฏในคิวผู้ใช้งาน แจ้ง IT เชื่อมบัญชี</div></div>`;
 if(d.status==="Duplicate")h+=`<div class="note d">${icon("copy")}<div>Portal พบเอกสารซ้ำกับ <b>${d.dup}</b> · ห้ามส่งเข้า AP Interface จนกว่าฝ่ายบัญชีตัดสิน <button class="link" onclick="openDMS('${d.dup}',1)">${icon("ext","sm")}เปิดฉบับที่ซ้ำ</button></div></div>`;
 return h}
function linesPane(d){return `<div class="note i" style="margin:0 0 12px">${icon("info")}<div>ค้นใบรับด้วย Tax ID ผู้ขาย <b class="mono">${d.stax}</b> + Invoice <b>${d.inv}</b> · PO ${d.po} และ Release ${d.release??"— (Standard PO หรืออ่านไม่ได้)"} แสดงผลเท่านั้น ไม่ใช้ในการตรวจ (มาตรฐาน v6.10 ตารางที่ 3 ฟิลด์ 2, 8, 9)</div></div>
 <div class="tbl-wrap"><table class="t"><thead><tr><th>#</th><th>รายการ</th><th class="num">จำนวน</th><th>หน่วย</th><th class="num">ราคา</th><th class="num">ราคารวม</th><th>บรรทัดใบรับ</th><th class="num">จำนวนรับ</th><th class="num">ราคาใบรับ</th><th>ชั้น</th></tr></thead><tbody>
 ${d.lines.map((l,i)=>{const nq=l[5]==null,bad=!nq&&(l[6]!==l[1]||l[7]!==l[3]);return `<tr class="${bad?"row-bad":""}"><td>${i+1}</td><td>${l[0]}</td><td class="num">${l[1]}</td><td>${l[2]}</td><td class="num">${B(l[3])}</td><td class="num ${l[1]*l[3]!==l[4]?"badc":""}">${B(l[4])}</td><td>${nq?'<span class="nac">—</span>':l[5]}</td>
 <td class="num ${nq?"nac":l[6]===l[1]?"okc":"badc"}">${nq?"ไม่ได้ประเมิน":l[6]}</td><td class="num ${nq?"nac":l[7]===l[3]?"okc":"badc"}">${nq?"—":B(l[7])}</td><td>${l[8]}</td></tr>`}).join("")}</tbody></table></div>
 <div class="grid2" style="margin-top:12px"><div class="card"><h4>ยอดบนใบแจ้งหนี้ (V-03)</h4><div class="kv"><span>ยอดก่อนภาษี</span><b class="mono">${B(d.sub)}</b></div><div class="kv"><span>VAT</span><b class="mono">${B(d.vat)}</b></div><div class="kv"><span>ยอดรวมสุทธิ</span><b class="mono">${B(d.total)}</b></div></div>
 <div class="card"><h4>เทียบกับใบรับ (V-09)</h4><div class="kv"><span>ใบแจ้งหนี้</span><b class="mono">${B(d.sub)}</b></div><div class="kv"><span>ใบรับ (QTY &gt; 0)</span><b class="mono">${B(d.rtotal)}</b></div><div class="kv"><span>ผล</span><b class="${d.rtotal==null?"nac":Math.abs(d.sub-d.rtotal)<=.5?"okc":"badc"}">${d.rtotal==null?"ไม่ได้ประเมิน":Math.abs(d.sub-d.rtotal)<=.5?"ตรงกัน":"ไม่ตรง (E03)"}</b></div></div></div>`}
function rulesPane(d){return `<div class="tbl-wrap"><table class="t"><thead><tr><th>กฎ</th><th>STEP</th><th>ผล</th><th>Exception code</th><th>หลักฐาน</th><th></th></tr></thead><tbody>${d.rules.map(r=>{const ev=hasRegion(d,r.rule_id)&&(r.result===F||r.result===M);return `<tr class="${r.result===F?"row-bad":""}"><td>${RULES.find(x=>x.startsWith(r.rule_id))}</td><td class="num">${RSTEP[r.rule_id]}</td>
 <td class="${r.result===P?"okc":r.result===F?"badc":"nac"}">${r.result}${r.halted_by?" ("+r.halted_by+")":""}</td><td>${r.exception_code?`<span class="code ${r.severity}">${r.exception_code}</span>`:"—"}</td><td class="sm">${r.evidence||""}</td><td>${ev&&can("DMS")?`<button class="link" onclick="openDMS('${d.doc}',${r.page||ev},'${r.rule_id}')">${icon("target","sm")}ดู</button>`:""}</td></tr>`}).join("")}</tbody></table></div>`}
function ownPane(d){const who=USERS.filter(u=>scopeCheck(d,u).ok);
 return `<div class="grid2"><div class="card"><h4>ผู้รับผิดชอบเอกสาร</h4>
 <div class="kv"><span>บริษัท</span><b>${d.company} · ${COMPANY[d.company].name}</b></div><div class="kv"><span>ที่มาของบริษัท</span><b>${d.org?"ORG_ID "+d.org+" จากใบรับ":"Tax ID ลูกค้าบนใบแจ้งหนี้"}</b></div>
 <div class="kv"><span>Receiver (RCV_VRC_HDS_V.RECEIVER)</span><b class="mono">${d.owner||"— ไม่มี"}</b></div><div class="kv"><span>สถานะการเชื่อมบัญชี</span><b>${!d.receiver?"—":d.receiverActive?"เชื่อมแล้ว":"ยังไม่เชื่อม"}</b></div>
 <div class="kv"><span>ที่มาของ Receiver</span><b>${d.ownerSrc}</b></div><div class="kv"><span>Tax ID ผู้ขาย (กุญแจค้นใบรับ)</span><b class="mono">${d.stax}</b></div><div class="kv"><span>ชื่อผู้ขายใน Oracle</span><b>${d.oname||"— (ยังไม่พบใบรับ)"}</b></div><div class="kv"><span>PO number (สกัดจากเอกสาร · ไม่ตรวจ)</span><b class="mono">${d.po}</b></div><div class="kv"><span>Release No. (สกัดจากเอกสาร)</span><b class="mono">${d.release??"— ไม่มี / อ่านไม่ได้"}</b></div><div class="kv"><span>ผู้สแกนเข้า DMS</span><b class="mono">${d.upl}</b></div></div>
 <div class="card"><h4>ผู้ที่มองเห็นเอกสารนี้ในพอร์ทัล</h4>${who.map(u=>`<div class="kv"><span>${u.n}</span><b>${ROLES[u.role].n}</b></div>`).join("")||'<div class="kv"><span>ไม่มีผู้ใช้งานที่เชื่อมบัญชี</span></div>'}
 ${!USERS.some(u=>u.role==="EU"&&scopeCheck(d,u).ok)?`<div class="note w">${icon("alert")}<div>${d.receiver?"Receiver "+d.receiver+" ยังไม่เชื่อมบัญชีในพอร์ทัล":"ไม่มี Receiver"} · ผู้ใช้งานไม่เห็นเอกสารนี้ ฝ่ายบัญชีเป็นผู้ดำเนินการ</div></div>`:""}</div></div>`}
function jsonPane(d){return `<div class="sec-h"><p>JSON ตามมาตรฐาน v6.10 ตารางที่ 9 (schema 1.7 · เพิ่ม dms.uploaded_at) · AIVA ไม่ส่ง URL ของ DMS · ค่า Tax ID ผู้ขาย ชื่อ/ที่อยู่ลูกค้า วันที่ และประเภทคำสั่งซื้อเป็นค่าสมมติ</p><button class="btn btn-sec sm" onclick="copyTxt(JSON.stringify(toJSON(DOCS.find(x=>x.doc==='${d.doc}')),null,2),'คัดลอก JSON แล้ว')">${icon("copy","sm")}คัดลอก JSON</button></div><pre class="json">${esc(JSON.stringify(toJSON(d),null,2))}</pre>`}
function logPane(d){return `<div class="tl">${d.hist.map(h=>`<div class="tle ${h.k}"><div class="t">${h.t}</div><div class="a">${h.a}</div>${histView(d,h)}</div>`).join("")}</div>`}
function custOf(d){const c=COMPANY[d.company]||{};return {name:c.name?"บริษัท "+c.name+" จำกัด":"—",addr:d.badAddr||BR_ADDR[d.company+"|"+d.custOn]||(CUST_TH[d.company]||{}).ad||"—"}}
function toJSON(d){const v5=d.rules.find(r=>r.rule_id==="V-05");const c=custOf(d);const found=d.rcv!=="—";
 const sev=d.rules.filter(r=>r.result===F).map(r=>r.severity);
 return {schema_version:"1.7",doc_id:d.doc,validation_round:d.round,validated_at:d.up+"T08:30:00+07:00",standard_version:"6.10",po_type:d.po.startsWith("45")||d.po.startsWith("40118")?"F4":"F1",
 dms:{doc_id:d.doc,pages:d.pages,uploaded_by:d.upl,uploaded_at:d.up+"T08:00:00+07:00"},access:{company:d.company,receiver:d.receiver,owner_source:d.receiver?"receipt":"none"},
 invoice:{invoice_num:d.inv,po_number:d.po,release_num:d.release??null,invoice_date:d.date,supplier_name:d.vendor,supplier_tax_id:d.stax,customer_name:c.name,customer_address:c.addr,customer_tax_id:d.tax,currency:"THB",sub_total:d.sub,vat:d.vat,grand_total:d.total},
 signatures:{supplier_or_deliverer:{present:!!d.sig[0],page:1},receiver:{present:!!d.sig[1],page:1}},
 receipt:{found:found,receipt_count:found?1:0,receipt_num:found?d.rcv:null,org_id:d.org,receiver:d.receiver,supplier_tax_id:found?d.stax:null,supplier_name:found?d.oname:null,receipt_total:d.rtotal},
 entity_check:(!v5||v5.result===N||v5.result===M)?null:Object.assign({org_id:d.org,short_name:ORG[d.org],tax_id_match:true,name_match:true,address_match:true,matched_on:"name_th",address_matched:d.custOn,intercompany:Object.values(COMPANY).some(x=>x.tax===d.stax)},d.ent||{}),
 lines:d.lines.map((l,i)=>({line_no:i+1,qty_inv:l[1],uom_inv:l[2],price_inv:l[3],amount_inv:l[4],rcv_line:l[5],qty_rcv:l[6],price_rcv:l[7],match_level:l[5]==null?null:l[8],result:l[5]==null?N:(l[6]===l[1]&&l[7]===l[3]?P:F)})),
 rules:d.rules,decision:{status:d.status,max_severity:sev.includes("High")?"High":sev.includes("Medium")?"Medium":sev.includes("Low")?"Low":"None",assigned_to:d.assigned==="eu"?"End user":"Accounting",exception_codes:d.codes}}}

/* ================= v4.12 PDF dock — เอกสาร mockup แบบ A4 (HTML) + กรอบหลักฐาน + ชุดทดสอบในตัว ================= */
/* ข้อมูลผู้ขาย (ค่าสมมติ) · style: scan = เอกสารสแกน (เอียง/สีจาง/ตรายาง) · digital = PDF จากระบบ */
const VENDOR_TH={
 "0105500000000":{th:"บริษัท เอบีซี ซัพพลาย จำกัด",ad:"55/12 หมู่ 4 ถนนพหลโยธิน ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120",tel:"02-516-2201",fax:"02-516-2202",lg:"ABC",acc:"#0F4C81",st:"scan",rot:-.45},
 "0105536012345":{th:"บริษัท ไทย สตีล เซอร์วิส จำกัด",ad:"700/12 หมู่ 6 นิคมอุตสาหกรรมอมตะนคร ตำบลดอนหัวฬ่อ อำเภอเมือง จังหวัดชลบุรี 20000",tel:"038-213-555",fax:"038-213-556",lg:"TSS",acc:"#7A1F1F",st:"scan",rot:.35},
 "0105548077777":{th:"บริษัท พรีซิชั่น ทูลส์ (ประเทศไทย) จำกัด",ad:"88/8 ซอยบางนา-ตราด 25 แขวงบางนาใต้ เขตบางนา กรุงเทพมหานคร 10260",tel:"02-398-7788",fax:"02-398-7789",lg:"PT",acc:"#1F5F3A",st:"digital"},
 "0103554001122":{th:"ห้างหุ้นส่วนจำกัด เอส อาร์ วาย เอ็นจิเนียริ่ง แอนด์ เทรดดิ้ง",ad:"19/3 หมู่ 2 ตำบลบ้านเลน อำเภอบางปะอิน จังหวัดพระนครศรีอยุธยา 13160",tel:"081-345-6789",fax:"-",lg:"SRY",acc:"#5B3A12",st:"scan",rot:-.6},
 "0105539044556":{th:"บริษัท สยาม ออโต้ พาร์ท จำกัด",ad:"123 ถนนเทพารักษ์ ตำบลบางเสาธง อำเภอบางเสาธง จังหวัดสมุทรปราการ 10570",tel:"02-705-4400",fax:"02-705-4401",lg:"SAP",acc:"#B42318",st:"scan",rot:.25},
 "0105551099887":{th:"บริษัท ซันวา พรีซิชั่น ทูลส์ จำกัด",ad:"9/99 หมู่ 5 สวนอุตสาหกรรมโรจนะ ตำบลคานหาม อำเภออุทัย จังหวัดพระนครศรีอยุธยา 13210",tel:"035-330-120",fax:"035-330-121",lg:"SW",acc:"#1E40AF",st:"digital"},
 "0105551045678":{th:"บริษัท เอ็นเอ็กซ์ โชจิ (ประเทศไทย) จำกัด",ad:"1 อาคารเอ็มไพร์ทาวเวอร์ ชั้น 30 ถนนสาทรใต้ แขวงยานนาวา เขตสาทร กรุงเทพมหานคร 10120",tel:"02-670-1234",fax:"02-670-1235",lg:"NX",acc:"#0B3B6F",st:"digital"},
 "0105560033221":{th:"บริษัท เมโทร ซัพพลาย จำกัด",ad:"45 ถนนรามอินทรา แขวงคันนายาว เขตคันนายาว กรุงเทพมหานคร 10230",tel:"02-919-5566",fax:"-",lg:"MS",acc:"#6D28D9",st:"digital"},
 "0105537011111":{th:"บริษัท กนก สตีล จำกัด",ad:"77 หมู่ 3 ถนนสุขุมวิท ตำบลบ้านฉาง อำเภอบ้านฉาง จังหวัดระยอง 21130",tel:"038-601-777",fax:"038-601-778",lg:"KS",acc:"#374151",st:"scan",rot:.5},
 "0105549022222":{th:"บริษัท โอเอสจี ไทย จำกัด",ad:"5/5 หมู่ 9 นิคมอุตสาหกรรมบางปู ตำบลแพรกษา อำเภอเมือง จังหวัดสมุทรปราการ 10280",tel:"02-324-0123",fax:"02-324-0124",lg:"OSG",acc:"#0E7490",st:"digital"},
 "0105545033333":{th:"บริษัท ฟานุค ไทย จำกัด",ad:"1301 ถนนพัฒนาการ แขวงสวนหลวง เขตสวนหลวง กรุงเทพมหานคร 10250",tel:"02-714-6111",fax:"02-714-6120",lg:"FANUC",acc:"#B8860B",st:"digital"},
 "0105560044444":{th:"บริษัท โปรเซิร์ฟ เอ็นจิเนียริ่ง จำกัด",ad:"300/7 หมู่ 1 ตำบลคลองสวนพลู อำเภอพระนครศรีอยุธยา จังหวัดพระนครศรีอยุธยา 13000",tel:"035-801-300",fax:"-",lg:"PS",acc:"#475569",st:"scan",rot:-.3}};
const CUST_TH={AH:{th:"บริษัท อาปิโก ไฮเทค จำกัด (มหาชน)",ad:"99 หมู่ 1 ตำบลบ้านเลน อำเภอบางปะอิน จังหวัดพระนครศรีอยุธยา 13160",en:"99 Moo 1, Banlane, Bang Pa-in, Phra Nakhon Si Ayutthaya 13160"},
 AHT:{th:"บริษัท อาปิโก ไฮเทค ทูลลิ่ง จำกัด",ad:"358 หมู่ 8 ตำบลบ้านเลน อำเภอบางปะอิน จังหวัดพระนครศรีอยุธยา 13160",en:"358 Moo 8, Banlane, Bang Pa-in, Phra Nakhon Si Ayutthaya 13160"},
 AHP:{th:"บริษัท อาปิโก ไฮเทค พาร์ทส์ จำกัด",ad:"129 หมู่ 1 ตำบลบ้านเลน อำเภอบางปะอิน จังหวัดพระนครศรีอยุธยา 13160",en:"129 Moo 1, Banlane, Bang Pa-in, Phra Nakhon Si Ayutthaya 13160"},
 AM:{th:"บริษัท เอเบิล มอเตอร์ส จำกัด",ad:"888 หมู่ 14 ตำบลราชาเทวะ อำเภอบางพลี จังหวัดสมุทรปราการ 10540",en:"888 Moo 14, Rachathewa, Bang Phli, Samut Prakan 10540"},
 "?":{th:"บริษัท เอ็มจีพี จำกัด",ad:"1 หมู่ 7 ตำบลบ้านเลน อำเภอบางปะอิน จังหวัดพระนครศรีอยุธยา 13160",en:"1 Moo 7, Banlane, Bang Pa-in, Phra Nakhon Si Ayutthaya 13160",tax:"0135559001234"}};
Object.assign(VENDOR_TH,{"0105547055551":{"th":"บริษัท ระยอง ได ซัพพลาย จำกัด","ad":"12 หมู่ 3 ตำบลมาบยางพร อำเภอปลวกแดง จังหวัดระยอง 21140","tel":"038-650-121","fax":"-","lg":"RDS","acc":"#9A3412","st":"digital","rot":0},"0105556055550":{"th":"บริษัท สตีล เทค จำกัด","ad":"88 หมู่ 2 ตำบลบ้านเลน อำเภอบางปะอิน จังหวัดพระนครศรีอยุธยา 13160","tel":"035-258-800","fax":"-","lg":"STT","acc":"#334155","st":"scan","rot":0.3},"0105552066662":{"th":"บริษัท ไทย แพ็คเกจจิ้ง จำกัด","ad":"45/1 ถนนบางนา-ตราด กม.23 ตำบลบางเสาธง อำเภอบางเสาธง จังหวัดสมุทรปราการ 10570","tel":"02-315-4400","fax":"-","lg":"TPK","acc":"#065F46","st":"digital","rot":0},"0105544077773":{"th":"บริษัท เมก้า รับเบอร์ จำกัด","ad":"9 หมู่ 5 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120","tel":"02-529-1188","fax":"-","lg":"MGR","acc":"#7C2D12","st":"scan","rot":0.3},"0105553088884":{"th":"บริษัท บางกอก ออฟฟิศ ซัพพลาย จำกัด","ad":"77 ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพมหานคร 10500","tel":"02-233-7700","fax":"-","lg":"BOS","acc":"#1D4ED8","st":"digital","rot":0},"0145548001557":{"th":"บริษัท อาปิโก ไฮเทค ทูลลิ่ง จำกัด","ad":"99/1 หมู่ 1 นิคมอุตสาหกรรมไฮเทค ตำบลบ้านเลน อำเภอบางปะอิน จังหวัดพระนครศรีอยุธยา 13160","tel":"035-350-880","fax":"-","lg":"AHT","acc":"#0D274D","st":"digital","rot":0},"0105541099995":{"th":"บริษัท ไพรม์ ลูบริแคนท์ จำกัด","ad":"300 หมู่ 4 ตำบลบ้านเลน อำเภอบางปะอิน จังหวัดพระนครศรีอยุธยา 13160","tel":"035-746-300","fax":"-","lg":"PLB","acc":"#A16207","st":"scan","rot":0.3},"0105546011116":{"th":"บริษัท เดลต้า เทรดดิ้ง จำกัด","ad":"15 ถนนพระราม 3 แขวงบางโพงพาง เขตยานนาวา กรุงเทพมหานคร 10120","tel":"02-294-1515","fax":"-","lg":"DLT","acc":"#4338CA","st":"digital","rot":0},"0105558022227":{"th":"บริษัท โอเรียนท์ โลจิสติกส์ จำกัด","ad":"1 ถนนเทพารักษ์ ตำบลบางพลีใหญ่ อำเภอบางพลี จังหวัดสมุทรปราการ 10540","tel":"02-312-0101","fax":"-","lg":"ORL","acc":"#0F766E","st":"scan","rot":0.3},"0105550033338":{"th":"บริษัท ฟาสเทนเนอร์ เน็ต จำกัด","ad":"222 หมู่ 9 ตำบลคลองสวนพลู อำเภอพระนครศรีอยุธยา จังหวัดพระนครศรีอยุธยา 13000","tel":"035-801-222","fax":"-","lg":"FNN","acc":"#B45309","st":"digital","rot":0},"0105549044449":{"th":"บริษัท เอเชีย เทค เซอร์วิส จำกัด","ad":"10 หมู่ 1 ตำบลบ้านเลน อำเภอบางปะอิน จังหวัดพระนครศรีอยุธยา 13160","tel":"035-258-010","fax":"-","lg":"ATS","acc":"#475569","st":"digital","rot":0}});
const BR_ADDR={"AH|branch 00003":"อาคารสาทรนคร ทาวเวอร์ ชั้น 9 เลขที่ 100/11 ถนนสาทรเหนือ แขวงสีลม เขตบางรัก กรุงเทพมหานคร 10500","AM|branch 00004":"888 หมู่ 14 ตำบลราชาเทวะ อำเภอบางพลี จังหวัดสมุทรปราการ 10540"};
const PAGE_W=794,PAGE_H=1123;
function bahtText(n){const D=["","หนึ่ง","สอง","สาม","สี่","ห้า","หก","เจ็ด","แปด","เก้า"],P=["","สิบ","ร้อย","พัน","หมื่น","แสน"];
 const rd=x=>{const s=String(x),L=s.length;let o="";for(let i=0;i<L;i++){const c=+s[i],pos=L-i-1;if(!c)continue;
  if(pos===0&&c===1&&L>1)o+="เอ็ด";else if(pos===1&&c===2)o+="ยี่";else if(!(pos===1&&c===1))o+=D[c];o+=P[pos]}return o};
 const big=x=>x>=1e6?big(Math.floor(x/1e6))+"ล้าน"+(x%1e6?rd(x%1e6):""):rd(x);
 const t=Math.round(Math.abs(n)*100),b=Math.floor(t/100),s=t%100;return (b?big(b):"ศูนย์")+"บาท"+(s?rd(s)+"สตางค์":"ถ้วน")}
const thDate=s=>{const [y,m,d]=s.split("-");return d+"/"+m+"/"+(+y+543)};
const addDays=(s,n)=>{const t=new Date(s+"T00:00:00");t.setDate(t.getDate()+n);return t.toISOString().slice(0,10)};
function seedR(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h=Math.imul(h^h>>>15,2246822507);h=Math.imul(h^h>>>13,3266489909);return((h^=h>>>16)>>>0)/4294967296}}
function sigSvg(seed,col){const r=seedR(seed);let x=14,p=`M ${x} ${32+r()*8}`;for(let i=0;i<5;i++){x+=16+r()*12;p+=` C ${x-12} ${4+r()*14}, ${x-6} ${48+r()*8}, ${x} ${18+r()*18}`}
 p+=` M ${10+r()*12} ${40+r()*6} Q ${x/2} ${30+r()*12} ${x+10} ${26+r()*8}`;
 return `<svg class="sigsvg" viewBox="0 0 ${Math.round(x+24)} 60" aria-hidden="true"><path d="${p}" fill="none" stroke="${col||"#1e3a8a"}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
const stamp=(V,col,r)=>`<div class="stamp" style="--stc:${col};--r:${r}deg"><div><b>${V.lg}</b><small>${V.th.replace(/^(บริษัท|ห้างหุ้นส่วนจำกัด)\s*/,"").replace(/\s*จำกัด.*$/,"")}</small><i>★ ★ ★</i></div></div>`;
/* หน้า A4 หนึ่งหน้า · kind: inv (ต้นฉบับ มีพิกัดหลักฐาน data-k) · copy (สำเนาใบส่งของ) · terms (เงื่อนไข) */
function ivPage(d,p){const V=VENDOR_TH[d.stax]||{th:d.vendor,ad:"—",tel:"-",fax:"-",lg:"V",acc:"#334155",st:"digital"};
 const C=CUST_TH[d.company]||CUST_TH["?"],en=d.custOn==="head_office_en",kind=p===1?"inv":p===2?"copy":"terms";
 const ctax=d.tax==="—"?C.tax:d.tax,branch=d.custOn&&d.custOn.startsWith("branch")?"สาขาที่ "+d.custOn.split(" ")[1]:"สำนักงานใหญ่";
 const K=k=>kind==="inv"?` data-k="${k}"`:"";
 const head=`<div class="iv-head"><div class="iv-sup"${K("supplier")}><div class="iv-logo">${V.lg}</div><div><b>${V.th}</b><div class="en">${d.vendor.toUpperCase()}</div>
  <div class="ad">${V.ad}</div><div class="ad">โทร. ${V.tel}${V.fax!=="-"?" &nbsp;แฟกซ์ "+V.fax:""}</div>
  <div class="ad">เลขประจำตัวผู้เสียภาษีอากร <b class="m">${d.stax}</b> &nbsp;(สำนักงานใหญ่)</div></div></div>
 <div class="iv-title"${K("header")}><div class="t1">${kind==="copy"?"ใบส่งของ":kind==="terms"?"เงื่อนไขการขาย":"ใบกำกับภาษี / ใบแจ้งหนี้"}</div>
  <div class="t2">${kind==="copy"?"DELIVERY ORDER":kind==="terms"?"TERMS &amp; CONDITIONS":"TAX INVOICE / INVOICE"}</div>
  <div class="orig ${kind==="inv"?"":"cp"}">${kind==="inv"?"ต้นฉบับ (ORIGINAL)":"สำเนา (COPY)"}</div>
  <table class="iv-kv"><tr><td>เลขที่ / No.</td><td>${d.inv}</td></tr><tr><td>วันที่ / Date</td><td>${thDate(d.date)}</td></tr><tr><td>หน้า / Page</td><td>${p} / ${d.pages}</td></tr></table></div></div>`;
 const foot=`<div class="iv-pf"><span>F-AC-01 Rev.03 · ${V.lg}-${d.date.replace(/-/g,"")}</span><span>${kind==="inv"?"เอกสารออกเป็นชุด":"สำเนาเพื่อการจัดเก็บ"}</span><span>หน้า ${p}/${d.pages}</span></div>`;
 if(kind==="terms"){const T=["ราคาสินค้ารวมค่าขนส่งถึงสถานที่ของผู้ซื้อ เว้นแต่ระบุไว้เป็นอย่างอื่นในใบสั่งซื้อ","กรรมสิทธิ์ในสินค้ายังเป็นของผู้ขายจนกว่าจะได้รับชำระเงินครบถ้วน","ผู้ซื้อต้องแจ้งความชำรุดบกพร่องภายใน 7 วันนับจากวันที่รับสินค้า","การชำระเงินด้วยเช็คจะถือว่าสมบูรณ์เมื่อเรียกเก็บเงินได้แล้ว","กรณีชำระล่าช้า ผู้ขายสงวนสิทธิ์คิดดอกเบี้ยร้อยละ 1.25 ต่อเดือน","ใบกำกับภาษีฉบับนี้จะสมบูรณ์เมื่อมีลายมือชื่อผู้มีอำนาจลงนามของผู้ขาย","ผู้ขายรับประกันสินค้าตามเงื่อนไขของผู้ผลิต 12 เดือน","ข้อพิพาทใด ๆ ให้อยู่ในเขตอำนาจของศาลไทย"];
  return `<div class="ivp-paper">${head}<div class="iv-terms"><h4>เงื่อนไขการขายและการชำระเงิน</h4><ol>${T.map(t=>`<li>${t}</li>`).join("")}</ol>
   <h4>ช่องทางการชำระเงิน</h4><table class="iv-bank"><tr><th>ธนาคาร</th><th>สาขา</th><th>ประเภท</th><th>เลขที่บัญชี</th></tr><tr><td>ธนาคารกรุงเทพ</td><td>บางนา</td><td>กระแสรายวัน</td><td class="m">123-3-45678-9</td></tr><tr><td>ธนาคารกสิกรไทย</td><td>สาทร</td><td>กระแสรายวัน</td><td class="m">987-1-23456-0</td></tr></table>
   <p class="iv-small">กรุณาโอนเงินในนาม ${V.th} และส่งหลักฐานการโอนมาที่ ar@${V.lg.toLowerCase()}.co.th</p></div><div class="iv-wm">COPY</div>${foot}</div>`}
 const rows=d.lines.map((l,i)=>`<tr${K("line"+(i+1))}><td class="c">${i+1}</td><td class="m">${V.lg}-${String(4100+i*37+(d.inv.length*13)%300)}</td><td>${l[0]}</td><td class="n">${l[1].toLocaleString("en-US")}</td><td class="c">${l[2]}</td><td class="n">${B(l[3])}</td><td class="n" data-amt>${B(l[4])}</td></tr>`).join("");
 const fill=Array.from({length:Math.max(0,10-d.lines.length)},()=>`<tr class="fl"><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join("");
 const sR=kind==="inv"&&!d.sig[1],sS=kind==="inv"&&!d.sig[0];
 return `<div class="ivp-paper">${head}
 <div class="iv-row"><div class="iv-box"${K("customer")}><div class="lbl">ชื่อลูกค้า / Customer</div><b>${en?COMPANY_EN[d.company]:C.th}</b><div>${en?C.en:(d.badAddr||BR_ADDR[d.company+"|"+d.custOn]||C.ad)}</div>
  <div>เลขประจำตัวผู้เสียภาษี <b class="m">${ctax}</b> &nbsp;${en&&branch==="สำนักงานใหญ่"?"(Head Office)":"("+branch+")"}</div></div>
  <div class="iv-box iv-ref"${K("po")}><table><tr><td>เลขที่ใบสั่งซื้อ / P/O No.</td><td>${d.po}${d.release?"-"+d.release:""}</td></tr><tr><td>เงื่อนไขชำระ / Terms</td><td>30 วัน</td></tr>
  <tr><td>ครบกำหนด / Due Date</td><td>${thDate(addDays(d.date,30))}</td></tr><tr><td>พนักงานขาย / Sales</td><td>S-${(d.stax.slice(-3))}</td></tr></table></div></div>
 <table class="iv-lines"><colgroup><col style="width:40px"><col style="width:84px"><col><col style="width:60px"><col style="width:48px"><col style="width:88px"><col style="width:100px"></colgroup>
  <thead><tr><th>ลำดับ<i>No.</i></th><th>รหัสสินค้า<i>Code</i></th><th>รายการ<i>Description</i></th><th>จำนวน<i>Qty</i></th><th>หน่วย<i>Unit</i></th><th>ราคา/หน่วย<i>Unit Price</i></th><th>จำนวนเงิน<i>Amount</i></th></tr></thead>
  <tbody>${rows}${fill}</tbody></table>
 <div class="iv-foot"><div class="iv-words"><div class="lbl">จำนวนเงินตัวอักษร / Amount in words</div><div class="bt" data-words>(${bahtText(d.total)})</div>
  <div class="iv-small">หมายเหตุ: ${kind==="copy"?"ผู้รับสินค้าโปรดตรวจนับสินค้าก่อนลงนาม":"กรุณาสั่งจ่ายเช็คขีดคร่อมในนาม "+V.th+" เท่านั้น"}</div></div>
  <table class="iv-tot"${K("totals")}><tr><td>รวมเป็นเงิน / Sub Total</td><td data-sub>${B(d.sub)}</td></tr><tr><td>ส่วนลด / Discount</td><td>0.00</td></tr><tr><td>ภาษีมูลค่าเพิ่ม / VAT 7%</td><td data-vat>${B(d.vat)}</td></tr><tr><td>จำนวนเงินรวมทั้งสิ้น / Grand Total</td><td data-total>${B(d.total)}</td></tr></table></div>
 <div class="iv-note">ได้รับสินค้าตามรายการข้างต้นไว้ถูกต้องและอยู่ในสภาพเรียบร้อยแล้ว · สินค้าที่ซื้อแล้วไม่รับคืน เว้นแต่ชำรุดจากการผลิต</div>
 <div class="iv-sigs"><div class="iv-sig"${K("sig_rcv")}><div class="ln">${sR?"":sigSvg(d.doc+"r","#1e3a8a")}</div><div>ผู้รับสินค้า / Received by</div>
   <div class="dt">${sR?"วันที่ ......../......../........":"วันที่ <span class=\"hand\">"+thDate(addDays(d.date,1))+"</span>"}</div></div>
  <div class="iv-sig"${K("sig_sup")}><div class="ln">${sS?"":sigSvg(d.doc+"s","#111827")}</div><div>ผู้ส่งสินค้า / Delivered by</div><div class="dt">วันที่ <span class="hand">${thDate(d.date)}</span></div></div>
  <div class="iv-sig">${kind==="inv"?stamp(V,V.st==="scan"?"#1d4ed8":"#7c3aed",-12-(d.inv.length%9)):""}<div class="ln">${kind==="inv"?sigSvg(d.doc+"a","#0f172a"):""}</div><div>ผู้มีอำนาจลงนาม / Authorized</div><div class="dt">ในนาม ${V.th}</div></div></div>
 ${kind==="copy"?`<div class="iv-wm">COPY</div>`:""}${foot}</div>`}
/* ตำแหน่งฟิลด์ (เทียบเท่า bbox จาก OCR) วัดจาก layout จริงของหน้า · หน่วย px ที่ขนาด A4 794×1123 */
function boxOf(el){let x=0,y=0,n=el;while(n&&!(n.classList&&n.classList.contains("ivp-paper"))){x+=n.offsetLeft;y+=n.offsetTop;n=n.offsetParent}return {x,y,w:el.offsetWidth,h:el.offsetHeight}}
function regions(d,rid){const L=d.lines.map((l,i)=>({l,k:"line"+(i+1)}));
 return ({"V-01":["header"],"V-02":L.filter(x=>Math.abs(x.l[1]*x.l[3]-x.l[4])>.005).map(x=>x.k),"V-03":["totals"],"V-04":["supplier","header"],"V-05":["customer"],
  "V-06":[!d.sig[1]?"sig_rcv":null,!d.sig[0]?"sig_sup":null].filter(Boolean),"V-07":L.filter(x=>x.l[7]!=null&&x.l[7]!==x.l[3]).map(x=>x.k),
  "V-08":L.filter(x=>x.l[6]!=null&&x.l[6]!==x.l[1]).map(x=>x.k),"V-09":["totals"]})[rid]||[]}
function hasRegion(d,rid){return regions(d,rid).length?1:0}
function evidenceOf(d){return d.rules.filter(r=>r.result===F||r.result===M).map(r=>({rule:r.rule_id,code:r.exception_code||"MR",sev:r.severity||"Medium",label:r.exception_code?EXC[r.exception_code][0]:"Manual Review",
  boxes:regions(d,r.rule_id).map(k=>({p:1,k}))})).filter(e=>e.boxes.length)}
function pageEl(d,p,wm){const V=VENDOR_TH[d.stax]||{},sc=V.st==="scan";const w=document.createElement("div");w.className="evd-page";w.dataset.p=p;
 w.innerHTML=`<div class="ivp ${sc?"scan":"digital"}" style="--acc:${V.acc||"#334155"};--rot:${sc?(V.rot||0)+(p-1)*.15:0}deg"><div class="ivp-in">${ivPage(d,p)}${wm?`<span class="ev-wm">ดูผ่าน AIVA · ${ME.email} · token ${PDF.token}</span>`:""}</div></div><span class="evd-pn">หน้า ${p}</span>`;return w}
function placeOverlays(w,d){const ivin=w.querySelector(".ivp-in");if(+w.dataset.p!==1)return;
 evidenceOf(d).forEach(e=>e.boxes.forEach((b,i)=>{const t=ivin.querySelector(`.ivp-paper [data-k="${b.k}"]`);if(!t)return;const r=boxOf(t),pad=3;
  const h=document.createElement("div");h.className="hl "+e.sev;h.dataset.rule=e.rule;h.dataset.k=b.k;
  Object.assign(h.style,{left:r.x-pad+"px",top:r.y-pad+"px",width:r.w+pad*2+"px",height:r.h+pad*2+"px"});if(i===0)h.innerHTML=`<span class="tag">${e.code} · ${e.label}</span>`;ivin.appendChild(h)}))}
/* ---- dock state / actions ---- */
let qHide=false,qPrev=false;
function openDMS(docId,pg,rule,silent){const d=docOf(docId);
 if(!can("DMS")){toast("ไม่มีสิทธิ์เปิดเอกสาร DMS",1);return}
 if(d&&!scopeCheck(d).ok){log("ถูกปฏิเสธการเปิด DMS",docId,scopeCheck(d).why);toast(scopeCheck(d).why,1);return}
 if(!d){toast("ไม่พบไฟล์ใน DMS",1);return}
 const token=Math.random().toString(36).slice(2,10);
 log("เปิดเอกสาร DMS",docId,"หน้า "+pg+(rule?" · หลักฐาน "+rule:""));d.hist.push({t:now(),a:"เปิดเอกสาร DMS",d:ME.n+" · หน้า "+pg+(rule?" · "+rule:""),k:"v"});
 if(!PDF.open){qHide=true;PDF.split=.4;markAnim()}
 Object.assign(PDF,{open:true,doc:docId,page:pg||1,focus:rule||null,token});if(rule)PDF.mode="evidence";
 if(page!=="queue"){page="queue";view="split";sel=d.doc;$("app").innerHTML="";render()}
 else if(view!=="split"){view="split";sel=d.doc;queuePage()}else{syncDock();drawDetail()}}
function togglePdf(){if(PDF.open&&docOf(PDF.doc)&&docOf(PDF.doc).doc===sel){closeDock()}else if(sel)openDMS(sel,1)}
function closeDock(quiet){if(PDF.open){qHide=false;if(!quiet)markAnim()}PDF.open=false;PDF.key="";renderSeq++;if($("work"))$("work").classList.remove("q-peek");if(!quiet&&$("work")){syncDock();drawDetail()}}
function toggleQueue(){if(PDF.open&&qHide)return peekQueue();qHide=!qHide;markAnim();syncDock();drawDetail()}
function peekQueue(v){const w=$("work");if(!w)return;const on=v===undefined?!w.classList.contains("q-peek"):!!v;w.classList.toggle("q-peek",on&&qHide);
 const b=document.querySelector(".qbtn");if(b)b.setAttribute("aria-pressed",String(on));if(on){const it=document.querySelector(`.qi[data-doc="${sel}"]`);if(it)it.scrollIntoView({block:"nearest"})}}
function stepDoc(n){const L=curList(),i=L.findIndex(x=>x.doc===sel),t=L[i+n];if(t)pick(t.doc)}
function queueBtns(d){const L=curList(),i=L.findIndex(x=>x.doc===d.doc);
 return `<button class="btn btn-sec sm qbtn" onclick="toggleQueue()" aria-pressed="${!qHide}" title="${qHide?"แสดงคิวเอกสาร":"ซ่อนคิวเอกสาร"} ( [ )">${icon("log","sm")}คิว</button>
 <span class="navpn" role="group" aria-label="เลื่อนเอกสาร"><button onclick="stepDoc(-1)" ${i<=0?"disabled":""} title="เอกสารก่อนหน้า (K / ↑)" aria-label="เอกสารก่อนหน้า">${icon("chevL","sm")}</button><span>${i<0?"–":i+1}/${L.length}</span><button onclick="stepDoc(1)" ${i<0||i>=L.length-1?"disabled":""} title="เอกสารถัดไป (J / ↓)" aria-label="เอกสารถัดไป">${icon("chevR","sm")}</button></span>`}
/* motion guard: ระหว่างเลื่อน 350ms ไม่วาด/ปรับขนาดเอกสาร · กดรัวก็ได้สถานะสุดท้ายเสมอ */
const MO=350;let animT=0,renderSeq=0;
function markAnim(){const w=$("work");if(!w||RM())return;w.classList.add("anim");clearTimeout(animT);animT=setTimeout(()=>{w.classList.remove("anim");fitPages()},MO+20)}
const animating=()=>{const w=$("work");return !!(w&&w.classList.contains("anim"))};
function setPdfMode(m){PDF.mode=m;const e=$("evd");if(e)e.classList.toggle("no-ev",m!=="evidence");dockChrome()}
function pdfGo(p){const d=docOf(PDF.doc);PDF.page=Math.min(Math.max(1,p),d.pages);PDF.focus=null;scrollEvPage(PDF.page);dockChrome()}
function evGo(rule){PDF.focus=rule;PDF.page=1;if(PDF.mode!=="evidence")setPdfMode("evidence");else dockChrome();applyFocus()}
function pdfZoom(z){PDF.zoom=z==="fit"?1:Math.min(2.5,Math.max(.5,Math.round((PDF.zoom+z)*10)/10));fitPages();dockChrome()}
function fitPages(){const b=$("dockBody"),e=$("evd");if(!b||!e)return;const s=Math.max(.2,(b.clientWidth-32)/PAGE_W)*PDF.zoom;e.style.setProperty("--s",s.toFixed(4))}
function printDoc(newTab){if(!newTab&&!SET.print[ME.role])return toast("ปิดการพิมพ์/ดาวน์โหลดสำหรับบทบาทนี้ (ตั้งค่าโดยหัวหน้าฝ่ายบัญชี)",1);const d=docOf(PDF.doc);const css=$("ivcss").textContent;
 const html=`<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>${d.inv} · ${d.doc}</title><style>${css}
  body{margin:0;background:#525659}.evd-page{position:relative;width:${PAGE_W}px;height:${PAGE_H}px;margin:16px auto;--s:1}.ivp .ivp-in{transform:none!important}
  @page{size:A4;margin:0}@media print{body{background:#fff}.evd-page{margin:0;page-break-after:always;box-shadow:none}}</style></head><body>${
  Array.from({length:d.pages},(_,i)=>`<div class="evd-page">${pageEl(d,i+1,true).innerHTML}</div>`).join("")}${newTab?"":"<script>onload=()=>print()<\/script>"}</body></html>`;
 const w=window.open("","_blank");if(!w)return toast("เบราว์เซอร์บล็อกหน้าต่างใหม่",1);w.document.write(html);w.document.close();log(newTab?"เปิดเอกสารแท็บใหม่":"พิมพ์/บันทึก PDF",PDF.doc,"")}
function syncDock(){const dk=$("dock"),w=$("work");if(!dk)return;
 const d=PDF.open&&docOf(PDF.doc);const show=!!(d&&scopeCheck(d).ok);
 w.classList.toggle("pdf-open",show);w.classList.toggle("q-hide",qHide&&view==="split");
 const s=PDF.split||.4;if(!qHide)w.classList.remove("q-peek");w.style.setProperty("--mc",show?((1-s)*100).toFixed(1)+"fr":"100fr");w.style.setProperty("--dc",show?(s*100).toFixed(1)+"fr":"0fr");
 $("shell").classList.toggle("nav-auto",show);
 if(!show){PDF.key="";clearTimeout(dk._t);dk._t=setTimeout(()=>{if(!PDF.open)dk.innerHTML=""},MO+30);return}
 clearTimeout(dk._t);
 if(!$("dockBody")){dk.innerHTML=`<div class="dock-rz" title="ลากเพื่อปรับความกว้าง (รายละเอียด 50–70%) · ดับเบิลคลิกเพื่อกลับเป็น 60:40" onpointerdown="rzStart(event)" ondblclick="rzReset()"></div><div id="dockChrome"></div><div class="dock-body" id="dockBody"></div><div class="dock-f" id="dockFoot"></div>`;
  new ResizeObserver(()=>{if(!animating())fitPages()}).observe($("dockBody"))}
 dockChrome();
 const key=[PDF.doc,ME.id].join("|");
 if(key!==PDF.key){PDF.key=key;const seq=++renderSeq;
  if(animating()){$("dockBody").innerHTML='<div class="pdf-ph"><i></i></div>';setTimeout(()=>{if(seq===renderSeq&&PDF.open)renderDoc()},MO+15)}else renderDoc()}
 else applyFocus()}
function renderDoc(){const body=$("dockBody"),d=docOf(PDF.doc);const wrap=document.createElement("div");wrap.className="evd"+(PDF.mode==="evidence"?"":" no-ev");wrap.id="evd";
 for(let p=1;p<=d.pages;p++)wrap.appendChild(pageEl(d,p,true));body.innerHTML="";body.appendChild(wrap);
 wrap.querySelectorAll(".evd-page").forEach(w=>placeOverlays(w,d));fitPages();wrap.addEventListener("scroll",onEvScroll,{passive:true});applyFocus(true)}
function dockChrome(){const d=docOf(PDF.doc),ev=evidenceOf(d);
 $("dockChrome").innerHTML=`<div class="dock-h">${icon("file","lg")}<div class="ttl"><b>${d.inv} · ${PDF.doc}</b><span>${d.vendor} · ${d.pages} หน้า · ${(VENDOR_TH[d.stax]||{}).st==="scan"?"ไฟล์สแกน":"PDF จากระบบผู้ขาย"}</span></div>
  <button class="ibtn" title="ทดสอบการแสดงผล" aria-label="ทดสอบการแสดงผล" onclick="runTests()">${icon("checkc")}</button><button class="ibtn" title="เปิดในแท็บใหม่" aria-label="เปิดในแท็บใหม่" onclick="printDoc(1)">${icon("ext")}</button><button class="ibtn" title="${SET.print[ME.role]?"พิมพ์ / บันทึกเป็น PDF":"ปิดการพิมพ์ (ตั้งค่าโดยหัวหน้าฝ่ายบัญชี)"}" aria-label="พิมพ์ หรือบันทึกเป็น PDF" ${SET.print[ME.role]?"":"disabled"} onclick="printDoc()">${icon("dl")}</button><span class="sep" aria-hidden="true"></span><button class="btn-close-pdf" id="pdfClose" onclick="closeDock()" title="ปิด PDF และแสดงคิวเอกสาร (Esc)" aria-label="ปิด PDF">${icon("x","sm")}ปิด PDF <kbd>Esc</kbd></button></div>
 <div class="dock-tb"><div class="seg" role="group" aria-label="โหมดแสดงผล"><button class="${PDF.mode!=="evidence"?"on":""}" onclick="setPdfMode('clean')">${icon("file","sm")}เอกสาร</button><button class="${PDF.mode==="evidence"?"on":""}" onclick="setPdfMode('evidence')">${icon("target","sm")}หลักฐาน</button></div>
  <span class="grow"></span><div class="pager"><button onclick="pdfZoom(-.1)" title="ย่อ">${icon("zout","sm")}</button><span>${Math.round(PDF.zoom*100)}%</span><button onclick="pdfZoom(.1)" title="ขยาย">${icon("zin","sm")}</button><button onclick="pdfZoom('fit')" title="พอดีความกว้าง">${icon("fitw","sm")}</button></div>
  <div class="pager"><button onclick="pdfGo(PDF.page-1)" ${PDF.page<=1?"disabled":""} title="หน้าก่อน">${icon("chevL","sm")}</button><span>หน้า ${PDF.page} / ${d.pages}</span><button onclick="pdfGo(PDF.page+1)" ${PDF.page>=d.pages?"disabled":""} title="หน้าถัดไป">${icon("chevR","sm")}</button></div></div>
 ${ev.length?`<div class="evbar" aria-label="หลักฐาน">${ev.map(e=>`<button class="evchip ${PDF.focus===e.rule?"on":""}" onclick="evGo('${e.rule}')"><span class="code ${e.sev}">${e.code}</span>${e.label}<span class="muted xs">· หน้า 1</span></button>`).join("")}</div>`:""}`;
 $("dockFoot").innerHTML=`${icon("lock","sm")}<span>ลิงก์ชั่วคราว 10 นาที ออกโดย Portal หลังตรวจสิทธิ์ · ลายน้ำ</span><span class="mono grow">${ME.email} · token ${PDF.token}</span>`}
/* เลื่อนเฉพาะภายในกรอบเอกสาร (ไม่ใช้ scrollIntoView เพื่อไม่ให้หน้าหลักเลื่อนตาม) */
function scrollEvd(el,center,smooth){const e=$("evd");if(!e||!el)return;const er=e.getBoundingClientRect(),r=el.getBoundingClientRect();
 const top=e.scrollTop+r.top-er.top-(center?(e.clientHeight-r.height)/2:8),left=center?e.scrollLeft+r.left-er.left-(e.clientWidth-r.width)/2:e.scrollLeft;
 e.scrollTo({top:Math.max(0,top),left:Math.max(0,left),behavior:smooth&&!RM()?"smooth":"auto"})}
function scrollEvPage(p){scrollEvd(document.querySelector(`.evd-page[data-p="${p}"]`),false,true)}
function applyFocus(first){document.querySelectorAll(".hl.focus").forEach(h=>h.classList.remove("focus"));
 const h=PDF.focus&&document.querySelector(`.hl[data-rule="${PDF.focus}"]`);if(h){h.classList.add("focus");scrollEvd(h,true,!first)}else if(first&&PDF.page>1)scrollEvPage(PDF.page)}
let evScrollT;function onEvScroll(e){clearTimeout(evScrollT);evScrollT=setTimeout(()=>{const w=e.target,mid=w.scrollTop+w.clientHeight/3;let p=1;w.querySelectorAll(".evd-page").forEach(el=>{if(el.offsetTop<=mid)p=+el.dataset.p});if(p!==PDF.page){PDF.page=p;dockChrome()}},120)}
/* ---- splitter: ลากปรับสัดส่วน รายละเอียด : PDF ---- */
function rzStart(e){const w=$("work");e.preventDefault();w.classList.add("dragging");const r=w.getBoundingClientRect();
 const mv=ev=>{PDF.split=Math.min(.5,Math.max(.3,(r.right-ev.clientX)/r.width));syncDockVars()};
 const up=()=>{w.classList.remove("dragging");removeEventListener("pointermove",mv);removeEventListener("pointerup",up);};
 addEventListener("pointermove",mv);addEventListener("pointerup",up)}
function syncDockVars(){const w=$("work"),s=PDF.split;w.style.setProperty("--mc",((1-s)*100).toFixed(1)+"fr");w.style.setProperty("--dc",(s*100).toFixed(1)+"fr")}
function rzReset(){PDF.split=.4;syncDockVars()}
PDF.split=.4;PDF.mode="evidence";
/* ================= ชุดทดสอบการแสดงผล (รันในหน้าเว็บ) ================= */
function testDocDom(d,root){const R=[],ok=(n,c,x)=>R.push([n,!!c,x||""]);const pages=root.querySelectorAll(".evd-page");
 ok("จำนวนหน้า = "+d.pages,pages.length===d.pages,pages.length+" หน้า");
 const p1=pages[0],paper=p1.querySelector(".ivp-paper");
 ok("เนื้อหาไม่ล้นหน้า A4",paper.scrollHeight<=PAGE_H+1&&paper.scrollWidth<=PAGE_W+1,paper.scrollWidth+"×"+paper.scrollHeight+" px");
 const lr=p1.querySelectorAll(".ivp-paper [data-k^=line]");ok("รายการสินค้า "+d.lines.length+" บรรทัด",lr.length===d.lines.length,lr.length+" บรรทัด");
 const amtOk=[...lr].every((r,i)=>r.querySelector("[data-amt]").textContent===B(d.lines[i][4]));ok("จำนวนเงินรายบรรทัดตรงกับข้อมูล",amtOk);
 ok("ยอดรวม/VAT/สุทธิ ตรงกับข้อมูล",p1.querySelector("[data-sub]").textContent===B(d.sub)&&p1.querySelector("[data-vat]").textContent===B(d.vat)&&p1.querySelector("[data-total]").textContent===B(d.total),B(d.total));
 ok("จำนวนเงินตัวอักษรถูกต้อง",p1.querySelector("[data-words]").textContent==="("+bahtText(d.total)+")",bahtText(d.total));
 const cut=[...p1.querySelectorAll(".iv-lines td.n,.iv-kv td,.iv-ref td,.iv-tot td")].filter(c=>c.scrollWidth>c.clientWidth+1);ok("ไม่มีตัวเลขถูกตัด",!cut.length,cut.length?cut.length+" ช่อง":"");
 ok("ลายเซ็นผู้รับตรงกับผล OCR",(!!p1.querySelector(".ivp-paper [data-k=sig_rcv] svg"))===!!d.sig[1],d.sig[1]?"มีลายเซ็น":"ไม่มีลายเซ็น (E08)");
 const ev=evidenceOf(d);ev.forEach(e=>{const hs=p1.querySelectorAll(`.hl[data-rule="${e.rule}"]`);
  const inb=[...hs].every(h=>{const x=h.offsetLeft,y=h.offsetTop;return h.offsetWidth>8&&h.offsetHeight>8&&x>=-4&&y>=-4&&x+h.offsetWidth<=PAGE_W+4&&y+h.offsetHeight<=PAGE_H+4});
  const fit=[...hs].every(h=>{const t=p1.querySelector(`.ivp-paper [data-k="${h.dataset.k}"]`),b=t&&boxOf(t);return b&&Math.abs(h.offsetLeft+3-b.x)<1&&Math.abs(h.offsetTop+3-b.y)<1});
  ok("กรอบหลักฐาน "+e.code+" ครอบฟิลด์ถูกตำแหน่ง",hs.length===e.boxes.length&&inb&&fit,e.boxes.map(b=>b.k).join(", "))});
 return R}
async function runTests(all){const R=[],ok=(n,c,x)=>R.push([n,!!c,x||""]),d=docOf(PDF.doc),w=$("work");
 if(all){const host=document.createElement("div");host.style.cssText="position:fixed;left:-30000px;top:0;width:900px";document.body.appendChild(host);
  DOCS.forEach(x=>{const e=document.createElement("div");e.className="evd";e.style.setProperty("--s",1);for(let p=1;p<=x.pages;p++)e.appendChild(pageEl(x,p));host.appendChild(e);
   e.querySelectorAll(".evd-page").forEach(pg=>placeOverlays(pg,x));const r=testDocDom(x,e);const bad=r.filter(t=>!t[1]);
   ok(x.inv+" ("+x.doc+")",!bad.length,bad.length?bad.map(t=>t[0]).join(" · "):r.length+" รายการผ่าน")});host.remove()}
 else{testDocDom(d,$("evd")).forEach(t=>R.push(t));
  await new Promise(r=>setTimeout(r,MO+60));const desk=window.innerWidth>=1200;
  if(window.innerWidth>=900){ok("Sidebar ย่อเหลือแถบไอคอน",$("shell").classList.contains("nav-auto")&&document.querySelector(".nav").getBoundingClientRect().width<=61,Math.round(document.querySelector(".nav").getBoundingClientRect().width)+" px");ok("แถบคิวแนวตั้งแสดง (หาคิวเจอ)",$("qrail").getBoundingClientRect().width>=31,Math.round($("qrail").getBoundingClientRect().width)+" px");ok("ปุ่มปิด PDF สีแดงมองเห็น",getComputedStyle($("pdfClose")).backgroundColor==="rgb(220, 38, 38)",getComputedStyle($("pdfClose")).backgroundColor);const ab=document.querySelector(".detail .abar").getBoundingClientRect(),pn=document.querySelector(".detail .pane").getBoundingClientRect(),db=$("dbody").getBoundingClientRect();ok("แถบปุ่ม action ไม่ล้นจอ (อยู่ใต้เนื้อหา หรือติดขอบล่างเมื่อเนื้อหายาว)",ab.bottom<=db.bottom+1&&(ab.top>=pn.bottom-1||db.bottom-ab.bottom<=12),ab.top>=pn.bottom-1?"ใต้เนื้อหา "+Math.round(ab.top-pn.bottom)+" px":"ติดขอบล่าง")}
  if(desk){ok("คิวซ่อนเมื่อเปิด PDF",!qHide||w.querySelector(".q47").getBoundingClientRect().width<=1,Math.round(w.querySelector(".q47").getBoundingClientRect().width)+" px");
   const dw=$("dock").getBoundingClientRect().width,mw=$("detail").getBoundingClientRect().width;ok("สัดส่วน รายละเอียด : PDF ≈ "+Math.round((1-PDF.split)*100)+":"+Math.round(PDF.split*100),Math.abs(dw/(dw+mw)-PDF.split)<.03,Math.round(mw)+" : "+Math.round(dw)+" px")}
  const pg=$("evd").querySelector(".evd-page"),bw=$("dockBody").clientWidth;ok("หน้าเอกสารพอดีความกว้าง (100%)",PDF.zoom!==1||Math.abs(pg.getBoundingClientRect().width-(bw-32))<2,Math.round(pg.getBoundingClientRect().width)+" / "+(bw-32)+" px");
  const z0=PDF.zoom,w0=pg.getBoundingClientRect().width;PDF.zoom=z0+.2;fitPages();const w1=pg.getBoundingClientRect().width;PDF.zoom=z0;fitPages();ok("ซูม +20% ทำงาน",Math.abs(w1/w0-(z0+.2)/z0)<.02,Math.round(w0)+" → "+Math.round(w1)+" px");
  const ev=evidenceOf(d);if(ev.length){evGo(ev[0].rule);ok("คลิกชิปหลักฐานแล้วโฟกัสกรอบ",!!document.querySelector(`.hl.focus[data-rule="${ev[0].rule}"]`),ev[0].code)}}
 const pass=R.filter(t=>t[1]).length;
 modal(all?"ผลทดสอบเอกสารทั้งหมด":"ผลทดสอบการแสดงผล · "+d.inv,pass+" / "+R.length+" ผ่าน · หน้าจอ "+innerWidth+"×"+innerHeight,pass===R.length?"checkc":"alert",pass===R.length?"ok":"err",
  `<div class="tbl-wrap"><table class="t"><tbody>${R.map(t=>`<tr class="${t[1]?"":"row-bad"}"><td class="${t[1]?"okc":"badc"}" style="width:24px">${t[1]?"✓":"✕"}</td><td>${t[0]}</td><td class="muted sm">${t[2]}</td></tr>`).join("")}</tbody></table></div>
  ${all?"":`<button class="btn btn-sec sm" style="margin-top:10px" onclick="closeM();runTests(1)">${icon("layers","sm")}ทดสอบเอกสารทั้งหมด (${DOCS.length} ฉบับ)</button>`}`,icon("check","sm")+"ปิด","btn-primary",closeM);
 window.__lastTest=R;return R}


/* ================= Actions (v4.7 rules) ================= */
const RANK={"Auto-pass":1,"Review":2,"Hold":3,"Manual Review":4};
const hasHigh=d=>d.rules.some(r=>r.result===F&&r.severity==="High");
const euPending=d=>d.codes.some(c=>EUCODES.has(c))&&!!d.receiver&&d.receiverActive;
/* Transition Matrix — SRS v1.1 ชีต 05A */
function allowed(d,a){const st=d.status,noRcv=!d.receiver,R=ME.role;
 const no=w=>({ok:false,why:w}),yes=p=>({ok:can(p),why:can(p)?"":"บทบาทนี้ไม่มีสิทธิ์ ("+p+")",perm:p});
 if(R==="EU"){if(a!=="upload")return no("End User อัปโหลดเอกสารใหม่ได้อย่างเดียว");
  if(["Superseded","Duplicate","Confirmed","Sent","Posted"].includes(st))return no("สถานะ "+st+" อัปโหลดแทนไม่ได้");return yes("UPLOAD_NEW")}
 if(a==="upload")return no("อัปโหลดเอกสารใหม่ทำโดย End User");
 if(["Sent","Posted","Rejected","Superseded"].includes(st))return no("เอกสารปิดหรืออยู่ระหว่าง Import");
 if(pendingBind(d))return no("รอผูกบัญชี: IT Admin ต้องผูก Oracle account "+d.receiver+" ก่อน (มีรหัสที่ Receiver ต้องแก้)");
 if(a==="unconfirm")return st==="Confirmed"?yes("UNCONFIRM"):no("ใช้กับ Confirmed เท่านั้น");
 if(a==="returnf")return st==="Import Failed"?yes("RETURN_FAILED"):no("ใช้กับ Import Failed เท่านั้น");
 if(["Confirmed","Import Failed"].includes(st))return no("ดำเนินการที่หน้า AP Interface");
 if(st==="Manual Review"){if(d.unres&&a==="reject")return yes("REJECT");if(a==="confirm"){if(!d.rcv||d.rcv==="—")return no("ยังไม่พบใบรับ");if(hasHigh(d))return no("มีรหัส High");return yes("MANUAL_REVIEW")}
  if(a==="reject")return yes("MANUAL_REVIEW");return no("Manual Review: Confirm / Reject เท่านั้น")}
 if(st==="Duplicate"){if(a==="confirm")return yes("DUP_OVERRIDE");if(a==="reject")return yes("REJECT");return no("Duplicate: Confirm (APR) / Reject เท่านั้น")}
 if(st==="Hold"&&noRcv){if(a==="reject")return yes("REJECT");return no("ไม่มี Receiver: Reject เท่านั้น")}
 if(a==="confirm"){if(euPending(d))return no("รอ End User แก้ไข (มีรหัสของผู้ใช้งานค้าง)");return yes("CONFIRM")}
 if(a==="review"){if(st==="Review")return no("อยู่ใน Review แล้ว");return yes("REVIEW")}
 if(a==="hold"){if(st==="Hold")return no("อยู่ใน Hold แล้ว");return yes("HOLD")}
 if(a==="reject")return yes("REJECT");return no("ไม่รองรับ")}
const BTN={confirm:["btn-success","check"],review:["btn-sec","clock"],hold:["btn-warn","pause"],reject:["btn-danger","ban"],unconfirm:["btn-sec","undo"],returnf:["btn-warn","undo"],upload:["btn-teal","dl"]};
function abtn(d,a,label){const g=allowed(d,a);return `<button class="btn ${BTN[a][0]}" ${g.ok?"":"disabled"} title="${g.why||""}" onclick="openM('${a}')">${icon(BTN[a][1],"sm")}${label}</button>`}
function actions(d){const st=d.status;
 if(ME.role==="EU"){const mine=d.assigned==="eu";const up=allowed(d,"upload");
  const hint=st==="Superseded"?"ฉบับนี้ถูกแทนที่แล้ว":st==="Duplicate"?"ฉบับนี้ซ้ำกับ "+(d.duplicateOf||d.dup||"เอกสารอื่น")+" · ฝ่ายบัญชีตัดสิน":
   mine?"ต้องแก้: <b>"+d.codes.filter(c=>EUCODES.has(c)).join(", ")+"</b> · แก้ไขแล้วอัปโหลดเอกสารใหม่ (ไม่มีการแจ้งเตือน ตรวจสถานะที่นี่)":
   st==="Rejected"?"ถูกปฏิเสธ · อัปโหลดเอกสารฉบับแก้ไขได้":"เอกสารอยู่ที่ฝ่ายบัญชี · ดูได้อย่างเดียว";
  return `<div class="hint">${icon(mine?"alert":"info")}<span>${hint}</span></div>${up.ok?abtn(d,"upload","อัปโหลดเอกสารใหม่"):""}`}
 if(["Posted","Rejected","Superseded"].includes(st))return `<div class="hint">${icon("lock")}เอกสารปิดแล้ว (<b>${st}</b>)${d.apId?" · Oracle Invoice ID <b class='mono'>"+d.apId+"</b>":""}${d.supersededBy?" · ฉบับใหม่ "+d.supersededBy:""}</div>`;
 if(st==="Sent")return `<div class="hint">${icon("info")}ส่งเข้า AP Interface แล้ว (<b>${d.batch}</b>) · รอผล Import</div>${can("VIEW_AP")?`<button class="btn btn-info" onclick="goAP('sent')">${icon("send","sm")}ไปหน้า AP Interface</button>`:""}`;
 if(st==="Confirmed")return `<div class="hint">${icon("info")}<span>ยืนยันแล้วโดย <b>${uName(d.confirmedBy)}</b> · รอส่งเข้า AP Interface</span></div>${abtn(d,"unconfirm","Unconfirm → Review")}${can("VIEW_AP")?`<button class="btn btn-info" onclick="goAP('pending')">${icon("send","sm")}ไปหน้า AP Interface</button>`:""}`;
 if(st==="Import Failed")return `<div class="hint">${icon("alert")}<span>Oracle Import ไม่ผ่าน · ${d.apErr}</span></div>${abtn(d,"returnf","Return → Review")}`;
 const noRcv=!d.receiver,high=hasHigh(d),eup=euPending(d);
 const hint=pendingBind(d)?"รอผูกบัญชี · IT Admin ต้องผูก Oracle account <b>"+d.receiver+"</b> ก่อน · ฝ่ายบัญชียังดำเนินการไม่ได้ เพราะมีรหัสที่ Receiver ต้องแก้":d.unres?"ไม่ทราบเจ้าของ · Reject ได้ทั้ง ACC และ APR · Confirm ไม่ได้ · ติดต่อผู้สแกน <b>"+d.upl+"</b> นอกระบบ":st==="Manual Review"?(can("MANUAL_REVIEW")?"Manual Review · Confirm / Reject เท่านั้น":"Manual Review · หัวหน้าฝ่ายบัญชีเป็นผู้ตัดสิน"):
  st==="Duplicate"?"Portal พบเอกสารซ้ำ · Confirm (ยืนยันว่าไม่ซ้ำ, APR) หรือ Reject":
  noRcv?"ไม่มี Receiver · ติดต่อผู้สแกน <b>"+d.upl+"</b> นอกระบบ · Reject เท่านั้น":
  eup?"รอ End User (<b>"+d.owner+"</b>) แก้ไขและอัปโหลดเอกสารใหม่ · Confirm ถูกล็อก":high?"พบรหัส <b>High</b> · Confirm ต้องมีหมายเหตุ":"พร้อมดำเนินการ";
 return `<div class="hint">${icon(high||noRcv||eup?"alert":"checkc")}<span>${hint}</span></div>${abtn(d,"reject","Reject")}${abtn(d,"hold","Hold")}${abtn(d,"review","Review")}${abtn(d,"confirm",st==="Duplicate"?"Confirm (ไม่ซ้ำ)":"Confirm")}`}
function openOld(id){const o=DOCS.find(x=>x.doc===id);if(!o)return toast("ไม่พบเอกสาร",1);if(!scopeCheck(o).ok)return toast(scopeCheck(o).why,1);filt="all";coF=new Set();CF={};qText="";PERS.q={k:"all"};sel=id;tab="sum";view="split";page="queue";$("app").innerHTML="";render()}
let act=null;
const CFG={confirm:["Confirm","Confirm","btn-success","check","ok"],review:["ย้ายเป็น Review","Review","btn-primary","clock","warn"],hold:["Hold","Hold","btn-warn","pause","warn"],
 reject:["Reject","Reject","btn-danger","ban","err"],unconfirm:["Unconfirm","ย้ายกลับ Review","btn-primary","undo","warn"],returnf:["Return Import Failed","Return → Review","btn-warn","undo","warn"],
 upload:["อัปโหลดเอกสารใหม่","อัปโหลด","btn-teal","dl","info"]};
const REASON={confirm:["ตรวจแล้วถูกต้อง","ผลต่างยอมรับได้","ตรวจต้นฉบับแล้ว","ยืนยันว่าไม่ใช่เอกสารซ้ำ"],review:["ต้องตรวจเพิ่มเติม","รอข้อมูลประกอบ"],
 hold:["รอเอกสารจากผู้ขาย","รอตรวจสอบราคา","รอยืนยันจากหน่วยงาน"],reject:["เอกสารซ้ำจริง","ผู้ขายออกใบแจ้งหนี้ผิด","ไม่พบใบรับ","ข้อมูลไม่ครบ"],
 unconfirm:["พบข้อมูลใหม่ก่อนส่ง","ยืนยันผิดฉบับ"],returnf:["ต้องแก้ข้อมูลผู้ขายใน Oracle","ต้องตรวจเอกสารใหม่"],upload:["ขอลายเซ็นผู้รับของแล้ว","แก้ใบรับใน Oracle แล้ว (ยกเลิกแล้วทำรับใหม่)","สแกนใหม่ครบทุกหน้า","ผู้ขายส่งฉบับแก้ไข"]};
function openM(a){const d=DOCS.find(x=>x.doc===sel);const g=allowed(d,a);
 if(!g.ok||!scopeCheck(d).ok){act=null;log("ถูกปฏิเสธการดำเนินการ",d.doc,a+" · "+(g.why||"scope"));return toast(g.why||"ไม่มีสิทธิ์ดำเนินการ",1)}
 act=a;const c=CFG[a],high=hasHigh(d);const needNote=(a==="confirm"&&(high||d.status==="Duplicate"))||["review","hold","reject","unconfirm","returnf"].includes(a);
 let body=`<label for="rs">เหตุผล <span class="req">*</span></label><select id="rs">${REASON[a].map(r=>`<option>${r}</option>`).join("")}</select>
 <label for="nt">หมายเหตุ${needNote?' <span class="req">* จำเป็น</span>':""}</label><textarea id="nt"></textarea>`;
 if(a==="upload")body=`<div class="note i" style="margin:0 0 6px">${icon("info")}<div>mockup: เลือกผลตรวจจำลองของฉบับใหม่ เพื่อทดสอบกติกา DR-01..07 · ระบบจริง AIVA ตรวจเอกสารที่อัปโหลด</div></div>
 <label for="fl">ไฟล์เอกสารใหม่</label><input id="fl" value="${d.inv}_rev.pdf">
 <label for="sim">ผลตรวจ AIVA ของฉบับใหม่ (จำลอง)</label><select id="sim"><option>Auto-pass</option><option>Review</option><option>Hold</option><option>Manual Review</option></select>`+body;
 modal(c[0]+" · "+d.inv,d.vendor+" · "+B(d.total)+" ฿ · สถานะ "+d.status,c[3],c[4],body,icon(c[3],"sm")+c[1],c[2],doAct)}
function doUpload(d,rs,nt){const sim=$("sim").value,who=ME.n+" (End User)";
 const n=JSON.parse(JSON.stringify(d));n.doc=d.doc.replace(/-R\d+$/,"")+"-R"+((DOCS.filter(x=>x.doc.startsWith(d.doc.replace(/-R\d+$/,""))).length));
 n.round=1;n.status=sim;n.hist=[];n.supersedes=null;n.supersededBy=null;n.duplicateOf=null;n.dup=null;n.supRule=n.dupRule=null;n.confirmedBy=null;n.pre=null;
 if(sim==="Auto-pass"){n.rules.forEach(r=>{if(r.result!==P){r.result=P;delete r.exception_code;delete r.severity;delete r.halted_by;r.evidence="ฉบับแก้ไข"}});n.codes=[];n.sig=[1,1]}
 else if(sim==="Review"){n.rules.forEach(r=>{if(r.result===F&&r.severity==="High"){r.result=P;delete r.exception_code;delete r.severity}});n.codes=n.rules.filter(r=>r.result===F).map(r=>r.exception_code);
  if(!n.codes.length){const r=n.rules.find(x=>x.rule_id==="V-08");r.result=F;r.exception_code="E15";r.severity="Medium";r.evidence="จำนวนน้อยกว่าใบรับ (จำลอง)";n.codes=["E15"]}}
 else if(sim==="Hold"){if(!hasHigh(n)){const r=n.rules.find(x=>x.rule_id==="V-06");r.result=F;r.exception_code="E08";r.severity="High";r.evidence="ไม่พบลายเซ็นผู้รับของ (จำลอง)";n.sig=[1,0];n.codes=[...new Set([...n.codes,"E08"])]}}
 else {n.rules.find(x=>x.rule_id==="V-05").result=M;n.rules.find(x=>x.rule_id==="V-05").evidence="ORG_ID ไม่ทราบ (จำลอง)"}
 n.assigned=(!n.receiver||!n.receiverActive||["Manual Review","Auto-pass"].includes(sim))?"acc":(n.codes.some(c=>EUCODES.has(c))?"eu":"acc");
 /* DR rules — SRS v1.1 ชีต 05B */
 const old=d,os=old.status;let rule,oldTo=null,newTo=sim;
 if(["Rejected","Superseded","Duplicate"].includes(os)){rule="DR-05 ไม่ใช้ฉบับเดิม ("+os+") เป็นคู่เทียบ"}
 else if(["Confirmed","Sent","Posted","Import Failed"].includes(os)){rule="DR-04 ฉบับเดิม "+os+" → ฉบับใหม่ Duplicate";newTo="Duplicate"}
 else{const cmp=RANK[sim]<RANK[os]?"ดีกว่า":RANK[sim]===RANK[os]?"เท่าเดิม":"แย่กว่า";
  if(cmp==="แย่กว่า"){rule="DR-03 ฉบับใหม่แย่กว่า ("+sim+" vs "+os+") → ฉบับใหม่ Duplicate";newTo="Duplicate"}
  else{rule=(cmp==="ดีกว่า"?"DR-01":"DR-02")+" ฉบับใหม่"+cmp+" ("+sim+" vs "+os+") → ฉบับเดิม Superseded";oldTo="Superseded"}}
 n.status=newTo;n.hist.push({t:now(),a:"อัปโหลดเอกสารใหม่",d:who+" · "+rs+(nt?" · "+nt:"")+" · ไฟล์ "+$("fl").value,k:"h"},{t:now(),a:"AIVA ตรวจรอบที่ 1",d:"ผลตรวจ "+sim,k:"s"});
 if(newTo==="Duplicate"){n.duplicateOf=old.doc;n.dupRule=rule;n.dup=old.doc;n.assigned="acc";n.hist.push({t:now(),a:"Portal ตรวจเอกสารซ้ำ",d:rule,k:"c"})}
 if(oldTo){old.status="Superseded";old.supersededBy=n.doc;old.supRule=rule;n.supersedes=old.doc;n.supRule=rule;
  old.hist.push({t:now(),a:"Superseded",d:rule+" · ฉบับใหม่ "+n.doc,k:"c"});n.hist.push({t:now(),a:"แทนที่ฉบับเดิม",d:rule+" · ฉบับเดิม "+old.doc,k:"g"})}
 n.up=TODAY;n.xh=null;n.tc="อัปโหลดระหว่างทดสอบ · "+rule;DOCS.unshift(n);log("อัปโหลดเอกสารใหม่",n.doc,rule);sel=n.doc;return "อัปโหลดแล้ว · "+rule}
function doAct(){const d=DOCS.find(x=>x.doc===sel);const g=act&&d?allowed(d,act):{ok:false};
 if(!act||!d||!g.ok||!scopeCheck(d).ok){closeM();act=null;return toast("ไม่มีสิทธิ์หรือสถานะไม่อนุญาต (ตรวจซ้ำก่อนบันทึก)",1)}
 const rs=$("rs").value,nt=$("nt").value.trim(),high=hasHigh(d);
 const needNote=(act==="confirm"&&(high||d.status==="Duplicate"))||["review","hold","reject","unconfirm","returnf"].includes(act);
 if(needNote&&!nt){$("nt").focus();return toast("กรุณาระบุหมายเหตุ",1)}
 const who=ME.n+" ("+ROLES[ME.role].n+")",from=d.status;let msg="",k="h";
 if(act==="upload"){msg=doUpload(d,rs,nt);closeM();toast(msg);if(PDF.open){PDF.key=""}return render()}
 if(act==="confirm"){if(from==="Duplicate"){d.dupOverrideBy=ME.id;d.hist.push({t:now(),a:"Override: ยืนยันว่าไม่ซ้ำ",d:who+" · "+nt,k:"c"})}
  d.status="Confirmed";d.confirmedBy=ME.id;d.confirmedAt="2026-10-07";d.pre=null;k="g";msg="Confirmed · ย้ายไปหน้า AP Interface"}
 else if(act==="review"||act==="unconfirm"||act==="returnf"){d.status="Review";if(act!=="review"){d.confirmedBy=null;d.batch=null;d.apErr=null}msg="ย้ายเป็น Review แล้ว"}
 else if(act==="hold"){d.status="Hold";k="c";msg="Hold แล้ว"}
 else if(act==="reject"){d.status="Rejected";k="c";msg="Reject แล้ว"}
 d.hist.push({t:now(),a:CFG[act][0]+" ("+from+" → "+d.status+")",d:who+" · "+rs+(nt?" · "+nt:""),k,rs,nt,who});
 log(CFG[act][0],d.doc,from+" → "+d.status+" · "+rs);closeM();toast(msg);if(PDF.open&&PDF.doc===d.doc){PDF.key=""}render()}
const TONE={ok:["var(--t-ok-bg)","var(--t-ok)"],err:["var(--t-err-bg)","var(--t-err)"],warn:["var(--t-org-bg)","var(--t-org)"],info:["var(--t-blue-bg)","var(--t-blue)"]};
function modal(title,sub,ic,tone,body,okTxt,okCls,okFn,okDisabled){const t=TONE[tone];
 $("mh").innerHTML=`<span class="mi" style="background:${t[0]};color:${t[1]}">${icon(ic,"lg")}</span><div><h4 id="mtitle">${title}</h4><p>${sub||""}</p></div>`;
 $("mb").innerHTML=body;const b=$("mok");b.className="btn "+okCls;b.innerHTML=okTxt;b.onclick=okFn;b.disabled=!!okDisabled;$("ov").classList.add("on");
 setTimeout(()=>{const f=$("mb").querySelector("select,textarea,input");(f||b).focus()},30)}
function closeM(){$("ov").classList.remove("on")}
function toast(m,e){const t=document.createElement("div");t.className="toast"+(e?" e":"");t.setAttribute("role","status");t.innerHTML=icon(e?"alert":"checkc")+`<span>${m}</span>`;$("toasts").appendChild(t);setTimeout(()=>t.remove(),2600)}
function copyTxt(s,m){(navigator.clipboard?navigator.clipboard.writeText(s):Promise.reject()).catch(()=>{const ta=document.createElement("textarea");ta.value=s;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove()});toast(m||"คัดลอก "+s+" แล้ว")}

/* ================= AP Interface page (v4.7) ================= */
let apTab="pending",apSel=new Set(),apF={co:"",by:"",from:"",to:""};
const AP_TABS=[["pending","รอส่ง","Confirmed","clock"],["sent","ส่งแล้ว รอ Import","Sent","send"],["done","Import สำเร็จ","Posted","checkc"],["failed","Import ไม่ผ่าน","Import Failed","alert"]];
function goAP(t){page="ap";apTab=t;apSel=new Set();$("app").innerHTML="";render()}
function apRows(t){const st=AP_TABS.find(x=>x[0]===t)[2];
 return DOCS.filter(d=>d.status===st&&["ACC","APR"].includes(ME.role)&&ME.co.includes(d.company))
  .filter(d=>(!apF.co||d.company===apF.co)&&(!apF.by||d.confirmedBy===apF.by)&&inPerOf(d.up,PERS.ap))}
function precheck(d){if(d.dupAtPost)return {ok:false,code:"dup",why:"Portal พบเอกสารซ้ำ: "+d.dupAtPost};
 if(d.confirmedBy===ME.id)return {ok:false,code:"sod",why:"ผู้ส่งเป็นผู้ยืนยันเอกสารนี้ (ผู้ยืนยัน ≠ ผู้ส่ง)"};
 const lim=ROLES[ME.role].postMax;if(lim&&d.total>lim)return {ok:false,code:"lim",why:"ยอด "+B(d.total)+" เกินวงเงินตั้งหนี้ "+B(lim)};
 return {ok:true,why:"พร้อมส่ง"}}
function openFromAP(id){sel=id;tab="sum";filt="all";coF=new Set();CF={};view="split";qText="";page="queue";$("app").innerHTML="";render()}
function apPage(){if(!can("VIEW_AP"))return `<div class="pg-scroll"><div class="panel"><div class="empty">${icon("lock")}ไม่มีสิทธิ์</div></div></div>`;
 const rows=apRows(apTab),send=can("POST");const confirmers=[...new Set(DOCS.filter(d=>d.confirmedBy).map(d=>d.confirmedBy))];const selR=rows.filter(d=>apSel.has(d.doc));
 const head=`<div class="tbar"><span class="lab">ขั้นตอนหลังยืนยัน</span><span class="scope-note">ตรวจซ้ำในฐานข้อมูล Portal → ผู้ยืนยัน ≠ ผู้ส่ง → ตรวจวงเงิน → ส่งเป็น Batch → รับผล Import</span><span class="grow"></span>
  <span class="pill" style="${send?"background:var(--ok-bg);color:var(--ok);border-color:var(--ok-bd)":""}">${icon(send?"send":"lock","sm")}${send?"ส่งได้ (วงเงิน ≤ "+B(ROLES[ME.role].postMax)+")":"ดูอย่างเดียว · ส่งได้เฉพาะหัวหน้าฝ่ายบัญชี"}</span></div>
 <div class="kpis">${AP_TABS.map(([k,l,,ic])=>`<button class="kpi ${apTab===k?"on":""}" onclick="apTab='${k}';apSel=new Set();render()"><span class="k-l">${l}</span><span class="k-v">${apRows(k).length}</span><span class="k-i" style="background:var(--s-100);color:var(--s-600)">${icon(ic)}</span></button>`).join("")}</div>`;
 const fb=`<div class="fbar"><span class="muted sm b">กรอง</span><select class="sel" onchange="apF.co=this.value;render()"><option value="">ทุกบริษัท</option>${ME.co.map(c=>`<option ${apF.co===c?"selected":""}>${c}</option>`).join("")}</select>
  <select class="sel" onchange="apF.by=this.value;render()"><option value="">ผู้ยืนยันทุกคน</option>${confirmers.map(u=>`<option value="${u}" ${apF.by===u?"selected":""}>${uName(u)}</option>`).join("")}</select>
  <span class="vsep" aria-hidden="true"></span>${perCtl("ap")}
  ${apF.co||apF.by||PERS.ap.k!=='all'?`<button class="chip" onclick="apF={co:'',by:'',from:'',to:''};PERS.ap={k:'all'};render()">${icon("x","sm")}ล้างตัวกรอง</button>`:""}<span class="grow"></span>
  ${apTab==="pending"&&send?`<span class="muted sm">เลือก <b>${selR.length}</b> ฉบับ · <b class="mono">${B(selR.reduce((a,d)=>a+d.total,0))}</b> ฿</span><button class="btn btn-sec sm" ${selR.length?"":"disabled"} onclick="apPre()">${icon("shield","sm")}ตรวจก่อนส่ง</button><button class="btn btn-info sm" ${selR.length?"":"disabled"} onclick="apOpenSend()">${icon("send","sm")}ส่งเข้า AP Interface (Batch)</button>`:""}
  ${apTab==="sent"&&send?`<button class="btn btn-teal sm" ${rows.length?"":"disabled"} onclick="apImport()">${icon("refresh","sm")}รับผล Import จาก Oracle (จำลอง)</button>`:""}</div>`;
 const allChk=apTab==="pending"&&send?`<input type="checkbox" aria-label="เลือกทั้งหมด" ${rows.length&&rows.every(d=>apSel.has(d.doc))?"checked":""} onclick="apAll(this.checked)">`:"";
 const extraH={pending:"<th>ผลตรวจก่อนส่ง</th>",sent:"<th>Batch</th><th>ผู้ส่ง</th><th>เวลาส่ง</th>",done:"<th>Batch</th><th>Oracle Invoice ID</th>",failed:"<th>Batch</th><th>ข้อความจาก Oracle</th><th></th>"}[apTab];
 const body=rows.length?rows.map(d=>{const p=d.pre;
  const ex={pending:`<td>${p?`<span class="${p.ok?"pre-ok":"pre-x"}">${p.ok?"✓ ":"✕ "}${p.why}</span>`:'<span class="pre-n">ยังไม่ตรวจ</span>'}</td>`,
   sent:`<td class="mono">${d.batch}</td><td>${uName(d.sentBy)}</td><td class="mono">${d.sentAt}</td>`,done:`<td class="mono">${d.batch}</td><td class="mono">${d.apId}</td>`,
   failed:`<td class="mono">${d.batch}</td><td class="sm" style="color:var(--err)">${d.apErr}</td><td>${send?`<button class="btn btn-warn sm" onclick="apOpenReturn('${d.doc}')">${icon("undo","sm")}ส่งกลับคิวตรวจสอบ</button>`:""}</td>`}[apTab];
  return `<tr class="${p&&!p.ok?"row-bad":""}"><td>${apTab==="pending"&&send?`<input type="checkbox" aria-label="เลือก ${d.inv}" ${apSel.has(d.doc)?"checked":""} onclick="apTog('${d.doc}',this.checked)">`:""}</td>
  <td><span class="co" style="margin:0">${d.company}</span></td><td><button class="link" onclick="openFromAP('${d.doc}')">${d.inv}</button></td><td class="mono">${d.stax}</td><td>${d.oname}</td><td class="mono">${d.rcv}</td>
  <td class="num">${B(d.sub)}</td><td class="num">${B(d.vat)}</td><td class="num"><b>${B(d.total)}</b></td><td>${uName(d.confirmedBy)}</td><td class="mono">${d.confirmedAt}</td><td class="mono">${dmy(d.up)}</td>${ex}</tr>`}).join("")
  :`<tr><td colspan="15"><div class="empty">${icon("inbox")}ไม่มีเอกสารในสถานะและช่วงเวลานี้</div></td></tr>`;
 const bt=BATCHES.filter(b=>b.docs.some(x=>{const d=DOCS.find(y=>y.doc===x);return d&&ME.co.includes(d.company)}));
 return `<div class="pg">${head}<div class="pg-scroll"><div class="panel"><div class="panel-h"><h3>${AP_TABS.find(x=>x[0]===apTab)[1]}</h3><span class="muted sm">${rows.length} ฉบับ</span></div>${fb}
 <div class="tbl-wrap"><table class="t"><thead><tr><th>${allChk}</th><th>บริษัท</th><th>เลขที่ใบแจ้งหนี้</th><th>Tax ID ผู้ขาย</th><th>ชื่อผู้ขายใน Oracle</th><th>เลขที่ใบรับ</th><th class="num">ก่อนภาษี</th><th class="num">VAT</th><th class="num">ยอดรวม</th><th>ผู้ยืนยัน</th><th>วันที่ยืนยัน</th><th>เข้าระบบ</th>${extraH}</tr></thead><tbody>${body}</tbody></table></div></div>
 <div class="panel"><div class="panel-h"><h3>ประวัติ Batch</h3><span class="muted sm">${bt.length} batch</span></div><div class="tbl-wrap"><table class="t"><thead><tr><th>Batch</th><th>เวลาส่ง</th><th>ผู้ส่ง</th><th class="num">จำนวน</th><th class="num">ยอดรวม</th><th>ผล Import</th></tr></thead><tbody>
 ${bt.map(b=>{const ds=b.docs.map(x=>DOCS.find(y=>y.doc===x));const ok=ds.filter(d=>d.status==="Posted").length,bad=ds.filter(d=>d.status==="Import Failed").length,wait=ds.filter(d=>d.status==="Sent").length;
  return `<tr><td class="mono">${b.id}</td><td class="mono">${b.at}</td><td>${uName(b.by)}</td><td class="num">${ds.length}</td><td class="num">${B(ds.reduce((a,d)=>a+d.total,0))}</td><td>${ok?`<span class="pre-ok">สำเร็จ ${ok}</span> `:""}${bad?`<span class="pre-x">ไม่ผ่าน ${bad}</span> `:""}${wait?`<span class="pre-n">รอ ${wait}</span>`:""}</td></tr>`}).join("")}</tbody></table></div></div>
 <div class="note i">${icon("info")}<div>mockup: ผล Import เป็นค่าจำลอง · ระบบจริงอ่านผลจาก AP Interface ของ Oracle (สถานะ PROCESSED / REJECTED) ตามรอบ Import</div></div></div></div>`}
function apTog(id,v){v?apSel.add(id):apSel.delete(id);render()}
function apAll(v){apRows("pending").forEach(d=>v?apSel.add(d.doc):apSel.delete(d.doc));render()}
function apPre(){apRows("pending").filter(d=>apSel.has(d.doc)).forEach(d=>d.pre=precheck(d));log("ตรวจก่อนส่ง AP Interface","—",apSel.size+" ฉบับ");render()}
function apOpenSend(){if(!can("POST")){log("ถูกปฏิเสธการส่ง AP Interface","—","ไม่มีสิทธิ์ POST");return toast("ไม่มีสิทธิ์ส่งเข้า AP Interface",1)}
 const ds=apRows("pending").filter(d=>apSel.has(d.doc));ds.forEach(d=>d.pre=precheck(d));const ok=ds.filter(d=>d.pre.ok),no=ds.filter(d=>!d.pre.ok);
 modal("ส่งเข้า AP Interface · สรุป Batch",ok.length+" ฉบับพร้อมส่ง · "+B(ok.reduce((a,d)=>a+d.total,0))+" ฿","send","info",
  `<div class="card" style="padding:6px 12px">${ok.map(d=>`<div class="kv"><span>✓ ${d.inv} <span class="co">${d.company}</span></span><b class="mono">${B(d.total)}</b></div>`).join("")||'<div class="kv"><span>ไม่มีฉบับที่ส่งได้</span></div>'}</div>
  ${no.length?`<div class="note w">${icon("alert")}<div><b>ตัดออกจาก Batch ${no.length} ฉบับ</b>${no.map(d=>`<div style="margin-top:4px">✕ ${d.inv} · ${d.pre.why}${d.pre.code==="dup"?" → ย้ายไปสถานะ “ซ้ำ” ในคิวตรวจสอบ":" → คงอยู่ในรอส่ง"}</div>`).join("")}</div></div>`:""}
  <label for="pin">รหัสยืนยันตัวตน (PIN)</label><input id="pin" type="password" placeholder="mockup ใช้ 1234" autocomplete="off">
  <label style="display:flex;gap:8px;align-items:flex-start;font-weight:400"><input id="ack" type="checkbox" style="margin-top:3px">ข้าพเจ้าตรวจสอบแล้ว และรับผิดชอบการส่งเข้า AP Interface ในนาม ${ROLES[ME.role].n}</label>`,
  icon("send","sm")+(ok.length?"ส่ง "+ok.length+" ฉบับ":"ย้ายเอกสารซ้ำ"),"btn-info",apDoSend,!ok.length&&!no.some(d=>d.pre.code==="dup"))}
function apDoSend(){if(!can("POST")){closeM();return toast("ไม่มีสิทธิ์",1)}
 if($("pin").value!=="1234"){log("ยืนยันตัวตนไม่สำเร็จ","—","ส่ง AP Interface");return toast("PIN ไม่ถูกต้อง",1)}
 if(!$("ack").checked)return toast("กรุณายืนยันความรับผิดชอบ",1);
 const ds=apRows("pending").filter(d=>apSel.has(d.doc));ds.forEach(d=>d.pre=precheck(d));const ok=ds.filter(d=>d.pre.ok),dup=ds.filter(d=>!d.pre.ok&&d.pre.code==="dup");
 dup.forEach(d=>{d.status="Duplicate";d.dup=d.dupAtPost;delete d.dupAtPost;d.hist.push({t:now(),a:"Portal ตรวจเอกสารซ้ำก่อนส่ง",d:d.dup+" · ตัดออกจาก Batch",k:"c"});log("ตัดออกจาก Batch (ซ้ำ)",d.doc,d.dup)});
 let id=null;if(ok.length){id="B-261002-"+String(BATCHES.filter(b=>b.id.startsWith("B-261002")).length+1).padStart(2,"0");const t="2026-10-02 "+now().slice(0,5);
  BATCHES.unshift({id,at:t,by:ME.id,docs:ok.map(d=>d.doc)});
  ok.forEach(d=>{d.status="Sent";d.batch=id;d.sentBy=ME.id;d.sentAt=t;d.pre=null;d.hist.push({t:now(),a:"ส่งเข้า AP Interface · "+id,d:ME.n+" · Portal ตรวจซ้ำแล้ว ไม่พบซ้ำ",k:"h"})});
  log("ส่งเข้า AP Interface",id,ok.length+" ฉบับ · "+B(ok.reduce((a,d)=>a+d.total,0))+" ฿")}
 apSel=new Set();closeM();toast(ok.length?"ส่ง Batch "+id+" แล้ว "+ok.length+" ฉบับ"+(dup.length?" · ย้ายเอกสารซ้ำ "+dup.length+" ฉบับ":""):"ย้ายเอกสารซ้ำ "+dup.length+" ฉบับ ไม่มีฉบับที่ส่ง");apTab=ok.length?"sent":"pending";render()}
function apImport(){if(!can("POST"))return toast("ไม่มีสิทธิ์",1);let n=0;
 apRows("sent").forEach(d=>{n++;d.status="Posted";d.apId="AP-"+(1188300+n);d.hist.push({t:now(),a:"Oracle Import สำเร็จ",d:"Invoice ID "+d.apId,k:"g"});log("Oracle Import สำเร็จ",d.doc,d.apId)});
 toast("รับผล Import แล้ว "+n+" ฉบับ");apTab="done";render()}
function apOpenReturn(id){if(!can("POST"))return toast("ไม่มีสิทธิ์",1);const d=DOCS.find(x=>x.doc===id);sel=id;
 modal("ส่งกลับคิวตรวจสอบ · "+d.inv,d.vendor,"undo","warn",`<div class="note d" style="margin:0 0 4px">${icon("alert")}<div>${d.apErr}</div></div><label for="rs">เหตุผล</label><select id="rs"><option>ต้องแก้ข้อมูลผู้ขายใน Oracle</option><option>ต้องตรวจเอกสารใหม่</option></select><label for="nt">หมายเหตุ <span class="req">* จำเป็น</span></label><textarea id="nt"></textarea>`,icon("undo","sm")+"ส่งกลับ","btn-warn",apDoReturn)}
function apDoReturn(){const d=DOCS.find(x=>x.doc===sel),nt=$("nt").value.trim();if(!nt){$("nt").focus();return toast("กรุณาระบุหมายเหตุ",1)}
 d.status="Review";d.assigned="acc";d.hist.push({t:now(),a:"ส่งกลับคิวตรวจสอบจาก AP Interface",d:ME.n+" · "+$("rs").value+" · "+nt,k:"c",rs:$("rs").value,nt:nt,who:ME.n});
 d.confirmedBy=null;log("ส่งกลับคิวตรวจสอบ",d.doc,nt);closeM();toast("ส่ง "+d.inv+" กลับคิวตรวจสอบแล้ว");render()}

/* ================= RBAC page (v4.7) ================= */

/* ================= v4.16 ชุดเอกสารทดสอบ (mock) ================= */
function casesPage(){const groups=[...new Set(DOCS.map(d=>d.grp||"G · อัปโหลดระหว่างทดสอบ"))].sort();
 const eu=d=>USERS.filter(u=>u.role==="EU"&&scopeCheck(d,u).ok).map(u=>u.n).join(", ")||'<span class="pre-x">ไม่มี</span>';
 const acc=d=>USERS.filter(u=>["ACC","APR"].includes(u.role)&&scopeCheck(d,u).ok).map(u=>u.n.split(" ")[0]).join(", ");
 return `<div class="pg"><div class="tbar"><span class="lab">ชุดเอกสารทดสอบ</span><span class="scope-note">${DOCS.length} ฉบับ · ค่าสมมติทั้งหมด · วันที่ระบบจำลอง ${dmy(TODAY)} · ครอบคลุม E01–E15 · Manual Review 3 แบบ · Matrix 8B ทุกแถว · DR-01..DR-07 · AP Interface · ช่วงเวลา 3 เดือน</span></div><div class="pg-scroll">
 <div class="note i" style="margin:0 0 12px">${icon("info")}<div>คลิก <b>เปิด</b> เพื่อดูเอกสารในคิว (ล้างตัวกรองให้อัตโนมัติ) · ปุ่มเปิดใช้ได้เฉพาะเอกสารในขอบเขตของผู้ใช้ปัจจุบัน · สลับผู้ใช้ที่มุมขวาบนเพื่อทดสอบสิทธิ์</div></div>
 <div class="panel"><div class="tbl-wrap"><table class="t"><thead><tr><th>#</th><th>เคสทดสอบ</th><th>เลขที่ใบแจ้งหนี้</th><th>บริษัท</th><th>เข้าระบบ</th><th>สถานะ</th><th>รหัส</th><th>ผู้ใช้งานที่เห็น</th><th>ฝ่ายบัญชีที่เห็น</th><th></th></tr></thead><tbody>
 ${groups.map(g=>{const ds=DOCS.filter(d=>(d.grp||"G · อัปโหลดระหว่างทดสอบ")===g);let i=0;return `<tr class="grp-h"><td colspan="10">${g} · ${ds.length} ฉบับ</td></tr>`+ds.map(d=>`<tr><td class="num">${++i}</td><td>${d.tc||"—"}</td><td><b>${d.inv}</b><div class="muted xs mono">${d.doc}</div></td><td><span class="co" style="margin:0">${d.company}</span></td><td class="mono">${dmy(d.up)}</td><td>${badge(d.status)}</td>
  <td>${d.codes.map(c=>`<span class="code ${sevOf(d,c)}">${c}</span>`).join(" ")||'<span class="nac">—</span>'}</td><td class="sm">${eu(d)}</td><td class="sm">${acc(d)}</td>
  <td>${scopeCheck(d).ok?`<button class="btn btn-sec sm" onclick="openOld('${d.doc}')">${icon("ext","sm")}เปิด</button>`:`<span class="muted xs">นอกสิทธิ์</span>`}</td></tr>`).join("")}).join("")}
 </tbody></table></div></div></div></div>`}
function rbacPage(){const pk=Object.keys(PERM),rk=Object.keys(ROLES);
 const unmapped=[...new Set(DOCS.map(d=>d.receiver).filter(Boolean))].filter(o=>!bound(o));
 return `<div class="pg"><div class="tbar"><span class="lab">สิทธิ์และการเชื่อมบัญชี</span><span class="scope-note">Entra ID ↔ RECEIVER (Oracle) ↔ บริษัท · ผู้ดูแลระบบจัดการได้ แต่ไม่เห็นเนื้อหาเอกสาร</span></div><div class="pg-scroll">
 <div class="panel"><div class="panel-h"><h3>กฎการมองเห็นเอกสาร (Visibility)</h3></div><div class="panel-b">
  <div class="rule"><b>ผู้ใช้งาน (Receiver)</b> เห็น<b>เฉพาะใบรับของตนเอง</b>: <span class="mono">RECEIVER ของใบรับ = Receiver ที่เชื่อมกับบัญชีผู้ใช้</span> <b>และ</b> บริษัทของเอกสารอยู่ในบริษัทที่ได้รับมอบหมาย · ไม่มีการมอบหมายแทน ไม่เห็นทั้งหน่วยงาน</div>
  <div class="rule"><b>เอกสารที่ยังไม่มีใบรับ</b> (E02 ไม่เรียก Oracle · E05 ไม่พบใบรับ) ไม่มี Receiver → ผู้ใช้งานไม่เห็น · ฝ่ายบัญชีของบริษัทตาม Tax ID ลูกค้าบนใบแจ้งหนี้ (ตารางที่ 4) ดำเนินการ ติดต่อผู้สแกนนอกระบบ · Reject เท่านั้น · ไม่มีการตรวจซ้ำ ผู้สแกนอัปโหลดเอกสารใหม่</div>
  <div class="rule"><b>ไม่มีการแจ้งกลับและไม่มีการตรวจซ้ำ</b> End User ตรวจสถานะเองในคิว “รอฉันแก้ไข” และอัปโหลดเอกสารใหม่ · ฝ่ายบัญชีอัปเดตสถานะตาม Transition Matrix (SRS ชีต 05A) · เอกสารซ้ำใช้กติกา DR-01..07 (ชีต 05B)</div>
  <div class="rule"><b>Receiver ยังไม่เชื่อมบัญชีหรือลาออก</b> เอกสารไม่ปรากฏในคิวผู้ใช้งาน · ฝ่ายบัญชียังเห็นและดำเนินการได้ · หน้าจอแสดงป้าย “ยังไม่เชื่อมบัญชี”</div>
  <div class="rule"><b>เจ้าหน้าที่บัญชี / หัวหน้าฝ่ายบัญชี</b> เห็นเอกสารรายบริษัท · บริษัท = นิติบุคคลตาม Tax ID ครอบคลุมทุก ORG_ID ของบริษัทนั้น (เช่น AH = 103 + 222 · AHT = 352 + 196)</div>
  <div class="rule"><b>ORG_ID ยังไม่ทราบ</b> อยู่ในบริษัท “?” เห็นเฉพาะผู้ที่ได้รับมอบหมายบริษัท “?” (หัวหน้าฝ่ายบัญชี)</div>
  <div class="rule"><b>ผู้ดูแลระบบ</b> จัดการการเชื่อมบัญชีและสิทธิ์ แต่ไม่เห็นเนื้อหาเอกสาร · <b>ผู้ยืนยัน ≠ ผู้ส่งเข้า AP Interface</b> · การส่งทำที่หน้า “ส่งเข้า AP Interface” เท่านั้น (เจ้าหน้าที่บัญชีดูได้ หัวหน้าฝ่ายบัญชีส่งได้ ≤ 1,000,000 ฿ ต่อฉบับ)</div>
  <div class="rule"><b>ลิงก์ DMS</b> ออกโดย Portal หลังตรวจสิทธิ์ทุกครั้ง อายุ 10 นาที ใส่ลายน้ำชื่อผู้ดู และบันทึกทุกการเปิด ห้ามเปิด DMS ตรงจาก doc_id</div></div></div>
 <div class="panel"><div class="panel-h"><h3>ข้อมูล Receiver จาก Oracle (SQL RCV-V01 · ยืนยันแล้ว)</h3></div><div class="panel-b">
 <div class="rule">คอลัมน์ <span class="mono">v.RECEIVER AS RECEIVER</span> จาก <span class="mono">APPS.RCV_VRC_HDS_V</span> = ผู้รับตาม <span class="mono">EMPLOYEE_ID</span> ของหัวใบรับ · บันทึกลง JSON <span class="mono">receipt.receiver</span></div>
 <pre class="sql">SELECT ph.ORG_ID AS ORG_ID,
       h.RECEIPT_NUM AS RECEIPT_NUM,
       v.RECEIVER AS RECEIVER,
       COALESCE(pv.VAT_REGISTRATION_NUM, pv.NUM_1099) AS SUPPLIER_TAX_ID,
       pv.VENDOR_NAME AS SUPPLIER_NAME,
       ...
LEFT JOIN APPS.PO_VENDORS pv ON pv.VENDOR_ID = v.VENDOR_ID
WHERE REGEXP_REPLACE(UPPER(COALESCE(pv.VAT_REGISTRATION_NUM, pv.NUM_1099)),'[^0-9A-Z]','') = :supplier_tax_id
AND   UPPER(v.SHIPMENT_NUM) = UPPER(:invoice_num)
JOIN APPS.RCV_VRC_HDS_V v ON v.SHIPMENT_HEADER_ID = h.SHIPMENT_HEADER_ID</pre>
 <div class="rule">การเชื่อมบัญชี: ผู้ดูแลระบบบันทึกค่า RECEIVER ของผู้ใช้แต่ละคนคู่กับ Entra ID · <b>RECEIVER เป็นชื่อ ไม่ใช่รหัส</b> ถ้ามีชื่อซ้ำหรือเปลี่ยนชื่อจะจับคู่ผิด ควรเพิ่ม <span class="mono">h.EMPLOYEE_ID</span> เป็นกุญแจหลักในอนาคต</div></div></div>
 <div class="panel"><div class="panel-h"><h3>ตารางสิทธิ์ (Role × Permission)</h3></div><div class="tbl-wrap"><table class="t"><thead><tr><th>สิทธิ์</th>${rk.map(k=>`<th style="text-align:center">${ROLES[k].n}</th>`).join("")}</tr></thead>
  <tbody>${pk.map(p=>`<tr><td><b>${PERM[p]}</b> <span class="muted xs mono">${p}</span></td>${rk.map(k=>ROLES[k].p.includes(p)?'<td class="yes">✓</td>':'<td class="no">—</td>').join("")}</tr>`).join("")}</tbody></table></div></div>
 <div class="panel"><div class="panel-h"><h3>การเชื่อมบัญชี: Portal (Entra ID) ↔ RECEIVER ใน Oracle ↔ บริษัท</h3>${can("MAP")?`<button class="btn btn-teal sm" onclick="toast('mockup: เพิ่มการเชื่อมบัญชี')">${icon("key","sm")}เชื่อมบัญชี</button>`:""}</div>
  <div class="tbl-wrap"><table class="t"><thead><tr><th>ผู้ใช้</th><th>Entra ID</th><th>บทบาท</th><th>RECEIVER (Oracle)</th><th>บริษัท</th><th class="num">เอกสารที่เห็น</th></tr></thead>
  <tbody>${USERS.map(u=>`<tr><td><b>${u.n}</b><div class="muted xs">${u.unit}</div></td><td class="mono sm">${u.email}</td><td><span class="role-pill" style="background:${ROLES[u.role].bg};color:${ROLES[u.role].c}">${ROLES[u.role].n}</span></td><td class="mono">${u.role==="EU"?(acctsOf(u).join(", ")||"—"):"—"}</td>
  <td>${u.co.map(c=>`<span class="co" style="margin:0 2px 0 0">${c}</span>`).join("")||"—"}</td><td class="num">${DOCS.filter(d=>scopeCheck(d,u).ok).length}</td></tr>`).join("")}</tbody></table></div>
  ${unmapped.length?`<div class="panel-b"><div class="note w" style="margin:0">${icon("alert")}<div>Receiver ที่ยังไม่เชื่อมบัญชีในพอร์ทัล: <b class="mono">${unmapped.join(", ")}</b> · เอกสารของ Receiver เหล่านี้จะไม่ปรากฏในคิวผู้ใช้งาน</div></div></div>`:""}</div>
 <div class="panel"><div class="panel-h"><h3>บริษัทและ ORG_ID (จากตารางที่ 4)</h3></div><div class="tbl-wrap"><table class="t"><thead><tr><th>บริษัท</th><th>ชื่อ</th><th>Tax ID</th><th>ORG_ID</th><th>ผู้ใช้งาน</th><th>ฝ่ายบัญชี</th></tr></thead>
  <tbody>${Object.entries(COMPANY).map(([k,c])=>`<tr><td><span class="co" style="margin:0">${k}</span></td><td>${c.name}</td><td class="mono">${c.tax}</td><td class="mono">${c.orgs.map(o=>o+" "+ORG[o]).join(", ")}</td>
  <td>${USERS.filter(u=>u.role==="EU"&&u.co.includes(k)).map(u=>u.n).join(", ")||"—"}</td><td>${USERS.filter(u=>["ACC","APR"].includes(u.role)&&u.co.includes(k)).map(u=>u.n).join(", ")||"—"}</td></tr>`).join("")}</tbody></table></div></div></div></div>`}
function auditPage(){const L=AUDIT.filter(a=>inPerOf(a.dt,PERS.au));
 return `<div class="pg"><div class="tbar"><span class="lab">บันทึกการเข้าถึงและการดำเนินการ</span><span class="scope-note">${L.length} / ${AUDIT.length} รายการ · ไม่สามารถแก้ไขได้</span><span class="vsep" aria-hidden="true"></span>${perCtl("au")}</div><div class="pg-scroll"><div class="panel"><div class="tbl-wrap">
 <table class="t"><thead><tr><th>วันที่</th><th>เวลา</th><th>ผู้ใช้</th><th>บทบาท</th><th>การดำเนินการ</th><th>เอกสาร</th><th>รายละเอียด</th></tr></thead><tbody>${L.map(a=>`<tr class="${/ปฏิเสธ|ไม่สำเร็จ/.test(a.act)?"row-bad":""}"><td class="mono">${dmy(a.dt)}</td><td class="mono">${a.t}</td><td>${a.who}</td><td>${a.role}</td><td>${a.act}</td><td class="mono">${a.doc}</td><td>${a.detail}</td></tr>`).join("")||`<tr><td colspan="7"><div class="empty">${icon("inbox")}ไม่มีเหตุการณ์ในช่วงเวลานี้</div></td></tr>`}</tbody></table></div></div></div></div>`}

/* ================= Keyboard ================= */
document.addEventListener("keydown",e=>{const ov=$("ov").classList.contains("on");
 if(e.key==="Escape"){if(ov)return closeM();if($("work")&&$("work").classList.contains("q-peek"))return peekQueue(false);if(PDF.open&&page==="queue")return closeDock();if(page==="queue"&&view==="split"&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return backToTable()}
 if(ov||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey||page!=="queue"||view!=="split")return;
 if(["ArrowDown","ArrowUp","j","k"].includes(e.key)){const L=curList();const i=L.findIndex(d=>d.doc===sel);const n=L[Math.min(L.length-1,Math.max(0,i+(e.key==="ArrowDown"||e.key==="j"?1:-1)))];if(n&&n.doc!==sel){e.preventDefault();pick(n.doc)}}
 else if(e.key==="p"||e.key==="P"){e.preventDefault();if(can("DMS"))togglePdf()}
 else if(e.key==="/"){e.preventDefault();$("q").focus()}
 else if(e.key==="["){e.preventDefault();toggleQueue()}});
/* =====================================================================
   v4.17 — (1) มาตรฐาน Payload Engine → Portal  aiva.portal.ingest/1.0
           (2) Document Simulation (เมนูพิเศษ · Sandbox แยกจากคิวจริง)
   Unique key ของรายการ = receive_id (Receipt Number · 1 Invoice/ผู้ขาย : 1 ใบรับ · ไม่ซ้ำ)
   Receiver = เจ้าของรายการ (ไม่ใช่ key) · Manual Review (ไม่ทราบเจ้าของ) = OCR อ่าน Invoice + (PO หรือ Tax ID ผู้ขาย) ไม่ได้
   ===================================================================== */
Object.assign(I,{code:"M16 18l6-6-6-6M8 6l-6 6 6 6",flask:"M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3M7 15h10",
 play:"M6 4l14 8-14 8z",git:"M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9",arrow:"M5 12h14M13 6l6 6-6 6"});
const PSTD={contract:"aiva.portal.ingest/1.0",endpoint:"POST /api/v1/ingest/validation-results"};
const REC_ENUM=["AUTO_PASS","REVIEW","HOLD","MANUAL_REVIEW","SYSTEM_ERROR"];
const ID_ENUM=["RESOLVED","NOT_FOUND","UNRESOLVED"];
const ES={AUTO_PASS:"Auto-pass",REVIEW:"Review",HOLD:"Hold",MANUAL_REVIEW:"Manual Review"};
const SEV={E01:"Medium",E02:"High",E03:"High",E04:"Low",E05:"High",E06:"High",E07:"High",E08:"High",E09:"High",E10:"Medium",E11:"Medium",E12:"Medium",E13:"High",E14:"High",E15:"Medium"};
const CRULE={E01:"V-01",E02:"V-02",E03:"V-03",E04:"V-03",E05:"V-04",E06:"V-04",E07:"V-05",E08:"V-06",E09:"V-07",E10:"V-07",E11:"V-07",E12:"V-07",E13:"V-07",E14:"V-08",E15:"V-08"};
const AP_ST=["Confirmed","Sent","Posted","Import Failed"],CLOSED_ST=["Rejected","Superseded","Duplicate"];
const isActive=r=>!CLOSED_ST.includes(r.status);
const FORBID=["workflow","status","duplicate_status","duplicate_of","superseded_by","supersedes_doc_id","history","assigned_to","allowed_actions","approved","ap_status","portal_doc_id"];
const SUPS={"0105546011116":"DELTA TRADING CO., LTD.","0105536012345":"THAI STEEL SERVICE CO., LTD.","0105539044556":"SIAM AUTO PARTS CO., LTD.","0105548077777":"PRECISION TOOLS (THAILAND) CO., LTD.","0105549022222":"OSG THAI CO., LTD.","0103554001122":"S R Y ENGINEERING & TRADING","0105537011111":"KANOK STEEL CO., LTD."};
const SIMD="2026-10-07";
/* ---------- Field dictionary (ใช้ทั้งเอกสารมาตรฐานและตัวตรวจ Payload) ----------
   req: Y = บังคับ · R = บังคับเมื่อ identity.status = RESOLVED · N = ไม่บังคับ */
const SPEC=[
 ["contract","string","Y","รุ่นของสัญญาข้อมูล","const = aiva.portal.ingest/1.0"],
 ["message_id","string","Y","รหัสข้อความไม่ซ้ำทุกครั้งที่ส่ง ใช้กันประมวลผลซ้ำ (= Header Idempotency-Key)","unique"],
 ["sent_at","datetime","Y","เวลาที่ Engine ส่ง (ISO 8601 +07:00)",""],
 ["source.engine","string","Y","ชื่อ Engine","system_a"],
 ["source.engine_version","string","Y","เวอร์ชันโค้ด Engine",""],
 ["source.standard_version","string","Y","Standard ที่ใช้ตรวจ","6.7"],
 ["source.validation_id","string","Y","อ้างอิงผลเต็ม aiva.system_a.result/3.0 (Portal ใช้ดึง evidence / bbox)",""],
 ["source.result_sha256","string","Y","hash ของผลเต็ม (integrity.payload_sha256)","^[a-f0-9]{64}$"],
 ["document.dms_doc_id","string","Y","รหัสเอกสารใน DMS (ไม่ส่ง URL)",""],
 ["document.file_sha256","string","Y","hash ไฟล์ PDF · ใช้เตือนไฟล์เดิมถูกส่งซ้ำ","^[a-f0-9]{64}$"],
 ["document.page_count","integer","Y","จำนวนหน้า","≥ 1"],
 ["document.uploaded_by","string","Y","ผู้สแกน · ใช้ติดต่อนอกระบบเมื่อไม่มี Receiver",""],
 ["document.uploaded_at","datetime","Y","เวลาที่เข้า DMS · ใช้นับอายุเอกสาร",""],
 ["identity.status","enum","Y","ผลการระบุตัวตนของรายการ","RESOLVED | NOT_FOUND | UNRESOLVED"],
 ["identity.reason","enum","Y","เหตุผล","FOUND | RECEIPT_NOT_FOUND | HALTED_BEFORE_LOOKUP | KEYS_UNREADABLE"],
 ["identity.receive_id","string|null","R","Receipt Number = Unique key ของรายการใน Portal · 1 Invoice/ผู้ขาย : 1 ใบรับ","RESOLVED: ^[A-Z0-9-]{4,30}$ · อื่น ๆ: null"],
 ["identity.lookup_path","string|null","N","เส้นทางที่ค้นเจอใน Oracle","TAX-INV | PO-INV | PO-TAX"],
 ["identity.missing_keys","string[]","Y","คีย์ที่ OCR อ่านไม่ได้ (บังคับมีค่าเมื่อ UNRESOLVED)","invoice_num | po_number | supplier_tax_id"],
 ["invoice.invoice_num","string|null","Y","เลขที่ใบแจ้งหนี้","null เมื่อ OCR อ่านไม่ได้"],
 ["invoice.invoice_date","string|null","N","วันที่ใบแจ้งหนี้ (YYYY-MM-DD)",""],
 ["invoice.supplier_tax_id","string|null","Y","Tax ID ผู้ขาย","^\\d{13}$ หรือ null"],
 ["invoice.supplier_name","string|null","N","ชื่อผู้ขายบนเอกสาร",""],
 ["invoice.customer_tax_id","string|null","Y","Tax ID ลูกค้า · กำหนดบริษัทเมื่อไม่มีใบรับ","^\\d{13}$ หรือ null"],
 ["invoice.customer_name","string|null","N","ชื่อลูกค้าบนเอกสาร",""],
 ["invoice.po_numbers","string[]","Y","PO ทุกใบที่พิมพ์บนใบแจ้งหนี้ (1 Invoice อ้างได้หลาย PO)","[] ได้"],
 ["invoice.currency","string","N","สกุลเงิน","THB"],
 ["invoice.sub_total","number|null","Y","ยอดก่อนภาษี",""],
 ["invoice.vat","number|null","Y","ภาษีมูลค่าเพิ่ม",""],
 ["invoice.grand_total","number|null","Y","ยอดสุทธิ",""],
 ["receipt","object|null","R","ข้อมูลใบรับจาก Oracle","null เมื่อไม่ใช่ RESOLVED"],
 ["receipt.receive_id","string","R","ต้องเท่ากับ identity.receive_id",""],
 ["receipt.org_id","integer","R","ORG_ID ของใบรับ → บริษัท (ตารางที่ 4)",""],
 ["receipt.receiver","string|null","R","ผู้รับของ = เจ้าของรายการ (ไม่ใช่ key)","RCV_VRC_HDS_V.RECEIVER"],
 ["receipt.receiver_employee_id","integer|null","N","EMPLOYEE_ID ของผู้รับ · ใช้ map บัญชีแทนชื่อ","แนะนำให้ส่ง"],
 ["receipt.po_received","object[]","R","PO ที่รับแล้วในใบรับนี้ [{po_number, line_count, amount}]","≥ 1 รายการ"],
 ["receipt.receipt_total","number","R","ยอดรวมใบรับ (QTY > 0)",""],
 ["po_breakdown","object[]","N","ยอดแยกตาม PO [{po_number, invoice_amount, receipt_amount, diff}]",""],
 ["lines","object[]","N","รายบรรทัด [{line_no, po_number, description, qty, uom, unit_price, amount, rcv_line_id, match_level, status, codes}]",""],
 ["rules","object[]","Y","ผลกฎ V-01..V-09 [{rule_id, result, exception_code, severity, halted_by}]","9 รายการ · SYSTEM_ERROR ส่ง [] ได้"],
 ["exceptions","object[]","Y","[{code, severity, rule_id, owner, message}]","code ^E(0[1-9]|1[0-5])$ · owner EU | ACC"],
 ["decision.recommendation","enum","Y","ข้อเสนอจาก Engine","AUTO_PASS | REVIEW | HOLD | MANUAL_REVIEW | SYSTEM_ERROR"],
 ["decision.max_severity","enum","Y","ความรุนแรงสูงสุด","None | Low | Medium | High"],
 ["decision.exception_codes","string[]","Y","รหัสทั้งหมด",""],
 ["decision.error","object|null","N","รายละเอียดเมื่อ SYSTEM_ERROR {stage, message, retryable}",""]];
const getP=(o,p)=>p.split(".").reduce((a,k)=>a==null?undefined:a[k],o);
function validatePayload(p){const E=[],W=[];
 if(!p||typeof p!=="object"||Array.isArray(p))return {E:["Payload ต้องเป็น JSON object"],W};
 FORBID.forEach(k=>{if(k in p)E.push("ห้ามส่งฟิลด์ที่ Portal เป็นเจ้าของ: "+k)});
 const st=getP(p,"identity.status"),res=st==="RESOLVED";
 SPEC.forEach(([path,type,req])=>{if(path.startsWith("receipt.")&&!(res&&p.receipt))return;const v=getP(p,path);
  const need=req==="Y"||(req==="R"&&res);
  if(v===undefined){if(need)E.push("ขาดฟิลด์ "+path);return}
  if(v===null){if(need&&!type.includes("null"))E.push(path+" ห้ามเป็น null");return}
  const t=type.replace("|null","");
  const okT=["string","datetime","enum"].includes(t)?typeof v==="string":t==="integer"?Number.isInteger(v):t==="number"?typeof v==="number":t.endsWith("[]")?Array.isArray(v):t==="object"?typeof v==="object"&&!Array.isArray(v):true;
  if(!okT)E.push(path+" ต้องเป็น "+type)});
 if(p.contract!==undefined&&p.contract!==PSTD.contract)E.push("contract ต้องเป็น "+PSTD.contract);
 if(st!==undefined&&!ID_ENUM.includes(st))E.push("identity.status ต้องเป็น "+ID_ENUM.join(" | "));
 const rid=getP(p,"identity.receive_id");
 if(res&&typeof rid==="string"&&!/^[A-Z0-9-]{4,30}$/.test(rid))E.push("identity.receive_id รูปแบบไม่ถูกต้อง (A-Z 0-9 - ยาว 4–30)");
 if(res&&rid==null)E.push("RESOLVED ต้องมี identity.receive_id");
 if(res&&p.receipt&&p.receipt.receive_id!==rid)E.push("receipt.receive_id ต้องเท่ากับ identity.receive_id");
 if(res&&p.receipt&&Array.isArray(p.receipt.po_received)&&!p.receipt.po_received.length)E.push("receipt.po_received ต้องมีอย่างน้อย 1 PO");
 if(st&&!res){if(rid!=null)E.push(st+" ต้องส่ง identity.receive_id = null");if(p.receipt!=null)E.push(st+" ต้องส่ง receipt = null")}
 if(st==="UNRESOLVED"&&!(getP(p,"identity.missing_keys")||[]).length)E.push("UNRESOLVED ต้องระบุ identity.missing_keys");
 if(st==="NOT_FOUND"&&!(getP(p,"invoice.invoice_num")&&getP(p,"invoice.supplier_tax_id")))E.push("NOT_FOUND ต้องมี invoice_num และ supplier_tax_id (ใช้เป็นคีย์ตรวจซ้ำ) · ถ้าอ่านไม่ได้ให้ส่ง UNRESOLVED");
 const rec=getP(p,"decision.recommendation");
 if(rec!==undefined&&!REC_ENUM.includes(rec))E.push("decision.recommendation ต้องเป็น "+REC_ENUM.join(" | "));
 const ms=getP(p,"decision.max_severity");if(ms!==undefined&&!["None","Low","Medium","High"].includes(ms))E.push("decision.max_severity ไม่ถูกต้อง");
 (getP(p,"decision.exception_codes")||[]).forEach(c=>{if(!/^E(0[1-9]|1[0-5])$/.test(c))E.push("รหัส "+c+" ไม่อยู่ใน E01–E15")});
 if(Array.isArray(p.rules)&&rec!=="SYSTEM_ERROR"&&p.rules.length!==9)E.push("rules ต้องมี 9 รายการ (V-01..V-09)");
 ["supplier_tax_id","customer_tax_id"].forEach(k=>{const v=getP(p,"invoice."+k);if(typeof v==="string"&&!/^\d{13}$/.test(v))E.push("invoice."+k+" ต้องเป็นตัวเลข 13 หลัก")});
 if(st==="UNRESOLVED"&&rec&&!["MANUAL_REVIEW","SYSTEM_ERROR"].includes(rec))W.push("UNRESOLVED แต่ recommendation = "+rec+" → Portal บังคับเป็น Manual Review");
 if(res&&rec==="MANUAL_REVIEW")W.push("RESOLVED แต่ได้ MANUAL_REVIEW → Manual Review แบบทราบเจ้าของ (ข้อมูลหลักไม่พร้อม / SQL 50 แถว / ORG_ID ไม่ทราบ)");
 if(res&&getP(p,"receipt.receiver")==null)W.push("ใบรับไม่มี RECEIVER → End User ไม่เห็นรายการนี้");
 return {E,W}}
/* ---------- สร้าง Payload ตัวอย่าง ---------- */
function fh(s){const r=seedR(String(s));return Array.from({length:64},()=>"0123456789abcdef"[Math.floor(r()*16)]).join("")}
const pad=(n,l)=>String(n).padStart(l||4,"0");
function newMsg(){return "msg-"+SIMD.replace(/-/g,"")+"-"+pad(++SIM.msg)}
const empOf=n=>(USERS.find(u=>acctsOf(u).includes(n))||{}).emp||null;
function mkPayload(o){const id=o.idStatus||(o.rid?"RESOLVED":"UNRESOLVED"),res=id==="RESOLVED";
 const missing=id==="UNRESOLVED"?(o.missing||["invoice_num","po_number"]):[];
 let codes=(o.codes||[]).filter(c=>SEV[c]);if(id==="NOT_FOUND"&&!codes.some(c=>c==="E05"||c==="E02"))codes=["E05",...codes];
 const rec=o.rec&&o.rec!=="auto"?o.rec:(id==="UNRESOLVED"?"MANUAL_REVIEW":codes.some(c=>SEV[c]==="High")?"HOLD":codes.some(c=>SEV[c]==="Medium")?"REVIEW":"AUTO_PASS");
 const sevs=codes.map(c=>SEV[c]),maxs=sevs.includes("High")?"High":sevs.includes("Medium")?"Medium":sevs.includes("Low")?"Low":"None";
 const tot=o.total||10700,sub=Math.round(tot/1.07*100)/100,vat=Math.round((tot-sub)*100)/100;
 const co=o.org?companyOfOrg(o.org):(o.co||"AH");const ctax="ctax" in o?o.ctax:(COMPANY[co]&&COMPANY[co].tax!=="—"?COMPANY[co].tax:null);
 const pos=missing.includes("po_number")?[]:(o.pos||["40130"+pad(Math.floor(Math.random()*900)+100,3)]);
 const dms=o.dms||("DMS-2026-"+pad(400+(++SIM.n),6));
 const inv=missing.includes("invoice_num")?null:(o.inv||"INV-"+pad(Math.floor(Math.random()*9000)+1000));
 const stax=missing.includes("supplier_tax_id")?null:(o.stax||"0105546011116");
 const halted=codes.includes("E02");
 const rules=rec==="SYSTEM_ERROR"?[]:["V-01","V-02","V-03","V-04","V-05","V-06","V-07","V-08","V-09"].map(v=>{const c=codes.find(x=>CRULE[x]===v);
  const fail=c?{rule_id:v,result:"fail",exception_code:c,severity:SEV[c],halted_by:null}:null,pass={rule_id:v,result:"pass",exception_code:null,severity:null,halted_by:null};
  if(id==="UNRESOLVED"){if(v==="V-01")return {rule_id:v,result:"manual_review",exception_code:null,severity:null,halted_by:null};if(["V-02","V-03","V-06"].includes(v))return fail||pass;return {rule_id:v,result:"not_evaluated",exception_code:null,severity:null,halted_by:"IDENTITY"}}
  if(id==="NOT_FOUND"&&["V-04","V-05","V-07","V-08","V-09"].includes(v)&&!fail)return {rule_id:v,result:"not_evaluated",exception_code:null,severity:null,halted_by:halted?"V-02":"V-04"};
  if(res&&rec==="MANUAL_REVIEW"&&v==="V-05"&&!fail)return {rule_id:v,result:"manual_review",exception_code:null,severity:null,halted_by:null};
  return fail||pass});
 const per=pos.length?Math.round(sub/pos.length*100)/100:sub;
 return {contract:PSTD.contract,message_id:o.msg||newMsg(),sent_at:SIMD+"T"+now()+"+07:00",
  source:{engine:"system_a",engine_version:"3.0.4",standard_version:"6.7",validation_id:"VAL-"+dms.slice(-6)+"-"+pad(SIM.msg,3),result_sha256:fh(dms+SIM.msg)},
  document:{dms_doc_id:dms,file_sha256:o.sha||fh(dms),page_count:o.pages||2,uploaded_by:o.upl||"SOMSAK.J",uploaded_at:SIMD+"T08:00:00+07:00"},
  identity:{status:id,reason:res?"FOUND":id==="NOT_FOUND"?(halted?"HALTED_BEFORE_LOOKUP":"RECEIPT_NOT_FOUND"):"KEYS_UNREADABLE",receive_id:res?o.rid:null,lookup_path:res?(o.path||"TAX-INV"):null,missing_keys:missing},
  invoice:{invoice_num:inv,invoice_date:"2026-10-05",supplier_tax_id:stax,supplier_name:stax?(SUPS[stax]||"SUPPLIER CO., LTD."):null,customer_tax_id:ctax,customer_name:ctax&&co&&COMPANY[companyOfTax(ctax)]?"บริษัท "+COMPANY[companyOfTax(ctax)].name+" จำกัด":null,
   po_numbers:pos,currency:"THB",sub_total:sub,vat:vat,grand_total:tot},
  receipt:res?{receive_id:o.rid,org_id:o.org||103,receiver:o.receiver===undefined?"SOMSAK JAIDEE":o.receiver,receiver_employee_id:empOf(o.receiver),
   po_received:pos.map(x=>({po_number:x,line_count:1,amount:per})),receipt_total:sub}:null,
  po_breakdown:res?pos.map(x=>({po_number:x,invoice_amount:per,receipt_amount:per,diff:0})):[],
  lines:(pos.length?pos:[null]).map((x,i)=>({line_no:i+1,po_number:x,description:"Item "+(i+1),qty:10,uom:"PCS",unit_price:Math.round(per/10*100)/100,amount:per,
   rcv_line_id:res?o.rid+"-"+(i+1):null,match_level:res?"M1":null,status:res?(codes.length?"CHECK":"OK"):"NOT_EVALUATED",codes:[]})),
  rules,exceptions:rec==="SYSTEM_ERROR"?[]:codes.map(c=>({code:c,severity:SEV[c],rule_id:CRULE[c],owner:EXC[c][1]==="eu"?"EU":"ACC",message:EXC[c][0]})),
  decision:{recommendation:rec,max_severity:rec==="SYSTEM_ERROR"?"None":maxs,exception_codes:rec==="SYSTEM_ERROR"?[]:codes,
   error:rec==="SYSTEM_ERROR"?{stage:"VLM_EXTRACTION",message:"LiteLLM timeout 120 s",retryable:true}:null}}}
/* ---------- Sandbox state ---------- */
function freshSim(){return {recs:[],log:[],seen:{},n:0,msg:0,rcv:530340600,sel:null,tab:"console",text:"",trace:null,ack:null,val:null,mres:null,xres:null,f:"all",preset:"new_ap",lastSent:null,pseq:0}}
let SIM=freshSim();
const nextRid=()=>"RCV"+(++SIM.rcv);
const nextInv=pre=>(pre||"INV")+"-2610-"+pad(SIM.rcv%10000);
function simWho(r){const eu=r.receiver?USERS.filter(u=>u.role==="EU"&&acctsOf(u).includes(r.receiver)&&u.co.includes(r.company)):[];
 return {eu,acc:USERS.filter(u=>u.role==="ACC"&&u.co.includes(r.company)),apr:USERS.filter(u=>u.role==="APR"&&u.co.includes(r.company))}}
function simActor(r){const s=r.status;
 if(s==="Manual Review")return "หัวหน้าฝ่ายบัญชี (APR) เท่านั้น";
 if(s==="Hold"&&!r.receiver)return "ฝ่ายบัญชี · Reject เท่านั้น · ติดต่อผู้สแกน "+r.upl+" นอกระบบ";
 if(s==="Duplicate")return "ฝ่ายบัญชี Reject · APR ยืนยันว่าไม่ซ้ำ";
 if(["Confirmed","Import Failed"].includes(s))return "หัวหน้าฝ่ายบัญชี (หน้า AP Interface)";
 if(s==="Sent")return "ระบบ (รอผล Oracle Import)";
 if(["Rejected","Superseded","Posted"].includes(s))return "ปิดแล้ว";
 if(r.codes.some(c=>EUCODES.has(c))&&r.receiverActive)return "End User แก้แล้วอัปโหลดใหม่ · Confirm ล็อก";
 return "ฝ่ายบัญชี (ACC / APR)"}
/* ---------- Ingest pipeline (จำลองฝั่ง Portal) ---------- */
function simDup(n,ns){
 if(n.idStatus==="UNRESOLVED")return {rule:"DR-07*",result:"CREATED",newStatus:ns,s:"warn",desc:"ไม่มี receive_id และคีย์สำรองไม่ครบ → ตรวจซ้ำอัตโนมัติไม่ได้ · สร้างรายการใหม่ (APR ต้องตรวจเอง)"};
 const key=n.rid?"receive_id = "+n.rid:"Tax ID ผู้ขาย "+n.stax+" + Invoice "+n.inv;
 const C=SIM.recs.filter(r=>(n.rid&&r.rid===n.rid)||(n.stax&&n.inv&&r.stax===n.stax&&r.inv===n.inv));
 if(!C.length)return {rule:"DR-07",result:"CREATED",newStatus:ns,s:"ok",desc:"ค้นด้วย "+key+" · ไม่พบรายการเดิม → รายการใหม่"};
 const A=C.filter(isActive);
 if(!A.length)return {rule:"DR-05",result:"CREATED",newStatus:ns,s:"ok",desc:"ค้นด้วย "+key+" · พบ "+C.map(r=>r.pid+" ("+r.status+")").join(", ")+" แต่ปิดแล้ว ไม่ใช้เป็นคู่เทียบ → สถานะตามผลตรวจ"};
 const t6=A.find(r=>n.rid&&r.rid===n.rid&&(r.inv!==n.inv||r.stax!==n.stax));
 if(t6)return {rule:"DR-06",result:"CREATED_AS_DUPLICATE",newStatus:"Duplicate",target:t6,s:"bad",desc:"ใบรับ "+n.rid+" ถูกใช้แล้วกับ "+t6.pid+" (Invoice "+t6.inv+") แต่ฉบับใหม่เป็น Invoice "+(n.inv||"—")+" → ฉบับใหม่ Duplicate"};
 const t=A[0];
 if(AP_ST.includes(t.status))return {rule:"DR-04",result:"CREATED_AS_DUPLICATE",newStatus:"Duplicate",target:t,s:"bad",desc:"ค้นด้วย "+key+" · "+t.pid+" อยู่ในสถานะ "+t.status+" แล้ว → ฉบับใหม่ Duplicate"};
 const a=RANK[ns],b=RANK[t.status],cmp=a<b?"ดีกว่า":a===b?"เท่าเดิม":"แย่กว่า";
 const base="ค้นด้วย "+key+" · เทียบกับ "+t.pid+" สถานะปัจจุบัน "+t.status+" · ฉบับใหม่ "+ns+" "+cmp;
 if(cmp==="แย่กว่า")return {rule:"DR-03",result:"CREATED_AS_DUPLICATE",newStatus:"Duplicate",target:t,s:"bad",desc:base+" → ฉบับใหม่ Duplicate · ฉบับเดิมคงไว้"};
 return {rule:cmp==="ดีกว่า"?"DR-01":"DR-02",result:"CREATED_SUPERSEDES",newStatus:ns,target:t,oldTo:"Superseded",s:"ok",desc:base+" → "+t.pid+" Superseded · ฉบับใหม่ "+ns+" (เหตุผลเดิมไม่ตามมา)"}}
function simLog(ack,p){SIM.log.unshift({t:now(),mid:p&&p.message_id||"—",http:ack.http,result:ack.result,pid:ack.portal_doc_id||"—",rule:ack.applied_rule||"—",note:(ack.errors||ack.warnings||[]).join(" · ")})}
function simIngest(p){const T=[],step=(t,d,s)=>T.push({t,d,s});
 const v=validatePayload(p);
 step("1. ตรวจ Payload ตามมาตรฐาน "+PSTD.contract,v.E.length?v.E.join(" · "):"ผ่าน "+SPEC.length+" ฟิลด์"+(v.W.length?" · คำเตือน "+v.W.length+" ข้อ":""),v.E.length?"bad":v.W.length?"warn":"ok");
 if(v.E.length){const ack={http:422,result:"VALIDATION_FAILED",message_id:p&&p.message_id||null,portal_doc_id:null,errors:v.E};step("ผล","ปฏิเสธ Payload · ไม่สร้างรายการ · Engine ต้องแก้แล้วส่งใหม่","bad");simLog(ack,p);return {ack,T}}
 const mid=p.message_id;
 if(SIM.seen[mid]){const ack=Object.assign({},SIM.seen[mid],{http:200,result:"ALREADY_PROCESSED",original_result:SIM.seen[mid].result,warnings:[]});
  step("2. ตรวจ message_id (Idempotency)",mid+" เคยประมวลผลแล้ว → ไม่สร้างรายการซ้ำ ตอบผลเดิม","warn");simLog(ack,p);return {ack,T}}
 step("2. ตรวจ message_id (Idempotency)",mid+" ยังไม่เคยรับ","ok");
 const rec=p.decision.recommendation;
 if(rec==="SYSTEM_ERROR"){const e=p.decision.error||{};
  step("3. Engine แจ้ง SYSTEM_ERROR","ขั้น "+(e.stage||"—")+" · "+(e.message||"")+(e.retryable?" · retry ได้":""),"bad");
  step("ผล","ไม่สร้างรายการ · ไม่ใช้ตรวจซ้ำ · บันทึก Ingest Error · Engine ส่งใหม่ด้วย message_id ใหม่","info");
  const ack={http:202,result:"ERROR_LOGGED",message_id:mid,portal_doc_id:null,receive_id:p.identity.receive_id,status:null,applied_rule:null,warnings:[]};SIM.seen[mid]=ack;simLog(ack,p);return {ack,T}}
 const id=p.identity.status,inv=p.invoice||{};
 const n={pid:"PD-"+pad(++SIM.pseq,6),rid:p.identity.receive_id||null,idStatus:id,reason:p.identity.reason,missing:p.identity.missing_keys||[],inv:inv.invoice_num||null,stax:inv.supplier_tax_id||null,
  sname:inv.supplier_name||null,ctax:inv.customer_tax_id||null,pos:inv.po_numbers||[],poRecv:(p.receipt&&p.receipt.po_received||[]).map(x=>x.po_number),org:p.receipt?p.receipt.org_id:null,
  receiver:p.receipt?p.receipt.receiver:null,upl:p.document.uploaded_by,dms:p.document.dms_doc_id,sha:p.document.file_sha256,total:inv.grand_total,rec,codes:p.decision.exception_codes||[],msg:mid,created:now(),hist:[],payload:p};
 n.company=n.org?(companyOfOrg(n.org)||"?"):companyOfTax(n.ctax);
 n.receiverActive=!!n.receiver&&bound(n.receiver);
 let ns=ES[rec];const forced=id==="UNRESOLVED"&&ns!=="Manual Review";if(id==="UNRESOLVED")ns="Manual Review";
 step("3. ระบุตัวตนรายการ (identity = "+id+")",id==="RESOLVED"?"receive_id "+n.rid+" · ORG_ID "+n.org+" → บริษัท "+n.company+" · Receiver "+(n.receiver||"— ไม่มี")+(n.receiver&&!n.receiverActive?" (ยังไม่เชื่อมบัญชี)":"")+" · PO ที่รับ "+(n.poRecv.join(", ")||"—")
  :id==="NOT_FOUND"?"ไม่มีใบรับ ("+n.reason+") · ไม่มี Receiver · คีย์สำรอง = Tax ID ผู้ขาย + Invoice · บริษัทจาก Tax ID ลูกค้า → "+n.company
  :"ไม่ทราบเจ้าของ · OCR อ่านไม่ได้: "+n.missing.join(", ")+" · ค้น Oracle ไม่ได้ · บริษัท "+(n.company==="?"?"? (Tax ID ลูกค้าอ่านไม่ได้) → เห็นเฉพาะหัวหน้าฝ่ายบัญชี":n.company+" จาก Tax ID ลูกค้า"),id==="RESOLVED"?"ok":"warn");
 step("4. แปลงผล Engine เป็นสถานะเริ่มต้น",rec+" → "+ns+(forced?" (บังคับ: ไม่ทราบเจ้าของ)":"")+(id==="NOT_FOUND"?" · ไม่มี Receiver → Reject เท่านั้น":""),forced?"warn":"info");
 const D=simDup(n,ns);step("5. ตรวจรายการซ้ำ ("+D.rule+")",D.desc,D.s);
 n.status=D.newStatus;n.prev=null;n.rule=D.rule;
 n.hist.push({t:n.created,from:"—",to:ns,by:"AIVA Engine",note:"รับผล "+rec+(n.codes.length?" · "+n.codes.join(", "):"")+" · "+mid});
 if(D.newStatus==="Duplicate"){n.dupOf=D.target.pid;n.prev=ns;n.hist.push({t:n.created,from:ns,to:"Duplicate",by:"Portal",note:D.rule+" · ซ้ำกับ "+D.target.pid})}
 if(D.oldTo){const o=D.target;o.hist.push({t:n.created,from:o.status,to:"Superseded",by:"Portal",note:D.rule+" · แทนที่โดย "+n.pid});o.prev=o.status;o.status="Superseded";o.supBy=n.pid;n.supersedes=o.pid}
 SIM.recs.unshift(n);
 const H=[...v.W];const sf=SIM.recs.find(r=>r!==n&&r.sha===n.sha);if(sf)H.push("ไฟล์เดียวกัน (file_sha256) เคยส่งมาแล้วเป็น "+sf.pid);
 {const mr=SIM.recs.filter(r=>r!==n&&r.idStatus==="UNRESOLVED"&&isActive(r)&&r.upl===n.upl);if(mr.length)H.push("ผู้สแกน "+n.upl+" มีรายการไม่ทราบเจ้าของค้างอยู่ "+mr.map(r=>r.pid).join(", ")+" · อาจเป็นเอกสารเดียวกัน ระบบเชื่อมอัตโนมัติไม่ได้ ให้ APR ตรวจแล้ว Reject ฉบับเดิม")}
 const w=simWho(n);
 step("6. สิทธิ์การมองเห็น",(w.eu.length?"End User: "+w.eu.map(u=>u.n).join(", "):"End User: ไม่มี"+(n.receiver&&!n.receiverActive?" (Receiver ยังไม่เชื่อมบัญชี)":n.receiver?"":" (ไม่มี Receiver)"))+" · ฝ่ายบัญชี: "+(w.acc.map(u=>u.n).join(", ")||"—")+" · หัวหน้า: "+(w.apr.map(u=>u.n).join(", ")||"—")+" · ผู้ดำเนินการ: "+simActor(n),"info");
 step("ผล",n.pid+" = "+n.status+(D.oldTo?" · "+D.target.pid+" → Superseded":"")+(H.length?" · ข้อสังเกต "+H.length+" ข้อ":""),n.status==="Duplicate"?"warn":"ok");
 const ack={http:201,result:D.result,message_id:mid,portal_doc_id:n.pid,receive_id:n.rid,status:n.status,applied_rule:D.rule,related_doc_id:D.target?D.target.pid:null,warnings:H};
 SIM.seen[mid]=ack;simLog(ack,p);return {ack,T}}
/* ---------- Accounting / AP actions จำลอง (Transition Matrix 05A) ---------- */
const SACT={confirm:["Confirm","Confirmed","btn-success"],review:["Review","Review","btn-sec"],hold:["Hold","Hold","btn-warn"],reject:["Reject","Rejected","btn-danger"],
 override:["Confirm (ยืนยันว่าไม่ซ้ำ)","Confirmed","btn-success"],unconfirm:["Unconfirm","Review","btn-sec"],send:["ส่ง Batch","Sent","btn-info"],posted:["Import สำเร็จ","Posted","btn-success"],failed:["Import ไม่ผ่าน","Import Failed","btn-danger"],ret:["Return → Review","Review","btn-warn"]};
function simActs(r){const s=r.status;
 if(s==="Auto-pass")return ["confirm","review","hold","reject"];if(s==="Review")return ["confirm","hold","reject"];
 if(s==="Hold")return r.receiver?["confirm","review","reject"]:["reject"];if(s==="Manual Review")return ["confirm","reject"];
 if(s==="Duplicate")return ["override","reject"];if(s==="Confirmed")return ["send","unconfirm"];if(s==="Sent")return ["posted","failed"];if(s==="Import Failed")return ["ret"];return []}
function simBlock(r,a){if(a==="confirm"&&r.status==="Manual Review"&&!r.rid)return "ยังไม่พบใบรับ (ไม่ทราบเจ้าของ) · Confirm ไม่ได้ ใช้ Reject แล้วให้ผู้สแกนอัปโหลดใหม่";
 if(a==="confirm"&&r.status==="Manual Review"&&r.codes.some(c=>SEV[c]==="High"))return "มีรหัส High · Confirm ไม่ได้";
 if(a==="confirm"&&["Review","Hold"].includes(r.status)&&r.codes.some(c=>EUCODES.has(c))&&r.receiverActive)return "มีรหัสของ End User ค้าง · Confirm ล็อก (รอ End User อัปโหลดใหม่)";return ""}
function simActBy(r,a){return ["send"].includes(a)?"สมชาย วงศ์ทอง (APR)":["posted","failed"].includes(a)?"Oracle AP Import":(r.status==="Manual Review"||["override","unconfirm","ret"].includes(a))?"สมชาย วงศ์ทอง (APR)":"ปณิดา รักงาน (ACC)"}
function simApply(r,a,silent){const to=SACT[a][1];r.hist.push({t:now(),from:r.status,to,by:simActBy(r,a),note:SACT[a][0]+" (จำลอง)"});r.prev=r.status;r.status=to}
function simDo(pid,a){const r=SIM.recs.find(x=>x.pid===pid);if(!r)return;const b=simBlock(r,a);if(b)return toast(b,1);simApply(r,a);SIM.sel=pid;toast(pid+" → "+r.status);simRefresh()}
/* ---------- Seed (ข้อมูลตั้งต้นใน Sandbox) ---------- */
function simSeed(){SIM=freshSim();
 const g=(o,acts)=>{simIngest(mkPayload(o));const r=SIM.recs[0];(acts||[]).forEach(a=>simApply(r,a));return r};
 g({rid:"RCV530340501",inv:"DT-2610-0501",stax:"0105546011116",org:103,receiver:"SOMSAK JAIDEE",pos:["40130101"],codes:["E08"],total:9095,upl:"SOMSAK.J"});
 g({rid:"RCV530340502",inv:"PT-2610-0502",stax:"0105548077777",org:352,receiver:"WILAIWAN SRISUK",pos:["40130102"],codes:["E10"],total:8346,upl:"WILAIWAN.S"});
 g({rid:"RCV530340503",inv:"SA-2610-0503",stax:"0105539044556",org:376,receiver:"THANAKORN MANKONG",pos:["40130103","40130104"],codes:[],total:23754,upl:"THANAKORN.M"},["confirm"]);
 g({rid:"RCV530340504",inv:"TS-2610-0504",stax:"0105536012345",org:103,receiver:"SOMSAK JAIDEE",pos:["40130105"],codes:[],total:20415.6,upl:"SOMSAK.J"},["confirm","send","posted"]);
 g({rid:"RCV530340505",inv:"DT-2610-0505",stax:"0105546011116",org:352,receiver:"WILAIWAN SRISUK",pos:["40130106"],codes:["E09","E03"],total:4494,upl:"WILAIWAN.S"},["reject"]);
 g({idStatus:"NOT_FOUND",inv:"SR-2610-0506",stax:"0103554001122",co:"AH",codes:["E05"],total:599.2,upl:"SOMSAK.J"});
 g({idStatus:"UNRESOLVED",missing:["invoice_num","po_number"],stax:"0105536012345",co:"AH",upl:"SOMSAK.J",total:3852});
 g({idStatus:"UNRESOLVED",missing:["invoice_num","supplier_tax_id"],ctax:null,upl:"NARONG.P",total:5778});
 SIM.log.forEach(l=>l.note=(l.note?l.note+" · ":"")+"ข้อมูลตั้งต้น");SIM.sel=SIM.recs[0].pid;SIM.preset="new_ap";simLoadPreset(true)}
/* ---------- Presets ---------- */
const PRESETS=[
 ["เอกสารใหม่ · receive_id ยังไม่เคยมีใน Portal",[
  ["new_ap","RESOLVED · AUTO_PASS → Auto-pass",()=>({rid:nextRid(),inv:nextInv("OSG"),stax:"0105549022222",org:352,receiver:"WILAIWAN SRISUK",pos:["40130201"],total:16478,upl:"WILAIWAN.S"})],
  ["new_multi","RESOLVED · 1 ใบรับ 2 PO · AUTO_PASS",()=>({rid:nextRid(),inv:nextInv("TS"),stax:"0105536012345",org:103,receiver:"SOMSAK JAIDEE",pos:["40130211","40130212"],total:38500,upl:"SOMSAK.J"})],
  ["new_rev_eu","RESOLVED · REVIEW (E10 ผู้ใช้งานแก้)",()=>({rid:nextRid(),inv:nextInv("SA"),stax:"0105539044556",org:376,receiver:"THANAKORN MANKONG",pos:["40130221"],codes:["E10"],total:12198,upl:"THANAKORN.M"})],
  ["new_rev_acc","RESOLVED · REVIEW (E11 ฝ่ายบัญชีตัดสิน)",()=>({rid:nextRid(),inv:nextInv("TS"),stax:"0105536012345",org:103,receiver:"SOMSAK JAIDEE",pos:["40130231"],codes:["E11"],total:3852,upl:"SOMSAK.J"})],
  ["new_hold","RESOLVED · HOLD (E09 + E03)",()=>({rid:nextRid(),inv:nextInv("PT"),stax:"0105548077777",org:352,receiver:"WILAIWAN SRISUK",pos:["40130241"],codes:["E09","E03"],total:13910,upl:"WILAIWAN.S"})],
  ["new_unmapped","RESOLVED · Receiver ยังไม่เชื่อมบัญชี (E10)",()=>({rid:nextRid(),inv:nextInv("PL"),stax:"0105546011116",org:103,receiver:"PRAPHAN KAEWKLA",pos:["40130251"],codes:["E10"],total:14552,upl:"PRAPHAN.K"})],
  ["new_mr_known","RESOLVED · MANUAL_REVIEW (ORG_ID ไม่ทราบ · ทราบเจ้าของ)",()=>({rid:nextRid(),inv:nextInv("MG"),stax:"0105546011116",org:556,receiver:"NARONG PHOLSRI",pos:["48000131"],rec:"MANUAL_REVIEW",total:5778,upl:"NARONG.P",ctax:null})],
  ["new_nf","NOT_FOUND · ไม่พบใบรับ (E05) → Hold ไม่มี Receiver",()=>({idStatus:"NOT_FOUND",inv:nextInv("SW"),stax:"0105537011111",co:"AHT",codes:["E05"],total:19688,upl:"WILAIWAN.S"})],
  ["new_e02","NOT_FOUND · E02 หยุดก่อนค้น Oracle → Hold ไม่มี Receiver",()=>({idStatus:"NOT_FOUND",inv:nextInv("SR"),stax:"0103554001122",co:"AH",codes:["E02"],total:599.2,upl:"SOMSAK.J"})],
  ["new_unres","UNRESOLVED · อ่าน Invoice + PO ไม่ได้ → Manual Review (ไม่ทราบเจ้าของ)",()=>({idStatus:"UNRESOLVED",missing:["invoice_num","po_number"],stax:"0105546011116",co:"AH",upl:"SOMSAK.J",total:6152.5})],
  ["new_unres_q","UNRESOLVED · Tax ID ลูกค้าอ่านไม่ได้ → บริษัท ? (APR เท่านั้น)",()=>({idStatus:"UNRESOLVED",missing:["invoice_num","supplier_tax_id"],ctax:null,upl:"NARONG.P",total:5778})],
  ["new_unres_forced","UNRESOLVED แต่ Engine ส่ง AUTO_PASS → Portal บังคับ Manual Review",()=>({idStatus:"UNRESOLVED",missing:["po_number","supplier_tax_id"],co:"AM",rec:"AUTO_PASS",upl:"THANAKORN.M",total:7704})],
  ["sys_err","SYSTEM_ERROR → ไม่สร้างรายการ (Ingest Error)",()=>({rid:nextRid(),inv:nextInv("ER"),org:103,rec:"SYSTEM_ERROR",upl:"SOMSAK.J"})]]],
 ["สแกนซ้ำ · receive_id / Invoice เดิม (ใช้ข้อมูลตั้งต้น)",[
  ["dup_better","RCV530340501 (Hold) ← ใหม่ REVIEW · ดีกว่า → DR-01",()=>({rid:"RCV530340501",inv:"DT-2610-0501",stax:"0105546011116",org:103,receiver:"SOMSAK JAIDEE",pos:["40130101"],codes:["E11"],total:9095,upl:"SOMSAK.J"})],
  ["dup_equal","RCV530340501 ← ใหม่ HOLD · เท่าเดิม/ตามสถานะปัจจุบัน → DR-01/02/03",()=>({rid:"RCV530340501",inv:"DT-2610-0501",stax:"0105546011116",org:103,receiver:"SOMSAK JAIDEE",pos:["40130101"],codes:["E08"],total:9095,upl:"SOMSAK.J"})],
  ["dup_worse","RCV530340502 (Review) ← ใหม่ HOLD · แย่กว่า → DR-03",()=>({rid:"RCV530340502",inv:"PT-2610-0502",stax:"0105548077777",org:352,receiver:"WILAIWAN SRISUK",pos:["40130102"],codes:["E14","E03"],total:8346,upl:"WILAIWAN.S"})],
  ["dup_conf","RCV530340503 (Confirmed) ← ใหม่ AUTO_PASS → DR-04",()=>({rid:"RCV530340503",inv:"SA-2610-0503",stax:"0105539044556",org:376,receiver:"THANAKORN MANKONG",pos:["40130103","40130104"],total:23754,upl:"THANAKORN.M"})],
  ["dup_posted","RCV530340504 (Posted) ← ใหม่ AUTO_PASS → DR-04",()=>({rid:"RCV530340504",inv:"TS-2610-0504",stax:"0105536012345",org:103,receiver:"SOMSAK JAIDEE",pos:["40130105"],total:20415.6,upl:"SOMSAK.J"})],
  ["dup_rej","RCV530340505 (Rejected) ← ใหม่ REVIEW → DR-05",()=>({rid:"RCV530340505",inv:"DT-2610-0505",stax:"0105546011116",org:352,receiver:"WILAIWAN SRISUK",pos:["40130106"],codes:["E01"],total:3852,upl:"WILAIWAN.S"})],
  ["dup_other","RCV530340502 ถูกใช้แล้ว แต่ Invoice ต่างกัน → DR-06",()=>({rid:"RCV530340502",inv:"PT-2610-9999",stax:"0105548077777",org:352,receiver:"WILAIWAN SRISUK",pos:["40130102"],total:8346,upl:"WILAIWAN.S"})],
  ["link_nf","แก้ใบรับใน Oracle แล้วสแกนใหม่: SR-2610-0506 (NOT_FOUND) → RESOLVED → DR-01",()=>({rid:nextRid(),inv:"SR-2610-0506",stax:"0103554001122",org:103,receiver:"SOMSAK JAIDEE",pos:["40130261"],total:599.2,upl:"SOMSAK.J"})],
  ["rescan_unres","ผู้สแกน SOMSAK.J สแกนใหม่หลัง Manual Review (ไม่ทราบเจ้าของ) → รายการใหม่ + คำเตือน",()=>({rid:nextRid(),inv:nextInv("TS"),stax:"0105536012345",org:103,receiver:"SOMSAK JAIDEE",pos:["40130271"],total:3852,upl:"SOMSAK.J"})]]],
 ["ทดสอบระบบรับข้อมูล",[
  ["resend","ส่ง message_id เดิมซ้ำ → ALREADY_PROCESSED",null],
  ["bad_schema","Payload ผิดมาตรฐาน (ขาด receive_id + ส่งฟิลด์ของ Portal) → 422",null],
  ["bad_code","รหัส E44 นอกมาตรฐาน + Tax ID ผิดรูปแบบ → 422",null]]]];
const presetOf=k=>{for(const g of PRESETS)for(const p of g[1])if(p[0]===k)return p;return null};
function simLoadPreset(quiet){const k=SIM.preset,p=presetOf(k);let pl;
 if(k==="resend"){if(!SIM.lastSent){toast("ยังไม่มี Payload ที่ส่งแล้ว · ส่งรายการใดก่อน",1);return}SIM.text=SIM.lastSent}
 else if(k==="bad_schema"){pl=mkPayload({rid:nextRid(),inv:nextInv("BD"),org:103});delete pl.identity.receive_id;pl.workflow={state:"NEW"};pl.status="Hold";SIM.text=JSON.stringify(pl,null,2)}
 else if(k==="bad_code"){pl=mkPayload({rid:nextRid(),inv:nextInv("BD"),org:103,codes:["E08"]});pl.decision.exception_codes.push("E44");pl.invoice.supplier_tax_id="010554601111";SIM.text=JSON.stringify(pl,null,2)}
 else{pl=mkPayload(p[2]());SIM.text=JSON.stringify(pl,null,2)}
 SIM.val=null;if(!quiet){toast("โหลด: "+p[1]);simRefresh()}}
/* ---------- Editor actions ---------- */
function simParse(){try{return {p:JSON.parse(SIM.text)}}catch(e){return {err:e.message}}}
function simValidate(){const r=simParse();SIM.val=r.err?{E:["JSON ไม่ถูกต้อง: "+r.err],W:[]}:validatePayload(r.p);simRefresh()}
function simSend(){const r=simParse();
 if(r.err){SIM.trace=[{t:"0. อ่าน JSON",d:"JSON ไม่ถูกต้อง: "+r.err,s:"bad"}];SIM.ack={http:400,result:"INVALID_JSON",errors:[r.err]};simLog(SIM.ack,null);toast("JSON ไม่ถูกต้อง",1);return simRefresh()}
 const out=simIngest(r.p);SIM.trace=out.T;SIM.ack=out.ack;SIM.val=null;SIM.lastSent=SIM.text;if(out.ack.portal_doc_id)SIM.sel=out.ack.portal_doc_id;
 toast(out.ack.result+(out.ack.status?" · "+out.ack.status:""),out.ack.http>=400);simRefresh()}
function simNewMsg(){const r=simParse();if(r.err)return toast("JSON ไม่ถูกต้อง",1);r.p.message_id=newMsg();r.p.sent_at=SIMD+"T"+now()+"+07:00";SIM.text=JSON.stringify(r.p,null,2);toast("ออก message_id ใหม่ "+r.p.message_id);simRefresh()}
function simRescan(pid){const x=SIM.recs.find(r=>r.pid===pid);if(!x)return;const p=JSON.parse(JSON.stringify(x.payload));p.message_id=newMsg();p.sent_at=SIMD+"T"+now()+"+07:00";
 p.document.dms_doc_id="DMS-2026-"+pad(400+(++SIM.n),6);p.document.file_sha256=fh(p.document.dms_doc_id);SIM.text=JSON.stringify(p,null,2);SIM.tab="console";SIM.val=null;
 toast("โหลด Payload ของ "+pid+" เป็นการสแกนซ้ำ · แก้ผลตรวจใน JSON แล้วกดส่ง");simRefresh();setTimeout(()=>{const e=$("simed");if(e){e.scrollIntoView({block:"center"});e.focus()}},60)}
function simFromForm(){const v=id=>($(id)||{}).value;const st=v("ff_id"),codes=(v("ff_codes")||"").toUpperCase().split(/[\s,]+/).filter(Boolean);
 const o={idStatus:st,inv:v("ff_inv")||undefined,stax:v("ff_stax"),pos:(v("ff_pos")||"").split(/[\s,]+/).filter(Boolean),rec:v("ff_rec"),codes,total:+v("ff_total")||10700,upl:v("ff_upl")||"SOMSAK.J"};
 if(st==="RESOLVED"){o.rid=(v("ff_rid")||"").toUpperCase()||nextRid();o.org=+v("ff_org");o.receiver=v("ff_rcv")||null}else{o.co=v("ff_co");if(o.co==="?")o.ctax=null}
 if(st==="UNRESOLVED")o.missing=[...document.querySelectorAll(".ff_miss:checked")].map(e=>e.value);
 if(st==="UNRESOLVED"&&!o.missing.length)return toast("เลือกคีย์ที่ OCR อ่านไม่ได้อย่างน้อย 1 ค่า",1);
 SIM.text=JSON.stringify(mkPayload(o),null,2);SIM.val=null;toast("สร้าง Payload จากฟอร์มแล้ว");simRefresh()}
function simReset(seed){if(seed)simSeed();else{SIM=freshSim();SIM.preset="new_ap";simLoadPreset(true)}toast(seed?"โหลดข้อมูลตั้งต้นแล้ว":"ล้าง Sandbox แล้ว");simRefresh()}
function simRefresh(){const s=document.querySelector("#app .pg-scroll"),top=s?s.scrollTop:0;render();const n=document.querySelector("#app .pg-scroll");if(n)n.scrollTop=top}
function simTab(t){SIM.tab=t;render()}
function simPick(pid){SIM.sel=pid;simRefresh()}
/* ---------- Scenario Matrix ---------- */
const MCOLS=[["AUTO_PASS","AUTO_PASS"],["REVIEW","REVIEW"],["HOLD","HOLD"],["MANUAL_REVIEW","MANUAL_REVIEW · ทราบใบรับ"],["MR_U","UNRESOLVED · ไม่ทราบเจ้าของ"],["SYSTEM_ERROR","SYSTEM_ERROR"]];
const MROWS=["—","Auto-pass","Review","Hold","Manual Review","Duplicate","Superseded","Rejected","Confirmed","Sent","Posted","Import Failed"];
function mExpect(old,c){if(c==="SYSTEM_ERROR")return {o:old,n:"ไม่สร้าง",r:"ERR"};if(c==="MR_U")return {o:old,n:"Manual Review",r:"DR-07*"};const ns=ES[c];
 if(old==="—")return {o:"—",n:ns,r:"DR-07"};if(CLOSED_ST.includes(old))return {o:old,n:ns,r:"DR-05"};if(AP_ST.includes(old))return {o:old,n:"Duplicate",r:"DR-04"};
 const a=RANK[ns],b=RANK[old];return a<b?{o:"Superseded",n:ns,r:"DR-01"}:a===b?{o:"Superseded",n:ns,r:"DR-02"}:{o:old,n:"Duplicate",r:"DR-03"}}
function mBase(){return {rid:"RCVTEST0001",inv:"MT-2610-0001",stax:"0105546011116",org:103,receiver:"SOMSAK JAIDEE",pos:["40130999"],upl:"SOMSAK.J"}}
function mNew(c){const b=mBase();if(c==="MR_U")return {idStatus:"UNRESOLVED",missing:["invoice_num","po_number"],co:"AH",upl:"SOMSAK.J"};if(c==="SYSTEM_ERROR")return Object.assign(b,{rec:"SYSTEM_ERROR"});
 return Object.assign(b,{rec:c,codes:c==="REVIEW"?["E11"]:c==="HOLD"?["E09"]:[]})}
function sandboxed(fn){const save=SIM;SIM=freshSim();try{return fn()}finally{SIM=save}}
function mRun(old,c){return sandboxed(()=>{let o=null;if(old!=="—"){simIngest(mkPayload(mBase()));o=SIM.recs[0];o.status=old}
 const out=simIngest(mkPayload(mNew(c)));const nr=out.ack.portal_doc_id?SIM.recs.find(r=>r.pid===out.ack.portal_doc_id):null;
 return {o:o?o.status:"—",n:nr?nr.status:"ไม่สร้าง",r:out.ack.applied_rule||(out.ack.result==="ERROR_LOGGED"?"ERR":"—")}})}
const XTESTS=[
 ["X-01","receive_id เดิม แต่ Invoice ต่างกัน","ฉบับใหม่ Duplicate · DR-06",()=>sandboxed(()=>{simIngest(mkPayload(mBase()));const o=simIngest(mkPayload(Object.assign(mBase(),{inv:"MT-2610-0002"})));return [o.ack.status+" · "+o.ack.applied_rule,o.ack.status==="Duplicate"&&o.ack.applied_rule==="DR-06"]})],
 ["X-02","NOT_FOUND แล้วสแกนใหม่เป็น RESOLVED (Tax ID + Invoice เดิม)","ฉบับเดิม Superseded · DR-01",()=>sandboxed(()=>{simIngest(mkPayload({idStatus:"NOT_FOUND",inv:"MT-2610-0003",stax:"0105546011116",co:"AH",codes:["E05"]}));const old=SIM.recs[0];const o=simIngest(mkPayload(Object.assign(mBase(),{rid:"RCVTEST0003",inv:"MT-2610-0003"})));return ["เดิม "+old.status+" · ใหม่ "+o.ack.status+" · "+o.ack.applied_rule,old.status==="Superseded"&&o.ack.applied_rule==="DR-01"]})],
 ["X-03","ส่ง message_id เดิมซ้ำ","200 ALREADY_PROCESSED · ไม่สร้างรายการเพิ่ม",()=>sandboxed(()=>{const p=mkPayload(mBase());simIngest(p);const o=simIngest(p);return [o.ack.http+" "+o.ack.result+" · รายการ "+SIM.recs.length,o.ack.result==="ALREADY_PROCESSED"&&SIM.recs.length===1]})],
 ["X-04","Payload ผิดมาตรฐาน","422 · ไม่สร้างรายการ",()=>sandboxed(()=>{const p=mkPayload(mBase());p.workflow={};const o=simIngest(p);return [o.ack.http+" "+o.ack.result,o.ack.http===422&&!SIM.recs.length]})],
 ["X-05","UNRESOLVED แต่ Engine ส่ง AUTO_PASS","บังคับ Manual Review",()=>sandboxed(()=>{const o=simIngest(mkPayload({idStatus:"UNRESOLVED",missing:["invoice_num"],co:"AH",rec:"AUTO_PASS"}));return [o.ack.status,o.ack.status==="Manual Review"]})],
 ["X-06","UNRESOLVED ที่ไม่ทราบบริษัท","เห็นเฉพาะ APR · End User/ACC ไม่เห็น",()=>sandboxed(()=>{simIngest(mkPayload({idStatus:"UNRESOLVED",missing:["invoice_num"],ctax:null}));const w=simWho(SIM.recs[0]);return ["บริษัท "+SIM.recs[0].company+" · EU "+w.eu.length+" · ACC "+w.acc.length+" · APR "+w.apr.length,!w.eu.length&&!w.acc.length&&w.apr.length===1]})],
 ["X-07","Manual Review ไม่ทราบเจ้าของ → Confirm","ถูกล็อก (ไม่มีใบรับ) · ทำได้แค่ Reject",()=>sandboxed(()=>{simIngest(mkPayload({idStatus:"UNRESOLVED",missing:["invoice_num"],co:"AH"}));const b=simBlock(SIM.recs[0],"confirm");return [b?"ล็อก":"ไม่ล็อก",!!b]})],
 ["X-08","NOT_FOUND (Hold ไม่มี Receiver)","ปุ่มที่ใช้ได้ = Reject เท่านั้น",()=>sandboxed(()=>{simIngest(mkPayload({idStatus:"NOT_FOUND",inv:"MT-2610-0008",stax:"0105546011116",co:"AH"}));const a=simActs(SIM.recs[0]);return [SIM.recs[0].status+" · "+a.join(", "),SIM.recs[0].status==="Hold"&&a.join()==="reject"]})],
 ["X-09","Receiver ยังไม่เชื่อมบัญชี","End User ไม่เห็น · ฝ่ายบัญชีเห็น",()=>sandboxed(()=>{simIngest(mkPayload(Object.assign(mBase(),{receiver:"UNBOUND TEST ACCT"})));const w=simWho(SIM.recs[0]);return ["EU "+w.eu.length+" · ACC "+w.acc.length,!w.eu.length&&w.acc.length>0]})],
 ["X-10","ฉบับเดิมถูกฝ่ายบัญชีย้าย Auto-pass → Hold แล้วสแกนใหม่ได้ REVIEW","เทียบกับสถานะปัจจุบัน (Hold) → DR-01",()=>sandboxed(()=>{simIngest(mkPayload(mBase()));const o=SIM.recs[0];simApply(o,"hold");const n=simIngest(mkPayload(Object.assign(mBase(),{codes:["E11"]})));return [n.ack.applied_rule+" · เดิม "+o.status,n.ack.applied_rule==="DR-01"&&o.status==="Superseded"]})]];
function simRunAll(){const M={};let pass=0,tot=0;MROWS.forEach(o=>MCOLS.forEach(([c])=>{const e=mExpect(o,c),a=mRun(o,c),ok=e.o===a.o&&e.n===a.n&&e.r===a.r;M[o+"|"+c]={e,a,ok};tot++;if(ok)pass++}));
 SIM.mres=M;SIM.xres=XTESTS.map(t=>{const [act,ok]=t[3]();tot++;if(ok)pass++;return {id:t[0],act,ok}});SIM.mtot=[pass,tot];toast("รันครบ "+tot+" กรณี · ผ่าน "+pass);simRefresh()}
function simMatrixLoad(old,c){if(old!=="—"){toast("กรณีนี้ต้องมีรายการเดิมสถานะ "+old+" · ใช้ปุ่มรัน Scenario หรือสร้างเองในคอนโซล",0)}
 SIM.text=JSON.stringify(mkPayload(mNew(c)),null,2);SIM.tab="console";SIM.val=null;render()}
/* ---------- UI helpers ---------- */
const tsIcon={ok:"check",warn:"alert",bad:"x",info:"info"};
const rchip=r=>r?`<span class="rchip ${/DR-0[346]/.test(r)?"d":/DR-0[12]/.test(r)?"s":/ERR/.test(r)?"e":"n"}">${r}</span>`:"";
const idTag=r=>r.idStatus==="UNRESOLVED"?`<span class="unres">${icon("alert","sm")}ไม่ทราบเจ้าของ</span>`:r.idStatus==="NOT_FOUND"?`<span class="norcv">ไม่มีใบรับ</span>`:"";
function stateMap(r){const seen=new Set(r?r.hist.map(h=>h.to):[]);
 const L=[["ผลตรวจ (Validation)",["Auto-pass","Review","Hold","Manual Review","Rejected"]],["Portal Control",["Duplicate","Superseded"]],["AP Interface",["Confirmed","Sent","Posted","Import Failed"]]];
 return `<div class="smap">${L.map(([l,ss])=>`<div class="lane"><div class="ln">${l}</div><div class="ls">${ss.map(s=>`<span class="sn ${r&&r.status===s?"cur":""} ${r&&r.prev===s&&r.status!==s?"prv":""} ${seen.has(s)?"vis":""}">${badge(s)}</span>`).join("")}</div></div>`).join("")}</div>
 <div class="legend"><span><i style="outline:2px solid var(--navy-600)"></i>สถานะปัจจุบัน</span><span><i style="outline:2px dashed var(--s-500)"></i>สถานะก่อนหน้า</span><span><i style="background:var(--s-200)"></i>เคยผ่าน</span></div>`}
/* ---------- Pages ---------- */
function simPage(){const tabs=[["console","คอนโซลจำลอง","play"],["life","เอกสารใหม่: เกิดอะไรได้บ้าง","git"],["matrix","Scenario Matrix","table"]];
 return `<div class="pg"><div class="sim-banner"><span class="sb-tag">SANDBOX</span>${icon("flask","sm")}<span><b>Document Simulation</b> · จำลอง Engine ส่งผลตรวจ (${PSTD.contract}) เข้า Portal · ข้อมูลในหน้านี้แยกจากคิวจริง ไม่กระทบเอกสาร Audit หรือ AP</span><span class="grow"></span>
  <button class="btn btn-sec sm" onclick="simReset(1)">${icon("refresh","sm")}โหลดข้อมูลตั้งต้น</button><button class="btn btn-sec sm" onclick="simReset(0)">${icon("x","sm")}ล้าง Sandbox</button><button class="btn btn-sec sm" onclick="go('std')">${icon("code","sm")}มาตรฐาน Payload</button></div>
 <div class="tbar"><div class="seg" role="tablist">${tabs.map(([k,l,ic])=>`<button class="${SIM.tab===k?"on":""}" role="tab" aria-selected="${SIM.tab===k}" onclick="simTab('${k}')">${icon(ic,"sm")}${l}</button>`).join("")}</div>
  <span class="scope-note">${icon("info","sm")}คีย์รายการ = <b>receive_id</b> (Receipt Number) · Receiver = เจ้าของ ไม่ใช่ key · เทียบซ้ำด้วย<b>สถานะปัจจุบัน</b>ของฉบับเดิม</span></div>
 <div class="pg-scroll">${SIM.tab==="console"?simConsole():SIM.tab==="life"?simLife():simMatrix()}</div></div>`}
function simConsole(){const opts=PRESETS.map(([g,ps])=>`<optgroup label="${g}">${ps.map(p=>`<option value="${p[0]}" ${SIM.preset===p[0]?"selected":""}>${p[1]}</option>`).join("")}</optgroup>`).join("");
 const sup=Object.entries(SUPS).map(([k,v])=>`<option value="${k}">${k} · ${v}</option>`).join("");
 const orgs=Object.keys(ORG).map(o=>`<option value="${o}" ${o==="103"?"selected":""}>${o} ${ORG[o]} → ${companyOfOrg(+o)}</option>`).join("");
 const rcvs=["SOMSAK JAIDEE","WILAIWAN SRISUK","THANAKORN MANKONG","PRAPHAN KAEWKLA","NARONG PHOLSRI"].map(n=>`<option>${n}</option>`).join("")+`<option value="">— ไม่มี RECEIVER</option>`;
 const v=SIM.val;
 const left=`<div class="panel"><div class="panel-h"><h3>${icon("code","sm")} Engine Payload Simulator</h3><span class="muted sm">${PSTD.endpoint}</span></div><div class="panel-b">
  <div class="btnrow"><select class="sel" style="flex:1;min-width:220px" aria-label="Scenario" onchange="SIM.preset=this.value">${opts}</select><button class="btn btn-sec sm" onclick="simLoadPreset()">${icon("dl","sm")}โหลด Scenario</button></div>
  <details style="margin-top:10px"><summary class="b sm" style="cursor:pointer">สร้าง Payload จากฟอร์ม</summary><div class="fgrid" style="margin-top:8px">
   <div><label for="ff_id">identity.status</label><select id="ff_id" class="sel"><option>RESOLVED</option><option>NOT_FOUND</option><option>UNRESOLVED</option></select></div>
   <div><label for="ff_rid">receive_id (ว่าง = สร้างใหม่)</label><input id="ff_rid" class="inp" placeholder="RCV530340xxx"></div>
   <div><label for="ff_inv">invoice_num</label><input id="ff_inv" class="inp" placeholder="ว่าง = สุ่ม"></div>
   <div><label for="ff_stax">supplier_tax_id</label><select id="ff_stax" class="sel">${sup}</select></div>
   <div><label for="ff_org">ORG_ID ใบรับ (RESOLVED)</label><select id="ff_org" class="sel">${orgs}</select></div>
   <div><label for="ff_rcv">RECEIVER (RESOLVED)</label><select id="ff_rcv" class="sel">${rcvs}</select></div>
   <div><label for="ff_co">บริษัทจาก Tax ID ลูกค้า (ไม่มีใบรับ)</label><select id="ff_co" class="sel">${["AH","AHT","AHP","AM"].map(c=>`<option>${c}</option>`).join("")}<option value="?">อ่านไม่ได้ (?)</option></select></div>
   <div><label for="ff_pos">PO (คั่นด้วย ,)</label><input id="ff_pos" class="inp" value="40130301,40130302"></div>
   <div><label for="ff_rec">recommendation</label><select id="ff_rec" class="sel"><option value="auto">อัตโนมัติจากรหัส</option>${REC_ENUM.map(r=>`<option>${r}</option>`).join("")}</select></div>
   <div><label for="ff_codes">exception codes</label><input id="ff_codes" class="inp" placeholder="E08, E03"></div>
   <div><label for="ff_total">grand_total</label><input id="ff_total" class="inp" type="number" value="10700"></div>
   <div><label for="ff_upl">uploaded_by</label><input id="ff_upl" class="inp" value="SOMSAK.J"></div>
   <div style="grid-column:1/-1"><label>คีย์ที่ OCR อ่านไม่ได้ (UNRESOLVED)</label>${["invoice_num","po_number","supplier_tax_id"].map(k=>`<label style="display:inline-flex;gap:4px;margin-right:12px;font-weight:400;color:var(--s-700)"><input type="checkbox" class="ff_miss" value="${k}" ${k!=="supplier_tax_id"?"checked":""}>${k}</label>`).join("")}</div>
  </div><div class="btnrow" style="margin-top:8px"><button class="btn btn-sec sm" onclick="simFromForm()">${icon("code","sm")}สร้าง JSON จากฟอร์ม</button></div></details>
  <label for="simed" class="b sm" style="display:block;margin:10px 0 4px">Mock Payload (แก้ไขได้)</label>
  <textarea id="simed" class="json-ed" spellcheck="false" oninput="SIM.text=this.value">${esc(SIM.text)}</textarea>
  <div class="btnrow" style="margin-top:8px"><button class="btn btn-sec sm" onclick="simValidate()">${icon("shield","sm")}ตรวจ Schema</button><button class="btn btn-sec sm" onclick="simNewMsg()">${icon("refresh","sm")}message_id ใหม่</button><button class="btn btn-sec sm" onclick="copyTxt(SIM.text,'คัดลอก Payload แล้ว')">${icon("copy","sm")}คัดลอก</button><span class="grow"></span><button class="btn btn-primary" onclick="simSend()">${icon("send","sm")}Send / Process</button></div>
  ${v?`<div class="note ${v.E.length?"d":v.W.length?"w":"ok"}">${icon(v.E.length?"x":v.W.length?"alert":"checkc")}<div><b>${v.E.length?"ไม่ผ่าน "+v.E.length+" ข้อ":"ผ่านมาตรฐาน"}${v.W.length?" · คำเตือน "+v.W.length+" ข้อ":""}</b><ul class="vres">${[...v.E,...v.W].map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div></div>`:""}
 </div></div>`;
 const a=SIM.ack;const hc=!a?"":a.http>=400?"e":(a.http===200||a.http===202)?"w":"";
 const right=`<div class="panel"><div class="panel-h"><h3>${icon("target","sm")} ผลการประมวลผลฝั่ง Portal</h3><span class="muted sm">Decision trace</span></div><div class="panel-b">
  ${a?`<div class="ackbox"><span class="http ${hc}">${a.http}</span><b>${a.result}</b>${a.status?badge(a.status):""}${rchip(a.applied_rule)}${a.portal_doc_id?`<button class="link" onclick="simPick('${a.portal_doc_id}')">${a.portal_doc_id}</button>`:""}</div>
  <div class="trace">${SIM.trace.map(s=>`<div class="ts ${s.s}"><span class="d">${icon(tsIcon[s.s]||"info")}</span><div><b>${esc(s.t)}</b><div class="x">${esc(s.d)}</div></div></div>`).join("")}</div>
  ${(a.warnings||[]).length?`<div class="note w">${icon("alert")}<div><b>ข้อสังเกต</b><ul class="vres">${a.warnings.map(w=>`<li>${esc(w)}</li>`).join("")}</ul></div></div>`:""}
  <details style="margin-top:10px"><summary class="b sm" style="cursor:pointer">Response (ACK) ที่ Portal ตอบ Engine</summary><pre class="json" style="margin-top:6px">${esc(JSON.stringify(Object.assign({},a,{trace:undefined}),null,2))}</pre></details>`
  :`<div class="empty">${icon("send")}เลือก Scenario หรือแก้ JSON แล้วกด <b>Send / Process</b></div>`}</div></div>`;
 return `<div class="sim-grid">${left}<div>${right}${simDetail()}</div></div>${simLedger()}${simIngestLog()}`}
function simDetail(){const r=SIM.recs.find(x=>x.pid===SIM.sel);if(!r)return "";const w=simWho(r),acts=simActs(r);
 const kv=(l,v)=>`<div class="kv"><span>${l}</span><b>${v}</b></div>`;
 return `<div class="panel"><div class="panel-h"><h3>${r.pid}</h3>${badge(r.status)}${idTag(r)}<span class="grow"></span><button class="btn btn-sec sm" onclick="simRescan('${r.pid}')">${icon("refresh","sm")}จำลองสแกนซ้ำ</button></div><div class="panel-b">
  ${r.idStatus==="UNRESOLVED"&&isActive(r)?`<div class="mr-banner">${icon("alert")}<div><b>Manual Review · ไม่ทราบเจ้าของ</b><br>OCR อ่าน ${r.missing.join(", ")} ไม่ได้ จึงค้น Oracle ไม่ได้ ไม่มี receive_id และ Receiver · ${r.company==="?"?"ไม่ทราบบริษัท เห็นเฉพาะหัวหน้าฝ่ายบัญชี":"บริษัท "+r.company+" จาก Tax ID ลูกค้า"} · APR ทำได้แค่ Reject แล้วติดต่อผู้สแกน <b>${r.upl}</b> ให้อัปโหลดใหม่</div></div>`:""}
  <div class="grid2"><div class="card"><h4>ข้อมูลรายการ</h4>${kv("receive_id",r.rid?`<span class="mono">${r.rid}</span>`:'<span class="pre-x">— ไม่มี</span>')}${kv("Invoice / ผู้ขาย",(r.inv||"—")+" · "+(r.stax||"—"))}${kv("PO บน Invoice",r.pos.join(", ")||"—")}${kv("PO ที่รับในใบรับ",r.poRecv.join(", ")||"—")}
   ${kv("บริษัท",r.company+(r.org?" (ORG_ID "+r.org+")":" (จาก Tax ID ลูกค้า)"))}${kv("Receiver",r.receiver?r.receiver+(r.receiverActive?"":' <span class="pre-x xs">ยังไม่เชื่อมบัญชี</span>'):'<span class="pre-x">ไม่มี</span>')}${kv("ผู้สแกน",r.upl)}
   ${kv("ผล Engine",r.rec+(r.codes.length?" · "+r.codes.join(", "):""))}${kv("สถานะก่อนหน้า",r.prev?badge(r.prev):"—")}${kv("กติกาที่ใช้",rchip(r.rule))}
   ${r.supersedes?kv("แทนที่",`<button class="link" onclick="simPick('${r.supersedes}')">${r.supersedes}</button>`):""}${r.supBy?kv("ถูกแทนที่โดย",`<button class="link" onclick="simPick('${r.supBy}')">${r.supBy}</button>`):""}${r.dupOf?kv("ซ้ำกับ",`<button class="link" onclick="simPick('${r.dupOf}')">${r.dupOf}</button>`):""}</div>
  <div class="card"><h4>ใครเห็น / ใครดำเนินการ</h4>
   <div class="sm muted">End User</div><div>${w.eu.map(u=>`<span class="whochip">${icon("user","sm")}${u.n}</span>`).join("")||'<span class="pre-x sm">ไม่มี</span>'}</div>
   <div class="sm muted" style="margin-top:6px">เจ้าหน้าที่บัญชี</div><div>${w.acc.map(u=>`<span class="whochip">${u.n}</span>`).join("")||'<span class="pre-x sm">ไม่มี</span>'}</div>
   <div class="sm muted" style="margin-top:6px">หัวหน้าฝ่ายบัญชี</div><div>${w.apr.map(u=>`<span class="whochip">${u.n}</span>`).join("")||"—"}</div>
   <div class="note i" style="margin-top:8px">${icon("user")}<div>${simActor(r)}</div></div></div></div>
  <div class="sec-h" style="margin-top:12px"><h3>ผังสถานะ</h3></div>${stateMap(r)}
  <div class="sec-h" style="margin-top:12px"><h3>จำลองการดำเนินการ (Transition Matrix 05A)</h3><p>ใช้เตรียมสถานะเดิมก่อนทดสอบสแกนซ้ำ</p></div>
  <div class="btnrow">${acts.length?acts.map(a=>{const b=simBlock(r,a);return `<button class="btn ${SACT[a][2]} sm" ${b?`disabled title="${esc(b)}"`:""} onclick="simDo('${r.pid}','${a}')">${SACT[a][0]} → ${SACT[a][1]}</button>`}).join(""):`<span class="muted sm">${icon("lock","sm")} สถานะ ${r.status} ไม่มี action</span>`}</div>
  <div class="sec-h" style="margin-top:12px"><h3>ประวัติ (Audit)</h3></div>
  <div class="tl">${r.hist.slice().reverse().map(h=>`<div class="tle ${h.to==="Superseded"||h.to==="Duplicate"||h.to==="Rejected"?"c":h.to==="Confirmed"||h.to==="Posted"?"g":"h"}"><div class="t">${h.t} · ${esc(h.by)}</div><div class="a">${h.from==="—"?"สร้างรายการ":h.from} → ${h.to}</div><div class="d">${esc(h.note)}</div></div>`).join("")}</div>
 </div></div>`}
function simLedger(){const F=[["all","ทั้งหมด",()=>true],["active","ยังเปิดอยู่",isActive],["mr","Manual Review",r=>r.status==="Manual Review"],["unres","ไม่ทราบเจ้าของ",r=>r.idStatus==="UNRESOLVED"],["dup","Duplicate / Superseded",r=>["Duplicate","Superseded"].includes(r.status)],["ap","AP Interface",r=>AP_ST.includes(r.status)]];
 const f=F.find(x=>x[0]===SIM.f)||F[0],L=SIM.recs.filter(f[2]);
 const ver=r=>{if(!r.rid&&!(r.stax&&r.inv))return "—";const g=SIM.recs.filter(x=>(r.rid&&x.rid===r.rid)||(r.stax&&r.inv&&x.stax===r.stax&&x.inv===r.inv)).reverse();return (g.indexOf(r)+1)+"/"+g.length};
 return `<div class="panel" style="margin-top:12px"><div class="panel-h"><h3>รายการใน Portal (Sandbox)</h3><span class="muted sm">${L.length} / ${SIM.recs.length} รายการ</span><span class="grow"></span>${F.map(([k,l,fn])=>`<button class="chip ${SIM.f===k?"on":""}" onclick="SIM.f='${k}';simRefresh()">${l} <span class="n">${SIM.recs.filter(fn).length}</span></button>`).join("")}</div>
 <div class="tbl-wrap"><table class="t"><thead><tr><th>Portal ID</th><th>receive_id</th><th>Invoice</th><th>ผู้ขาย</th><th>Receiver</th><th>บริษัท</th><th>PO</th><th>สถานะปัจจุบัน</th><th>ก่อนหน้า</th><th>กติกา</th><th>รุ่น</th><th class="num">ยอด</th><th>เวลา</th></tr></thead><tbody>
 ${L.map(r=>`<tr class="click ${r.pid===SIM.sel?"sel":""} ${r.idStatus==="UNRESOLVED"?"mr":r.idStatus==="NOT_FOUND"?"nf":""}" onclick="simPick('${r.pid}')"><td class="mono"><b>${r.pid}</b></td><td class="mono">${r.rid||idTag(r)}</td><td>${r.inv||'<span class="nac">อ่านไม่ได้</span>'}</td><td class="sm">${r.sname||'<span class="nac">—</span>'}</td>
  <td>${r.receiver?r.receiver+(r.receiverActive?"":' <span class="pre-x xs">(ยังไม่เชื่อม)</span>'):'<span class="pre-x">ไม่มี</span>'}</td><td><span class="co" style="margin:0">${r.company}</span></td><td class="mono sm">${(r.poRecv.length?r.poRecv:r.pos).join(", ")||"—"}</td>
  <td>${badge(r.status)}</td><td>${r.prev?badge(r.prev):'<span class="nac">—</span>'}</td><td>${rchip(r.rule)}</td><td class="mono">${ver(r)}</td><td class="num">${B(r.total)}</td><td class="mono">${r.created}</td></tr>`).join("")||`<tr><td colspan="13"><div class="empty">${icon("inbox")}ยังไม่มีรายการ · ส่ง Payload หรือโหลดข้อมูลตั้งต้น</div></td></tr>`}
 </tbody></table></div></div>`}
function simIngestLog(){return `<div class="panel"><div class="panel-h"><h3>Ingest log (การรับข้อมูลจาก Engine)</h3><span class="muted sm">${SIM.log.length} ครั้ง</span></div><div class="tbl-wrap" style="max-height:260px"><table class="t"><thead><tr><th>เวลา</th><th>message_id</th><th>HTTP</th><th>ผล</th><th>Portal ID</th><th>กติกา</th><th>หมายเหตุ</th></tr></thead><tbody>
 ${SIM.log.map(l=>`<tr class="${l.http>=400?"row-bad":""}"><td class="mono">${l.t}</td><td class="mono sm">${l.mid}</td><td><span class="http ${l.http>=400?"e":l.http===201?"":"w"}">${l.http}</span></td><td class="b">${l.result}</td><td class="mono">${l.pid}</td><td>${l.rule==="—"?"—":rchip(l.rule)}</td><td class="sm">${esc(l.note||"")}</td></tr>`).join("")}</tbody></table></div></div>`}
function simLife(){const P=[
  ["P1","RESOLVED + AUTO_PASS","Auto-pass","fbox ok","End User (Receiver) · ACC/APR ของบริษัทจาก ORG_ID","ACC/APR: Confirm / Review / Hold / Reject","Confirmed → Sent → Posted · หรือ Import Failed → Review","new_ap"],
  ["P2","RESOLVED + REVIEW (รหัส End User เช่น E01 E10 E15)","Review","fbox warn","เหมือน P1 · คิว “รอฉันแก้ไข” ของ End User","End User แก้แล้วอัปโหลดใหม่ · Confirm ล็อกจนกว่ารหัสหมด","ฉบับใหม่ดีกว่า/เท่าเดิม → ฉบับนี้ Superseded (DR-01/02)","new_rev_eu"],
  ["P3","RESOLVED + REVIEW (รหัสฝ่ายบัญชี เช่น E11 E12)","Review","fbox warn","เหมือน P1","ACC/APR: Confirm (เหตุผล) / Hold / Reject","Confirmed → AP","new_rev_acc"],
  ["P4","RESOLVED + HOLD (รหัส High)","Hold","fbox err","เหมือน P1","ACC/APR: Confirm (หมายเหตุ) / Review / Reject","Confirmed → AP · Rejected","new_hold"],
  ["P5","RESOLVED + MANUAL_REVIEW (ORG_ID ไม่ทราบ / SQL 50 แถว)","Manual Review","fbox vio","ทราบเจ้าของ · บริษัท ? → APR","APR: Confirm (พบใบรับ ไม่มี High) / Reject","Confirmed → AP · Rejected","new_mr_known"],
  ["P6","NOT_FOUND (E05 ไม่พบใบรับ / E02 หยุดก่อนค้น)","Hold · ไม่มี Receiver","fbox org","ACC/APR ของบริษัทจาก Tax ID ลูกค้า · End User ไม่เห็น","Reject เท่านั้น · ติดต่อผู้สแกนนอกระบบ","แก้ใบรับใน Oracle แล้วสแกนใหม่ → RESOLVED ดีกว่า → Superseded (DR-01)","new_nf"],
  ["P7","UNRESOLVED (อ่าน Invoice + PO/Tax ID ผู้ขาย ไม่ได้)","Manual Review · ไม่ทราบเจ้าของ","fbox vio","APR (บริษัทจาก Tax ID ลูกค้า หรือ ?) · End User ไม่เห็น","APR: Reject เท่านั้น (Confirm ล็อก)","สแกนใหม่ = รายการใหม่ (ตรวจซ้ำอัตโนมัติไม่ได้) + คำเตือนผู้สแกนเดียวกัน","new_unres"],
  ["P8","SYSTEM_ERROR","ไม่สร้างรายการ","fbox err","—","—","Engine ส่งใหม่ด้วย message_id ใหม่","sys_err"],
  ["P9","Payload ผิดมาตรฐาน","ไม่สร้างรายการ (422)","fbox err","—","—","Engine แก้แล้วส่งใหม่","bad_schema"]];
 const box=(c,b,d)=>`<div class="fbox ${c}"><b>${b}</b>${d||""}</div>`,arr=`<span class="farr">${icon("arrow","lg")}</span>`;
 return `<div class="panel"><div class="panel-h"><h3>เส้นทางของเอกสารที่ receive_id ยังไม่เคยมีใน Portal</h3></div><div class="panel-b"><div class="flow">
  <div class="fcol"><h5>1 รับข้อมูล</h5>${box("nav","Engine ส่ง Payload",PSTD.contract)}${box("err","Schema ไม่ผ่าน","422 · ไม่สร้าง")}${box("warn","message_id เคยรับ","200 · ตอบผลเดิม")}</div>${arr}
  <div class="fcol"><h5>2 ระบุตัวตน</h5>${box("ok","RESOLVED","มี receive_id + Receiver")}${box("org","NOT_FOUND","คีย์ครบ แต่ไม่มีใบรับ")}${box("vio","UNRESOLVED","OCR อ่านคีย์ไม่ได้")}${box("err","SYSTEM_ERROR","log อย่างเดียว")}</div>${arr}
  <div class="fcol"><h5>3 ตรวจซ้ำ</h5>${box("ok","receive_id","คีย์หลัก")}${box("org","Tax ID ผู้ขาย + Invoice","คีย์สำรอง")}${box("vio","ไม่มีคีย์","DR-07* สร้างใหม่")}${box("nav","ไม่พบคู่เทียบ","DR-07 รายการใหม่")}</div>${arr}
  <div class="fcol"><h5>4 สถานะเริ่มต้น</h5>${["Auto-pass","Review","Hold","Manual Review"].map(s=>`<div>${badge(s)}</div>`).join("")}</div>${arr}
  <div class="fcol"><h5>5 ฝ่ายบัญชี</h5>${box("ok","Confirm","→ Confirmed")}${box("warn","Review / Hold","เหตุผลบังคับ")}${box("err","Reject","ปิด")}${box("nav","End User","อัปโหลดเอกสารใหม่เท่านั้น")}</div>${arr}
  <div class="fcol"><h5>6 AP Interface</h5>${["Confirmed","Sent","Posted","Import Failed"].map(s=>`<div>${badge(s)}</div>`).join("")}<div class="xs muted">Import Failed → Return → Review</div></div></div></div></div>
 <div class="panel"><div class="panel-h"><h3>Path catalog · ทุกเส้นทางของเอกสารใหม่</h3><span class="muted sm">กด “จำลอง” เพื่อส่ง Payload ของเส้นทางนั้นเข้า Sandbox ทันที</span></div><div class="tbl-wrap"><table class="t"><thead><tr><th>#</th><th>เงื่อนไขจาก Engine</th><th>สถานะเริ่มต้น</th><th>ใครเห็น</th><th>ใครดำเนินการ / ทำอะไรได้</th><th>เส้นทางต่อ</th><th></th></tr></thead><tbody>
 ${P.map(p=>`<tr class="${p[0]==="P7"?"mr":""}"><td class="mono b">${p[0]}</td><td>${p[1]}</td><td>${/ไม่สร้าง/.test(p[2])?`<span class="pre-x">${p[2]}</span>`:p[2].split(" · ").map((s,i)=>i?(/ไม่ทราบ/.test(s)?`<span class="unres">${s}</span>`:`<span class="norcv">${s}</span>`):badge(s)).join(" ")}</td><td class="sm">${p[4]}</td><td class="sm">${p[5]}</td><td class="sm">${p[6]}</td>
  <td><button class="btn btn-sec sm" onclick="SIM.preset='${p[7]}';SIM.tab='console';simLoadPreset(true);simSend()">${icon("play","sm")}จำลอง</button></td></tr>`).join("")}</tbody></table></div></div>
 <div class="panel"><div class="panel-b">${stateMap(null)}<div class="note i">${icon("info")}<div><b>กติกาทั่วไป</b> · ไม่มีการตรวจซ้ำ (Rerun) และไม่แจ้งกลับ End User · ผลใหม่ได้จากการสแกน/อัปโหลดเอกสารใหม่เท่านั้น · Superseded / Rejected / Posted เป็นสถานะปิด · Duplicate เปิดให้ฝ่ายบัญชีตัดสิน</div></div></div></div>`}
function simMatrix(){const M=SIM.mres;
 const cell=(o,c)=>{const e=mExpect(o,c),m=M&&M[o+"|"+c],a=m?m.a:e;
  return `<td class="cell ${m?(m.ok?"ok":"bad"):""}" onclick="simMatrixLoad('${o}','${c}')" title="คลิกเพื่อโหลด Payload ฉบับใหม่ของกรณีนี้">เดิม → ${a.o==="—"?"—":badge(a.o)}<br>ใหม่ → ${a.n==="ไม่สร้าง"?'<span class="nac">ไม่สร้าง</span>':badge(a.n)} ${rchip(a.r)}${m&&!m.ok?`<div class="xs pre-x">คาด: ${e.o} / ${e.n} / ${e.r}</div>`:""}</td>`};
 return `<div class="panel"><div class="panel-h"><h3>Scenario Matrix · สถานะปัจจุบันของฉบับเดิม × ผลตรวจฉบับใหม่ (receive_id เดียวกัน)</h3><span class="grow"></span>${SIM.mtot?`<span class="pill" style="${SIM.mtot[0]===SIM.mtot[1]?"background:var(--ok-bg);color:var(--ok)":"background:var(--err-bg);color:var(--err)"}">ผ่าน ${SIM.mtot[0]} / ${SIM.mtot[1]}</span>`:""}<button class="btn btn-primary sm" onclick="simRunAll()">${icon("play","sm")}รันทุก Scenario</button></div>
 <div class="tbl-wrap"><table class="t mx"><thead><tr><th class="rowh">ฉบับเดิม (สถานะปัจจุบัน)</th>${MCOLS.map(c=>`<th>${c[1]}</th>`).join("")}</tr></thead><tbody>
 ${MROWS.map(o=>`<tr><th class="rowh">${o==="—"?"ไม่มีรายการเดิม":badge(o)}</th>${MCOLS.map(([c])=>cell(o,c)).join("")}</tr>`).join("")}</tbody></table></div>
 <div class="panel-b"><div class="legend"><span>${rchip("DR-07")} ใหม่</span><span>${rchip("DR-01")} ฉบับเดิม Superseded</span><span>${rchip("DR-03")} ฉบับใหม่ Duplicate</span><span>${rchip("ERR")} ไม่สร้างรายการ</span><span>ลำดับ Auto-pass &gt; Review &gt; Hold &gt; Manual Review · สถานะเดียวกัน = เท่าเดิม</span></div></div></div>
 <div class="panel"><div class="panel-h"><h3>กรณีพิเศษ</h3></div><div class="tbl-wrap"><table class="t"><thead><tr><th>ID</th><th>สถานการณ์</th><th>ผลที่คาด</th><th>ผลจริง</th><th></th></tr></thead><tbody>
 ${XTESTS.map((t,i)=>{const x=SIM.xres&&SIM.xres[i];return `<tr class="${x&&!x.ok?"row-bad":""}"><td class="mono b">${t[0]}</td><td>${t[1]}</td><td class="sm">${t[2]}</td><td class="sm">${x?esc(x.act):'<span class="nac">ยังไม่รัน</span>'}</td><td class="${x?(x.ok?"okc":"badc"):""}">${x?(x.ok?"✓":"✕"):""}</td></tr>`}).join("")}</tbody></table></div></div>`}
/* ---------- มาตรฐาน Payload ---------- */
let STDX="resolved";
function stdExamples(){return sandboxed(()=>({
 resolved:mkPayload({rid:"RCV530340610",inv:"TS-2610-0610",stax:"0105536012345",org:103,receiver:"SOMSAK JAIDEE",pos:["40130611","40130612"],codes:["E11"],total:38500,msg:"msg-20261007-0001",dms:"DMS-2026-000610",upl:"SOMSAK.J"}),
 not_found:mkPayload({idStatus:"NOT_FOUND",inv:"SW-2610-0611",stax:"0105537011111",co:"AHT",codes:["E05"],total:19688,msg:"msg-20261007-0002",dms:"DMS-2026-000611",upl:"WILAIWAN.S"}),
 unresolved:mkPayload({idStatus:"UNRESOLVED",missing:["invoice_num","po_number"],stax:"0105546011116",co:"AH",total:6152.5,msg:"msg-20261007-0003",dms:"DMS-2026-000612",upl:"SOMSAK.J"}),
 system_error:mkPayload({rid:"RCV530340613",inv:"ER-2610-0613",org:103,rec:"SYSTEM_ERROR",msg:"msg-20261007-0004",dms:"DMS-2026-000613"}),
 ack:{http:201,result:"CREATED_SUPERSEDES",message_id:"msg-20261007-0001",portal_doc_id:"PD-000123",receive_id:"RCV530340610",status:"Review",applied_rule:"DR-01",related_doc_id:"PD-000098",warnings:[]}}))}
function specToSchema(){const root={$schema:"https://json-schema.org/draft/2020-12/schema",$id:PSTD.contract,title:"AIVA Engine → Portal ingest payload",type:"object",properties:{},required:[],
  not:{anyOf:FORBID.map(k=>({required:[k]}))},
  allOf:[{if:{properties:{identity:{properties:{status:{const:"RESOLVED"}}}}},then:{required:["receipt"],properties:{identity:{required:["receive_id"],properties:{receive_id:{type:"string",pattern:"^[A-Z0-9-]{4,30}$"}}},receipt:{type:"object",required:["receive_id","org_id","receiver","po_received","receipt_total"]}}},
   else:{properties:{identity:{properties:{receive_id:{type:"null"}}},receipt:{type:"null"}}}}]};
 const tmap=t=>{const nl=t.includes("|null"),b=t.replace("|null",""),base=b==="integer"?{type:"integer"}:b==="number"?{type:"number"}:b==="datetime"?{type:"string",format:"date-time"}:b==="enum"||b==="string"?{type:"string"}:b==="string[]"?{type:"array",items:{type:"string"}}:b==="object[]"?{type:"array",items:{type:"object"}}:{type:"object"};
  if(nl)base.type=[base.type,"null"];return base};
 SPEC.forEach(([path,type,req,desc,rule])=>{const ks=path.split(".");let node=root;
  ks.forEach((k,i)=>{node.properties=node.properties||{};node.required=node.required||[];
   if(i===ks.length-1){const s=Object.assign(node.properties[k]||{},tmap(type),{description:desc});if(type==="enum")s.enum=rule.split("|").map(x=>x.trim());if(path==="contract")s.const=PSTD.contract;node.properties[k]=s;if(req==="Y")node.required.push(k)}
   else{node.properties[k]=node.properties[k]||{type:"object",properties:{},required:[]};if(!node.required.includes(k)&&ks[0]!=="receipt")node.required.push(k);node=node.properties[k]}})});
 root.properties.receipt.type=["object","null"];return root}
function stdDownload(){const b=new Blob([JSON.stringify(specToSchema(),null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="aiva.portal.ingest-1.0.schema.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast("ดาวน์โหลด JSON Schema แล้ว")}
function stdPage(){const X=stdExamples();const ex=X[STDX];
 const grp=k=>k.split(".")[0];let last="";
 const rows=SPEC.map(([p,t,r,d,rule])=>{const g=grp(p);const h=g!==last&&SPEC.filter(x=>grp(x[0])===g).length>1?`<tr class="grp-row"><td colspan="5">${g}</td></tr>`:"";last=g;
  return h+`<tr><td class="mono">${p}</td><td class="mono sm">${t}</td><td class="${r==="Y"?"reqY":r==="R"?"reqR":"reqN"}">${r==="Y"?"บังคับ":r==="R"?"บังคับเมื่อ RESOLVED":"ไม่บังคับ"}</td><td>${d}</td><td class="sm mono">${esc(rule)}</td></tr>`}).join("");
 const sec=(id,t,b,extra)=>`<div class="panel" id="${id}"><div class="panel-h"><h3>${t}</h3>${extra||""}</div>${b}</div>`;
 return `<div class="pg"><div class="tbar"><span class="lab">มาตรฐาน Payload</span><span class="pill">${icon("code","sm")}${PSTD.contract}</span><span class="scope-note">Engine → Web Portal · Draft สำหรับพัฒนา · อ้างอิง SRS v1.1 ชีต 05A/05B และ result 3.0</span><span class="grow"></span>
  <button class="btn btn-sec sm" onclick="stdDownload()">${icon("dl","sm")}JSON Schema</button><button class="btn btn-teal sm" onclick="go('sim')">${icon("flask","sm")}เปิด Simulator</button></div>
 <div class="pg-scroll"><div class="std-toc" style="margin-bottom:12px">${[["s1","1 การเชื่อมต่อ"],["s2","2 คีย์และการระบุตัวตน"],["s3","3 พจนานุกรมฟิลด์"],["s4","4 ฟิลด์ของ Portal"],["s5","5 กติกาตรวจซ้ำ"],["s6","6 Response"],["s7","7 ตัวอย่าง"],["s8","8 Mapping จาก result 3.0"]].map(([a,l])=>`<a href="#${a}" onclick="event.preventDefault();document.getElementById('${a}').scrollIntoView({block:'start'})">${l}</a>`).join("")}</div>
 ${sec("s1","1. การเชื่อมต่อ",`<div class="panel-b"><div class="grid2"><div class="card"><h4>Endpoint</h4><div class="kv"><span>Method / Path</span><b class="mono">${PSTD.endpoint}</b></div><div class="kv"><span>Content-Type</span><b class="mono">application/json; charset=utf-8</b></div><div class="kv"><span>Authorization</span><b class="mono">Bearer &lt;service token ของ Engine&gt;</b></div><div class="kv"><span>Idempotency-Key</span><b class="mono">= message_id</b></div><div class="kv"><span>ขนาดสูงสุด</span><b>2 MB (ไม่ส่ง OCR elements / bbox)</b></div></div>
  <div class="card"><h4>แบ่งหน้าที่</h4><div class="kv"><span>Engine</span><b>อ่าน · ระบุตัวตน · ตรวจกฎ · เสนอผล</b></div><div class="kv"><span>Portal</span><b>ตรวจซ้ำ · สถานะ · สิทธิ์ · Workflow · AP · Audit</b></div><div class="kv"><span>Evidence / bbox</span><b>Portal ดึงจาก result 3.0 ด้วย validation_id</b></div><div class="kv"><span>URL DMS</span><b>ไม่ส่ง · Portal ออกเองหลังตรวจสิทธิ์</b></div></div></div></div>`)}
 ${sec("s2","2. คีย์และการระบุตัวตน (identity)",`<div class="tbl-wrap"><table class="t"><thead><tr><th>identity.status</th><th>เกิดเมื่อ</th><th>receive_id</th><th>คีย์ตรวจซ้ำ</th><th>สถานะเริ่มต้น</th><th>ใครเห็น / ใครทำ</th></tr></thead><tbody>
  <tr><td><b>RESOLVED</b></td><td>พบใบรับใน Oracle</td><td class="mono">RCV… (บังคับ)</td><td><b>receive_id</b></td><td>ตามผล Engine</td><td>End User (Receiver) + ACC/APR ของบริษัทจาก ORG_ID</td></tr>
  <tr class="nf"><td><b>NOT_FOUND</b></td><td>OCR อ่านคีย์ครบ แต่ไม่พบใบรับ (E05) หรือหยุดก่อนค้น (E02)</td><td class="mono">null</td><td>Tax ID ผู้ขาย + Invoice</td><td>${badge("Hold")} <span class="norcv">ไม่มีใบรับ</span></td><td>ACC/APR ของบริษัทจาก Tax ID ลูกค้า · Reject เท่านั้น</td></tr>
  <tr class="mr"><td><b>UNRESOLVED</b></td><td>OCR อ่าน <b>invoice_num</b> ไม่ได้ หรืออ่านทั้ง <b>po_number</b> และ <b>supplier_tax_id</b> ไม่ได้ → ค้น Oracle ไม่ได้</td><td class="mono">null</td><td>ไม่มี (DR-07*)</td><td>${badge("Manual Review")} <span class="unres">ไม่ทราบเจ้าของ</span></td><td>APR เท่านั้น · บริษัทจาก Tax ID ลูกค้า ถ้าอ่านไม่ได้ = “?” · Reject แล้วให้ผู้สแกนอัปโหลดใหม่</td></tr></tbody></table></div>
  <div class="panel-b"><div class="note i" style="margin:0">${icon("info")}<div><b>receive_id</b> = Receipt Number เช่น <code class="k">RCV530340610</code> · 1 Invoice/ผู้ขาย อ้างได้ 1 ใบรับเท่านั้น และไม่ซ้ำ · 1 ใบรับครอบคลุมได้หลาย PO (ระบุใน <code class="k">receipt.po_received</code>) · <b>Receiver</b> คือเจ้าของรายการ ใช้กำหนดสิทธิ์ ไม่ใช่ key</div></div></div>`)}
 ${sec("s3","3. พจนานุกรมฟิลด์",`<div class="tbl-wrap"><table class="t"><thead><tr><th>ฟิลด์</th><th>ชนิด</th><th>บังคับ</th><th>ความหมาย</th><th>กติกา</th></tr></thead><tbody>${rows}</tbody></table></div>`,`<span class="muted sm">${SPEC.length} ฟิลด์</span>`)}
 ${sec("s4","4. ฟิลด์ที่ Portal เป็นเจ้าของ (ห้าม Engine ส่ง)",`<div class="panel-b"><div class="btnrow">${FORBID.map(k=>`<code class="k">${k}</code>`).join("")}</div><div class="note w">${icon("alert")}<div>ถ้ามีฟิลด์เหล่านี้ Portal ตอบ <b>422 VALIDATION_FAILED</b> · Portal สร้าง <code class="k">portal_doc_id</code>, <code class="k">status</code>, <code class="k">supersedes_doc_id</code>, <code class="k">superseded_by</code>, <code class="k">duplicate_of</code>, <code class="k">compare_result</code> และประวัติเอง (SRS ชีต 07/08)</div></div></div>`)}
 ${sec("s5","5. กติกาตรวจซ้ำเมื่อรับ Payload",`<div class="tbl-wrap"><table class="t"><thead><tr><th>กติกา</th><th>เงื่อนไข (เทียบกับ<b>สถานะปัจจุบัน</b>ของฉบับเดิม)</th><th>ฉบับเดิม</th><th>ฉบับใหม่</th><th>ACK</th></tr></thead><tbody>
  ${[["DR-07","ไม่พบ receive_id / คีย์สำรองเดิม","—","ตามผลตรวจ","CREATED"],["DR-07*","UNRESOLVED ไม่มีคีย์","—","Manual Review","CREATED"],["DR-01","เดิม Auto-pass/Review/Hold/Manual Review · ใหม่ดีกว่า","Superseded","ตามผลตรวจ","CREATED_SUPERSEDES"],["DR-02","เหมือนข้างบน · ใหม่เท่าเดิม","Superseded","ตามผลตรวจ","CREATED_SUPERSEDES"],["DR-03","เหมือนข้างบน · ใหม่แย่กว่า","คงเดิม","Duplicate","CREATED_AS_DUPLICATE"],["DR-04","เดิม Confirmed / Sent / Posted / Import Failed","คงเดิม","Duplicate","CREATED_AS_DUPLICATE"],["DR-05","เดิม Rejected / Superseded / Duplicate","ไม่นำมาเทียบ","ตามผลตรวจ","CREATED"],["DR-06","receive_id เดิมแต่ Invoice/ผู้ขายต่างกัน","คงเดิม","Duplicate","CREATED_AS_DUPLICATE"]].map(r=>`<tr><td>${rchip(r[0])}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td class="mono sm">${r[4]}</td></tr>`).join("")}</tbody></table></div>
  <div class="panel-b"><div class="note i" style="margin:0">${icon("info")}<div>ลำดับเทียบ Auto-pass &gt; Review &gt; Hold &gt; Manual Review · สถานะเดียวกัน = เท่าเดิม · ลำดับการตรวจ: Schema → message_id → identity → DR-06 → DR-04 → DR-01/02/03 · ทดสอบได้ที่ Simulator แท็บ Scenario Matrix</div></div></div>`)}
 ${sec("s6","6. Response (ACK) ที่ Portal ตอบ Engine",`<div class="tbl-wrap"><table class="t"><thead><tr><th>HTTP</th><th>result</th><th>ความหมาย</th><th>Engine ต้องทำ</th></tr></thead><tbody>
  ${[["201","CREATED","สร้างรายการใหม่ (DR-07 / DR-05)","—"],["201","CREATED_SUPERSEDES","สร้างใหม่และแทนที่ฉบับเดิม (DR-01/02)","—"],["201","CREATED_AS_DUPLICATE","สร้างใหม่ในสถานะ Duplicate (DR-03/04/06)","—"],["200","ALREADY_PROCESSED","message_id เคยรับแล้ว ตอบผลเดิม","ไม่ต้องทำอะไร"],["202","ERROR_LOGGED","รับ SYSTEM_ERROR · ไม่สร้างรายการ","แก้แล้วส่งใหม่ด้วย message_id ใหม่"],["400","INVALID_JSON","อ่าน JSON ไม่ได้","แก้ Payload"],["401 / 403","UNAUTHORIZED","token ไม่ถูกต้อง","ตรวจ credential"],["422","VALIDATION_FAILED","ผิดมาตรฐาน · คืน errors[]","แก้ Payload แล้วส่งใหม่"],["5xx","—","Portal ขัดข้อง","retry ด้วย message_id เดิม (exponential backoff)"]].map(r=>`<tr><td><span class="http ${/^4/.test(r[0])?"e":r[0]==="201"?"":r[0]==="5xx"?"e":"w"}">${r[0]}</span></td><td class="mono b">${r[1]}</td><td>${r[2]}</td><td class="sm">${r[3]}</td></tr>`).join("")}</tbody></table></div>`)}
 ${sec("s7","7. ตัวอย่าง Payload",`<div class="panel-b"><pre class="json">${esc(JSON.stringify(ex,null,2))}</pre></div>`,`<div class="seg">${[["resolved","RESOLVED · 2 PO"],["not_found","NOT_FOUND"],["unresolved","UNRESOLVED"],["system_error","SYSTEM_ERROR"],["ack","ACK"]].map(([k,l])=>`<button class="${STDX===k?"on":""}" onclick="STDX='${k}';simRefresh()">${l}</button>`).join("")}</div><button class="btn btn-sec sm" onclick="copyTxt(JSON.stringify(stdExamples()[STDX],null,2),'คัดลอกตัวอย่างแล้ว')">${icon("copy","sm")}คัดลอก</button>`)}
 ${sec("s8","8. Mapping จาก aiva.system_a.result/3.0",`<div class="tbl-wrap"><table class="t"><thead><tr><th>ingest/1.0</th><th>ที่มาใน result/3.0</th><th>หมายเหตุ</th></tr></thead><tbody>
  ${[["source.validation_id","request.validation_id",""],["source.standard_version","versions.standard",""],["source.result_sha256","integrity.payload_sha256",""],["document.dms_doc_id / file_sha256 / page_count","package.*",""],["identity.* / receipt.*","oracle_snapshot.*","⚠ ยืนยัน path กับทีม Engine"],["invoice.*","normalized_fields.*","รวม po_numbers ทุกใบ"],["lines / po_breakdown","line_matching.*","ใส่ po_number รายบรรทัด"],["rules","rule_results[] (9 รายการ)","ตัด evidence_ids ออก"],["exceptions","exceptions[]","เพิ่ม owner EU/ACC ตาม Standard"],["decision.recommendation / max_severity / exception_codes","recommendation.value / max_severity / exception_codes",""],["(ไม่ส่ง)","ocr.elements · evidence · pages · metrics","Portal ดึงด้วย validation_id เมื่อเปิด DMS"]].map(r=>`<tr><td class="mono">${r[0]}</td><td class="mono">${r[1]}</td><td class="sm">${r[2]}</td></tr>`).join("")}</tbody></table></div>`)}
 </div></div>`}

/* =====================================================================
   v4.18 — เมนูตั้งค่า + การผูก AD user ↔ Oracle account (หลายต่อหลาย) + ป้ายรอผูกบัญชี / ไม่ทราบเจ้าของ
   ===================================================================== */
Object.assign(I,{sliders:"M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",trash:"M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",plus:"M12 5v14M5 12h14",save:"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8"});
const SET0=()=>({staleDays:7,limit:{APR:1000000},hideClosed:true,period:"month",euReason:"reason",print:{EU:true,ACC:true,APR:true},reasons:JSON.parse(JSON.stringify(REASON))});
let SET=SET0(),PREF={},showClosed=false,setTab=null,itRef="",mseq=10;
const SETLOG=[{dt:"2026-10-05",t:"09:12:00",who:"สมชาย วงศ์ทอง",role:"หัวหน้าฝ่ายบัญชี",what:"จำนวนวันค้างนาน",o:"5 วัน",n:"7 วัน",ref:""},
 {dt:"2026-10-02",t:"14:40:00",who:"อนุชา ไอที",role:"ผู้ดูแลระบบ (IT)",what:"ผูก Oracle account",o:"—",n:"กิตติ สมบูรณ์ → SOMSAK JAIDEE",ref:"ticket INC-1021"}];
const RS_ACT=[["confirm","Confirm"],["review","Review"],["hold","Hold"],["reject","Reject"],["unconfirm","Unconfirm"],["returnf","Return Import Failed"]];
const COLS=[["tax","Tax ID ผู้ขาย",4],["po","PO",5],["rcv","Receiver",6],["own","ผู้รับผิดชอบ",10],["idate","วันที่ใบแจ้งหนี้",11],["up","วันที่เข้าระบบ",12],["age","อายุ",13]];
const CLOSED_V=["Posted","Rejected","Superseded"];
const isAPR=()=>ME.role==="APR";
/* ---------- binding helpers ---------- */
function pendingBind(d){return !!d.receiver&&!bound(d.receiver)&&["Review","Hold"].includes(d.status)&&d.codes.some(c=>EUCODES.has(c))}
function ownTag(d){return (d.unres?`<span class="unres">${icon("alert","sm")}ไม่ทราบเจ้าของ</span>`:"")+(pendingBind(d)?`<span class="bindtag">${icon("lock","sm")}รอผูกบัญชี</span>`:"")}
function refreshBinding(){DOCS.forEach(d=>{d.receiverActive=!d.receiver||bound(d.receiver);
  if(["Review","Hold"].includes(d.status))d.assigned=(!d.receiver||!d.receiverActive)?"acc":(d.codes.some(c=>EUCODES.has(c))?"eu":"acc")});
 SIM.recs.forEach(r=>{r.receiverActive=!!r.receiver&&bound(r.receiver)})}
function unboundAccts(){const m={};DOCS.forEach(d=>{if(!d.receiver||bound(d.receiver))return;const a=m[d.receiver]=m[d.receiver]||{acct:d.receiver,n:0,open:0,lock:0,old:null,cos:new Set()};
  a.n++;a.cos.add(d.company);if(!CLOSED_V.includes(d.status)&&!["Confirmed","Sent","Import Failed","Duplicate"].includes(d.status)){a.open++;if(!a.old||d.up<a.old)a.old=d.up}if(pendingBind(d))a.lock++});
 return Object.values(m).sort((x,y)=>y.lock-x.lock||y.open-x.open)}
const knownAccts=()=>[...new Set([...DOCS.map(d=>d.receiver).filter(Boolean),...MAPS.map(m=>m.acct)])].sort();
/* ---------- personal preferences ---------- */
function loadPref(){try{PREF=JSON.parse(storageGet("aiva.pref."+ME.id)||"{}")||{}}catch(e){PREF={}}
 PREF.cols=Object.assign({tax:true,po:true,rcv:true,own:true,idate:true,up:true,age:true},PREF.cols||{});applyColCss()}
function applyColCss(){let st=$("colcss");if(!st){st=document.createElement("style");st.id="colcss";document.head.appendChild(st)}
 st.textContent=COLS.filter(c=>PREF.cols&&PREF.cols[c[0]]===false).map(c=>`#tview table.t th:nth-child(${c[2]}),#tview table.t td:nth-child(${c[2]}){display:none}`).join("\n")}
const wantShowClosed=()=>ME.role==="EU"?true:(PREF.showClosed!=null?PREF.showClosed:!SET.hideClosed);
function savePref(){const np={period:$("pf_period").value||null,view:$("pf_view").value||null,cols:{}};
 COLS.forEach(c=>np.cols[c[0]]=$("pc_"+c[0]).checked);if(ME.role!=="EU")np.showClosed=$("pf_closed").checked;
 PREF=np;storageSet("aiva.pref."+ME.id,JSON.stringify(np));applyColCss();
 if(np.period){PERS.q={k:np.period};storageSet(perKey(),JSON.stringify(PERS.q))}
 showClosed=wantShowClosed();log("บันทึกการตั้งค่าส่วนตัว","—","ช่วงเวลา "+(np.period||"ตามค่ากลาง")+" · มุมมอง "+(np.view||"ตามค่ากลาง"));toast("บันทึกการตั้งค่าส่วนตัวแล้ว");render()}
function resetPref(){PREF={};storageSet("aiva.pref."+ME.id,"{}");PERS.q=perDefault();storageSet(perKey(),JSON.stringify(PERS.q));loadPref();showClosed=wantShowClosed();toast("คืนค่าส่วนตัวเป็นค่าเริ่มต้นแล้ว");render()}
/* ---------- org settings (APR แก้ · ACC ดูอย่างเดียว) ---------- */
function needAPR(){if(!isAPR()){log("ถูกปฏิเสธการเปลี่ยนการตั้งค่า","—","ไม่มีสิทธิ์ (บทบาท "+ROLES[ME.role].n+")");toast("เฉพาะหัวหน้าฝ่ายบัญชี (APR) แก้ค่านี้ได้",1);return true}return false}
function setLog(what,o,n,ref){SETLOG.unshift({dt:TODAY,t:now(),who:ME.n,role:ROLES[ME.role].n,what,o:String(o),n:String(n),ref:ref||""});
 log("เปลี่ยนการตั้งค่า","—",what+": "+o+" → "+n+(ref?" · อ้างอิง "+ref:""))}
function saveStale(){if(needAPR())return;const v=+$("so_stale").value;if(!Number.isInteger(v)||v<1||v>90)return toast("ใส่จำนวนวันเป็นจำนวนเต็ม 1–90",1);
 if(v===SET.staleDays)return toast("ค่าไม่เปลี่ยน");setLog("จำนวนวันค้างนาน",SET.staleDays+" วัน",v+" วัน");SET.staleDays=v;toast("บันทึกแล้ว · มีผลกับการไฮไลต์อายุทันที");render()}
function saveLimit(){if(needAPR())return;const v=Math.round(+$("so_limit").value);if(!isFinite(v)||v<0)return toast("ใส่วงเงินเป็นตัวเลข ≥ 0",1);if(v===SET.limit.APR)return toast("ค่าไม่เปลี่ยน");
 modal("ยืนยันการเปลี่ยนวงเงินตั้งหนี้","มีผลต่อการส่ง Batch เข้า AP · ต้องยืนยันตัวตนด้วย Entra MFA","shield","warn",
  `<div class="card" style="padding:6px 12px"><div class="kv"><span>วงเงินเดิม (APR)</span><b class="mono">${B(SET.limit.APR)} ฿</b></div><div class="kv"><span>วงเงินใหม่</span><b class="mono">${B(v)} ฿</b></div></div>
   <label for="mfa">รหัส MFA</label><input id="mfa" type="password" placeholder="mockup ใช้ 123456" autocomplete="off">`,icon("check","sm")+"ยืนยัน","btn-primary",()=>{
   if(needAPR())return;if($("mfa").value!=="123456"){log("ยืนยัน MFA ไม่สำเร็จ","—","เปลี่ยนวงเงินตั้งหนี้");return toast("รหัส MFA ไม่ถูกต้อง",1)}
   setLog("วงเงินตั้งหนี้ต่อฉบับ (APR)",B(SET.limit.APR)+" ฿",B(v)+" ฿","MFA ผ่าน");SET.limit.APR=v;ROLES.APR.postMax=v;closeM();toast("บันทึกวงเงินแล้ว");render()})}
function saveReasons(){if(needAPR())return;const NEW={},bad=[];
 RS_ACT.forEach(([k,l])=>{const a=[...new Set($("rs_"+k).value.split("\n").map(s=>s.trim()).filter(Boolean))];if(!a.length)bad.push(l);NEW[k]=a});
 if(bad.length)return toast("ต้องมีเหตุผลอย่างน้อย 1 ข้อ: "+bad.join(", "),1);let ch=0;
 RS_ACT.forEach(([k,l])=>{const o=SET.reasons[k],n=NEW[k],add=n.filter(x=>!o.includes(x)),del=o.filter(x=>!n.includes(x));
  if(add.length||del.length){ch++;setLog("รายการเหตุผล · "+l,"เดิม "+o.length+" ข้อ",(add.length?"+ "+add.join(", "):"")+(add.length&&del.length?" · ":"")+(del.length?"− "+del.join(", "):""))}
  SET.reasons[k]=n;REASON[k]=n});toast(ch?"บันทึกรายการเหตุผลแล้ว":"ไม่มีการเปลี่ยนแปลง");render()}
function saveEuVis(){if(needAPR())return;const v=(document.querySelector('input[name=sv_eu]:checked')||{}).value;if(!v||v===SET.euReason)return toast("ค่าไม่เปลี่ยน");
 const L={all:"เห็นเหตุผลและหมายเหตุ",reason:"เห็นเฉพาะเหตุผลที่เลือก",none:"ไม่เห็น"};setLog("End User เห็นเหตุผลของฝ่ายบัญชี",L[SET.euReason],L[v]);SET.euReason=v;toast("บันทึกแล้ว");render()}
function savePrint(){if(needAPR())return;let ch=0;["EU","ACC","APR"].forEach(r=>{const v=$("sp_"+r).checked;if(v!==SET.print[r]){ch++;setLog("พิมพ์/ดาวน์โหลด PDF · "+ROLES[r].n,SET.print[r]?"เปิด":"ปิด",v?"เปิด":"ปิด")}SET.print[r]=v});toast(ch?"บันทึกแล้ว":"ไม่มีการเปลี่ยนแปลง");render()}
function saveQueueDef(){if(needAPR())return;const p=$("so_period").value,c=$("so_closed").checked;let ch=0;
 if(p!==SET.period){ch++;setLog("ช่วงเวลาเริ่มต้นของคิว",SET.period,p);SET.period=p}if(c!==SET.hideClosed){ch++;setLog("ซ่อนฉบับที่ปิดแล้วเป็นค่าเริ่มต้น",SET.hideClosed?"ซ่อน":"แสดง",c?"ซ่อน":"แสดง");SET.hideClosed=c}
 showClosed=wantShowClosed();toast(ch?"บันทึกแล้ว":"ไม่มีการเปลี่ยนแปลง");render()}
/* ---------- IT Admin: การผูกบัญชี ---------- */
function itNeed(){if(ME.role!=="ADM"){log("ถูกปฏิเสธการจัดการการผูกบัญชี","—","ไม่มีสิทธิ์ (บทบาท "+ROLES[ME.role].n+")");toast("เฉพาะ IT Admin จัดการการผูกบัญชี",1);return true}
 const r=($("itref")||{}).value;itRef=(r||"").trim();if(!itRef){toast("ระบุอ้างอิงคำขอ (ticket / อีเมล) ก่อนทุกครั้ง",1);if($("itref"))$("itref").focus();return true}return false}
function mapAddForm(){const uid=$("mp_user").value,a=($("mp_acct").value||"").trim().toUpperCase();if(!a)return toast("ระบุชื่อ Oracle account (RECEIVER)",1);mapAdd(uid,a)}
function mapAdd(uid,a){if(itNeed())return;if(MAPS.some(m=>m.user===uid&&m.acct===a))return toast("ผูกไว้แล้ว",1);
 MAPS.push({id:"m"+(++mseq),user:uid,acct:a,by:ME.n,at:TODAY,req:itRef});setLog("ผูก Oracle account","—",uName(uid)+" → "+a,itRef);refreshBinding();toast("ผูก "+a+" กับ "+uName(uid)+" แล้ว");render()}
function mapDel(id){if(itNeed())return;const i=MAPS.findIndex(m=>m.id===id);if(i<0)return;const m=MAPS[i];MAPS.splice(i,1);
 setLog("ยกเลิกการผูก Oracle account",uName(m.user)+" → "+m.acct,"—",itRef);refreshBinding();toast("ยกเลิกการผูกแล้ว · เอกสารของ "+m.acct+(bound(m.acct)?" ยังเห็นได้โดยผู้ที่ผูกอยู่":" กลับไปรอผูกบัญชี"));render()}
function coToggle(uid,c){if(itNeed())return;const u=USERS.find(x=>x.id===uid);const had=u.co.includes(c);
 u.co=had?u.co.filter(x=>x!==c):[...u.co,c];setLog("บริษัทที่รับผิดชอบ · "+u.n,had?c:"—",had?"ถอด "+c:"เพิ่ม "+c,itRef);toast((had?"ถอด ":"เพิ่ม ")+c+" แล้ว");render()}
/* ---------- pages ---------- */
function setTabTo(t){setTab=t;render()}
function settingsPage(){const role=ME.role,tabs=[["personal","ส่วนตัว","user"]];
 if(role==="ACC"||role==="APR")tabs.push(["org","ฝ่ายบัญชี"+(role==="ACC"?" (ดูอย่างเดียว)":""),"building"],["locked","ค่าที่ล็อก","lock"]);
 if(role==="ADM")tabs.push(["it","IT Admin · การผูกบัญชี","key"]);
 if(role!=="EU")tabs.push(["hist","ประวัติการเปลี่ยนค่า","log"]);
 if(!setTab||!tabs.some(t=>t[0]===setTab))setTab=role==="EU"?"personal":role==="ADM"?"it":"org";
 const body=setTab==="personal"?setPersonal():setTab==="org"?setOrg():setTab==="locked"?setLocked():setTab==="it"?setIT():setHist();
 return `<div class="pg"><div class="tbar"><span class="lab">ตั้งค่า</span><div class="seg" role="tablist">${tabs.map(([k,l,ic])=>`<button class="${setTab===k?"on":""}" role="tab" aria-selected="${setTab===k}" onclick="setTabTo('${k}')">${icon(ic,"sm")}${l}</button>`).join("")}</div>
  <span class="scope-note">${icon("info","sm")}ค่าที่ SRS / Standard กำหนดไว้จะล็อก · ทุกการเปลี่ยนค่าบันทึกใน Audit</span></div><div class="pg-scroll">${body}</div></div>`}
const secH=(t,d,fn,dis,why)=>`<div class="panel-h"><h3>${t}</h3><span class="muted sm">${d||""}</span><span class="grow"></span>${fn?`<button class="btn btn-primary sm" ${dis?`disabled title="${why||"ไม่มีสิทธิ์แก้ค่านี้"}"`:""} onclick="${fn}">${icon("save","sm")}บันทึก</button>`:""}</div>`;
function setPersonal(){const per=[["","ตามค่ากลาง"],["all","ทั้งหมด"],["today","วันนี้"],["7d","7 วันล่าสุด"],["month","เดือนนี้"],["lastm","เดือนก่อน"]];
 return `<div class="panel">${secH("ค่าส่วนตัวของคุณ","เก็บตามบัญชี "+ME.email+" · ใช้ได้ทุกเครื่องเมื่อขึ้นระบบจริง (mockup เก็บในเบราว์เซอร์)","savePref()")}<div class="panel-b">
  <div class="fgrid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
   <div><label for="pf_period">ช่วงเวลาเริ่มต้นของคิว</label><select id="pf_period" class="sel">${per.map(([k,l])=>`<option value="${k}" ${(PREF.period||"")===k?"selected":""}>${l}</option>`).join("")}</select></div>
   <div><label for="pf_view">มุมมองเริ่มต้น</label><select id="pf_view" class="sel"><option value="" ${!PREF.view?"selected":""}>ตามค่ากลาง (ตารางสรุป)</option><option value="table" ${PREF.view==="table"?"selected":""}>ตารางสรุป</option><option value="split" ${PREF.view==="split"?"selected":""}>แยก 2 ฝั่ง</option></select></div></div>
  ${ME.role==="EU"?`<div class="set-note">${icon("info","sm")} End User เห็นทุกสถานะของ Oracle account ตน (รวม Duplicate / Superseded / Rejected) เพราะไม่มีการแจ้งเตือน</div>`:`<label class="chk" style="margin-top:10px"><input id="pf_closed" type="checkbox" ${wantShowClosed()?"checked":""}>แสดงฉบับที่ปิดแล้ว (Posted / Rejected / Superseded) ในคิวเป็นค่าเริ่มต้น <span class="muted xs">· ค่ากลาง: ${SET.hideClosed?"ซ่อน":"แสดง"}</span></label>`}
  <div class="b sm" style="margin-top:12px">คอลัมน์ในตารางสรุป</div><div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:4px">${COLS.map(([k,l])=>`<label class="chk"><input id="pc_${k}" type="checkbox" ${PREF.cols&&PREF.cols[k]===false?"":"checked"}>${l}</label>`).join("")}</div>
  <div class="set-note">คอลัมน์ เลขที่ใบแจ้งหนี้ / บริษัท / ผู้ขาย / ยอดรวม / สถานะ / รหัส ซ่อนไม่ได้</div>
  <div class="btnrow" style="margin-top:12px"><button class="btn btn-sec sm" onclick="resetPref()">${icon("undo","sm")}คืนค่าเริ่มต้น</button></div></div></div>
  <div class="note i">${icon("info")}<div>ตัวกรองบริษัท / สถานะ / ค้นหาที่ใช้ในคิว จำค่าล่าสุดของช่วงเวลาไว้ตามบัญชีของคุณ ส่วนการตั้งค่าอื่นของคุณไม่กระทบผู้ใช้คนอื่น</div></div>`}
function setOrg(){const dis=!isAPR(),d=dis?"disabled":"",why="เฉพาะหัวหน้าฝ่ายบัญชี (APR) แก้ได้ · เจ้าหน้าที่บัญชีดูอย่างเดียว";
 const stale=visible().filter(x=>OPEN_ST.includes(x.status)&&ageDays(x)>SET.staleDays).length;
 const per=[["all","ทั้งหมด"],["today","วันนี้"],["7d","7 วันล่าสุด"],["month","เดือนนี้"],["lastm","เดือนก่อน"]];
 return `${dis?`<div class="note w" style="margin:0 0 12px">${icon("lock")}<div><b>ดูอย่างเดียว</b> · ค่าในหน้านี้แก้ได้เฉพาะหัวหน้าฝ่ายบัญชี (APR) ทุกการเปลี่ยนบันทึกใน Audit</div></div>`:""}
 <div class="panel">${secH("1. จำนวนวันที่ถือว่า “ค้างนาน”","ใช้ค่าเดียวกับทุกสถานะที่ยังเปิด: Review · Hold · Manual Review · Duplicate","saveStale()",dis,why)}<div class="panel-b">
  <div class="fgrid"><div><label for="so_stale">ค้างนานเมื่อเกิน (วัน)</label><input id="so_stale" class="inp" type="number" min="1" max="90" value="${SET.staleDays}" ${d}></div></div>
  <div class="set-note">มีผล: ตัวเลข “อายุ” ในคิวขึ้นสีแดง · ตอนนี้มี <b>${stale}</b> ฉบับค้างนานในขอบเขตของคุณ · ไม่ส่งอีเมลและไม่ปิดอัตโนมัติ (BR-016/017)</div></div></div>
 <div class="panel">${secH("2. วงเงินตั้งหนี้ต่อฉบับ","ใช้ตอนตรวจก่อนส่ง Batch เข้า AP Interface (BR-008) · เปลี่ยนค่าต้องยืนยัน MFA","saveLimit()",dis,why)}<div class="panel-b">
  <div class="tbl-wrap"><table class="t"><thead><tr><th>บทบาท</th><th>ส่ง Batch เข้า AP</th><th class="num">วงเงินต่อฉบับ (฿)</th></tr></thead><tbody>
   <tr><td>หัวหน้าฝ่ายบัญชี (APR)</td><td class="okc">ส่งได้</td><td class="num"><input id="so_limit" class="inp" type="number" min="0" step="1000" style="width:160px;text-align:right" value="${SET.limit.APR}" ${d}></td></tr>
   <tr><td>เจ้าหน้าที่บัญชี (ACC)</td><td class="nac">ดูอย่างเดียว (SRS AP-01)</td><td class="num nac">—</td></tr></tbody></table></div>
  <div class="set-note">ถ้ายอดฉบับใดเกินวงเงิน ฉบับนั้นถูกตัดออกจาก Batch และคงอยู่ในรายการรอส่ง · ตัวเลขจริงให้ฝ่ายบัญชีเป็นผู้กำหนด</div></div></div>
 <div class="panel">${secH("3. รายการเหตุผลใน dropdown","หนึ่งบรรทัดต่อหนึ่งเหตุผล · แต่ละการดำเนินการต้องมีอย่างน้อย 1 ข้อ","saveReasons()",dis,why)}<div class="panel-b"><div class="grid2">
  ${RS_ACT.map(([k,l])=>`<div><label class="b sm" for="rs_${k}">${l}</label><textarea id="rs_${k}" class="set-ta" ${d}>${esc(SET.reasons[k].join("\n"))}</textarea></div>`).join("")}</div>
  <div class="set-note">การบังคับให้กรอกเหตุผล/หมายเหตุ (FR-ACC-002) ยังล็อก · เหตุผลที่ลบออกไม่กระทบประวัติเดิม</div></div></div>
 <div class="panel">${secH("4. End User เห็นอะไรจากการตัดสินของฝ่ายบัญชี","ใช้กับแท็บประวัติของเอกสาร (ไม่มีการแจ้งเตือน End User ต้องเข้ามาดูเอง)","saveEuVis()",dis,why)}<div class="panel-b"><div class="radio-row">
  ${[["reason","เห็นเฉพาะเหตุผลที่เลือกจากรายการ (ไม่เห็นหมายเหตุที่พิมพ์เอง)"],["all","เห็นทั้งเหตุผลและหมายเหตุ"],["none","ไม่เห็นเหตุผล เห็นแค่สถานะ"]].map(([k,l])=>`<label class="chk"><input type="radio" name="sv_eu" value="${k}" ${SET.euReason===k?"checked":""} ${d}>${l}</label>`).join("")}</div></div></div>
 <div class="panel">${secH("5. พิมพ์ / ดาวน์โหลด PDF","ลายน้ำ ลิงก์ 10 นาที และการบันทึก Audit ยังบังคับทุกกรณี (BR-010)","savePrint()",dis,why)}<div class="panel-b"><div style="display:flex;gap:18px;flex-wrap:wrap">
  ${["EU","ACC","APR"].map(r=>`<label class="chk"><input id="sp_${r}" type="checkbox" ${SET.print[r]?"checked":""} ${d}>${ROLES[r].n}</label>`).join("")}</div><div class="set-note">ปิดแล้วปุ่มพิมพ์/ดาวน์โหลดใน DMS Viewer ใช้ไม่ได้ ส่วน zoom / เปลี่ยนหน้า / เปิดแท็บใหม่ ยังใช้ได้</div></div></div>
 <div class="panel">${secH("6. ค่าเริ่มต้นของคิวฝ่ายบัญชี","ผู้ใช้แต่ละคนแก้ค่าของตนได้ที่แท็บ “ส่วนตัว”","saveQueueDef()",dis,why)}<div class="panel-b"><div class="fgrid">
  <div><label for="so_period">ช่วงเวลาเริ่มต้น</label><select id="so_period" class="sel" ${d}>${per.map(([k,l])=>`<option value="${k}" ${SET.period===k?"selected":""}>${l}</option>`).join("")}</select></div></div>
  <label class="chk" style="margin-top:8px"><input id="so_closed" type="checkbox" ${SET.hideClosed?"checked":""} ${d}>ซ่อนฉบับที่ปิดแล้ว (Posted / Rejected / Superseded) ในคิว มีปุ่ม “รวมที่ปิดแล้ว”</label>
  <div class="set-note">ผู้ใช้ที่เลือกช่วงเวลาเองไว้แล้วจะใช้ค่าของตนต่อไป</div></div></div>`}
function setLocked(){const L=[
 ["กฎตรวจ V-01 ถึง V-09 และค่า tolerance","Standard · Engine","ออกเวอร์ชัน Standard แล้ว deploy Engine"],
 ["Severity และเจ้าของของรหัส E01–E15","Standard ตาราง 7","ออกเวอร์ชัน Standard"],
 ["ลำดับเทียบ Auto-pass › Review › Hold › Manual Review (สถานะเดียวกัน = เท่าเดิม)","SRS 05B","แก้ SRS"],
 ["กติกาตรวจซ้ำ DR-01 ถึง DR-07 (คีย์หลัก receive_id · คีย์สำรอง Tax ID + Invoice)","SRS 05B","แก้ SRS"],
 ["Transition Matrix ของฝ่ายบัญชี และสิทธิ์ตามบทบาท (Manual Review = APR · ไม่ทราบเจ้าของ ACC/APR Reject ได้)","SRS 05A · RBAC","แก้ SRS"],
 ["ต้องกรอกเหตุผล/หมายเหตุ (Review, Hold, Reject, Unconfirm, Return · Confirm เมื่อมีรหัส High)","FR-ACC-002","แก้ SRS"],
 ["ผู้ยืนยัน ≠ ผู้ส่ง AP (SoD)","BR-007","แก้ SRS"],
 ["ลิงก์ DMS 10 นาที + ลายน้ำ + บันทึกทุกการเปิด","BR-010","แก้ SRS / IT Security"],
 ["Audit และรอบตรวจ append-only · ไม่มีการตรวจซ้ำ · ไม่แจ้งเตือน End User","BR-015/016/017","แก้ SRS"],
 ["IT Admin เห็นเนื้อหาเอกสารไม่ได้","SEC-10","แก้ SRS"],
 ["การผูก AD user ↔ Oracle account และบริษัทของผู้ใช้","IT Admin","ตั้งค่าที่แท็บ “IT Admin” (เฉพาะ IT Admin)"],
 ["SSO / Role จาก Entra Group / MFA / ระยะเก็บข้อมูล","IT Security / Compliance","ตั้งค่าที่ Entra และระบบหลังบ้าน"]];
 return `<div class="note i" style="margin:0 0 12px">${icon("lock")}<div>ค่าเหล่านี้ <b>ไม่เปิดให้แก้ในหน้านี้</b> เพราะเป็นข้อกำหนดที่ผ่านการอนุมัติหรือมีผลต่อความปลอดภัย การเปลี่ยนต้องออกเวอร์ชันเอกสาร</div></div>
 <div class="panel"><div class="panel-h"><h3>ข้อกำหนดที่ล็อก</h3></div><div class="tbl-wrap"><table class="t"><thead><tr><th>รายการ</th><th>ที่มา</th><th>เปลี่ยนได้อย่างไร</th></tr></thead><tbody>
  ${L.map(r=>`<tr class="lockrow"><td>${icon("lock","sm")} ${r[0]}</td><td><span class="lockbadge">${r[1]}</span></td><td class="sm">${r[2]}</td></tr>`).join("")}</tbody></table></div></div>
 <div class="panel"><div class="panel-h"><h3>รหัสข้อยกเว้น E01–E15 (อ่านอย่างเดียว)</h3></div><div class="tbl-wrap"><table class="t"><thead><tr><th>รหัส</th><th>ชื่อ</th><th>Severity</th><th>ผู้รับเรื่อง</th></tr></thead><tbody>
  ${Object.keys(EXC).map(c=>`<tr><td><span class="code ${SEV[c]}">${c}</span></td><td>${EXC[c][0]}</td><td><span class="sev ${SEV[c]}">${SEV[c]}</span></td><td>${EXC[c][1]==="eu"?"ผู้ใช้งาน (Receiver)":"ฝ่ายบัญชี"}</td></tr>`).join("")}</tbody></table></div></div>`}
function setIT(){const ub=unboundAccts(),eus=USERS.filter(u=>u.role==="EU"),cnt=a=>DOCS.filter(d=>d.receiver===a).length;
 const cos=["AH","AHT","AHP","AM"];
 return `<div class="note w" style="margin:0 0 12px">${icon("shield")}<div>หน้านี้ยังใช้ได้ แต่ <b>จัดการสิทธิ์ทั้งหมด</b> (บทบาท · บริษัท · Oracle account · ระงับบัญชี · ร่างและเลิกทำ · ทดสอบสิทธิ์) อยู่ที่หน้าใหม่ <button class="link" onclick="go('perm')">เปิดหน้าจัดการสิทธิ์</button></div></div>
   <div class="note i" style="margin:0 0 12px">${icon("key")}<div><b>ผูก AD user กับ Oracle account</b> · เอกสารเป็นของ Oracle account (Receiver) · 1 AD user ดูได้หลาย account และ 1 account ผูกได้หลาย AD user · ทุก AD user ที่ผูกกับ account เดียวกันทำงานได้เท่ากัน · IT Admin เห็นเฉพาะจำนวนเอกสาร ไม่เห็นเนื้อหา</div></div>
 <div class="panel"><div class="panel-h"><h3>อ้างอิงคำขอ</h3><span class="muted sm">บังคับกรอกก่อนเพิ่ม / ลบ / เปลี่ยนบริษัทของผู้ใช้ทุกครั้ง · บันทึกใน Audit</span></div><div class="panel-b">
  <div class="fgrid" style="grid-template-columns:minmax(260px,420px)"><div><label for="itref">ticket / อีเมลคำขอ</label><input id="itref" class="inp" placeholder="เช่น INC-1055" value="${esc(itRef)}" ${ME.role==="ADM"?"":"disabled"}></div></div></div></div>
 <div class="panel"><div class="panel-h"><h3>รอผูกบัญชี · Oracle account ที่ยังไม่มีใครถูกผูก</h3><span class="muted sm">${ub.length} account</span></div>
  <div class="tbl-wrap"><table class="t"><thead><tr><th>Oracle account (RECEIVER)</th><th>บริษัท</th><th class="num">เอกสารทั้งหมด</th><th class="num">ยังเปิดอยู่</th><th class="num">ล็อก (ต้องให้เจ้าของแก้)</th><th>ค้างเก่าสุด</th><th>ผูกกับ</th><th></th></tr></thead><tbody>
  ${ub.map((a,i)=>`<tr><td class="mono"><b>${a.acct}</b></td><td>${[...a.cos].map(c=>`<span class="co" style="margin:0 2px 0 0">${c}</span>`).join("")}</td><td class="num">${a.n}</td><td class="num">${a.open}</td><td class="num ${a.lock?"badc":"nac"}">${a.lock||"—"}</td><td class="mono">${a.old?dmy(a.old)+" ("+Math.max(0,Math.round((new Date(TODAY+"T00:00:00Z")-new Date(a.old+"T00:00:00Z"))/864e5))+" วัน)":"—"}</td>
   <td><select id="ub_${i}" class="sel">${eus.map(u=>`<option value="${u.id}">${u.n}</option>`).join("")}</select></td><td><button class="btn btn-teal sm" onclick="mapAdd($('ub_${i}').value,'${a.acct}')">${icon("plus","sm")}ผูก</button></td></tr>`).join("")||`<tr><td colspan="8"><div class="empty">${icon("checkc")}ทุก Oracle account มีผู้ถูกผูกแล้ว</div></td></tr>`}</tbody></table></div></div>
 <div class="panel"><div class="panel-h"><h3>การผูก AD user ↔ Oracle account</h3><span class="muted sm">${MAPS.length} การผูก</span></div>
  <div class="fbar"><span class="muted sm b">เพิ่มการผูก</span><select id="mp_user" class="sel">${eus.map(u=>`<option value="${u.id}">${u.n} · ${u.email}</option>`).join("")}</select>
   <input id="mp_acct" class="inp" list="acctlist" placeholder="Oracle account (RECEIVER)" style="width:230px"><datalist id="acctlist">${knownAccts().map(a=>`<option value="${a}">`).join("")}</datalist>
   <button class="btn btn-teal sm" onclick="mapAddForm()">${icon("plus","sm")}เพิ่ม</button></div>
  <div class="tbl-wrap"><table class="t"><thead><tr><th>AD user</th><th>Entra ID</th><th>Oracle account</th><th class="num">เอกสาร</th><th>ผูกโดย</th><th>วันที่</th><th>อ้างอิง</th><th></th></tr></thead><tbody>
  ${MAPS.map(m=>{const u=USERS.find(x=>x.id===m.user)||{};return `<tr><td><b>${u.n||"—"}</b></td><td class="mono sm">${u.email||""}</td><td class="mono">${m.acct}</td><td class="num">${cnt(m.acct)}</td><td>${m.by}</td><td class="mono">${dmy(m.at)}</td><td class="sm">${esc(m.req||"")}</td><td><button class="btn btn-danger sm" onclick="mapDel('${m.id}')">${icon("trash","sm")}ยกเลิก</button></td></tr>`}).join("")}</tbody></table></div></div>
 <div class="panel"><div class="panel-h"><h3>บริษัทที่ผู้ใช้รับผิดชอบ</h3><span class="muted sm">กดชิปเพื่อเพิ่ม / ถอด · เห็นเอกสารของบริษัทนั้น (ORG_ID ทั้งหมดใต้ Tax ID เดียวกัน)</span></div>
  <div class="tbl-wrap"><table class="t"><thead><tr><th>ผู้ใช้</th><th>บทบาท</th><th>บริษัท</th></tr></thead><tbody>
  ${USERS.filter(u=>u.role!=="ADM").map(u=>{const opts=u.role==="EU"?cos:[...cos,"?"];return `<tr><td><b>${u.n}</b><div class="muted xs">${u.email}</div></td><td><span class="role-pill" style="background:${ROLES[u.role].bg};color:${ROLES[u.role].c}">${ROLES[u.role].n}</span></td>
   <td>${opts.map(c=>`<button class="chip cochip ${u.co.includes(c)?"on":"off"}" title="${COMPANY[c].name}" onclick="coToggle('${u.id}','${c}')">${c}</button>`).join(" ")}</td></tr>`}).join("")}</tbody></table></div></div>`}
function setHist(){return `<div class="panel"><div class="panel-h"><h3>ประวัติการเปลี่ยนค่า</h3><span class="muted sm">${SETLOG.length} รายการ · แก้ไขไม่ได้ (บันทึกซ้ำใน Audit)</span></div><div class="tbl-wrap"><table class="t"><thead><tr><th>วันที่</th><th>เวลา</th><th>ผู้เปลี่ยน</th><th>บทบาท</th><th>การตั้งค่า</th><th>ค่าเดิม</th><th>ค่าใหม่</th><th>อ้างอิง</th></tr></thead><tbody>
 ${SETLOG.map(r=>`<tr><td class="mono">${dmy(r.dt)}</td><td class="mono">${r.t}</td><td>${r.who}</td><td>${r.role}</td><td><b>${esc(r.what)}</b></td><td class="sm">${esc(r.o)}</td><td class="sm">${esc(r.n)}</td><td class="sm">${esc(r.ref)}</td></tr>`).join("")||`<tr><td colspan="8"><div class="empty">${icon("inbox")}ยังไม่มีการเปลี่ยนค่า</div></td></tr>`}</tbody></table></div></div>`}
/* ---------- History view for End User (ตามค่า SET.euReason) ---------- */
function histView(d,h){if(ME.role!=="EU"||h.rs===undefined)return `<div class="d">${h.d||""}</div>`;
 const m=SET.euReason;if(m==="none")return `<div class="d muted">ฝ่ายบัญชีดำเนินการแล้ว · ไม่แสดงเหตุผล</div>`;
 return `<div class="d">${esc(h.who||"ฝ่ายบัญชี")} · ${esc(h.rs)}${m==="all"&&h.nt?" · "+esc(h.nt):""}</div>`}


/* =====================================================================
   v4.21 — ตัวกรองรายคอลัมน์ (Column Filters)
   · ปุ่มกรวยที่หัวทุกคอลัมน์ของ “ตารางสรุปคิวเอกสาร” · ใช้ร่วมกับตัวกรองด้านบน (บริษัท / สถานะ / ช่วงเวลา / ค้นหา) แบบ AND
   · ชนิดตัวกรอง: รายการค่า (ติ๊กเลือก + ค้นหา + จำนวน) · ข้อความตามเงื่อนไข · ช่วงตัวเลข · ช่วงวันที่ (พร้อมปุ่มลัด)
   · ยังไม่ใช้จนกว่าจะกด ตกลง · เห็นผลลัพธ์ล่วงหน้า · ล้าง / เลิกทำได้ · ไม่จำข้ามการโหลดหน้า (กันเอกสารถูกซ่อนโดยไม่รู้ตัว)
   ===================================================================== */
Object.assign(I,{filter:"M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
 users:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
 userplus:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6",
 link:"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
 unlink:"M9 17H7A5 5 0 0 1 7 7M15 7h2a5 5 0 0 1 4 8M8 12h4M2 2l20 20",
 eye:"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
 history:"M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l4 2",
 chevD:"M6 9l6 6 6-6",chevU:"M18 15l-6-6-6 6",sortb:"M7 15l5 5 5-5M7 9l5-5 5 5",
 redo:"M15 14l5-5-5-5M20 9H9.5A5.5 5.5 0 0 0 4 14.5 5.5 5.5 0 0 0 9.5 20H13"});
let CF={},CD=null;
const NONE="∅";
const ST_ORDER=["Auto-pass","Review","Hold","Manual Review","Duplicate","Confirmed","Sent","Posted","Import Failed","Superseded","Rejected"];
const OPL={contains:"มีคำว่า",ncontains:"ไม่มีคำว่า",starts:"ขึ้นต้นด้วย",eq:"ตรงกับทั้งหมด"};
const nfmt=n=>Number(n).toLocaleString("en-US",{maximumFractionDigits:2});
const escA=s=>esc(s).replace(/"/g,"&quot;");
const OWN_L={eu:"ผู้ใช้งาน",acc:"ฝ่ายบัญชี"};
/* นิยามคอลัมน์ · t: text | enum | num | date */
const CFC={
 inv:{l:"เลขที่ใบแจ้งหนี้",t:"text",str:d=>d.inv},
 co:{l:"บริษัท",t:"enum",keys:d=>[d.company],lab:k=>`<span class="co" style="margin:0">${k}</span><span>${(COMPANY[k]||{}).name||""}</span>`,txt:k=>k+" "+((COMPANY[k]||{}).name||"")},
 vendor:{l:"ผู้ขาย",t:"text",str:d=>d.vendor},
 stax:{l:"Tax ID ผู้ขาย",t:"text",str:d=>d.stax,mono:1},
 po:{l:"PO",t:"text",str:d=>d.po+(d.release?"-"+d.release:""),mono:1},
 rcv:{l:"Receiver",t:"text",str:d=>d.owner||"",none:"(ไม่มี Receiver)"},
 total:{l:"ยอดรวม",t:"num",get:d=>d.total,unit:"฿"},
 status:{l:"สถานะ",t:"enum",keys:d=>[d.status],lab:k=>badge(k),txt:k=>k},
 codes:{l:"รหัส",t:"enum",keys:d=>d.codes.length?d.codes:[NONE],
  lab:k=>k===NONE?'<span class="nac">(ไม่มีรหัส)</span>':`<span class="code ${SEV[k]||"Medium"}">${k}</span><span>${EXC[k]?EXC[k][0]:""}</span>`,txt:k=>k===NONE?"ไม่มีรหัส":k},
 own:{l:"ผู้รับผิดชอบ",t:"enum",keys:d=>[d.assigned==="eu"?"eu":"acc"],lab:k=>OWN_L[k],txt:k=>OWN_L[k]},
 idate:{l:"วันที่ใบแจ้งหนี้",t:"date",get:d=>d.date},
 up:{l:"เข้าระบบ",t:"date",get:d=>d.up},
 age:{l:"อายุ",t:"num",get:d=>ageDays(d),unit:"วัน"}};
const CF_ORDER=["inv","co","vendor","stax","po","rcv","total","status","codes","own","idate","up","age"];
const cfKeys=(c,d)=>c.keys?c.keys(d):[c.str(d)||NONE];
const cfTxt=(k,key)=>{const c=CFC[k];return c.txt?c.txt(key):(key===NONE?(c.none||"(ว่าง)"):String(key))};
const cfLab=(k,key)=>{const c=CFC[k];if(c.lab)return c.lab(key);return key===NONE?`<span class="nac">${c.none||"(ว่าง)"}</span>`:`<span class="${c.mono?"mono":""}">${esc(key)}</span>`};
const cfCount=()=>Object.keys(CF).length;
const cfSnap=()=>JSON.parse(JSON.stringify(CF));
/* ---------- การกรอง ---------- */
function cfMatch(d,k,f){const c=CFC[k];
 if(c.t==="date"){const v=c.get(d);return !!v&&(!f.from||v>=f.from)&&(!f.to||v<=f.to)}
 if(c.t==="num"){const v=c.get(d);return v!=null&&(f.min==null||v>=f.min)&&(f.max==null||v<=f.max)}
 if(c.t==="text"&&f.mode==="cond"){const s=(c.str(d)||"").toLowerCase(),q=(f.v||"").trim().toLowerCase();
  return f.op==="ncontains"?!s.includes(q):f.op==="starts"?s.startsWith(q):f.op==="eq"?s===q:s.includes(q)}
 return cfKeys(c,d).some(x=>f.sel.includes(x))}
function cfPass(d,ex){if(ex==="*")return true;for(const k in CF){if(k!==ex&&!cfMatch(d,k,CF[k]))return false}return true}
/* รายการหลังตัวกรองด้านบน + ตัวกรองคอลัมน์อื่น (ยกเว้นคอลัมน์ ex) · ex="*" = ไม่ใช้ตัวกรองคอลัมน์เลย */
function baseList(ex){const q=(qText||"").trim().toLowerCase();
 return visible().filter(listFilter).filter(d=>(d.inv+d.po+(d.release||"")+d.vendor+d.stax+d.doc).toLowerCase().includes(q)).filter(d=>cfPass(d,ex))}
/* ---------- สร้างหัวตาราง + แถบสรุป ---------- */
function cfHeadRow(){const th=(k,cls)=>`<th class="${cls||""}" data-col="${k}"><span class="th-in"><span class="th-t">${CFC[k].l}</span><button class="cf-btn" type="button" data-col="${k}" aria-haspopup="dialog" aria-expanded="false" aria-label="ตัวกรอง ${CFC[k].l}" title="ตัวกรอง ${CFC[k].l}" onclick="cfOpen('${k}',this,event)">${icon("filter","sm")}</button></span></th>`;
 return "<tr>"+CF_ORDER.map(k=>th(k,CFC[k].t==="num"?"num":"")).join("")+"</tr>"}
function cfPaintHeads(){document.querySelectorAll("#tview th[data-col]").forEach(th=>{const k=th.dataset.col,on=!!CF[k];th.classList.toggle("cf-on",on);
  const b=th.querySelector(".cf-btn");if(b){const t="ตัวกรอง "+CFC[k].l+(on?" (กำลังกรอง: "+cfSum(k,CF[k])+")":"");b.setAttribute("aria-label",t);b.title=t}})}
function cfPaintBar(){const el=$("cfbar");if(!el)return;const ks=CF_ORDER.filter(k=>CF[k]);
 if(!ks.length){el.hidden=true;el.innerHTML="";return}
 const total=baseList("*").length,n=baseList(null).length;el.hidden=false;
 el.innerHTML=`<span class="cfl">${icon("filter","sm")}ตัวกรองคอลัมน์</span>`+ks.map(k=>`<span class="cfchip"><button type="button" class="cfchip-t" title="แก้ไขตัวกรอง ${CFC[k].l}" onclick="cfOpen('${k}',this,event)">${esc(cfSum(k,CF[k]))}</button><button type="button" class="cfchip-x" aria-label="ลบตัวกรอง ${CFC[k].l}" title="ลบตัวกรองนี้" onclick="cfRemove('${k}')">${icon("x","sm")}</button></span>`).join("")
  +`<span class="grow"></span><span class="muted sm">ตรงเงื่อนไข <b>${n}</b> จาก ${total} ฉบับ</span><button type="button" class="link" onclick="cfClearAll()">ล้างทั้งหมด</button>`}
/* ---------- ประโยคอธิบายตัวกรอง (ใช้ทั้งชิปและกล่องตัวกรอง) ---------- */
function cfSum(k,f){const c=CFC[k];
 if(c.t==="date"){const a=f.from,b=f.to;return a&&b?`${c.l} ระหว่าง ${dmy(a)} ถึง ${dmy(b)}`:a?`${c.l} ตั้งแต่ ${dmy(a)}`:b?`${c.l} ไม่เกิน ${dmy(b)}`:""}
 if(c.t==="num"){const u=" "+c.unit,a=f.min,b=f.max;
  return a!=null&&b!=null?(a===b?`${c.l} เท่ากับ ${nfmt(a)}${u}`:`${c.l} ระหว่าง ${nfmt(a)} ถึง ${nfmt(b)}${u}`):a!=null?`${c.l} ตั้งแต่ ${nfmt(a)}${u} ขึ้นไป`:b!=null?`${c.l} ไม่เกิน ${nfmt(b)}${u}`:""}
 if(c.t==="text"&&f.mode==="cond")return (f.v||"").trim()?`${c.l} ${OPL[f.op]} “${f.v.trim()}”`:"";
 const s=f.sel||[];if(!s.length)return "";const t=s.map(x=>cfTxt(k,x));
 return `${c.l} เป็น ${t.length<=2?t.join(" หรือ "):t.slice(0,2).join(", ")+" และอีก "+(t.length-2)+" ค่า"}`}
/* ---------- ตัวเลือกในรายการ ---------- */
function cfOpts(k,base){const c=CFC[k],m=new Map();
 base.forEach(d=>{new Set(cfKeys(c,d)).forEach(x=>m.set(x,(m.get(x)||0)+1))});
 return [...m].map(([key,n])=>({key,n})).sort((a,b)=>{if(a.key===NONE)return 1;if(b.key===NONE)return -1;
  if(k==="status")return ST_ORDER.indexOf(a.key)-ST_ORDER.indexOf(b.key);if(k==="own")return a.key<b.key?-1:1;
  return String(a.key).localeCompare(String(b.key),"th",{numeric:true})})}
function cfDefault(k){const t=CFC[k].t;return t==="date"?{from:"",to:"",preset:""}:t==="num"?{min:null,max:null}:{mode:"list",sel:null,op:"contains",v:""}}
/* ---------- ปุ่มลัด ---------- */
const DP=[["today","วันนี้"],["7d","7 วันล่าสุด"],["30d","30 วันล่าสุด"],["month","เดือนนี้"],["lastm","เดือนก่อน"],["custom","กำหนดเอง"]];
function cfDateRange(p){const ym=TODAY.slice(0,7);
 if(p==="today")return [TODAY,TODAY];if(p==="7d")return [dAdd(TODAY,-6),TODAY];if(p==="30d")return [dAdd(TODAY,-29),TODAY];if(p==="month")return mRange(ym);
 if(p==="lastm"){const [y,m]=ym.split("-").map(Number);return mRange(isoD(new Date(Date.UTC(y,m-2,1))).slice(0,7))}return null}
function cfNumPresets(k){
 if(k==="total")return [{l:"ต่ำกว่า 10,000",max:9999.99},{l:"10,000 – 100,000",min:10000,max:100000},{l:"มากกว่า 100,000",min:100000.01},{l:"เกินวงเงิน APR ("+nfmt(SET.limit.APR)+")",min:SET.limit.APR+0.01}];
 return [{l:"วันนี้ (0 วัน)",min:0,max:0},{l:"ไม่เกิน 3 วัน",max:3},{l:"เกิน "+SET.staleDays+" วัน (ค้างนาน)",min:SET.staleDays+1},{l:"เกิน 30 วัน",min:31}]}
/* ---------- เปิด / ปิดกล่องตัวกรอง ---------- */
function cfOpen(k,anchor,ev){if(ev)ev.stopPropagation();
 if(CD&&CD.k===k){cfClose();return}
 cfClose();const c=CFC[k],cur=CF[k],f=cur?JSON.parse(JSON.stringify(cur)):cfDefault(k);
 CD={k,f,q:"",anchor,base:baseList(k)};
 if(c.t==="text"||c.t==="enum"){CD.opts=cfOpts(k,CD.base);if(!f.mode)f.mode="list";if(!Array.isArray(f.sel))f.sel=CD.opts.map(o=>o.key)}
 const p=document.createElement("div");p.id="cfp";p.className="cfp";p.setAttribute("role","dialog");p.setAttribute("aria-label","ตัวกรอง "+c.l);
 p.innerHTML=`<div class="cfp-h">${icon("filter","sm")}<span class="t">ตัวกรอง · ${c.l}</span><span class="grow"></span><button type="button" class="ibtn" aria-label="ปิด (ยกเลิก)" title="ปิด (Esc)" onclick="cfClose()">${icon("x","sm")}</button></div>
  <div class="cfp-sent" id="cfSent"></div><div class="cfp-b" id="cfB"></div>
  <div class="cfp-f"><div class="cfp-pv" id="cfPrev"></div><div class="cfp-err" id="cfErr" role="alert"></div>
   <div class="cfp-ac"><button type="button" class="link" onclick="cfReset()" title="ล้างค่าที่เลือกในกล่องนี้ (ยังไม่มีผลจนกว่าจะกดตกลง)">ล้างค่า</button><span class="grow"></span><button type="button" class="btn btn-sec sm" onclick="cfClose()">ยกเลิก</button><button type="button" class="btn btn-primary sm" id="cfOk" onclick="cfApplyDraft()">ตกลง</button></div>
   <div class="cfp-safe">ยังไม่ใช้ตัวกรองจนกว่าจะกด ตกลง · Esc = ยกเลิก</div></div>`;
 document.body.appendChild(p);
 document.querySelectorAll(".cf-btn").forEach(b=>b.setAttribute("aria-expanded",String(b.dataset.col===k)));
 cfBody();cfRefresh();cfPlace();
 const fi=p.querySelector("#cfQ,#cfVal,#cfMin,#cfFrom");if(fi)fi.focus({preventScroll:true})}
function cfClose(){const p=$("cfp");if(p)p.remove();const a=CD&&CD.anchor;CD=null;
 document.querySelectorAll(".cf-btn").forEach(b=>b.setAttribute("aria-expanded","false"));
 if(a&&a.isConnected&&a.focus)a.focus({preventScroll:true})}
function cfPlace(){const p=$("cfp");if(!p||!CD)return;let a=CD.anchor;if(!a||!a.isConnected||!a.getBoundingClientRect().width)a=$("cfbar")&&!$("cfbar").hidden?$("cfbar"):$("tview");
 const r=a.getBoundingClientRect(),w=p.offsetWidth,h=p.offsetHeight;
 let x=r.left;if(x+w>innerWidth-8)x=r.right-w;x=Math.max(8,Math.min(x,innerWidth-w-8));
 let y=r.bottom+6;if(y+h>innerHeight-8)y=Math.max(8,r.top-h-6);if(y+h>innerHeight-8)y=Math.max(8,innerHeight-h-8);
 p.style.left=x+"px";p.style.top=y+"px"}
/* ---------- เนื้อหาในกล่องตามชนิดคอลัมน์ ---------- */
function cfBody(){const k=CD.k,c=CFC[k],f=CD.f;let h="";
 if(c.t==="text")h+=`<div class="seg cf-seg" role="tablist" aria-label="วิธีกรอง"><button type="button" role="tab" aria-selected="${f.mode==="list"}" class="${f.mode==="list"?"on":""}" onclick="cfSetMode('list')">เลือกจากรายการ</button><button type="button" role="tab" aria-selected="${f.mode==="cond"}" class="${f.mode==="cond"?"on":""}" onclick="cfSetMode('cond')">ตามเงื่อนไข</button></div>`;
 if(c.t==="enum"||(c.t==="text"&&f.mode==="list"))
  h+=`<div class="cf-search">${icon("search","sm")}<input id="cfQ" type="search" placeholder="ค้นหาในรายการ…" aria-label="ค้นหาค่าในรายการ" value="${escA(CD.q)}" oninput="cfSetQ(this.value)" autocomplete="off"></div>
   <label class="cf-all"><input type="checkbox" id="cfAllBox" onchange="cfSetAll(this.checked)"><b id="cfAllLbl">เลือกทั้งหมด</b><span class="cf-n" id="cfAllN"></span></label><div class="cf-list" id="cfList" role="group" aria-label="ค่าที่เลือกได้"></div>`;
 else if(c.t==="text")
  h+=`<div class="cf-f"><label for="cfOpSel">แสดงแถวที่ ${c.l}</label><select id="cfOpSel" class="sel" onchange="cfSetOp(this.value)">${Object.entries(OPL).map(([a,b])=>`<option value="${a}" ${f.op===a?"selected":""}>${b}</option>`).join("")}</select></div>
   <div class="cf-f"><label for="cfVal">ข้อความ</label><input id="cfVal" class="inp" placeholder="พิมพ์ข้อความที่ต้องการ" value="${escA(f.v||"")}" oninput="cfSetV(this.value)" autocomplete="off"><div class="set-note">ไม่แยกตัวพิมพ์เล็ก / ใหญ่</div></div>`;
 else if(c.t==="num"){const P=cfNumPresets(k);
  h+=`<div class="cf-pre" role="group" aria-label="ปุ่มลัด">${P.map((p,i)=>`<button type="button" class="chip" data-p="${i}" onclick="cfNumPreset(${i})">${p.l}</button>`).join("")}</div>
   <div class="cf-range"><div class="cf-f"><label for="cfMin">ตั้งแต่ (${c.unit})</label><input id="cfMin" class="inp" type="number" min="0" step="any" inputmode="decimal" placeholder="ต่ำสุด" value="${f.min==null?"":f.min}" oninput="cfSetNum('min',this.value)"></div><span class="cf-to">ถึง</span>
   <div class="cf-f"><label for="cfMax">ไม่เกิน (${c.unit})</label><input id="cfMax" class="inp" type="number" min="0" step="any" inputmode="decimal" placeholder="สูงสุด" value="${f.max==null?"":f.max}" oninput="cfSetNum('max',this.value)"></div></div>`}
 else{
  h+=`<div class="cf-pre" role="group" aria-label="ช่วงเวลาที่ใช้บ่อย">${DP.map(([p,l])=>`<button type="button" class="chip" data-p="${p}" onclick="cfDatePreset('${p}')">${l}</button>`).join("")}</div>
   <div class="cf-range"><div class="cf-f"><label for="cfFrom">ตั้งแต่วันที่</label><input id="cfFrom" class="inp" type="date" value="${f.from||""}" oninput="cfSetDate('from',this.value)"></div><span class="cf-to">ถึง</span>
   <div class="cf-f"><label for="cfTo">ถึงวันที่</label><input id="cfTo" class="inp" type="date" value="${f.to||""}" oninput="cfSetDate('to',this.value)"></div></div>
   <div class="cf-dur" id="cfSum" aria-live="polite"></div>
   <div class="set-note">เว้นวันที่ใดว่างไว้ = ไม่จำกัดด้านนั้น · วันนี้ในระบบจำลอง = ${dmy(TODAY)}</div>`;
  if(k==="up"&&PERS.q.k!=="all")h+=`<div class="note w" style="margin:0">${icon("info","sm")}<div>ตัวกรอง “ช่วงเวลา” ด้านบนยังใช้อยู่ (<b>${perLabel(PERS.q)}</b>) · ผลลัพธ์คือส่วนที่ตรงทั้งสองเงื่อนไข <button type="button" class="link" onclick="cfWidenTop()">ตั้งช่วงเวลาด้านบนเป็น “ทั้งหมด”</button></div></div>`}
 $("cfB").innerHTML=h;if($("cfList"))cfDrawList();cfPaintPre();cfPlace()}
function cfDrawList(){const el=$("cfList");if(!el)return;const k=CD.k,q=CD.q.trim().toLowerCase();
 const vis=CD.opts.map((o,i)=>({o,i})).filter(x=>!q||cfTxt(k,x.o.key).toLowerCase().includes(q));
 el.innerHTML=vis.length?vis.map(({o,i})=>`<label class="cf-it"><input type="checkbox" ${CD.f.sel.includes(o.key)?"checked":""} onchange="cfTog(${i},this.checked)"><span class="cf-lab">${cfLab(k,o.key)}</span><span class="cf-n">${o.n}</span></label>`).join("")
  :`<div class="empty" style="padding:16px 8px">ไม่พบค่าที่ตรงกับ “${esc(CD.q)}”</div>`;cfAllState()}
function cfVisIdx(){const q=CD.q.trim().toLowerCase();return CD.opts.map((o,i)=>i).filter(i=>!q||cfTxt(CD.k,CD.opts[i].key).toLowerCase().includes(q))}
function cfAllState(){const b=$("cfAllBox");if(!b)return;const v=cfVisIdx(),n=v.filter(i=>CD.f.sel.includes(CD.opts[i].key)).length;
 b.checked=v.length>0&&n===v.length;b.indeterminate=n>0&&n<v.length;b.disabled=!v.length;
 const t=$("cfAllN");if(t)t.textContent=CD.f.sel.length+" / "+CD.opts.length;const l=$("cfAllLbl");if(l)l.textContent=CD.q.trim()?"เลือกผลการค้นหาทั้งหมด":"เลือกทั้งหมด"}
function cfTog(i,on){const key=CD.opts[i].key,s=CD.f.sel,j=s.indexOf(key);if(on&&j<0)s.push(key);if(!on&&j>=0)s.splice(j,1);cfAllState();cfRefresh()}
function cfSetAll(on){cfVisIdx().forEach(i=>{const key=CD.opts[i].key,s=CD.f.sel,j=s.indexOf(key);if(on&&j<0)s.push(key);if(!on&&j>=0)s.splice(j,1)});cfDrawList();cfRefresh()}
function cfSetQ(v){CD.q=v;if(v.trim())CD.f.sel=cfVisIdx().map(i=>CD.opts[i].key);cfDrawList();cfRefresh()}
function cfSetMode(m){if(CD.f.mode===m)return;CD.f.mode=m;CD.q="";cfBody();cfRefresh();const fi=$("cfQ")||$("cfVal");if(fi)fi.focus({preventScroll:true})}
function cfSetOp(v){CD.f.op=v;cfRefresh()}
function cfSetV(v){CD.f.v=v;cfRefresh()}
function cfSetNum(w,v){const n=v===""?null:Number(v);CD.f[w]=(n==null||isNaN(n))?null:n;cfPaintPre();cfRefresh()}
function cfNumPreset(i){const p=cfNumPresets(CD.k)[i];CD.f.min=p.min==null?null:p.min;CD.f.max=p.max==null?null:p.max;
 $("cfMin").value=CD.f.min==null?"":CD.f.min;$("cfMax").value=CD.f.max==null?"":CD.f.max;cfPaintPre();cfRefresh()}
function cfSetDate(w,v){CD.f[w]=v;CD.f.preset="custom";cfPaintPre();cfRefresh()}
function cfDatePreset(p){if(p==="custom"){CD.f.preset="custom";cfPaintPre();$("cfFrom").focus();cfRefresh();return}
 const r=cfDateRange(p);CD.f.from=r[0];CD.f.to=r[1];CD.f.preset=p;$("cfFrom").value=r[0];$("cfTo").value=r[1];cfPaintPre();cfRefresh()}
function cfPaintPre(){const k=CD&&CD.k;if(!k)return;const c=CFC[k],f=CD.f;
 document.querySelectorAll("#cfp .cf-pre .chip").forEach(b=>{let on=false;
  if(c.t==="date")on=f.preset===b.dataset.p;
  else if(c.t==="num"){const p=cfNumPresets(k)[+b.dataset.p];on=(f.min??null)===(p.min??null)&&(f.max??null)===(p.max??null)}
  b.classList.toggle("on",on);b.setAttribute("aria-pressed",String(on))})}
function cfWidenTop(){PERS.q={k:"all"};storageSet(perKey(),JSON.stringify(PERS.q));cfAfter();if(CD){CD.base=baseList(CD.k);cfBody();cfRefresh()}toast("ตั้งช่วงเวลาด้านบนเป็น “ทั้งหมด” แล้ว")}
/* ---------- ตรวจค่า / สรุป / ผลลัพธ์ล่วงหน้า ---------- */
function cfNorm(k,f){const c=CFC[k];
 if(c.t==="date")return (f.from||f.to)?{from:f.from||"",to:f.to||"",preset:f.preset||"custom"}:null;
 if(c.t==="num")return (f.min!=null||f.max!=null)?{min:f.min,max:f.max}:null;
 if(c.t==="text"&&f.mode==="cond")return (f.v||"").trim()?{mode:"cond",op:f.op,v:f.v.trim()}:null;
 if(CD&&CD.k===k&&CD.opts&&CD.opts.every(o=>f.sel.includes(o.key)))return null;
 return {mode:"list",sel:[...f.sel]}}
function cfValid(k,f){const c=CFC[k];
 if(c.t==="date"&&f.from&&f.to&&f.from>f.to)return "วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด";
 if(c.t==="num"&&f.min!=null&&f.max!=null&&f.min>f.max)return "ค่าต่ำสุดต้องไม่มากกว่าค่าสูงสุด";
 if(c.t==="num"&&((f.min!=null&&f.min<0)||(f.max!=null&&f.max<0)))return "ใส่ค่าตั้งแต่ 0 ขึ้นไป";
 if((c.t==="enum"||(c.t==="text"&&f.mode==="list"))&&!f.sel.length)return "เลือกอย่างน้อย 1 ค่า (หรือกด “ล้างค่า” เพื่อแสดงทั้งหมด)";
 return ""}
function cfRefresh(){if(!CD)return;const k=CD.k,f=CD.f,err=cfValid(k,f),n=cfNorm(k,f);
 $("cfErr").innerHTML=err?icon("alert","sm")+esc(err):"";$("cfOk").disabled=!!err;
 $("cfSent").innerHTML=err?"ตรวจค่าที่กรอกอีกครั้ง":n?`แสดงเฉพาะแถวที่ <b>${esc(cfSum(k,n))}</b>`:"ยังไม่ได้กรองคอลัมน์นี้ · แสดงทุกแถว";
 const m=err?null:CD.base.filter(d=>!n||cfMatch(d,k,n)).length;
 $("cfPrev").innerHTML=err?"":`ผลลัพธ์ <b>${m}</b> จาก ${CD.base.length} ฉบับ`+(m===0?` <span class="pre-x">· ไม่มีเอกสารตรงเงื่อนไข</span>`:"");
 const s=$("cfSum");if(s){const a=f.from,b=f.to;s.textContent=!a&&!b?"ยังไม่ได้เลือกช่วงวันที่":a&&b?(a>b?"—":dmy(a)+" – "+dmy(b)+" · "+(Math.round((new Date(b+"T00:00:00Z")-new Date(a+"T00:00:00Z"))/864e5)+1)+" วัน"):a?"ตั้งแต่ "+dmy(a)+" เป็นต้นไป":"ถึง "+dmy(b)+" และก่อนหน้า"}}
function cfReset(){const k=CD.k;CD.f=cfDefault(k);if(CD.opts){CD.f.mode=CFC[k].t==="text"?CD.f.mode:"list";CD.f.sel=CD.opts.map(o=>o.key)}CD.q="";cfBody();cfRefresh()}
/* ---------- ใช้ / ล้าง / เลิกทำ ---------- */
function cfAfter(){queuePage()}
function cfApplyDraft(){if(!CD)return;const k=CD.k;if(cfValid(k,CD.f))return;const n=cfNorm(k,CD.f),snap=cfSnap();
 if(n)CF[k]=n;else delete CF[k];const changed=JSON.stringify(snap[k]||null)!==JSON.stringify(CF[k]||null);
 cfClose();cfAfter();if(changed)toastUndo(n?`ใช้ตัวกรอง “${CFC[k].l}” แล้ว`:`ล้างตัวกรอง “${CFC[k].l}” แล้ว`,snap)}
function cfRemove(k){const snap=cfSnap();delete CF[k];if(CD)cfClose();cfAfter();toastUndo(`ล้างตัวกรอง “${CFC[k].l}” แล้ว`,snap)}
function cfClearAll(){if(!cfCount())return;const snap=cfSnap();CF={};if(CD)cfClose();cfAfter();toastUndo("ล้างตัวกรองคอลัมน์ทั้งหมดแล้ว",snap)}
function toastUndo(m,snap){document.querySelectorAll(".toast.tu").forEach(x=>x.remove());const t=document.createElement("div");t.className="toast tu";t.setAttribute("role","status");
 t.innerHTML=icon("checkc")+`<span>${m}</span><button type="button" class="tu-b">เลิกทำ</button>`;
 t.querySelector("button").onclick=()=>{CF=JSON.parse(JSON.stringify(snap));t.remove();cfAfter();toast("เลิกทำแล้ว")};
 $("toasts").appendChild(t);setTimeout(()=>t.remove(),7000)}
/* ---------- เหตุการณ์ทั่วไป ---------- */
document.addEventListener("keydown",e=>{if(!CD)return;const p=$("cfp");
 if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();cfClose();return}
 if(e.key==="Enter"&&p&&p.contains(e.target)&&/^(INPUT|SELECT)$/.test(e.target.tagName)&&e.target.type!=="checkbox"){e.preventDefault();e.stopImmediatePropagation();if(!$("cfOk").disabled)cfApplyDraft();return}
 if(e.key==="Tab"&&p){const f=[...p.querySelectorAll("button:not(:disabled),input:not(:disabled),select")].filter(x=>x.offsetParent);if(!f.length)return;
  const a=document.activeElement,first=f[0],last=f[f.length-1];
  if(!p.contains(a)){e.preventDefault();first.focus()}else if(e.shiftKey&&a===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&a===last){e.preventDefault();first.focus()}}},true);
document.addEventListener("mousedown",e=>{if(CD&&!e.target.closest("#cfp,.cf-btn,.cfchip"))cfClose()},true);
addEventListener("resize",()=>{if(CD)cfPlace()});
document.addEventListener("scroll",()=>{if(CD)cfPlace()},true);

simSeed();
init();

}
