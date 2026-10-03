import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "@/App";

// Requires the backend running on :8000 (see README).
const mount = (path) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
afterEach(cleanup);

describe("pages render against the live API", () => {
  it("Analysis: KPIs, charts, filters", async () => {
    const err = vi.spyOn(console, "error");
    const { container } = mount("/analysis");
    await screen.findByText("Students analysed", {}, { timeout: 15000 });
    expect(container.querySelectorAll(".chart svg").length).toBe(20);
    fireEvent.click(screen.getByRole("radio", { name: "Female" }));
    await waitFor(() => expect(container.querySelector(".filters .badge").textContent).toMatch(/students/));
    expect(err).not.toHaveBeenCalled();
  });

  it("Analysis: High School filter (zero-variance Age) no longer crashes", async () => {
    const err = vi.spyOn(console, "error");
    const { container } = mount("/analysis");
    await screen.findByText("Students analysed", {}, { timeout: 15000 });
    fireEvent.click(screen.getByRole("radio", { name: "High School" }));
    await screen.findByText(/same value for every student/, {}, { timeout: 15000 });
    expect(container.textContent).toContain("n/a");
    expect(err).not.toHaveBeenCalled();
  });

  it("Home route opens the Prediction Lab first", async () => {
    mount("/");
    await screen.findByText("Predicted mental health score", {}, { timeout: 20000 });
    expect(screen.getAllByRole("link")[0].textContent).toMatch(/Prediction Lab/);
  });

  it("Models: leaderboard, explorer, training steps", async () => {
    const err = vi.spyOn(console, "error");
    const { container } = mount("/models");
    await screen.findByText(/wins on every metric/, {}, { timeout: 15000 });
    expect(container.querySelectorAll(".lb-card").length).toBe(3);
    fireEvent.click(screen.getByRole("tab", { name: "Model explorer" }));
    await screen.findByText("Permutation importance", {}, { timeout: 15000 });
    fireEvent.click(screen.getByRole("tab", { name: "Training steps" }));
    await screen.findByText("Training timeline", { exact: false });
    expect(container.querySelectorAll(".timeline li").length).toBe(10);
    expect(err).not.toHaveBeenCalled();
  });

  it("Predict: custom controls drive a real prediction", async () => {
    const err = vi.spyOn(console, "error");
    const { container } = mount("/predict");
    await screen.findByText("Predicted mental health score", {}, { timeout: 20000 });
    expect(container.querySelector("select, input[type=range], input[type=number]")).toBeNull(); // no native controls
    fireEvent.click(screen.getByRole("radio", { name: "Very High" }));
    fireEvent.click(screen.getByRole("button", { name: /Predict mental health score/ }));
    await waitFor(() => expect(container.querySelector(".gauge")).not.toBeNull(), { timeout: 15000 });
    await screen.findByText(/What-if explorer/, {}, { timeout: 15000 });
    expect(container.querySelectorAll(".chart svg").length).toBe(4);
    fireEvent.click(container.querySelector(".select-trigger"));
    expect(container.querySelector("[role=listbox]")).not.toBeNull();
    expect(err).not.toHaveBeenCalled();
  });

  it("Docs: all sections with highlighted code", async () => {
    const err = vi.spyOn(console, "error");
    const { container } = mount("/docs");
    await screen.findByText(/every step explained/, {}, { timeout: 15000 });
    expect(container.querySelectorAll(".doc-section").length).toBe(20);
    expect(container.querySelectorAll(".t-kw").length).toBeGreaterThan(50);
    expect(err).not.toHaveBeenCalled();
  });
});
