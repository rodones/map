import "./index.css";

import { registerComponents } from "./components";
import { html, render } from "lit-html";

const createApp = () => {
  const modelBase = "https://rodones.fra1.digitaloceanspaces.com/map/meshes/";

  const searchParams = new URL(window.location).searchParams;

  const modelName = searchParams.get("model") || "sonnn.nxs";

  const controlType = searchParams.get("control") || "trackball";
  const model = modelBase + modelName;

  return html`<rodo-sidebar>
      <rodo-sidebar-button
        text="A"
        title="an example action button a"
      ></rodo-sidebar-button>
      <rodo-sidebar-button
        text="B"
        title="an example action button b"
      ></rodo-sidebar-button>
      <rodo-sidebar-button
        text="C"
        title="an example action button c"
      ></rodo-sidebar-button>
    </rodo-sidebar>

    <rodo-canvas control-type="${controlType}" model="${model}"></rodo-canvas>`;
};

registerComponents();

window.onload = () => {
  render(createApp(), document.getElementById("root"));
};
