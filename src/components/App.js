import { LitElement, html, css } from "lit";

export class App extends LitElement {
  static properties = {
    control: { type: String },
    model: { type: String },
  };

  static styles = css`
    rodo-canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `;

  constructor() {
    super();
  }

  #changeMode(event) {
    this.control = event.detail.control;
  }

  #showAbout() {
    alert("Rodones Map Viewer v0.3");
  }

  #renderLayout() {
    return html`
      <rodo-rectangular-layout position="right" align="right">
        <rodo-button title="about" @click="${this.#showAbout}">A</rodo-button>
      </rodo-rectangular-layout>

      <rodo-rectangular-layout position="bottom" align="right">
        <rodo-change-control-button
          @controlChanged="${this.#changeMode}"
          control=${this.control}
        ></rodo-change-control-button>
      </rodo-rectangular-layout>
    `;
  }

  #renderCanvas() {
    return html`<rodo-canvas
      control="${this.control}"
      model="${this.model}"
    ></rodo-canvas>`;
  }

  render() {
    return [this.#renderLayout(), this.#renderCanvas()];
  }
}

window.customElements.define("rodo-app", App);
