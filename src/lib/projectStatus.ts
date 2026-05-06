import type { ProjectStatus, Ui } from '../content/types';

export function projectStatusLabel(ui: Ui, status: ProjectStatus): string {
  return ui.projectStatusLabels[status] ?? status;
}
