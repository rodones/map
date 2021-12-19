import "./index.css";
import "./components";
import { html, render } from "lit-html";

const createApp = () => {
  const modelBases = {
    digitalocean: "https://rodones.fra1.digitaloceanspaces.com/map/meshes/",
    static: "/static/",
  };

  const searchParams = new URL(window.location).searchParams;

  const modelBase =
    modelBases[searchParams.get("from")] ?? modelBases["digitalocean"];
  const modelName = searchParams.get("model") ?? "birlesik.nxz";

  const control = searchParams.get("control") ?? "pointer-lock";
  const model = modelBase + modelName;

  return html`<rodo-app control="${control}" model="${model}"></rodo-app>`;
};

window.onload = () => {
  render(createApp(), document.getElementById("rodo-root"));
};
