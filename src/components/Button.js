import { LitElement, html, css } from "lit";
import { classMap } from "lit/directives/class-map.js";

export class Button extends LitElement {
  static properties = {
    title: { type: String },
    size: { type: String },
  };

  static styles = css`
    button {
      height: 40px;
      min-width: 40px;
      padding: 0px 8px;
      border: 1px solid var(--rodo-button-border-color, #8699a6);
      border-radius: var(--rodo-button-border-radius, 2px);
      background-color: var(--rodo-button-background-color, #414952);
      color: var(--rodo-button-color, #b1c5cb);
      cursor: pointer;
      margin: 0;
    }

    button.small {
      height: 24px;
      min-width: 40px;
      padding: 0px 4px;
    }

    slot {
      display: flex;
      justify-content: center;
      align-content: center;
    }
  `;

  constructor() {
    super();
    this.size = "normal";
  }

  render() {
    return html`<button
      class="${classMap({ small: this.size === "small" })}"
      title="${this.title}"
    >
      <slot></slot>
    </button>`;
  }
}

window.customElements.define("rodo-button", Button);
