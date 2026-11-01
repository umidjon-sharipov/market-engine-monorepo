export interface PickedProfileImage {
    uri: string;
    fileName: string | null;
}

export async function pickProfileImage(): Promise<PickedProfileImage | null> {
    return null;
}
