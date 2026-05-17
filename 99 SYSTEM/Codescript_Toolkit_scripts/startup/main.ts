import { invoke as ythoverPlayer } from './Youtube-Hover-Player.ts';
import { invoke as calloutOverrider } from './Callout-Overrider.ts';
import { invoke as backlinksdisplayerforhoverEditor } from './Backlinks-Displayer.ts';
import { invoke as notecreationGuard } from './Note-Creation-Guard.ts';
import { invoke as webViewerDark } from './Webviewer-Dark-Reader-Mode.ts';
import { invoke as zoomsetLinux } from './Maximize-Window&Zoom-Set-Linux.ts';
import { invoke as ctrlxOverrider } from './CtrlX-Overrider.ts';
import { invoke as linkopeningRestore } from './Link-Opening-Restore.ts';

export async function invoke(app: App): Promise<void> {
  await ythoverPlayer(app);
  await calloutOverrider(app);
  await backlinksdisplayerforhoverEditor(app);
  await notecreationGuard(app);
  await webViewerDark(app);
  await zoomsetLinux(app);
  await ctrlxOverrider(app);
  await linkopeningRestore(app);
}
