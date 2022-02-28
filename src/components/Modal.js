import { LitElement } from "lit";

export class ModalElement extends LitElement {
  createDispatcher =
    (name, detail = {}) =>
    () => {
      this.dispatchEvent(
        new CustomEvent(name, {
          composed: true,
          bubbles: true,
          detail,
        }),
      );
    };

  disconnectedCallback() {
    super.disconnectedCallback();
    document.dispatchEvent(
      new CustomEvent("portal-close", {
        composed: true,
      }),
    );
  }

  firstUpdated() {
    this.dispatchEvent(
      new CustomEvent("portal-open", {
        composed: true,
        detail: {
          content: Array.from(this.shadowRoot.childNodes),
        },
      }),
    );
  }
}
