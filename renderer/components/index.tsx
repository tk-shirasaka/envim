import React from "react";
import ReactDom from "react-dom";

import "../styles/index.scss";

import { AppComponent } from "./app";

ReactDom.render(<AppComponent />, document.getElementById("app"));
