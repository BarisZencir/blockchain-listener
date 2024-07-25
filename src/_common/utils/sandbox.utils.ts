
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retryOperation<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let attempts = 0;
    
    while (attempts < maxRetries) {
        try {
            return await operation();
        } catch (error) {
            attempts++;
            if (attempts >= maxRetries) {
                throw error;
            }
            // Opsiyonel: Hata mesajını loglamak ya da başka bir işlem yapmak için
            console.warn(`Attempt ${attempts} failed. Retrying...`);
        }
    }
    
    // Bu noktaya hiç gelinmemeli
    throw new Error('Unexpected error in retryOperation');
}