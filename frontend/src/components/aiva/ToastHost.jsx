import React from "react";
import { dispatch } from "@/runtime/bridge.js";
export default function ToastHost() { return (<div className="toasts" id="toasts" aria-live="polite"></div>); }
