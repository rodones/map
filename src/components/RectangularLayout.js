import { LitElement, html, css } from "lit";

export class RectangularLayout extends LitElement {
  static properties = {
    position: { type: String },
    align: { type: String },
  };

  static styles = css`
    :host {
      --size: 40px;
      --gap: 4px;
    }

    div {
      color: white;
      position: absolute;
      z-index: 2;
      display: flex;
      margin: var(--gap);
      gap: var(--gap);
    }

    .p-top {
      top: 0;
      height: var(--size);
      flex-direction: row;
      flex-wrap: nowrap;
    }
    .p-bottom {
      bottom: 0;
      height: var(--size);
      flex-direction: row;
      flex-wrap: nowrap;
    }
    .p-left {
      left: 0;
      width: var(--size);
      flex-direction: column;
      flex-wrap: nowrap;
    }
    .p-right {
      right: 0;
      width: var(--size);
      flex-direction: column;
      flex-wrap: nowrap;
    }

    .p-top.s-center,
    .p-bottom.s-center {
      left: 50%;
      transform: translateX(-50%);
    }
    .p-top.s-right,
    .p-bottom.s-right {
      right: 0;
      margin-right: calc(var(--size) + var(--gap));
      flex-direction: row-reverse;
    }
    .p-top.s-left,
    .p-bottom.s-left {
      margin-left: calc(var(--size) + var(--gap));
    }

    .p-left.s-center,
    .p-right.s-center {
      top: 50%;
      transform: translateY(-50%);
    }
    .p-left.s-left,
    .p-right.s-right {
      bottom: 0;
      margin-bottom: calc(var(--size) + var(--gap));
      flex-direction: column-reverse;
    }
    .p-left.s-right,
    .p-right.s-left {
      margin-top: calc(var(--size) + var(--gap));
    }
  `;

  static #alignValues = Object.freeze(["right", "center", "left"]);
  static #positionValues = Object.freeze(["top", "right", "bottom", "left"]);

  constructor() {
    super();
    this.align = "center";
  }

  connectedCallback() {
    if (!RectangularLayout.#alignValues.includes(this.align))
      throw Error(
        `The 'align' property accepts only ${this.constructor.#alignValues
          .map((v) => `'${v}'`)
          .join(", ")} but '${this.align}' was passed.`,
      );

    if (!RectangularLayout.#positionValues.includes(this.position))
      throw Error(
        `The 'position' property accepts only ${this.constructor.#positionValues
          .map((v) => `'${v}'`)
          .join(", ")} but '${this.position}' was passed.`,
      );

    super.connectedCallback();
  }

  #getClassName() {
    return `p-${this.position} ${`s-${this.align}`}`;
  }

  render() {
    return html`<div class="${this.#getClassName()}">
      <slot></slot>
    </div>`;
  }
}

window.customElements.define("rodo-rectangular-layout", RectangularLayout);
