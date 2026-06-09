import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  selectedStoreId: number | null;
  selectedEquipmentId: number | null;
  selectedControllerId: number | null;
  selectedFloorId: number | null;
  selectedGatewayId: number | null;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  selectStore: (storeId: number | null) => void;
  setCurrentStoreId: (storeId: number | null) => void;
  selectEquipment: (equipmentId: number | null) => void;
  selectController: (controllerId: number | null) => void;
  selectFloor: (floorId: number | null) => void;
  selectGateway: (gatewayId: number | null) => void;
  clearSelection: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarWidth: 240,
      selectedStoreId: null,
      selectedEquipmentId: null,
      selectedControllerId: null,
      selectedFloorId: null,
      selectedGatewayId: null,

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSidebarWidth: (width) => set({ sidebarWidth: Math.min(480, Math.max(180, width)) }),

      selectStore: (storeId) =>
        set({
          selectedStoreId: storeId,
          selectedEquipmentId: null,
          selectedControllerId: null,
          selectedFloorId: null,
          selectedGatewayId: null,
        }),

      setCurrentStoreId: (storeId) => set({ selectedStoreId: storeId }),

      selectEquipment: (equipmentId) =>
        set({ selectedEquipmentId: equipmentId, selectedControllerId: null }),

      selectController: (controllerId) => set({ selectedControllerId: controllerId }),
      selectFloor: (floorId) => set({ selectedFloorId: floorId }),
      selectGateway: (gatewayId) => set({ selectedGatewayId: gatewayId }),

      clearSelection: () =>
        set({
          selectedStoreId: null,
          selectedEquipmentId: null,
          selectedControllerId: null,
          selectedFloorId: null,
          selectedGatewayId: null,
        }),
    }),
    {
      name: 'esp-ui-selection',
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        selectedStoreId: state.selectedStoreId,
        selectedEquipmentId: state.selectedEquipmentId,
        selectedControllerId: state.selectedControllerId,
        selectedFloorId: state.selectedFloorId,
        selectedGatewayId: state.selectedGatewayId,
      }),
    },
  ),
);
