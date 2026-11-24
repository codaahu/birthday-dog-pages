export const photoCategories = ['couple', 'portrait', 'travel', 'daily', 'engagement', 'funny', 'puzzle', 'pet'] as const
export type PhotoCategory = typeof photoCategories[number]

export interface Photo {
  id: string
  category: PhotoCategory
  image: string
  thumbnail: string
  width: number
  height: number
  title?: string
  note?: string
  date?: string
  location?: string
  order?: number
}

export interface PhotoManifest {
  photos: Photo[]
}

export const emptyPhotos: PhotoManifest = { photos: [] }
