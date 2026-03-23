"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

interface ToolStatusProps {
  toolInvocation: ToolInvocation;
}

function getFilename(path: string): string {
  return path.split("/").pop() || path;
}

export function getToolLabel(
  toolName: string,
  args: Record<string, unknown>,
  state: string
): string {
  const isDone = state === "result";
  const path = typeof args.path === "string" ? args.path : "";
  const filename = getFilename(path);

  if (toolName === "str_replace_editor") {
    const command = args.command as string;
    switch (command) {
      case "create":
        return isDone ? `Created ${filename}` : `Creating ${filename}`;
      case "str_replace":
        return isDone ? `Edited ${filename}` : `Editing ${filename}`;
      case "insert":
        return isDone ? `Edited ${filename}` : `Editing ${filename}`;
      case "view":
        return isDone ? `Viewed ${filename}` : `Viewing ${filename}`;
      case "undo_edit":
        return isDone ? `Reverted ${filename}` : `Reverting ${filename}`;
      default:
        return toolName;
    }
  }

  if (toolName === "file_manager") {
    const command = args.command as string;
    const newPath = typeof args.new_path === "string" ? args.new_path : "";
    switch (command) {
      case "rename": {
        const newFilename = getFilename(newPath);
        return isDone
          ? `Renamed ${filename} → ${newFilename}`
          : `Renaming ${filename} → ${newFilename}`;
      }
      case "delete":
        return isDone ? `Deleted ${filename}` : `Deleting ${filename}`;
      default:
        return toolName;
    }
  }

  return toolName;
}

export function ToolStatus({ toolInvocation }: ToolStatusProps) {
  const { toolName, args, state, result } = toolInvocation;
  const isDone = state === "result" && result;
  const label = getToolLabel(toolName, args, state);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
