export interface PickedCommentImage {
    uri: string;
    fileName: string;
    type: string;
}

export async function pickCommentImages(_limit: number): Promise<PickedCommentImage[]> {
    return [];
}
