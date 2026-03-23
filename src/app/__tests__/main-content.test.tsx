import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

// Mock child components and contexts
vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <div>{children}</div>,
  useFileSystem: vi.fn(() => ({
    getAllFiles: vi.fn(() => new Map()),
    refreshTrigger: 0,
  })),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <div>{children}</div>,
  useChat: vi.fn(() => ({
    messages: [],
    input: "",
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    status: "idle",
  })),
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">FileTree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">CodeEditor</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">Actions</div>,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: any) => (
    <div data-testid="resizable-group">{children}</div>
  ),
  ResizablePanel: ({ children }: any) => (
    <div data-testid="resizable-panel">{children}</div>
  ),
  ResizableHandle: () => <div data-testid="resizable-handle" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

test("renders preview view by default", () => {
  render(<MainContent />);

  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("clicking Code button switches to code view", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const codeButton = screen.getByRole("tab", { name: "Code" });
  await user.click(codeButton);

  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.queryByTestId("preview-frame")).toBeNull();
});

test("clicking Preview button switches back to preview view", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Switch to code view first
  const codeButton = screen.getByRole("tab", { name: "Code" });
  await user.click(codeButton);
  expect(screen.getByTestId("code-editor")).toBeDefined();

  // Switch back to preview
  const previewButton = screen.getByRole("tab", { name: "Preview" });
  await user.click(previewButton);
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("toggling multiple times works correctly", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const previewButton = screen.getByRole("tab", { name: "Preview" });
  const codeButton = screen.getByRole("tab", { name: "Code" });

  // Start: preview
  expect(screen.getByTestId("preview-frame")).toBeDefined();

  // Switch to code
  await user.click(codeButton);
  expect(screen.getByTestId("code-editor")).toBeDefined();

  // Switch back to preview
  await user.click(previewButton);
  expect(screen.getByTestId("preview-frame")).toBeDefined();

  // Switch to code again
  await user.click(codeButton);
  expect(screen.getByTestId("code-editor")).toBeDefined();
});

test("Preview tab is active by default", () => {
  render(<MainContent />);

  const previewButton = screen.getByRole("tab", { name: "Preview" });
  expect(previewButton.getAttribute("data-state")).toBe("active");

  const codeButton = screen.getByRole("tab", { name: "Code" });
  expect(codeButton.getAttribute("data-state")).toBe("inactive");
});

test("Code tab becomes active when clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const codeButton = screen.getByRole("tab", { name: "Code" });
  await user.click(codeButton);

  expect(codeButton.getAttribute("data-state")).toBe("active");

  const previewButton = screen.getByRole("tab", { name: "Preview" });
  expect(previewButton.getAttribute("data-state")).toBe("inactive");
});

test("code view shows both file tree and code editor", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("tab", { name: "Code" }));

  expect(screen.getByTestId("file-tree")).toBeDefined();
  expect(screen.getByTestId("code-editor")).toBeDefined();
});
