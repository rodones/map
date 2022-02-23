import { LitElement, html, css } from "lit";
import { map } from "lit/directives/map.js";
import { classMap } from "lit/directives/class-map.js";

export class ChangeControlButton extends LitElement {
  static properties = {
    title: { type: String },
    control: { type: String },
    _opened: { state: true },
  };

  static styles = css`
    .active {
      --rodo-button-border-color: goldenrod;
    }

    .controls > * {
      margin: 0 1px;
    }
  `;

  #controlValues = ["pointer-lock", "map", "orbit", "trackball"];

  constructor() {
    super();
    this._opened = false;
  }

  updated(changedProperties) {
    if (changedProperties.has("control")) {
      this.#reorderControlValues();
    }
  }

  #reorderControlValues() {
    this.#controlValues.splice(this.#controlValues.indexOf(this.control), 1);
    this.#controlValues.push(this.control);
  }

  #controlStylized(control) {
    return control.replace("-", " ").toUpperCase();
  }

  #showOptions = () => {
    this._opened = true;
  };

  #renderOptions() {
    return html`<div class="controls" @click="${this.#handleChange}">
      ${map(
        this.#controlValues,
        (control) => html`<rodo-button
          title="Change mode"
          data-control="${control}"
          class=${classMap({ active: control === this.control })}
        >
          ${this.#controlStylized(control)}
        </rodo-button>`,
      )}
    </div>`;
  }

  #renderToggle() {
    return html`<rodo-button title="Change mode" @click="${this.#showOptions}">
      ${this.#controlStylized(this.control)}
    </rodo-button>`;
  }

  #handleChange(event) {
    const control = event.target.dataset.control;

    this.dispatchEvent(
      new CustomEvent("controlChanged", {
        detail: {
          control,
        },
        bubbles: true,
        composed: true,
      }),
    );
    this._opened = false;
  }

  render() {
    return html`${this._opened ? this.#renderOptions() : this.#renderToggle()}`;
  }
}

window.customElements.define("rodo-change-control-button", ChangeControlButton);
