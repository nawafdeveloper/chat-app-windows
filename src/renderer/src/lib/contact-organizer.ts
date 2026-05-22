import { Contact } from "../types/contacts.type";

export type ContactGroup = {
    letter: string;
    contacts: Contact[];
};

export function groupContactsByLetter(contacts: Contact[]): ContactGroup[] {
    const groupsMap: Record<string, Contact[]> = {};

    contacts.forEach((contact) => {
        const letter = contact.contact_letter_group?.toUpperCase() || "#";

        if (!groupsMap[letter]) {
            groupsMap[letter] = [];
        }

        groupsMap[letter].push(contact);
    });

    const groupedContacts: ContactGroup[] = Object.keys(groupsMap)
        .sort((a, b) => {
            if (a === "#") return 1;
            if (b === "#") return -1;
            return a.localeCompare(b);
        })
        .map((letter) => ({
            letter,
            contacts: groupsMap[letter].sort((a, b) =>
                (a.contact_first_name || "").localeCompare(b.contact_first_name || "")
            ),
        }));

    return groupedContacts;
}
