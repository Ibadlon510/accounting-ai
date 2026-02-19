import { create } from "zustand";

export interface WorkspaceState {
  documentId: string | null;
  extractedData: Record<string, unknown> | null;
  activeField: string | null;
  userEdits: Record<string, { original: unknown; current: unknown }>;
  zoom: number;
  rotation: number;

  setDocumentId: (id: string | null) => void;
  setExtractedData: (data: Record<string, unknown> | null) => void;
  setActiveField: (field: string | null) => void;
  trackEdit: (field: string, original: unknown, current: unknown) => void;
  setZoom: (zoom: number) => void;
  setRotation: (rotation: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  rotateRight: () => void;
  resetWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  documentId: null,
  extractedData: null,
  activeField: null,
  userEdits: {},
  zoom: 100,
  rotation: 0,

  setDocumentId: (id) => set({ documentId: id }),
  setExtractedData: (data) => set({ extractedData: data }),
  setActiveField: (field) => set({ activeField: field }),
  trackEdit: (field, original, current) =>
    set((state) => ({
      userEdits: { ...state.userEdits, [field]: { original, current } },
    })),
  setZoom: (zoom) => set({ zoom: Math.max(25, Math.min(300, zoom)) }),
  setRotation: (rotation) => set({ rotation }),
  zoomIn: () => set((state) => ({ zoom: Math.min(300, state.zoom + 25) })),
  zoomOut: () => set((state) => ({ zoom: Math.max(25, state.zoom - 25) })),
  rotateRight: () => set((state) => ({ rotation: (state.rotation + 90) % 360 })),
  resetWorkspace: () =>
    set({
      documentId: null,
      extractedData: null,
      activeField: null,
      userEdits: {},
      zoom: 100,
      rotation: 0,
    }),
}));
