/**
 * Copies HTML content to the clipboard as Rich Text.
 * @param html - The raw HTML string to be rendered.
 */
export async function copyRichText(html: string): Promise<boolean> {
  const os = Deno.build.os;

  try {
    if (os === "darwin") {
      // macOS: AppleScript can set specific clipboard classes
      const script = `set the clipboard to {«class HTML»:\"${html.replace(/"/g, '\\"')}\"}`;
      const command = new Deno.Command("osascript", {
        args: ["-e", script],
      });
      await command.output();
    } else if (os === "windows") {
      // Windows: PowerShell Set-Clipboard -AsHtml
      // We wrap the HTML in a string and pass it to PowerShell
      const psCommand = `Set-Clipboard -Value '${html}' -AsHtml`;
      const command = new Deno.Command("powershell", {
        args: ["-Command", psCommand],
      });
      await command.output();
    } else if (os === "linux") {
      // Linux: Uses xclip to set the text/html target
      const command = new Deno.Command("xclip", {
        args: ["-selection", "clipboard", "-t", "text/html"],
        stdin: "piped",
      });

      const child = command.spawn();
      const writer = child.stdin.getWriter();
      await writer.write(new TextEncoder().encode(html));
      await writer.close();
      await child.status;
    }

    return true;
  } catch {
    return false;
  }
}
