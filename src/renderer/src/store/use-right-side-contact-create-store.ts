import { create } from "zustand";

interface RightSideContactCreateState {
    isRightSideContactCreateActive: boolean;
    firstName: string;
    lastName: string;
    dialCode: string;
    phoneNumber: string;
    setIsRightSideContactCreateActive: (value: boolean) => void;
    setFirstName: (value: string) => void;
    setLastName: (value: string) => void;
    setDialCode: (value: string) => void;
    setPhoneNumber: (value: string) => void;
    reset: () => void;
}

const initialState = {
    isRightSideContactCreateActive: false,
    firstName: "",
    lastName: "",
    dialCode: "",
    phoneNumber: "",
};

export const useRightSideContactCreateStore =
    create<RightSideContactCreateState>((set) => ({
        ...initialState,
        setIsRightSideContactCreateActive: (value) =>
            set({ isRightSideContactCreateActive: value }),
        setFirstName: (value) => set({ firstName: value }),
        setLastName: (value) => set({ lastName: value }),
        setDialCode: (value) => set({ dialCode: value }),
        setPhoneNumber: (value) => set({ phoneNumber: value }),
        reset: () => set(initialState),
    }));