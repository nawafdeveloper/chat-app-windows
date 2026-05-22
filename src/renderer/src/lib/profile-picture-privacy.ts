export type PrivacyVisibility = "all" | "contacts" | "nobody";
export type ProfilePictureVisibility = PrivacyVisibility;

export function canViewPrivacyValue(
    visibility: PrivacyVisibility | string | null | undefined,
    isSavedContact: boolean
) {
    if (visibility === "all") {
        return true;
    }

    if (visibility === "contacts") {
        return isSavedContact;
    }

    return false;
}

export function canViewProfilePicture(
    visibility: ProfilePictureVisibility | string | null | undefined,
    isSavedContact: boolean
) {
    return canViewPrivacyValue(visibility, isSavedContact);
}

export function canViewLastSeen(
    visibility: PrivacyVisibility | string | null | undefined,
    isSavedContact: boolean
) {
    return canViewPrivacyValue(visibility, isSavedContact);
}

export function canViewStatus(
    visibility: PrivacyVisibility | string | null | undefined,
    isSavedContact: boolean
) {
    return canViewPrivacyValue(visibility, isSavedContact);
}

export function canViewAbout(
    visibility: PrivacyVisibility | string | null | undefined,
    isSavedContact: boolean
) {
    return canViewPrivacyValue(visibility, isSavedContact);
}
