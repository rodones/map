import { html, render } from "lit-html";
import "./components";

window.onload = () => {
  const modelBases = {
    digitalocean: "https://rodones.fra1.digitaloceanspaces.com/map/meshes/",
    static: "/static/",
  };

  const searchParams = new URL(window.location).searchParams;

  const modelBase =
    modelBases[searchParams.get("from")] ?? modelBases["digitalocean"];
  const modelName = searchParams.get("model") ?? "main.nxz";

  const control = searchParams.get("control") ?? "pointer-lock";
  const model = modelBase + modelName;

  const onMapLoaded = () => {
    document.getElementById("rodo-loading").classList.add("hidden");
  };

  render(
    html`<rodo-app
      @mapLoaded="${onMapLoaded}"
      control="${control}"
      model="${model}"
    ></rodo-app>`,
    document.getElementById("rodo-root"),
  );
};
