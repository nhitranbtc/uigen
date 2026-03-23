import { describe, test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolStatus, getToolLabel } from "../ToolStatus";

afterEach(cleanup);

describe("getToolLabel", () => {
  describe("str_replace_editor", () => {
    test("create completed", () => {
      expect(
        getToolLabel("str_replace_editor", { command: "create", path: "/App.jsx" }, "result")
      ).toBe("Created App.jsx");
    });

    test("create in progress", () => {
      expect(
        getToolLabel("str_replace_editor", { command: "create", path: "/App.jsx" }, "call")
      ).toBe("Creating App.jsx");
    });

    test("str_replace completed", () => {
      expect(
        getToolLabel("str_replace_editor", { command: "str_replace", path: "/components/Card.jsx" }, "result")
      ).toBe("Edited Card.jsx");
    });

    test("str_replace in progress", () => {
      expect(
        getToolLabel("str_replace_editor", { command: "str_replace", path: "/components/Card.jsx" }, "call")
      ).toBe("Editing Card.jsx");
    });

    test("insert completed", () => {
      expect(
        getToolLabel("str_replace_editor", { command: "insert", path: "/utils.js" }, "result")
      ).toBe("Edited utils.js");
    });

    test("insert in progress", () => {
      expect(
        getToolLabel("str_replace_editor", { command: "insert", path: "/utils.js" }, "partial-call")
      ).toBe("Editing utils.js");
    });

    test("view completed", () => {
      expect(
        getToolLabel("str_replace_editor", { command: "view", path: "/App.jsx" }, "result")
      ).toBe("Viewed App.jsx");
    });

    test("view in progress", () => {
      expect(
        getToolLabel("str_replace_editor", { command: "view", path: "/App.jsx" }, "call")
      ).toBe("Viewing App.jsx");
    });

    test("undo_edit completed", () => {
      expect(
        getToolLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" }, "result")
      ).toBe("Reverted App.jsx");
    });

    test("undo_edit in progress", () => {
      expect(
        getToolLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" }, "call")
      ).toBe("Reverting App.jsx");
    });

    test("unknown command falls back to tool name", () => {
      expect(
        getToolLabel("str_replace_editor", { command: "unknown" }, "result")
      ).toBe("str_replace_editor");
    });
  });

  describe("file_manager", () => {
    test("rename completed", () => {
      expect(
        getToolLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" }, "result")
      ).toBe("Renamed old.jsx → new.jsx");
    });

    test("rename in progress", () => {
      expect(
        getToolLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" }, "call")
      ).toBe("Renaming old.jsx → new.jsx");
    });

    test("delete completed", () => {
      expect(
        getToolLabel("file_manager", { command: "delete", path: "/temp.jsx" }, "result")
      ).toBe("Deleted temp.jsx");
    });

    test("delete in progress", () => {
      expect(
        getToolLabel("file_manager", { command: "delete", path: "/temp.jsx" }, "call")
      ).toBe("Deleting temp.jsx");
    });
  });

  describe("unknown tool", () => {
    test("falls back to tool name", () => {
      expect(getToolLabel("some_other_tool", {}, "result")).toBe("some_other_tool");
    });
  });

  describe("edge cases", () => {
    test("nested path extracts filename", () => {
      expect(
        getToolLabel("str_replace_editor", { command: "create", path: "/a/b/c/Deep.jsx" }, "result")
      ).toBe("Created Deep.jsx");
    });

    test("missing path arg", () => {
      expect(
        getToolLabel("str_replace_editor", { command: "create" }, "result")
      ).toBe("Created ");
    });
  });
});

describe("ToolStatus component", () => {
  test("renders completed state with green dot", () => {
    const { container } = render(
      <ToolStatus
        toolInvocation={{
          toolName: "str_replace_editor",
          args: { command: "create", path: "/App.jsx" },
          state: "result",
          result: "Success",
        }}
      />
    );

    expect(screen.getByText("Created App.jsx")).toBeDefined();
    expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  });

  test("renders in-progress state with spinner", () => {
    const { container } = render(
      <ToolStatus
        toolInvocation={{
          toolName: "str_replace_editor",
          args: { command: "create", path: "/App.jsx" },
          state: "call",
        }}
      />
    );

    expect(screen.getByText("Creating App.jsx")).toBeDefined();
    expect(container.querySelector(".animate-spin")).not.toBeNull();
  });

  test("renders file_manager rename", () => {
    render(
      <ToolStatus
        toolInvocation={{
          toolName: "file_manager",
          args: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
          state: "result",
          result: { success: true },
        }}
      />
    );

    expect(screen.getByText("Renamed old.jsx → new.jsx")).toBeDefined();
  });

  test("renders unknown tool with fallback", () => {
    render(
      <ToolStatus
        toolInvocation={{
          toolName: "custom_tool",
          args: {},
          state: "result",
          result: "done",
        }}
      />
    );

    expect(screen.getByText("custom_tool")).toBeDefined();
  });
});
