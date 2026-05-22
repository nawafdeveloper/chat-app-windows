import { authClient } from "./auth-client";
import { UserKeyBundle } from "../types/crypto";

export async function uploadKeyBundle(bundle: UserKeyBundle): Promise<void> {
    await authClient.updateUser({
        yhlaPublicKey: bundle.publicKey,
        yhlaEncryptedPrivateKey: bundle.encryptedPrivateKey,
        yhlaPrivateKeyIv: bundle.privateKeyIv,
        yhlaPinSalt: bundle.pinSalt,
        yhlaPinVerificationTag: bundle.pinVerificationTag,
        yhlaPinVerificationIv: bundle.pinVerificationIv,
    });
}

export async function fetchKeyBundle(): Promise<UserKeyBundle> {
    const { data } = await authClient.getSession();
    
    if (!data?.user) {
        throw new Error("No user session found");
    }

    const user = data.user;

    return {
        publicKey: user.yhlaPublicKey,
        encryptedPrivateKey: user.yhlaEncryptedPrivateKey,
        privateKeyIv: user.yhlaPrivateKeyIv,
        pinSalt: user.yhlaPinSalt,
        pinVerificationTag: user.yhlaPinVerificationTag,
        pinVerificationIv: user.yhlaPinVerificationIv,
    };
}

export async function updateKeyBundle(
    bundle: Partial<UserKeyBundle>
): Promise<void> {
    const updateData: Record<string, string> = {};
    if (bundle.encryptedPrivateKey !== undefined) {
        updateData.yhlaEncryptedPrivateKey = bundle.encryptedPrivateKey;
    }
    if (bundle.privateKeyIv !== undefined) {
        updateData.yhlaPrivateKeyIv = bundle.privateKeyIv;
    }
    if (bundle.pinSalt !== undefined) {
        updateData.yhlaPinSalt = bundle.pinSalt;
    }
    if (bundle.pinVerificationTag !== undefined) {
        updateData.yhlaPinVerificationTag = bundle.pinVerificationTag;
    }
    if (bundle.pinVerificationIv !== undefined) {
        updateData.yhlaPinVerificationIv = bundle.pinVerificationIv;
    }
    if (bundle.publicKey !== undefined) {
        updateData.yhlaPublicKey = bundle.publicKey;
    }
    await authClient.updateUser(updateData);
}
