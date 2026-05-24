import { useEffect } from "react";
import { useCryptoKeys } from "../context/crypto";
import { authClient } from "../lib/auth-client";
import { decryptStoredContact } from "../lib/contact-crypto";
import { electronApiFetch } from "../lib/electron-api-fetch";
import { useContactDirectoryStore } from "../store/use-contact-directory-store";
import type { Contact, StoredContactRecord } from "../types/contacts.type";

let contactsLoadRequestId = 0;
let contactsLoadingForUserId: string | null = null;

export function useDecryptedContacts() {
    const { isReady } = useCryptoKeys();
    const { data: session } = authClient.useSession();
    const contacts = useContactDirectoryStore((state) => state.contacts);
    const isLoading = useContactDirectoryStore((state) => state.isLoading);
    const error = useContactDirectoryStore((state) => state.error);
    const setContacts = useContactDirectoryStore((state) => state.setContacts);
    const setLoading = useContactDirectoryStore((state) => state.setLoading);
    const setError = useContactDirectoryStore((state) => state.setError);
    const reset = useContactDirectoryStore((state) => state.reset);

    const currentUserId = session?.user.id ?? null;

    useEffect(() => {
        if (!currentUserId) {
            contactsLoadRequestId += 1;
            contactsLoadingForUserId = null;
            reset();
            return;
        }

        if (!isReady) {
            return;
        }

        const loadContacts = async (force = false) => {
            const directoryState = useContactDirectoryStore.getState();

            if (
                directoryState.isLoading &&
                contactsLoadingForUserId === currentUserId
            ) {
                return;
            }

            if (!force && directoryState.loadedForUserId === currentUserId) {
                return;
            }

            const requestId = (contactsLoadRequestId += 1);
            contactsLoadingForUserId = currentUserId;

            try {
                setLoading(true);
                setError(null);

                const response = await electronApiFetch("/api/contacts", {
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error("Failed to load contacts.");
                }

                const payload = (await response.json()) as {
                    contacts: StoredContactRecord[];
                };

                const decryptedContacts = await Promise.all(
                    payload.contacts.map(async (contactRecord) => {
                        try {
                            return await decryptStoredContact(contactRecord);
                        } catch {
                            return null;
                        }
                    })
                );

                if (contactsLoadRequestId !== requestId) {
                    return;
                }

                setContacts(
                    currentUserId,
                    decryptedContacts.filter(
                        (contact): contact is Contact => contact !== null
                    )
                );
            } catch (nextError) {
                if (contactsLoadRequestId !== requestId) {
                    return;
                }

                setError(
                    nextError instanceof Error
                        ? nextError.message
                        : "Failed to load contacts."
                );
            } finally {
                if (contactsLoadRequestId === requestId) {
                    contactsLoadingForUserId = null;
                    setLoading(false);
                }
            }
        };

        const handleContactsChanged = () => {
            void loadContacts(true);
        };

        void loadContacts();
        window.addEventListener("contacts:changed", handleContactsChanged);

        return () => {
            window.removeEventListener("contacts:changed", handleContactsChanged);
        };
    }, [
        currentUserId,
        isReady,
        reset,
        setContacts,
        setError,
        setLoading,
    ]);

    return {
        contacts,
        isLoading,
        error,
    };
}
