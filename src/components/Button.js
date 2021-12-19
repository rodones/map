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
      border: 1px solid #8699a6;
      border-radius: 2px;
      background-color: #414952;
      color: #b1c5cb;
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
