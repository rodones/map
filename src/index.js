import { html, render } from "lit-html";
import "./components";

if (process.env.NODE_ENV != "development") {
  window.onbeforeunload = function (e) {
    const returnValue = "Do you want to exit?";
    const event = e || window.event;

    // For IE and Firefox
    if (event) {
      event.returnValue = returnValue;
    }

    // For Safari
    return returnValue;
  };
}

window.onload = () => {
  const modelBases = {
    digitalocean: "https://rodones2.fra1.digitaloceanspaces.com/map/meshes/",
    static: "/static/",
  };

  const searchParams = new URL(window.location).searchParams;

  const modelBase =
    modelBases[searchParams.get("from")] ?? modelBases["digitalocean"];
  const modelName = searchParams.get("model") ?? "main.nxz";

  const control = searchParams.get("control") ?? "pointer-lock";
  const model = modelBase + modelName;
  const stats = searchParams.get("stats") === "true";

  const onMapLoaded = () => {
    document.getElementById("rodo-loading").classList.add("hidden");
  };

  render(
    html`<rodo-app
      @mapLoaded="${onMapLoaded}"
      control="${control}"
      model="${model}"
      ?stats="${stats}"
    ></rodo-app>`,
    document.getElementById("rodo-root"),
  );
};
