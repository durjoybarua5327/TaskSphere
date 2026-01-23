/**
 * Resize and crop an image to a specific size
 * @param file - The image file to process
 * @param maxWidth - Maximum width (default 400)
 * @param maxHeight - Maximum height (default 400)
 * @param quality - Image quality 0-1 (default 0.9)
 * @returns Promise with the resized image as base64 data URL
 */
export async function resizeImage(
    file: File,
    maxWidth: number = 400,
    maxHeight: number = 400,
    quality: number = 0.9
): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();

            img.onload = () => {
                // Create canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                // Calculate dimensions to maintain aspect ratio
                let width = img.width;
                let height = img.height;

                // Calculate scaling to fit within max dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                // Set canvas size
                canvas.width = width;
                canvas.height = height;

                // Draw and resize image
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to base64
                const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(resizedDataUrl);
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = event.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Crop an image to a square with the specified size
 * @param file - The image file to process
 * @param size - The size of the square (default 400)
 * @param quality - Image quality 0-1 (default 0.9)
 * @returns Promise with the cropped image as base64 data URL
 */
export async function cropToSquare(
    file: File,
    size: number = 400,
    quality: number = 0.9
): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                // Set canvas to square size
                canvas.width = size;
                canvas.height = size;

                // Calculate crop area (center crop)
                const sourceSize = Math.min(img.width, img.height);
                const sourceX = (img.width - sourceSize) / 2;
                const sourceY = (img.height - sourceSize) / 2;

                // Draw cropped and resized image
                ctx.drawImage(
                    img,
                    sourceX,
                    sourceY,
                    sourceSize,
                    sourceSize,
                    0,
                    0,
                    size,
                    size
                );

                // Convert to base64
                const croppedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(croppedDataUrl);
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = event.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}
