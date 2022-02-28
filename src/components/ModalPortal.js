import { LitElement, html, css } from "lit";
import { classMap } from "lit/directives/class-map.js";

class ModalPortal extends LitElement {
  static properties = {
    content: { type: Array, state: true },
  };

  static styles = css`
    .wrapper {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 111;
    }

    .hidden {
      display: none;
    }

    .content {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      border: 1px solid #8699a6;
      border-radius: 2px;
      background-color: #414952;
      color: #b1c5cb;
      margin: 0;
    }

    header,
    footer {
      display: flex;
      align-items: center;
      padding: 8px;
    }

    header {
      border-bottom: 1px solid #69737d;
      display: flex;
    }

    main {
      padding: 0px 8px;
    }

    footer {
      border-top: 1px solid #69737d;
      display: flex;
    }

    .between {
      justify-content: space-between;
    }

    .right {
      justify-content: right;
    }

    .center {
      justify-content: center;
    }
  `;

  constructor() {
    super();
    this.content = [];
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("portal-open", this.#onOpen, true);
    document.addEventListener("portal-close", this.#onClose, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("portal-open", this.#onOpen, true);
    document.removeEventListener("portal-close", this.#onClose, true);
  }

  #onOpen = (e) => {
    this.content = e.detail.content;
  };

  #onClose = () => {
    this.content = [];
  };

  render() {
    return html`<div
      class="wrapper ${classMap({ hidden: this.content.length === 0 })}"
    >
      <div class="content">${this.content}</div>
    </div>`;
  }
}

customElements.define("rodo-modal-portal", ModalPortal);
