import { LitElement, html, css } from "lit";

export class Sidebar extends LitElement {
  static styles = css`
    :host {
      display: table-cell;
      height: 100%;
      vertical-align: top;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
  `;

  constructor() {
    super();
  }

  render() {
    return html`<ul>
      <slot></slot>
    </ul>`;
  }
}

window.customElements.define("rodo-sidebar", Sidebar);
