import { LovelaceCardConfig, EntitiesCardEntityConfig, LovelaceElementConfigBase, ActionConfig } from 'custom-card-helpers';

export interface ConfigTemplateConfig {
  type: string;
  url: string;
  card?: LovelaceCardConfig;
  row?: EntitiesCardEntityConfig;
  element?: LovelaceElementConfigBase;
  style?: Record<string, string>;
  entity?: string;
  camera_image?: string;
  hold_action?: ActionConfig;
  tap_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}
