import { LitElement, html, css } from "lit";

export class App extends LitElement {
  static properties = {
    controlType: { type: String, attribute: "control-type" },
    model: { type: String },
  };

  static styles = css`
    :host {
      display: table;
      width: 100%;
      height: 100%;
    }
  `;

  constructor() {
    super();
  }

  render() {
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

      <rodo-canvas
        control-type="${this.controlType}"
        model="${this.model}"
      ></rodo-canvas>`;
  }
}

window.customElements.define("rodo-app", App);
