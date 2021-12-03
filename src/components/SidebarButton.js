import { LitElement, html, css } from "lit";

export class SidebarButton extends LitElement {
  static properties = {
    text: { type: String },
  };

  static styles = css`
    li {
      height: 40px;
      width: 40px;
      line-height: 40px;
      text-align: center;
      margin: 2px;
      border: 3px solid transparent;
      border-radius: 2px;
      background-color: tomato;
      cursor: pointer;
    }
  `;

  constructor() {
    super();
  }

  render() {
    return html`<li>${this.text}</li>`;
  }
}

export const registerSidebarButton = () =>
  window.customElements.define("rodo-sidebar-button", SidebarButton);
