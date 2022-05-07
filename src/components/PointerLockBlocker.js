import { LitElement, html, css } from "lit";

export class PointerLockBlocker extends LitElement {
  static get styles() {
    return css`
      .blocker {
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        user-select: none;
      }

      .instructions {
        width: 100%;
        height: 100%;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        text-align: center;
        font-size: 14px;
        cursor: pointer;

        color: whitesmoke;
      }

      .keys tr {
        height: 24px;
      }

      .keys td:nth-child(2n + 1) {
        text-align: left;
        min-width: 90px;
      }

      .key {
        background-color: #414952;
        border: 1px solid black;
        border-radius: 4px;
        padding: 1px 2px;
        margin: 1px;
      }

      .locked {
        display: none;
      }

      @media (pointer: coarse) {
        .blocker {
          display: none;
        }
      }
    `;
  }

  static properties = {
    lock: { type: Boolean },
  };

  constructor() {
    super();
    this.show = true;
  }

  render() {
    return html`<div class="blocker ${this.lock ? "locked" : ""}">
      <div class="instructions">
        <div style="font-size:36px">Click to start</div>
        <table class="keys">
          <tbody>
            <tr>
              <td>Move</td>
              <td>
                <span class="key">W</span><span class="key">A</span
                ><span class="key">S</span><span class="key">D</span>
              </td>
            </div>
            <tr>
              <td>Jump</td>
              <td><span class="key">SPACE</span></td>
            </tr>
            <tr>
              <td>Look</td>
              <td><span class="key">MOUSE</span></td>
            </tr>
            <tr>
              <td>Exit</td>
              <td><span class="key">M</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;
  }
}

window.customElements.define("rodo-pointer-lock-blocker", PointerLockBlocker);
