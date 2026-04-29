import apiClient from '@/lib/api-client';

export interface InteractiveMovie {
  movieId: number;
  title: string;
  slug: string;
  description?: string;
  genre?: string;
  // ... other fields matching Movie if applicable
}

export const interactiveMovieService = {
  getAll: async () => {
    // The documentation mentions Interactive Movies API but doesn't specify the exact endpoint for "getAll" 
    // besides the general /movies with filters or a specific /interactive-movies if it exists.
    // Based on "Interactive Movies API" section in user request:
    const response = await apiClient.get<{ status: boolean; data: InteractiveMovie[] }>('/movies?is_interactive=true');
    return response.data.data;
  }
};
