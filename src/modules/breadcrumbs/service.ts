import { BreadcrumbsUploadResponse } from "./types.js";

export class BreadcrumbsService {
    constructor(
        private readonly apiUrl: string,
        private readonly apiKey: string
    ) {}

    async upload(imageData: string): Promise<string> {
        try {
            const response = await fetch(`${this.apiUrl}/screenshots`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/octet-stream",
                    "Authorization": `Bearer ${this.apiKey}`,
                },
                body: Buffer.from(imageData, "base64"),
            });

            if (!response.ok) {
                throw new Error(`Failed to upload image: ${response.statusText}`);
            }

            const result: BreadcrumbsUploadResponse = await response.json();
            return result.id;
        } catch (error) {
            console.error("Error uploading image to Breadcrumbs:", error);
            throw error;
        }
    }
}
