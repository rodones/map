import { LitElement, html, css } from "lit";

export class App extends LitElement {
  static properties = {
    control: { type: String },
    model: { type: String },
  };

  static styles = css`
    rodo-canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `;

  constructor() {
    super();
  }

  get #nextControlType() {
    const values = ["pointer-lock", "map", "orbit", "trackball"];
    const currentIndex = values.findIndex((value) => value === this.control);
    return values[(currentIndex + 1) % values.length];
  }

  #changeMode() {
    this.control = this.#nextControlType;
  }

  #showAbout() {
    alert("Rodones Map Viewer v0.2");
  }

  #renderButtons() {
    return html`
      <!-- <rodo-button-container position="top" align="left">
        <rodo-button title="tl">tl1</rodo-button>
        <rodo-button title="tl">tl2</rodo-button>
        <rodo-button title="tl">tl3</rodo-button>
      </rodo-button-container> -->
      <!-- <rodo-button-container position="top" align="center">
        <rodo-button title="tc">tc1</rodo-button>
        <rodo-button title="tc">tc2</rodo-button>
        <rodo-button title="tc">tc3</rodo-button>
      </rodo-button-container> -->
      <!-- <rodo-button-container position="top" align="right">
        <rodo-button title="tr">tr1</rodo-button>
        <rodo-button title="tr">tr2</rodo-button>
        <rodo-button title="tr">tr3</rodo-button>
      </rodo-button-container> -->

      <!-- <rodo-button-container position="bottom" align="left">
        <rodo-button title="bl">bl1</rodo-button>
        <rodo-button title="bl">bl2</rodo-button>
        <rodo-button title="bl">bl3</rodo-button>
      </rodo-button-container> -->
      <!-- <rodo-button-container position="bottom" align="center">
        <rodo-button title="bc">bc1</rodo-button>
        <rodo-button title="bc">bc2</rodo-button>
        <rodo-button title="bc">bc3</rodo-button>
      </rodo-button-container> -->

      <!-- <rodo-button-container position="left" align="left">
        <rodo-button title="ll">ll1</rodo-button>
        <rodo-button title="ll">ll2</rodo-button>
        <rodo-button title="ll">ll3</rodo-button>
      </rodo-button-container> -->
      <!-- <rodo-button-container position="left" align="center">
        <rodo-button title="lc">lc1</rodo-button>
        <rodo-button title="lc">lc2</rodo-button>
        <rodo-button title="lc">lc3</rodo-button>
      </rodo-button-container> -->
      <!-- <rodo-button-container position="left" align="right">
        <rodo-button title="lr">lr1</rodo-button>
        <rodo-button title="lr">lr2</rodo-button>
        <rodo-button title="lr">lr3</rodo-button>
      </rodo-button-container> -->

      <!-- <rodo-button-container position="right" align="left">
        <rodo-button title="rl">rl1</rodo-button>
        <rodo-button title="rl">rl2</rodo-button>
        <rodo-button title="rl">rl3</rodo-button>
      </rodo-button-container> -->
      <!-- <rodo-button-container position="right" align="center">
        <rodo-button title="rc">rc1</rodo-button>
        <rodo-button title="rc">rc2</rodo-button>
        <rodo-button title="rc">rc3</rodo-button>
      </rodo-button-container>  -->
      <rodo-button-container position="right" align="right">
        <rodo-button title="about" @click="${this.#showAbout}">A</rodo-button>
        <!-- <rodo-button title="rr">rr2</rodo-button>
        <rodo-button title="rr">rr3</rodo-button> -->
      </rodo-button-container>

      <rodo-button-container position="bottom" align="right">
        <rodo-button
          title="change mode (current: ${this.control})"
          @click="${this.#changeMode}"
          >${this.#nextControlType.replace("-", " ").toUpperCase()}
        </rodo-button>
        <!-- <rodo-button title="br">br2</rodo-button>
        <rodo-button title="br">br3</rodo-button> -->
      </rodo-button-container>
    `;
  }

  #renderCanvas() {
    return html`<rodo-canvas
      control="${this.control}"
      model="${this.model}"
    ></rodo-canvas>`;
  }

  render() {
    return [this.#renderButtons(), this.#renderCanvas()];
  }
}

window.customElements.define("rodo-app", App);
