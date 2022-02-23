import { LitElement, html, css } from "lit";

export class Button extends LitElement {
  static properties = {
    title: { type: String },
  };

  static styles = css`
    button {
      height: 40px;
      min-width: 40px;
      padding: 0px 8px;
      line-height: 34px;
      text-align: center;
      border: 1px solid var(--rodo-button-border-color, #8699a6);
      border-radius: var(--rodo-button-border-radius, 2px);
      background-color: var(--rodo-button-background-color, #414952);
      color: var(--rodo-button-color, #b1c5cb);
      cursor: pointer;
      margin: 0;
    }
  `;

  constructor() {
    super();
  }

  render() {
    return html`<button title="${this.title}"><slot></slot></button>`;
  }
}

window.customElements.define("rodo-button", Button);
