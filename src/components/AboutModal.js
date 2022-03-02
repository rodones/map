import { html } from "lit";
import { ModalElement } from "./Modal";

export class AboutModal extends ModalElement {
  render() {
    return html`<style>
        main {
          font-size: 0.75rem;
        }

        a {
          color: inherit;
          text-decoration: underline;
        }
      </style>
      <header class="center">
        <div role="heading">
          <b>Rodones Map Viewer</b> <i>v${process.env.RODONES_MAP_VERSION}</i>
        </div>
      </header>
      <main>
        <p>Rodones Map Viewer is a web based FPS mesh viwer.</p>
        <p>
          Build Date: ${process.env.RODONES_MAP_BUILT_DATE}
        </p>
        <p>
          The <a href="https://github.com/rodones/map">source code</a> is
          published under BSD 3-Clause License.
        </p>
        <p>
          Copyright © 2021-2022 Rodones Mapping Project
          <br />
          (<a href="https://akdeniz.dev">Gökberk Akdeniz</a>,
          <a href="https://hakanalp.dev">Hakan Alp</a>,
          <a href="https://demiray.dev">Arif Burak Demiray</a>,
          <a href="mailto:caneralparslan@std.iyte.edu.tr">Caner Alparslan</a>)
        </p>
      </main>
      <footer class="right">
        <rodo-button size="small" @click="${this.createDispatcher(
          "close",
        )}">CLOSE</button>
      </footer>`;
  }
}

window.customElements.define("rodo-about-modal", AboutModal);
