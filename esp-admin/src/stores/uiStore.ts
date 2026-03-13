import { create } from 'zustand';

interface UiState {
  sidebarCollapsed: boolean;
  selectedStoreId: number | null;
  selectedEquipmentId: number | null;
  selectedControllerId: number | null;
  selectedFloorId: number | null;
  selectedGatewayId: number | null;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  selectStore: (storeId: number | null) => void;
  selectEquipment: (equipmentId: number | null) => void;
  selectController: (controllerId: number | null) => void;
  selectFloor: (floorId: number | null) => void;
  selectGateway: (gatewayId: number | null) => void;
  clearSelection: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  selectedStoreId: null,
  selectedEquipmentId: null,
  selectedControllerId: null,
  selectedFloorId: null,
  selectedGatewayId: null,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  selectStore: (storeId) =>
    set({
      selectedStoreId: storeId,
      selectedEquipmentId: null,
      selectedControllerId: null,
      selectedFloorId: null,
      selectedGatewayId: null,
    }),

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
}));
