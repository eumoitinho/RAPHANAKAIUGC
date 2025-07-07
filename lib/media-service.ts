
import { getMediaCollection, MediaItem } from './mongodb'
import { ObjectId } from 'mongodb'

export class MediaService {
  async getMediaByFileName(fileName: string): Promise<MediaItem | null> {
    const collection = await getMediaCollection();
    const item = await collection.findOne({ fileName });
    if (!item) return null;
    const { _id, ...rest } = item;
    return {
      ...rest,
      _id: _id?.toString(),
      id: _id?.toString() || item.id,
      title: item.title || '',
      description: item.description || '',
      fileUrl: item.fileUrl || '',
      thumbnailUrl: item.thumbnailUrl || '',
      fileType: item.fileType || 'photo',
      categories: item.categories || [],
      dateCreated: item.dateCreated || new Date(),
      views: typeof item.views === 'number' ? item.views : 0,
      fileName: item.fileName || '',
      fileSize: item.fileSize || 0,
      duration: item.duration,
      dimensions: item.dimensions,
      optimized: typeof item.optimized === 'boolean' ? item.optimized : false
    };
  }
  async getAllMedia(): Promise<MediaItem[]> {
    const collection = await getMediaCollection()
    const items = await collection.find({}).sort({ dateCreated: -1 }).toArray()
    
    return items.map(item => ({
      ...item,
      id: item._id?.toString() || item.id
    }))
  }

  async getMediaById(id: string): Promise<MediaItem | null> {
    const collection = await getMediaCollection()
    const item = await collection.findOne({ 
      $or: [
        { _id: new ObjectId(id) },
        { id: id }
      ]
    })
    
    if (!item) return null
    
    return {
      ...item,
      id: item._id?.toString() || item.id
    }
  }

  async createMedia(mediaData: Omit<MediaItem, '_id' | 'id' | 'views' | 'dateCreated'>): Promise<MediaItem> {
    const collection = await getMediaCollection()
    
    const newMedia: Omit<MediaItem, '_id'> = {
      ...mediaData,
      id: new ObjectId().toString(),
      views: 0,
      dateCreated: new Date()
    }

    const result = await collection.insertOne(newMedia)
    
    return {
      ...newMedia,
      id: result.insertedId.toString()
    }
  }

  async updateMedia(id: string, updates: Partial<MediaItem>): Promise<boolean> {
    const collection = await getMediaCollection()
    
    const result = await collection.updateOne(
      { 
        $or: [
          { _id: new ObjectId(id) },
          { id: id }
        ]
      },
      { $set: updates }
    )
    
    return result.modifiedCount > 0
  }

  async deleteMedia(id: string): Promise<boolean> {
    const collection = await getMediaCollection()
    
    const result = await collection.deleteOne({
      $or: [
        { _id: new ObjectId(id) },
        { id: id }
      ]
    })
    
    return result.deletedCount > 0
  }

  async incrementViews(id: string): Promise<boolean> {
    const collection = await getMediaCollection()
    
    const result = await collection.updateOne(
      {
        $or: [
          { _id: new ObjectId(id) },
          { id: id }
        ]
      },
      { $inc: { views: 1 } }
    )
    
    return result.modifiedCount > 0
  }

  async getMediaByCategory(category: string): Promise<MediaItem[]> {
    const collection = await getMediaCollection()
    
    const items = await collection
      .find({ categories: { $in: [category] } })
      .sort({ dateCreated: -1 })
      .toArray()
    
    return items.map(item => ({
      ...item,
      id: item._id?.toString() || item.id
    }))
  }

  async getMediaStats() {
    const collection = await getMediaCollection()
    
    const [totalCount, videoCount, photoCount, totalViews] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ fileType: 'video' }),
      collection.countDocuments({ fileType: 'photo' }),
      collection.aggregate([
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]).toArray()
    ])

    return {
      totalMedia: totalCount,
      totalVideos: videoCount,
      totalPhotos: photoCount,
      totalViews: totalViews[0]?.total || 0
    }
  }
}