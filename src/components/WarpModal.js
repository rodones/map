import { html } from "lit";
import { ModalElement } from "./Modal";

export class WarpModal extends ModalElement {
  static properties = {
    places: { type: Array },
  };

  #warp(e) {
    const position = e.target.dataset.position
      .split(",")
      .filter((x) => x !== "" && !Number.isNaN(x))
      .concat([0, 0, 0])
      .slice(0, 3)
      .map(Number.parseFloat);

    this.dispatchEvent(
      new CustomEvent("warp", {
        detail: {
          position,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`<style>
        main {
          font-size: 0.75rem;
          padding: 8px !important;

        }

        a {
          color: inherit;
          text-decoration: underline;
        }

        .places {
          display: grid;
          gap: 4px;
          grid-template-columns: repeat(3, 1fr);
        }

        .place {
          --rodo-button-height: 80px;
          --rodo-button-min-width: 80px;
          --rodo-button-border-radius: 0;
        }
      </style>
      <header class="center">
        <div role="heading">
          <b>Places</b>
        </div>
      </header>
      <main>
        <div class="places">
          ${this.places.map(
            ({ abbr, position, name }) =>
              html`<rodo-button
                class="place"
                data-position="${position}"
                title="${name}"
                @click="${this.#warp}"
              >
                ${abbr}
              </rodo-button>`,
          )}
        </div>
      </main>
      <footer class="right">
        <rodo-button size="small" @click="${this.createDispatcher(
          "close",
        )}">CLOSE</button>
      </footer>`;
  }
}

window.customElements.define("rodo-warp-modal", WarpModal);
