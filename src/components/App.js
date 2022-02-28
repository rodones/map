import { LitElement, html, css } from "lit";

export class App extends LitElement {
  static properties = {
    control: { type: String },
    model: { type: String },
    _showAbout: { state: true },
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
    this._showAbout = false;
  }

  #changeMode(event) {
    this.control = event.detail.control;
  }

  #showAbout() {
    this._showAbout = true;
  }

  #hideAbout() {
    this._showAbout = false;
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

  #renderModalProvider() {
    return html`<rodo-modal-portal></rodo-modal-portal>`;
  }

  #renderAboutModal() {
    return html`<rodo-about-modal
      @close=${this.#hideAbout}
    ></rodo-about-modal>`;
  }

  render() {
    return [
      this.#renderModalProvider(),
      this.#renderLayout(),
      this.#renderCanvas(),
      this._showAbout && this.#renderAboutModal(),
    ];
  }
}

window.customElements.define("rodo-app", App);
