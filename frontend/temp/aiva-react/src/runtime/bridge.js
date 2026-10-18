import { initializeIcons } from "./icons.js";
import { initializeCore } from "./core.js";
import { initializePermissions } from "./permissions.js";
import { initializeLogin } from "./login.js";
import { initializeEffects } from "./effects.js";
let initialized = false;
const handlers = [function(event){switchUser()},function(event){toggleNav()},function(event){toggleNav()},function(event){if(event.target===this)closeM()},function(event){closeM()}];
export function dispatch(index, event) {
 const result = handlers[index]?.call(event.currentTarget, event.nativeEvent || event);
 if (result === false) { event.preventDefault(); event.stopPropagation(); }
 return result;
}
export function initialize() {
 if (initialized) return;
 initialized = true;
initializeIcons();
initializeCore();
initializePermissions();
initializeLogin();
initializeEffects();
}
