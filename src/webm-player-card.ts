import { LitElement, html, customElement, property, TemplateResult, PropertyValues, state } from 'lit-element';
import { computeCardSize, HomeAssistant, LovelaceCard, handleAction, ActionHandlerEvent } from 'custom-card-helpers';

import { ConfigTemplateConfig } from './types';
import { CARD_VERSION } from './const';

/* eslint no-console: 0 */
console.info(
  `%c  WEBM-PLAYER-CARD  \n%c  Version ${CARD_VERSION}         `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

@customElement('webm-player-card')
export class WebmPlayerCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: ConfigTemplateConfig;
  @state() private _helpers?: any;
  private _initialized = false;

  private hasAction(config?): boolean {
    return config !== undefined && config.action !== "none";
  }

  public setConfig(config: ConfigTemplateConfig): void {
    if (!config) {
      throw new Error('Invalid configuration');
    }

    if (!config.url) {
      throw new Error('No url defined');
    }

    this._config = config;

    this.loadCardHelpers();
  }

  private getLovelacePanel() {
    const ha = document.querySelector("home-assistant");

    if (ha && ha.shadowRoot) {
      const haMain = ha.shadowRoot.querySelector("home-assistant-main");

      if (haMain && haMain.shadowRoot) {
        return haMain.shadowRoot.querySelector('ha-panel-lovelace');
      }
    }

    return null
  }

  private getLovelaceConfig() {
    const panel = this.getLovelacePanel() as any;

    if (panel && panel.lovelace && panel.lovelace.config && panel.lovelace.config.config_template_card_vars) {
      return panel.lovelace.config.config_template_card_vars
    }

    return {}
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this._initialized) {
      this._initialize();
    }

    if (changedProps.has('_config')) {
      return true;
    }

    if (this._config) {
      const oldHass = changedProps.get('hass') as HomeAssistant | undefined;

      if (oldHass) {
        return false;
      }
    }

    return true;
  }

  public getCardSize(): number | Promise<number> {
    if (this.shadowRoot) {
      const element = this.shadowRoot.querySelector('#card > *') as LovelaceCard;
      if (element) {
        console.log('computeCardSize is ' + computeCardSize(element));
        return computeCardSize(element);
      }
    }

    return 1;
  }

  private _handleAction(ev: ActionHandlerEvent) {
    handleAction(this, this.hass!, this._config!, ev.detail.action!);
  }

  protected render(): TemplateResult | void {
    if (!this._config) {
      return html``
    }



    return html`
      <ha-card
          @action=${this._handleAction}
      >
        <div class="card-content">
          <video controls width="100%" height="100%" loop=true autoplay muted>
            <source src="${this._config.url}" type="video/webm"/>
          </video>
        </div>
      </ha-card>
    `;
  }

  private _initialize(): void {
    if (this.hass === undefined) return;
    if (this._config === undefined) return;
    if (this._helpers === undefined) return;
    this._initialized = true;
  }

  private async loadCardHelpers(): Promise<void> {
    this._helpers = await (window as any).loadCardHelpers();
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private _evaluateConfig(config: any): any {
    Object.entries(config).forEach(entry => {
      const key = entry[0];
      const value = entry[1];

      if (value !== null) {
        if (value instanceof Array) {
          config[key] = this._evaluateArray(value);
        } else if (typeof value === 'object') {
          config[key] = this._evaluateConfig(value);
        } else if (typeof value === 'string' && value.includes('${')) {
          config[key] = this._evaluateTemplate(value);
        }
      }
    });

    return config;
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private _evaluateArray(array: any): any {
    for (let i = 0; i < array.length; ++i) {
      const value = array[i];
      if (value instanceof Array) {
        array[i] = this._evaluateArray(value);
      } else if (typeof value === 'object') {
        array[i] = this._evaluateConfig(value);
      } else if (typeof value === 'string' && value.includes('${')) {
        array[i] = this._evaluateTemplate(value);
      }
    }

    return array;
  }

  private _evaluateTemplate(template: string): string {
    if (!template.includes('${')) {
      return template;
    }

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const user = this.hass ? this.hass.user : undefined;
    const states = this.hass ? this.hass.states : undefined;
    const vars: any[] = [];
    const namedVars: { [key: string]: any } = {};
    const arrayVars: string[] = [];
    let varDef = '';

    const localVars = this.getLovelaceConfig();

    if (localVars) {
      if (Array.isArray(localVars)) {
        arrayVars.push(...localVars);
      } else {
        Object.assign(namedVars, localVars);
      }
    }

    for (const v in arrayVars) {
      const newV = eval(arrayVars[v]);
      vars.push(newV);
    }

    for (const varName in namedVars) {
      const newV = eval(namedVars[varName]);
      vars[varName] = newV;
      // create variable definitions to be injected:
      varDef = varDef + `var ${varName} = vars['${varName}'];\n`;
    }

    return eval(varDef + template.substring(2, template.length - 1));
  }
}
