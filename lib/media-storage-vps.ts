import { getMediaCollection, MediaItem } from './mongodb'
import { ObjectId } from 'mongodb'

export const mediaStorageVPS = {
  // Buscar todos os itens de mídia
  getAll: async (): Promise<MediaItem[]> => {
    try {
      const collection = await getMediaCollection()
      const items = await collection.find({}).sort({ dateCreated: -1 }).toArray()
      
      return items.map(item => ({
        ...item,
        _id: item._id?.toString(),
        id: item.id || item._id?.toString()
      })) as MediaItem[]
    } catch (error) {
      console.error('Erro ao buscar itens de mídia:', error)
      return []
    }
  },

  // Adicionar novo item de mídia
  add: async (item: Omit<MediaItem, 'id' | 'views' | 'dateCreated' | '_id'>): Promise<MediaItem> => {
    try {
      const collection = await getMediaCollection()
      
      const newItem: Omit<MediaItem, '_id'> = {
        id: new ObjectId().toString(),
        ...item,
        views: 0,
        dateCreated: new Date(),
        optimized: false
      }

      const result = await collection.insertOne(newItem)
      
      return {
        ...newItem,
        _id: result.insertedId.toString()
      }
    } catch (error) {
      console.error('Erro ao adicionar item de mídia:', error)
      throw error
    }
  },

  // Deletar item de mídia
  delete: async (id: string): Promise<boolean> => {
    try {
      const collection = await getMediaCollection()
      
      // Tentar deletar por id ou _id
      const result = await collection.deleteOne({
        $or: [
          { id: id },
          { _id: new ObjectId(id) }
        ]
      })

      return result.deletedCount > 0
    } catch (error) {
      console.error('Erro ao deletar item de mídia:', error)
      return false
    }
  },

  // Atualizar item de mídia
  update: async (id: string, updates: Partial<MediaItem>): Promise<MediaItem | null> => {
    try {
      const collection = await getMediaCollection()
      
      const result = await collection.findOneAndUpdate(
        {
          $or: [
            { id: id },
            { _id: new ObjectId(id) }
          ]
        },
        { $set: updates },
        { returnDocument: 'after' }
      )

      if (result) {
        return {
          ...result,
          _id: result._id?.toString(),
          id: result.id || result._id?.toString()
        } as MediaItem
      }

      return null
    } catch (error) {
      console.error('Erro ao atualizar item de mídia:', error)
      return null
    }
  },

  // Incrementar visualizações
  incrementViews: async (id: string): Promise<void> => {
    try {
      const collection = await getMediaCollection()
      
      await collection.updateOne(
        {
          $or: [
            { id: id },
            { _id: new ObjectId(id) }
          ]
        },
        { $inc: { views: 1 } }
      )
    } catch (error) {
      console.error('Erro ao incrementar visualizações:', error)
    }
  },

  // Buscar por categoria
  getByCategory: async (category: string): Promise<MediaItem[]> => {
    try {
      const collection = await getMediaCollection()
      const items = await collection.find({ 
        categories: { $in: [category] } 
      }).sort({ dateCreated: -1 }).toArray()
      
      return items.map(item => ({
        ...item,
        _id: item._id?.toString(),
        id: item.id || item._id?.toString()
      })) as MediaItem[]
    } catch (error) {
      console.error('Erro ao buscar por categoria:', error)
      return []
    }
  },

  // Buscar por tipo de arquivo
  getByType: async (fileType: 'video' | 'photo'): Promise<MediaItem[]> => {
    try {
      const collection = await getMediaCollection()
      const items = await collection.find({ fileType }).sort({ dateCreated: -1 }).toArray()
      
      return items.map(item => ({
        ...item,
        _id: item._id?.toString(),
        id: item.id || item._id?.toString()
      })) as MediaItem[]
    } catch (error) {
      console.error('Erro ao buscar por tipo:', error)
      return []
    }
  }
}

