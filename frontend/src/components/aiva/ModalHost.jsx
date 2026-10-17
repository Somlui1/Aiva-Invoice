import React from "react";
import { dispatch } from "@/runtime/bridge.js";
export default function ModalHost() { return (<div className="ov" id="ov" onClick={(event) => dispatch(3, event)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="mtitle"><div className="mh" id="mh"></div><div className="mb" id="mb"></div>
<div className="mf"><button className="btn btn-sec" onClick={(event) => dispatch(4, event)}>{"ยกเลิก"}</button><button className="btn" id="mok">{"ยืนยัน"}</button></div></div></div>); }
